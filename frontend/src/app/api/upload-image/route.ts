import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: 'IMGBB_API_KEY is not configured on the server' },
        { status: 500 }
      );
    }
    
    let base64Image = '';
    let imageName = 'craftykidsco_upload';

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      base64Image = body.image || '';
      if (body.name) imageName = body.name;
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('image') as File | null;
      if (file) {
        const bytes = await file.arrayBuffer();
        base64Image = Buffer.from(bytes).toString('base64');
        imageName = `craftykidsco_${file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      }
      const customName = formData.get('name') as string | null;
      if (customName) imageName = customName;
    }

    if (!base64Image) {
      return NextResponse.json(
        { success: false, message: 'Image data (base64 string or file) is required' },
        { status: 400 }
      );
    }

    // Strip prefix if data URL (e.g. data:image/png;base64,...)
    if (base64Image.includes('base64,')) {
      base64Image = base64Image.split('base64,')[1];
    }

    const formBody = new URLSearchParams();
    formBody.append('image', base64Image);
    formBody.append('name', imageName);

    const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formBody,
    });

    const data = await imgbbRes.json();

    if (data.success) {
      return NextResponse.json({
        success: true,
        url: data.data.url,
        display_url: data.data.display_url,
        delete_url: data.data.delete_url,
        thumb: data.data.thumb?.url,
        data: data.data,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: data.error?.message || 'Failed to upload image to ImgBB',
          error: data.error,
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Frontend ImgBB upload error:', error);
    const isProd = process.env.NODE_ENV === 'production';
    return NextResponse.json(
      {
        success: false,
        message: isProd ? 'Internal server error during upload' : (error.message || 'Internal server error during upload'),
      },
      { status: 500 }
    );
  }
}
