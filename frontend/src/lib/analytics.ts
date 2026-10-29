'use client';

/**
 * Client-Side Unified Meta Pixel & Conversions API (CAPI) Analytics Helper
 * Handles automatic deduplication between browser fbq and server CAPI events using identical event_id.
 */

export function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : undefined;
}

export function getFbp(): string | undefined {
  return getCookie('_fbp');
}

export function getFbc(): string | undefined {
  const cookieFbc = getCookie('_fbc');
  if (cookieFbc) return cookieFbc;

  // Check if current URL has fbclid parameter and format as standard _fbc
  if (typeof window !== 'undefined') {
    try {
      const url = new URL(window.location.href);
      const fbclid = url.searchParams.get('fbclid');
      if (fbclid) {
        const creationTime = Date.now();
        return `fb.1.${creationTime}.${fbclid}`;
      }
    } catch {}
  }
  return undefined;
}

export function generateEventId(prefix: string = 'evt'): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${timestamp}_${randomStr}`;
}

export interface TrackMetaEventOptions {
  eventId?: string;
  userData?: {
    phone?: string;
    email?: string;
    name?: string;
    district?: string;
  };
  eventSourceUrl?: string;
  skipCapi?: boolean;
}

/**
 * Core event tracking function with browser fbq and server CAPI dual-firing & deduplication
 */
export function trackMetaEvent(
  eventName: 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase' | string,
  customData: Record<string, any> = {},
  options: TrackMetaEventOptions = {}
): string {
  const eventId = options.eventId || generateEventId(eventName.toLowerCase().slice(0, 4));
  const fbp = getFbp();
  const fbc = getFbc();
  const eventSourceUrl = options.eventSourceUrl || (typeof window !== 'undefined' ? window.location.href : undefined);

  // 1. Browser Meta Pixel (fbq) tracking with explicit eventID for deduplication
  if (typeof window !== 'undefined' && (window as any).fbq) {
    try {
      (window as any).fbq('track', eventName, customData, { eventID: eventId });
    } catch (e) {
      console.warn('[Meta Pixel Browser Error]:', e);
    }
  }

  // 2. Dispatch Server-Side CAPI relay in background (non-blocking)
  if (!options.skipCapi && typeof window !== 'undefined') {
    const capiPayload = {
      eventName,
      eventId,
      eventSourceUrl,
      customData,
      userData: {
        ...(options.userData || {}),
        fbp,
        fbc,
      },
    };

    try {
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(capiPayload)], { type: 'application/json' });
        navigator.sendBeacon('/api/tracking/meta-capi', blob);
      } else {
        fetch('/api/tracking/meta-capi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(capiPayload),
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Ignore background network errors
    }
  }

  return eventId;
}

/**
 * Track Product ViewContent event
 */
export function trackViewContent(product: {
  id: string;
  title?: string;
  category?: string;
  price: number;
  variantTitle?: string;
  sku?: string;
}): string {
  return trackMetaEvent('ViewContent', {
    content_name: product.title || 'Product',
    content_category: product.category || 'Kids Toys & Art Kits',
    content_ids: [product.sku || product.id],
    content_type: 'product',
    value: Number(product.price || 0),
    currency: 'BDT',
    contents: [
      {
        id: product.sku || product.id,
        quantity: 1,
        item_price: Number(product.price || 0),
        title: product.variantTitle || product.title,
      },
    ],
  });
}

/**
 * Track AddToCart event
 */
export function trackAddToCart(item: {
  id: string;
  title?: string;
  category?: string;
  price: number;
  quantity?: number;
  variantTitle?: string;
  sku?: string;
}): string {
  const qty = Math.max(1, item.quantity || 1);
  return trackMetaEvent('AddToCart', {
    content_name: item.title || 'Product',
    content_category: item.category || 'Kids Toys & Art Kits',
    content_ids: [item.sku || item.id],
    content_type: 'product',
    value: Number(item.price || 0) * qty,
    currency: 'BDT',
    contents: [
      {
        id: item.sku || item.id,
        quantity: qty,
        item_price: Number(item.price || 0),
        title: item.variantTitle || item.title,
      },
    ],
  });
}

/**
 * Track InitiateCheckout event
 */
export function trackInitiateCheckout(
  items: Array<{
    id: string;
    title?: string;
    price: number;
    quantity: number;
    sku?: string;
  }>,
  totalAmount: number
): string {
  return trackMetaEvent('InitiateCheckout', {
    content_type: 'product',
    content_ids: items.map((i) => i.sku || i.id),
    contents: items.map((i) => ({
      id: i.sku || i.id,
      quantity: i.quantity,
      item_price: i.price,
      title: i.title,
    })),
    num_items: items.reduce((sum, i) => sum + i.quantity, 0),
    value: Number(totalAmount || 0),
    currency: 'BDT',
  });
}

/**
 * Track Purchase event
 */
export function trackPurchase(order: {
  orderNumber: string;
  totalAmount: number;
  items: Array<{
    id: string;
    title?: string;
    price: number;
    quantity: number;
    sku?: string;
  }>;
  customerPhone?: string;
  customerName?: string;
  district?: string;
  eventId?: string;
}): string {
  const eventId = order.eventId || `purch_${order.orderNumber}`;

  return trackMetaEvent(
    'Purchase',
    {
      content_type: 'product',
      order_id: order.orderNumber,
      content_ids: order.items.map((i) => i.sku || i.id),
      contents: order.items.map((i) => ({
        id: i.sku || i.id,
        quantity: i.quantity,
        item_price: i.price,
        title: i.title,
      })),
      num_items: order.items.reduce((sum, i) => sum + i.quantity, 0),
      value: Number(order.totalAmount || 0),
      currency: 'BDT',
    },
    {
      eventId,
      userData: {
        phone: order.customerPhone,
        name: order.customerName,
        district: order.district,
      },
    }
  );
}
