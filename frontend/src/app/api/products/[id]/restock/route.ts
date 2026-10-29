import { NextRequest } from 'next/server';
import { POST as handleStockLogsPost } from '../stock-logs/route';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteParams) {
  return handleStockLogsPost(req, context);
}
