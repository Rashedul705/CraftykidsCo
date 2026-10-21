import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { Setting } from '@/models/Setting';
import { getMemoryOrders, OrderRecord } from '@/lib/store';
import { defaultSiteSettings, SiteSettings } from '@/lib/site-settings';
import { generateInvoiceHtml, renderHtmlToPdf } from '@/lib/print-templates';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  try {
    const idsParam = searchParams.get('ids') || searchParams.get('id') || '';
    const download = searchParams.get('download') === '1';
    const format = searchParams.get('format') || 'pdf'; // 'pdf' | 'html'

    const idList = idsParam
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    // 1. Fetch Orders (MongoDB Atlas with in-memory fallback)
    let matchedOrders: OrderRecord[] = [];

    try {
      await connectToDatabase();
      if (idList.length > 0) {
        const isObjectIdList = idList.filter((id) => /^[0-9a-fA-F]{24}$/.test(id));
        const mongoOrders = await Order.find({
          $or: [
            { id: { $in: idList } },
            { orderNumber: { $in: idList } },
            ...(isObjectIdList.length > 0 ? [{ _id: { $in: isObjectIdList } }] : []),
          ],
        }).lean();

        matchedOrders = mongoOrders as unknown as OrderRecord[];
      }
    } catch (dbErr) {
      console.warn('MongoDB error in invoice print API, using memory fallback:', dbErr);
    }

    // Fallback to in-memory store if DB query returned fewer or failed
    if (matchedOrders.length === 0) {
      const memoryOrders = getMemoryOrders();
      if (idList.length > 0) {
        matchedOrders = memoryOrders.filter(
          (o) => idList.includes(o.id) || idList.includes(o.orderNumber)
        );
      } else {
        matchedOrders = memoryOrders.slice(0, 10);
      }
    }

    if (matchedOrders.length === 0) {
      return NextResponse.json(
        { success: false, message: 'প্রিন্ট করার মতো কোনো অর্ডার পাওয়া যায়নি।' },
        { status: 404 }
      );
    }

    // 2. Fetch Site Settings for Print Config
    let siteSettings: SiteSettings = defaultSiteSettings;
    try {
      await connectToDatabase();
      const settingDoc = await Setting.findOne({ key: 'site_settings' }).lean();
      if (settingDoc && settingDoc.value) {
        siteSettings = {
          ...defaultSiteSettings,
          ...JSON.parse(settingDoc.value),
          print: {
            ...defaultSiteSettings.print,
            ...(JSON.parse(settingDoc.value).print || {}),
          },
        };
      }
    } catch {
      // use defaultSiteSettings
    }

    // 3. Generate Invoice HTML
    const isHtmlFallback = format === 'html';
    const invoiceHtml = await generateInvoiceHtml(matchedOrders, siteSettings, isHtmlFallback);

    // If explicit HTML format requested or fallback
    if (format === 'html') {
      return new NextResponse(invoiceHtml, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }

    // 4. Render to PDF via Puppeteer
    const pdfBuffer = await renderHtmlToPdf(invoiceHtml, { format: 'A4' });

    if (!pdfBuffer) {
      // Fallback to print-only HTML page with @page rules
      console.warn('Returning print-ready HTML fallback for invoice');
      return new NextResponse(invoiceHtml, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Print-Fallback': 'true',
        },
      });
    }

    // 5. Return PDF Response
    const filename =
      matchedOrders.length === 1
        ? `invoice-${matchedOrders[0].orderNumber}.pdf`
        : `invoices-${matchedOrders.length}-orders.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('Invoice print route error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Error generating invoice document' },
      { status: 500 }
    );
  }
}
