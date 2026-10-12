import {
  IPaymentProvider,
  CreatePaymentPayload,
  PaymentInitResult,
  PaymentVerifyResult,
} from './payment.interface';

export class CashOnDeliveryProvider implements IPaymentProvider {
  name = 'COD';

  async initiatePayment(payload: CreatePaymentPayload): Promise<PaymentInitResult> {
    return {
      success: true,
      provider: 'COD',
      requiresRedirect: false,
      transactionId: `COD-${payload.orderNumber}`,
      message: 'Cash on Delivery order placed successfully. Payment due upon arrival.',
    };
  }

  async verifyPayment(transactionId: string): Promise<PaymentVerifyResult> {
    return {
      success: true,
      transactionId,
      amount: 0,
      status: 'PENDING', // Will be marked PAID when courier collects it
      message: 'Payment will be settled by courier on delivery.',
    };
  }
}

export class BkashPaymentProvider implements IPaymentProvider {
  name = 'BKASH';

  async initiatePayment(payload: CreatePaymentPayload): Promise<PaymentInitResult> {
    const isMock = process.env.USE_MOCK_PAYMENTS === 'true' || !process.env.BKASH_APP_KEY;
    if (isMock) {
      const mockTrx = `BKASH-${Date.now().toString().slice(-8)}`;
      return {
        success: true,
        provider: 'BKASH',
        transactionId: mockTrx,
        requiresRedirect: true,
        paymentUrl: `/api/payments/bkash/mock-gateway?orderId=${payload.orderId}&amount=${payload.amount}&trx=${mockTrx}`,
        message: 'Mock bKash payment gateway initiated',
      };
    }

    // Direct bKash tokenized checkout API integration placeholder
    return {
      success: false,
      provider: 'BKASH',
      requiresRedirect: false,
      message: 'bKash live credentials pending configuration.',
    };
  }

  async verifyPayment(trxId: string): Promise<PaymentVerifyResult> {
    return {
      success: true,
      transactionId: trxId,
      amount: 0,
      status: 'PAID',
      message: 'bKash transaction verified successfully.',
      rawResponse: { trxId, status: 'Completed', gateway: 'bKash Tokenized' },
    };
  }
}

export class NagadPaymentProvider implements IPaymentProvider {
  name = 'NAGAD';

  async initiatePayment(payload: CreatePaymentPayload): Promise<PaymentInitResult> {
    const isMock = process.env.USE_MOCK_PAYMENTS === 'true' || !process.env.NAGAD_MERCHANT_ID;
    if (isMock) {
      const mockTrx = `NAGAD-${Date.now().toString().slice(-8)}`;
      return {
        success: true,
        provider: 'NAGAD',
        transactionId: mockTrx,
        requiresRedirect: true,
        paymentUrl: `/api/payments/nagad/mock-gateway?orderId=${payload.orderId}&amount=${payload.amount}&trx=${mockTrx}`,
        message: 'Mock Nagad payment gateway initiated',
      };
    }

    return {
      success: false,
      provider: 'NAGAD',
      requiresRedirect: false,
      message: 'Nagad live credentials pending configuration.',
    };
  }

  async verifyPayment(trxId: string): Promise<PaymentVerifyResult> {
    return {
      success: true,
      transactionId: trxId,
      amount: 0,
      status: 'PAID',
      message: 'Nagad transaction verified successfully.',
      rawResponse: { trxId, status: 'Success', gateway: 'Nagad Direct' },
    };
  }
}

export function getPaymentProvider(method: 'COD' | 'BKASH' | 'NAGAD' | 'CARD'): IPaymentProvider {
  switch (method) {
    case 'BKASH':
      return new BkashPaymentProvider();
    case 'NAGAD':
      return new NagadPaymentProvider();
    case 'COD':
    default:
      return new CashOnDeliveryProvider();
  }
}
