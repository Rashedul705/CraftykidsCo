import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

function saveToLocalUploads(base64Image: string, imageName: string): string {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const ext = base64Image.startsWith('/9j/')
    ? '.jpg'
    : base64Image.startsWith('iVBORw')
    ? '.png'
    : base64Image.startsWith('R0lGOD')
    ? '.gif'
    : '.png';
  const cleanName = imageName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50) || 'upload';
  const fileName = `${Date.now()}_${cleanName}${ext}`;
  const filePath = path.join(uploadsDir, fileName);
  fs.writeFileSync(filePath, Buffer.from(base64Image, 'base64'));
  return `/uploads/${fileName}`;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const apiKey = process.env.IMGBB_API_KEY;
    
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

    // 1. Try ImgBB if API key is provided
    if (apiKey) {
      try {
        const formBody = new URLSearchParams();
        formBody.append('image', base64Image);
        formBody.append('name', imageName);

        const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
          method: 'POST',
          body: formBody,
        });

        const data = await imgbbRes.json();

        if (data.success && data.data?.url) {
          return NextResponse.json({
            success: true,
            url: data.data.url,
            display_url: data.data.display_url,
            delete_url: data.data.delete_url,
            thumb: data.data.thumb?.url,
            data: data.data,
          });
        }

        console.warn('ImgBB upload rejected or unavailable:', data.error?.message, '- falling back to local storage.');
      } catch (imgbbErr: any) {
        console.warn('ImgBB fetch threw an error:', imgbbErr.message, '- falling back to local storage.');
      }
    }

    // 2. Reliable Local Storage Fallback
    const localUrl = saveToLocalUploads(base64Image, imageName);
    return NextResponse.json({
      success: true,
      url: localUrl,
      display_url: localUrl,
      thumb: localUrl,
      source: 'local_storage',
    });
  } catch (error: any) {
    console.error('Upload handler error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Internal server error during upload',
      },
      { status: 500 }
    );
  }
}
