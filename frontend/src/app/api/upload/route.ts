import { NextRequest } from 'next/server';
import { POST as handleUpload } from '../upload-image/route';

export async function POST(req: NextRequest) {
  return handleUpload(req);
}
