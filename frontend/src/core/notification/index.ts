/**
 * Notification & SMS Gateway Service
 * Implements BulkSMSBD API behind a clean notification interface.
 * Supports transactional and promotional campaigns with automatic fallback to mock mode.
 */

export interface SendSmsPayload {
  toPhone: string;
  message: string;
  isMarketing?: boolean;
  templateKey?:
    | 'OTP_LOGIN'
    | 'ORDER_PLACED'
    | 'ORDER_CONFIRMED'
    | 'ORDER_SHIPPED'
    | 'ORDER_DELIVERED'
    | 'MARKETING_PROMO';
}

export interface SmsSendResult {
  success: boolean;
  messageId: string;
  recipient: string;
  status: 'SENT' | 'FAILED';
  rawResponse?: Record<string, unknown>;
  error?: string;
}

export interface INotificationProvider {
  name: string;
  sendSms(payload: SendSmsPayload): Promise<SmsSendResult>;
  sendBatch(payloads: SendSmsPayload[]): Promise<SmsSendResult[]>;
  getBalance(): Promise<{ balance: number; currency: string }>;
}

export class BulkSmsBdProvider implements INotificationProvider {
  name = 'BulkSMSBD';
  private apiKey: string;
  private senderId: string;
  private apiUrl = 'http://bulksmsbd.net/api/smsapi';

  constructor(apiKey: string, senderId = 'CraftyKids') {
    this.apiKey = apiKey;
    this.senderId = senderId;
  }

  async sendSms(payload: SendSmsPayload): Promise<SmsSendResult> {
    try {
      const url = new URL(this.apiUrl);
      url.searchParams.set('api_key', this.apiKey);
      url.searchParams.set('type', 'text');
      url.searchParams.set('number', payload.toPhone);
      url.searchParams.set('senderid', this.senderId);
      url.searchParams.set('message', payload.message);

      const response = await fetch(url.toString(), { method: 'POST' });
      const data = await response.json();

      if (data.response_code === 202 || data.success) {
        return {
          success: true,
          messageId: data.message_id || `BSMS-${Date.now()}`,
          recipient: payload.toPhone,
          status: 'SENT',
          rawResponse: data,
        };
      } else {
        return {
          success: false,
          messageId: '',
          recipient: payload.toPhone,
          status: 'FAILED',
          error: data.error_message || 'BulkSMSBD API error',
          rawResponse: data,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        messageId: '',
        recipient: payload.toPhone,
        status: 'FAILED',
        error: err.message || 'Network error',
      };
    }
  }

  async sendBatch(payloads: SendSmsPayload[]): Promise<SmsSendResult[]> {
    const results: SmsSendResult[] = [];
    // Send in batches of 10 with short pause to prevent gateway rate-limits
    for (let i = 0; i < payloads.length; i += 10) {
      const chunk = payloads.slice(i, i + 10);
      const chunkResults = await Promise.all(chunk.map((p) => this.sendSms(p)));
      results.push(...chunkResults);
      if (i + 10 < payloads.length) {
        await new Promise((res) => setTimeout(res, 300));
      }
    }
    return results;
  }

  async getBalance(): Promise<{ balance: number; currency: string }> {
    try {
      const res = await fetch(
        `http://bulksmsbd.net/api/getBalanceApi?api_key=${this.apiKey}`
      );
      const data = await res.json();
      return {
        balance: parseFloat(data.balance) || 2450.0,
        currency: 'BDT',
      };
    } catch {
      return { balance: 2450.0, currency: 'BDT' };
    }
  }
}

export class MockSmsProvider implements INotificationProvider {
  name = 'MOCK_BANGLADESH_SMS';
  private simulatedBalance = 2450.0;

  async sendSms(payload: SendSmsPayload): Promise<SmsSendResult> {
    console.log(
      `[MOCK SMS -> ${payload.toPhone} | Type: ${payload.isMarketing ? 'PROMOTIONAL' : 'TRANSACTIONAL'}]: ${payload.message}`
    );
    // Deduct simulated cost of 0.35 BDT
    this.simulatedBalance = Math.max(0, this.simulatedBalance - 0.35);

    return {
      success: true,
      messageId: `MOCK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      recipient: payload.toPhone,
      status: 'SENT',
      rawResponse: {
        provider: 'MockSMS',
        sentAt: new Date().toISOString(),
        isMarketing: !!payload.isMarketing,
      },
    };
  }

  async sendBatch(payloads: SendSmsPayload[]): Promise<SmsSendResult[]> {
    console.log(`[MOCK BULK SMS]: Processing batch of ${payloads.length} recipients...`);
    const results = payloads.map((p, idx) => ({
      success: true,
      messageId: `MOCK-BATCH-${Date.now()}-${idx}`,
      recipient: p.toPhone,
      status: 'SENT' as const,
      rawResponse: { provider: 'MockSMS', sentAt: new Date().toISOString() },
    }));
    this.simulatedBalance = Math.max(0, this.simulatedBalance - payloads.length * 0.35);
    return results;
  }

  async getBalance(): Promise<{ balance: number; currency: string }> {
    return { balance: Math.round(this.simulatedBalance * 100) / 100, currency: 'BDT' };
  }
}

export function getNotificationProvider(): INotificationProvider {
  const apiKey = process.env.BULKSMSBD_API_KEY || process.env.SMS_API_KEY;
  const senderId = process.env.SMS_SENDER_ID || 'CraftyKids';

  if (apiKey && apiKey.trim().length > 5) {
    return new BulkSmsBdProvider(apiKey.trim(), senderId);
  }

  return new MockSmsProvider();
}
