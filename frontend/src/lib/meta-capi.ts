import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import { Setting } from '@/models/Setting';
import { defaultSiteSettings, PixelSettings } from '@/lib/site-settings';

export interface MetaCapiUserData {
  phone?: string;
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  district?: string;
  clientIp?: string;
  clientUserAgent?: string;
  fbp?: string; // _fbp cookie value
  fbc?: string; // _fbc cookie value
}

export interface MetaCapiCustomData {
  currency?: string;
  value?: number;
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: 'product' | 'product_group';
  contents?: Array<{
    id: string;
    quantity: number;
    item_price?: number;
    title?: string;
  }>;
  num_items?: number;
  order_id?: string;
  status?: string;
}

export interface MetaCapiEventPayload {
  eventName: 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase' | string;
  eventId: string;
  eventTime?: number;
  eventSourceUrl?: string;
  actionSource?: 'website' | 'system_generated';
  userData?: MetaCapiUserData;
  customData?: MetaCapiCustomData;
  testEventCode?: string;
}

export interface MetaCapiResult {
  success: boolean;
  eventsReceived?: number;
  fbTraceId?: string;
  message?: string;
  rawResponse?: any;
}

/**
 * Standard SHA-256 hash function required by Meta Graph API.
 * Inputs must be trimmed and converted to lowercase before hashing.
 */
