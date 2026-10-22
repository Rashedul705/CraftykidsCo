import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { Setting } from '@/models/Setting';
import { getMemoryOrders, OrderRecord } from '@/lib/store';
import { defaultSiteSettings, SiteSettings } from '@/lib/site-settings';
import { generateStickerHtml, renderHtmlToPdf } from '@/lib/print-templates';

// Fake sample order for "Test print" alignment verification
const SAMPLE_TEST_ORDER: OrderRecord = {
  id: 'ord-test-sample',
  orderNumber: 'CKC-20261022-9999',
  customerName: 'নাজমুল ইসলাম (নমুনা প্রিন্ট)',
  customerPhone: '01731-376498',
  district: 'Dhaka',
  fullAddress: 'বাড়ি #১২, রোড #৭, সেক্টর #৩, উত্তরা, ঢাকা-১২৩০',
  subtotal: 1569,
  deliveryCharge: 60,
  discountAmount: 0,
  totalAmount: 1629,
  status: 'SHIPPED',
  paymentStatus: 'UNPAID',
  paymentMethod: 'COD',
  courier: 'STEADFAST',
  consignmentId: 'STF-311164126',
  trackingCode: 'TRK-987654321',
  source: 'website',
  internalNote: 'Fragile: Plaster models inside',
  timeline: [],
  items: [
    {
      id: 'it-1',
      productId: 'prod-1',
      title: 'Sweet Fruit 3D Plaster Kit',
      price: 1569,
      quantity: 1,
      total: 1569,
      imageUrl: '',
    },
  ],
  createdAt: new Date().toISOString(),
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  try {
    const idsParam = searchParams.get('ids') || searchParams.get('id') || '';
    const sizeParam = searchParams.get('size') || '100x150';
    const sheetParam = searchParams.get('sheet'); // '4' or '8'
    const startPosParam = searchParams.get('startPos') || '1';
    const isTest = searchParams.get('test') === '1';
    const download = searchParams.get('download') === '1';
    const format = searchParams.get('format') || 'pdf'; // 'pdf' | 'html'

    const idList = idsParam
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    // 1. Fetch Orders or Sample
    let matchedOrders: OrderRecord[] = [];

    if (isTest) {
      matchedOrders = [SAMPLE_TEST_ORDER];
      if (sheetParam === '4') {
        matchedOrders = [SAMPLE_TEST_ORDER, SAMPLE_TEST_ORDER, SAMPLE_TEST_ORDER, SAMPLE_TEST_ORDER];
      } else if (sheetParam === '8') {
        matchedOrders = Array(8).fill(SAMPLE_TEST_ORDER);
      }
    } else {
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
        console.warn('MongoDB error in sticker print API, using memory fallback:', dbErr);
      }

      // Memory store fallback
      if (matchedOrders.length === 0) {
        const memoryOrders = getMemoryOrders();
        if (idList.length > 0) {
          matchedOrders = memoryOrders.filter(
            (o) => idList.includes(o.id) || idList.includes(o.orderNumber)
          );
        } else {
          matchedOrders = memoryOrders.filter((o) => !!(o.consignmentId || o.trackingCode));
        }
      }
    }

    if (matchedOrders.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'স্টিকার প্রিন্ট করার জন্য কোনো অর্ডার পাওয়া যায়নি।',
        },
        { status: 404 }
      );
    }

    // Rule: Filter out orders without consignmentId
    const eligibleOrders = matchedOrders.filter((o) => !!(o.consignmentId || o.trackingCode));
    const skippedOrders = matchedOrders.filter((o) => !(o.consignmentId || o.trackingCode));

    if (eligibleOrders.length === 0 && !isTest) {
      return NextResponse.json(
        {
          success: false,
          message:
            'নির্বাচিত অর্ডারের কোনো কনসাইনমেন্ট আইডি (Consignment ID) নেই। স্টিকার প্রিন্ট করার আগে অনুগ্রহ করে স্টিডফাস্ট বা কুরিয়ারে পার্সেল পাঠান।',
          skipped: skippedOrders.map((o) => o.orderNumber),
        },
        { status: 400 }
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

    // 3. Determine Layout Options
    const sheetLayout: 'single' | 'sheet4' | 'sheet8' =
      sheetParam === '4' ? 'sheet4' : sheetParam === '8' ? 'sheet8' : 'single';
    const isCompact = sizeParam === '75x50' || sheetLayout === 'sheet8';
    const startPos = parseInt(startPosParam, 10) || 1;
    const isHtmlFallback = format === 'html';

    const stickerHtml = await generateStickerHtml(eligibleOrders, siteSettings, {
      sheetLayout,
      startPos,
      isCompact,
      isHtmlFallback,
    });

    // If explicit HTML format requested
    if (format === 'html') {
      return new NextResponse(stickerHtml, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }

    // 4. Render to PDF via Puppeteer
    const pdfFormat = sheetLayout !== 'single' ? 'A4' : '100x150';
    const pdfBuffer = await renderHtmlToPdf(stickerHtml, { format: pdfFormat });

    if (!pdfBuffer) {
      // Fallback to print-ready HTML page with @page rules
      console.warn('Returning print-ready HTML fallback for sticker');
      return new NextResponse(stickerHtml, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Print-Fallback': 'true',
        },
      });
    }

    // 5. Return PDF Response
    const filename =
      eligibleOrders.length === 1
        ? `sticker-${eligibleOrders[0].orderNumber}.pdf`
        : `stickers-${eligibleOrders.length}-orders.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('Sticker print route error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Error generating parcel sticker document' },
      { status: 500 }
    );
  }
}
