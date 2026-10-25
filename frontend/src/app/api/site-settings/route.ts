import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Setting } from '@/models/Setting';
import { SiteSettings, defaultSiteSettings } from '@/lib/site-settings';
import { getSiteSettings, updateSiteSettings } from '@/lib/store';
import { verifyAdminRequest } from '@/lib/auth';

export async function GET() {
  try {
    // 1. Try querying MongoDB Atlas
    try {
      await connectToDatabase();
      const dbDoc = await Setting.findOne({ key: 'site_settings' }).lean();
      if (dbDoc && dbDoc.value) {
        const parsed = JSON.parse(dbDoc.value);
        // Merge with defaults so any newly added fields always have fallback values
        const merged: SiteSettings = {
          ...defaultSiteSettings,
          ...parsed,
          announcement: { ...defaultSiteSettings.announcement, ...(parsed.announcement || {}) },
          showcases: { ...defaultSiteSettings.showcases, ...(parsed.showcases || {}) },
          whyLoveUs: { ...defaultSiteSettings.whyLoveUs, ...(parsed.whyLoveUs || {}) },
          testimonials: { ...defaultSiteSettings.testimonials, ...(parsed.testimonials || {}) },
          bulkOrderBanner: { ...defaultSiteSettings.bulkOrderBanner, ...(parsed.bulkOrderBanner || {}) },
          welcomeOffer: { ...defaultSiteSettings.welcomeOffer, ...(parsed.welcomeOffer || {}) },
          footer: { ...defaultSiteSettings.footer, ...(parsed.footer || {}) },
          print: { ...defaultSiteSettings.print, ...(parsed.print || {}) },
          customPages: {
            contact: { ...defaultSiteSettings.customPages!.contact, ...(parsed.customPages?.contact || {}) },
            about: { ...defaultSiteSettings.customPages!.about, ...(parsed.customPages?.about || {}) },
            privacy: { ...defaultSiteSettings.customPages!.privacy, ...(parsed.customPages?.privacy || {}) },
            terms: { ...defaultSiteSettings.customPages!.terms, ...(parsed.customPages?.terms || {}) },
          },
          heroSlides: Array.isArray(parsed.heroSlides) && parsed.heroSlides.length > 0 ? parsed.heroSlides : defaultSiteSettings.heroSlides,
          trustBadges: Array.isArray(parsed.trustBadges) && parsed.trustBadges.length > 0 ? parsed.trustBadges : defaultSiteSettings.trustBadges,
          promoBanners: Array.isArray(parsed.promoBanners) && parsed.promoBanners.length > 0 ? parsed.promoBanners : defaultSiteSettings.promoBanners,
        };

        // Automatically migrate any legacy/dummy placeholder phone numbers or address
        let updated = false;
        if (merged.footer?.address?.includes('ধানমন্ডি') || merged.footer?.address?.includes('ওপেন ২৪ ঘণ্টা')) {
          merged.footer.address = 'তেরখাদিয়া, রাজপাড়া, রাজশাহী।';
          updated = true;
        }
        const isLegacyNumber = (val?: string) =>
          !val ||
          val.includes('01711') ||
          val.includes('১৭১১') ||
          val.includes('01890') ||
          val.includes('১৮৯০') ||
          val.includes('01700') ||
          val.includes('১৭০০');

        if (isLegacyNumber(merged.footer?.phone)) {
          merged.footer.phone = '+৮৮০ ১৭৩১-৩৭৬৪৯৮';
          updated = true;
        }
        if (isLegacyNumber(merged.announcement?.hotline)) {
          merged.announcement.hotline = '01731-376498';
          updated = true;
        }
        if (isLegacyNumber(merged.announcement?.whatsapp)) {
          merged.announcement.whatsapp = '01731-376498';
          updated = true;
        }
        if (isLegacyNumber(merged.bulkOrderBanner?.whatsappNumber)) {
          merged.bulkOrderBanner.whatsappNumber = '+8801731376498';
          updated = true;
        }
        if (isLegacyNumber(merged.print?.phone)) {
          merged.print.phone = '01731-376498';
          updated = true;
        }
        if (isLegacyNumber(merged.print?.supportPhone)) {
          merged.print.supportPhone = '01731-376498';
          updated = true;
        }
        if (isLegacyNumber(merged.print?.whatsapp)) {
          merged.print.whatsapp = '8801731376498';
          updated = true;
        }
        if (Array.isArray(merged.promoBanners)) {
          merged.promoBanners.forEach((b) => {
            if (b.link && (b.link.includes('01711') || b.link.includes('01890') || b.link.includes('১৭১১'))) {
              b.link = 'https://wa.me/8801731376498';
              updated = true;
            }
          });
        }

        if (updated) {
          try {
            await Setting.updateOne(
              { key: 'site_settings' },
              { $set: { value: JSON.stringify(merged), updatedAt: new Date() } }
            );
          } catch (syncErr) {
            console.warn('Could not persist updated site_settings numbers to MongoDB:', syncErr);
          }
        }

        updateSiteSettings(merged);
        return NextResponse.json({
          success: true,
          settings: merged,
          source: 'mongodb',
        });
      }
    } catch (dbErr) {
      console.warn('MongoDB error reading site_settings (using memory fallback):', dbErr);
    }

    // 2. Fallback to in-memory store
    return NextResponse.json({
      success: true,
      settings: getSiteSettings(),
      source: 'memory',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Error fetching site settings', settings: defaultSiteSettings },
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
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
    }

    // Merge incoming changes
    const updated = updateSiteSettings(body);

    // Save to MongoDB Atlas
    try {
      await connectToDatabase();
      await Setting.findOneAndUpdate(
        { key: 'site_settings' },
        { key: 'site_settings', value: JSON.stringify(updated) },
        { upsert: true, new: true }
      );
    } catch (dbErr) {
      console.warn('MongoDB error saving site_settings:', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Site sections saved successfully',
      settings: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Error saving site settings' },
      { status: 500 }
    );
  }
}