export function sha256Hash(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return undefined;
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Normalize Bangladeshi or international phone numbers to E.164 without '+' or leading zeros.
 * Meta expects numbers with country code: e.g. Bangladesh: 88017XXXXXXXX
 */
export function normalizePhoneForMeta(phone: string | undefined | null): string | undefined {
  if (!phone) return undefined;
  let digits = String(phone).replace(/\D/g, '');
  if (!digits) return undefined;

  // If starts with 880, keep it
  if (digits.startsWith('880')) {
    // Valid BD format
  } else if (digits.startsWith('01') && digits.length === 11) {
    // 01712345678 -> 8801712345678
    digits = `88${digits}`;
  } else if (digits.startsWith('1') && digits.length === 10) {
    // 1712345678 -> 8801712345678
    digits = `880${digits}`;
  }

  return digits;
}

/**
 * Fetch current Pixel & CAPI configurations from MongoDB or environment variables
 */
export async function getPixelConfiguration(): Promise<PixelSettings> {
  let pixelConfig: PixelSettings = {
    ...defaultSiteSettings.pixel!,
    pixelId: process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID || '',
    capiToken: process.env.META_CAPI_TOKEN || process.env.FACEBOOK_CONVERSIONS_API_ACCESS_TOKEN || '',
    testEventCode: process.env.META_TEST_EVENT_CODE || '',
    pixelEnabled: false,
  };

  try {
    await connectToDatabase();
    const dbDoc = await Setting.findOne({ key: 'site_settings' }).lean();
    if (dbDoc && (dbDoc as any).value) {
      const parsed = JSON.parse((dbDoc as any).value);
      if (parsed.pixel) {
        pixelConfig = {
          ...pixelConfig,
          ...parsed.pixel,
          // Fall back to env variables if settings are empty
          pixelId: parsed.pixel.pixelId || pixelConfig.pixelId,
          capiToken: parsed.pixel.capiToken || pixelConfig.capiToken,
          testEventCode: parsed.pixel.testEventCode || pixelConfig.testEventCode,
        };
      }
    }
  } catch (err) {
    console.warn('[Meta CAPI] Error loading site settings for Pixel:', err);
  }

  // If pixelId and capiToken are provided via env, enable automatically unless explicitly disabled in DB
  if (!pixelConfig.pixelEnabled && pixelConfig.pixelId && pixelConfig.capiToken) {
    pixelConfig.pixelEnabled = true;
  }

  return pixelConfig;
}

/**
 * Dispatches an event to the official Meta Conversions API (Graph API v21.0)
 */
export async function sendMetaCapiEvent(payload: MetaCapiEventPayload): Promise<MetaCapiResult> {
  try {
    const config = await getPixelConfiguration();

    if (!config.pixelEnabled) {
      return {
        success: false,
        message: 'Meta Pixel & Conversions API is currently disabled in site settings.',
      };
    }

    if (!config.pixelId) {
      return {
        success: false,
        message: 'Meta Pixel ID is missing.',
      };
    }

    if (!config.capiToken) {
      return {
        success: false,
        message: 'Meta Conversions API Access Token (CAPI Token) is missing.',
      };
    }

    // Check individual event toggle
    if (payload.eventName === 'PageView' && config.trackPageView === false) {
      return { success: true, message: 'PageView tracking disabled.' };
    }
    if (payload.eventName === 'AddToCart' && config.trackAddToCart === false) {
      return { success: true, message: 'AddToCart tracking disabled.' };
    }
    if (payload.eventName === 'InitiateCheckout' && config.trackInitiateCheckout === false) {
      return { success: true, message: 'InitiateCheckout tracking disabled.' };
    }
    if (payload.eventName === 'Purchase' && config.trackPurchase === false) {
      return { success: true, message: 'Purchase tracking disabled.' };
    }

    const { userData = {}, customData = {} } = payload;

    // Hash user identity fields
    const hashedEmail = sha256Hash(userData.email);
    const normalizedPhone = normalizePhoneForMeta(userData.phone);
    const hashedPhone = sha256Hash(normalizedPhone);

    let hashedFirstName: string | undefined;
    let hashedLastName: string | undefined;
    if (userData.firstName) {
      hashedFirstName = sha256Hash(userData.firstName);
    } else if (userData.email || userData.phone) {
      // Split single full name if provided
      const rawName = (userData as any).customerName || (userData as any).name || '';
      if (rawName) {
        const parts = rawName.trim().split(/\s+/);
        hashedFirstName = sha256Hash(parts[0]);
        if (parts.length > 1) {
          hashedLastName = sha256Hash(parts.slice(1).join(' '));
        }
      }
    }
    if (userData.lastName && !hashedLastName) {
      hashedLastName = sha256Hash(userData.lastName);
    }

    const cityOrDistrict = userData.city || userData.district;
    const hashedCity = sha256Hash(cityOrDistrict);
    const hashedCountry = sha256Hash('bd'); // Default Bangladesh

    // Construct Meta CAPI user_data object
    const metaUserData: Record<string, any> = {
      ...(hashedEmail ? { em: [hashedEmail] } : {}),
      ...(hashedPhone ? { ph: [hashedPhone] } : {}),
      ...(hashedFirstName ? { fn: [hashedFirstName] } : {}),
      ...(hashedLastName ? { ln: [hashedLastName] } : {}),
      ...(hashedCity ? { ct: [hashedCity] } : {}),
      country: [hashedCountry],
      ...(userData.clientIp ? { client_ip_address: userData.clientIp } : {}),
      ...(userData.clientUserAgent ? { client_user_agent: userData.clientUserAgent } : {}),
      ...(userData.fbp ? { fbp: userData.fbp } : {}),
      ...(userData.fbc ? { fbc: userData.fbc } : {}),
    };

    // Construct Meta CAPI event object
    const eventTime = payload.eventTime || Math.floor(Date.now() / 1000);
    const eventSourceUrl =
      payload.eventSourceUrl ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://craftykidsco.com';

    const eventObject: Record<string, any> = {
      event_name: payload.eventName,
      event_time: eventTime,
      event_id: payload.eventId,
      event_source_url: eventSourceUrl,
      action_source: payload.actionSource || 'website',
      user_data: metaUserData,
      custom_data: {
        currency: customData.currency || 'BDT',
        ...(customData.value !== undefined ? { value: Number(customData.value) } : {}),
        ...(customData.content_name ? { content_name: customData.content_name } : {}),
        ...(customData.content_category ? { content_category: customData.content_category } : {}),
        ...(customData.content_ids ? { content_ids: customData.content_ids } : {}),
        ...(customData.content_type ? { content_type: customData.content_type } : { content_type: 'product' }),
        ...(customData.contents ? { contents: customData.contents } : {}),
        ...(customData.num_items !== undefined ? { num_items: Number(customData.num_items) } : {}),
        ...(customData.order_id ? { order_id: customData.order_id } : {}),
        ...(customData.status ? { status: customData.status } : {}),
      },
    };

    // Test event code support
    const activeTestCode = payload.testEventCode || config.testEventCode;

    const requestBody: Record<string, any> = {
      data: [eventObject],
      ...(activeTestCode ? { test_event_code: activeTestCode } : {}),
    };

    const graphUrl = `https://graph.facebook.com/v21.0/${encodeURIComponent(config.pixelId)}/events`;

    const res = await fetch(graphUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.capiToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    const responseData = await res.json().catch(() => null);

    if (res.ok && responseData?.events_received) {
      console.log(`[Meta CAPI] ✅ Event ${payload.eventName} [ID: ${payload.eventId}] sent successfully. Events received: ${responseData.events_received}`);
      return {
        success: true,
        eventsReceived: responseData.events_received,
        fbTraceId: responseData.fbtrace_id,
        rawResponse: responseData,
      };
    }

    const errorMsg =
      responseData?.error?.message ||
      responseData?.message ||
      `Meta CAPI responded with HTTP status ${res.status}`;

    console.warn(`[Meta CAPI] ⚠️ Error sending ${payload.eventName}:`, errorMsg, responseData);

    return {
      success: false,
      message: errorMsg,
      rawResponse: responseData,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Network error communicating with Meta Graph API';
    console.error('[Meta CAPI] Network error:', errorMsg);
    return {
      success: false,
      message: errorMsg,
    };
  }
}
