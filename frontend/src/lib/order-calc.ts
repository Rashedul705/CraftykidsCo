/**
 * CraftyKidsCo Order Financials & Calculation Engine
 * 
 * Spec Rule Section 0:
 * amountToCollect = subtotal + deliveryCharge - discount
 * If payment is already paid (bKash, Nagad, card, or paymentStatus === 'PAID'),
 * the amount to collect is 0 and the invoice and sticker must show "পেইড" instead of a collect amount.
 * 
 * This shared function is used everywhere:
 * - Order detail panel
 * - Customer invoice (A4)
 * - Parcel sticker (100 x 150 mm)
 * - Courier API request (Steadfast COD amount)
 */

export interface OrderFinancialRecord {
  subtotal?: number;
  deliveryCharge?: number;
  discountAmount?: number;
  totalAmount?: number;
  paymentStatus?: string;
  paymentMethod?: string;
  items?: Array<{ price: number; quantity: number }>;
}

export interface AmountToCollectResult {
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  grossTotal: number;
  amountToCollect: number;
  isPaid: boolean;
  collectDisplayBn: string; // e.g. "৳1,629" or "পেইড"
  collectDisplayEn: string; // e.g. "৳1,629" or "PAID"
  statusLabelBn: string;    // "পেইড" or "বকেয়া (COD)"
}

/**
 * Determines whether an order is pre-paid
 */
export function isOrderPaid(paymentStatus?: string, paymentMethod?: string): boolean {
  const status = (paymentStatus || '').toUpperCase().trim();
  const method = (paymentMethod || '').toUpperCase().trim();

  // If explicitly marked as PAID or COMPLETED
  if (status === 'PAID' || status === 'COMPLETED') {
    return true;
  }

  // If digital payment method is confirmed (not UNPAID / FAILED / REFUNDED / PENDING)
  if (
    ['BKASH', 'NAGAD', 'CARD', 'ONLINE', 'SSLCOMMERZ', 'ROCKET', 'UPAY'].includes(method) &&
    status !== 'UNPAID' &&
    status !== 'FAILED' &&
    status !== 'REFUNDED' &&
    status !== 'PENDING'
  ) {
    return true;
  }

  return false;
}

/**
 * Format any integer or number with Bangladeshi Taka currency format (e.g. ৳1,629)
 */
export function formatTaka(amount: number): string {
  const safe = Math.round(Number.isFinite(amount) ? amount : 0);
  return `৳${safe.toLocaleString('en-US')}`;
}

/**
 * Single source of truth calculation for Amount to Collect
 */
export function calculateAmountToCollect(order: OrderFinancialRecord): AmountToCollectResult {
  // 1. Resolve subtotal
  let subtotal = Number(order.subtotal);
  if (!Number.isFinite(subtotal) || subtotal <= 0) {
    if (Array.isArray(order.items) && order.items.length > 0) {
      subtotal = order.items.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);
    } else {
      subtotal = Number(order.totalAmount) || 0;
    }
  }

  // 2. Resolve delivery charge
  const deliveryCharge = Math.max(0, Number(order.deliveryCharge) || 0);

  // 3. Resolve discount
  const discount = Math.max(0, Number(order.discountAmount) || 0);

  // 4. Exact gross formula: subtotal + deliveryCharge - discount
  const grossTotal = Math.max(0, subtotal + deliveryCharge - discount);

  // 5. Check paid state
  const isPaid = isOrderPaid(order.paymentStatus, order.paymentMethod);

  // 6. Final amount to collect: 0 if paid, else grossTotal
  const amountToCollect = isPaid ? 0 : grossTotal;

  return {
    subtotal,
    deliveryCharge,
    discount,
    grossTotal,
    amountToCollect,
    isPaid,
    collectDisplayBn: isPaid ? 'পেইড' : formatTaka(amountToCollect),
    collectDisplayEn: isPaid ? 'PAID' : formatTaka(amountToCollect),
    statusLabelBn: isPaid ? 'পেইড' : 'বকেয়া (ক্যাশ অন ডেলিভারি)',
  };
}
