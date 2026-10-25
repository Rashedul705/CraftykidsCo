import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ContactMessage } from '@/models/ContactMessage';
import {
  getContactMessages,
  addContactMessage,
  updateContactMessage,
  deleteContactMessage,
} from '@/lib/store';
import { verifyAdminRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    try {
      await connectToDatabase();
      const filter: any = {};
      if (status && status !== 'all') {
        filter.status = status;
      }
      const docs = await ContactMessage.find(filter).sort({ createdAt: -1 }).lean();
      if (docs && docs.length > 0) {
        const formatted = docs.map((d: any) => ({
          id: d._id.toString(),
          name: d.name,
          phone: d.phone,
          subject: d.subject,
          message: d.message,
          status: d.status,
          replyNote: d.replyNote,
          repliedAt: d.repliedAt ? d.repliedAt.toISOString() : undefined,
          repliedBy: d.repliedBy,
          createdAt: d.createdAt ? d.createdAt.toISOString() : new Date().toISOString(),
        }));
        return NextResponse.json({ success: true, messages: formatted });
      }
    } catch (dbErr) {
      console.warn('MongoDB error fetching contact messages, falling back to memory store:', dbErr);
    }

    // Memory fallback
    let messages = getContactMessages();
    if (status && status !== 'all') {
      messages = messages.filter((m) => m.status === status);
    }
    return NextResponse.json({ success: true, messages });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch contact messages' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, subject, message } = body;

    if (!name || !phone || !message) {
      return NextResponse.json(
        { success: false, message: 'Name, phone, and message are required' },
        { status: 400 }
      );
    }

    let savedMessage = null;

    try {
      await connectToDatabase();
      const doc = await ContactMessage.create({
        name,
        phone,
        subject: subject || 'সাধারণ জিজ্ঞাসা',
        message,
        status: 'unread',
      });
      savedMessage = {
        id: doc._id.toString(),
        name: doc.name,
        phone: doc.phone,
        subject: doc.subject,
        message: doc.message,
        status: doc.status,
        createdAt: doc.createdAt.toISOString(),
      };
    } catch (dbErr) {
      console.warn('MongoDB error saving contact message, saving in memory:', dbErr);
    }

    // Also sync to in-memory store
    const memMsg = addContactMessage({
      name,
      phone,
      subject: subject || 'সাধারণ জিজ্ঞাসা',
      message,
    });

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      contactMessage: savedMessage || memMsg,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to submit contact message' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();
    const { id, status, replyNote, repliedBy } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Message ID is required' }, { status: 400 });
    }

    const updateFields: any = {};
    if (status) updateFields.status = status;
    if (replyNote !== undefined) updateFields.replyNote = replyNote;
    if (status === 'replied' || replyNote) {
      updateFields.repliedAt = new Date();
      updateFields.repliedBy = repliedBy || 'Admin';
    }

    try {
      await connectToDatabase();
      await ContactMessage.findByIdAndUpdate(id, { $set: updateFields });
    } catch (dbErr) {
      console.warn('MongoDB error updating message, updating memory store:', dbErr);
    }

    // Update memory store
    const memUpdated = updateContactMessage(id, {
      ...updateFields,
      repliedAt: updateFields.repliedAt ? updateFields.repliedAt.toISOString() : undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Message updated successfully',
      contactMessage: memUpdated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update message' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Message ID is required' }, { status: 400 });
    }

    try {
      await connectToDatabase();
      await ContactMessage.findByIdAndDelete(id);
    } catch (dbErr) {
      console.warn('MongoDB error deleting message, removing from memory store:', dbErr);
    }

    deleteContactMessage(id);

    return NextResponse.json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete message' },
      { status: 500 }
    );
  }
}
