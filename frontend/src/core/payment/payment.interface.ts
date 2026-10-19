export interface CreatePaymentPayload {
  orderId: string;
  orderNumber: string;
  amount: number; // in integer BDT
  customerName: string;
  customerPhone: string;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface PaymentInitResult {
  success: boolean;
  provider: 'COD' | 'BKASH' | 'NAGAD' | 'CARD';
  paymentUrl?: string;
  transactionId?: string;
  requiresRedirect: boolean;
  message?: string;
}

export interface PaymentVerifyResult {
  success: boolean;
  transactionId: string;
  amount: number;
  status: 'PAID' | 'FAILED' | 'PENDING';
  rawResponse?: Record<string, unknown>;
  message?: string;
}

export interface IPaymentProvider {
  name: string;
  initiatePayment(payload: CreatePaymentPayload): Promise<PaymentInitResult>;
  verifyPayment(paymentIdOrTrxId: string, queryParams?: Record<string, string>): Promise<PaymentVerifyResult>;
  refundPayment?(transactionId: string, amount: number, reason: string): Promise<{ success: boolean; refundTrxId?: string }>;
}
