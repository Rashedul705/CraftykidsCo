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

/**
 * Normalizes Bangladesh phone number(s) to gateway format (e.g. 88017XXXXXXXX)
 * Accepts single numbers or comma-separated numbers.
 */
export function formatBdPhoneForGateway(phone: string): string {
  if (!phone) return '';
  const parts = phone.split(',').map((p) => {
    let clean = p.trim().replace(/[^0-9]/g, '');
    if (clean.startsWith('880')) {
      return clean;
    }
    if (clean.startsWith('01')) {
      return '88' + clean;
    }
    if (clean.startsWith('1') && clean.length === 10) {
      return '880' + clean;
    }
    return clean;
  }).filter((p) => p.length >= 11);
  return parts.join(',');
}

async function recordNotificationLog(
  recipient: string,
  event: string,
  message: string,
  status: 'SENT' | 'FAILED',
  rawResponse?: any
) {
  try {
    const { NotificationLog } = await import('@/models/Notification');
    const { connectToDatabase } = await import('@/lib/mongodb');
    await connectToDatabase();
    await NotificationLog.create({
      recipient,
      channel: 'SMS',
      event,
      message,
      status,
      responsePayload: rawResponse,
      createdAt: new Date(),
    });
  } catch {
    // Non-blocking log persistence
  }
}

export class BulkSmsBdProvider implements INotificationProvider {
  name = 'BulkSMSBD';
  private apiKey: string;
  private senderId: string;
  private apiUrl = 'https://bulksmsbd.net/api/smsapi';

  constructor(apiKey: string, senderId = '8809617644359') {
    this.apiKey = apiKey;
    this.senderId = senderId;
  }

  async sendSms(payload: SendSmsPayload): Promise<SmsSendResult> {
    try {
      const formattedPhone = formatBdPhoneForGateway(payload.toPhone);
      if (!formattedPhone) {
        return {
          success: false,
          messageId: '',
          recipient: payload.toPhone,
          status: 'FAILED',
          error: 'সঠিক বাংলাদেশি মোবাইল নম্বর নয় (Invalid phone number)',
        };
      }

      const params = new URLSearchParams();
      params.append('api_key', this.apiKey);
      params.append('type', 'text');
      params.append('number', formattedPhone);
      params.append('senderid', this.senderId);
      params.append('message', payload.message);

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const text = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        data = { error_message: text || `HTTP ${response.status}` };
      }

      const isSuccess = data.response_code === 202 || Boolean(data.success_message) || Boolean(data.success);

      const result: SmsSendResult = {
        success: isSuccess,
        messageId: data.message_id ? String(data.message_id) : `BSMS-${Date.now()}`,
        recipient: formattedPhone,
        status: isSuccess ? 'SENT' : 'FAILED',
        error: isSuccess ? undefined : (data.error_message || data.msg || 'BulkSMSBD API error'),
        rawResponse: data,
      };

      // Asynchronously log notification event
      recordNotificationLog(
        formattedPhone,
        payload.templateKey || (payload.isMarketing ? 'MARKETING_PROMO' : 'TRANSACTIONAL_SMS'),
        payload.message,
        result.status,
        data
      );

      return result;
    } catch (err: any) {
      const result: SmsSendResult = {
        success: false,
        messageId: '',
        recipient: payload.toPhone,
        status: 'FAILED',
        error: err.message || 'Network error',
      };

      recordNotificationLog(
        payload.toPhone,
        payload.templateKey || 'SMS_ERROR',
        payload.message,
        'FAILED',
        { error: err.message }
      );

      return result;
    }
  }

  async sendBatch(payloads: SendSmsPayload[]): Promise<SmsSendResult[]> {
    if (!payloads.length) return [];

    // Check if all messages are identical (e.g. bulk promotional SMS)
    const firstMsg = payloads[0].message;
    const isAllSame = payloads.every((p) => p.message === firstMsg);

    if (isAllSame && payloads.length > 1) {
      // Chunk comma-separated numbers in groups of up to 50
      const results: SmsSendResult[] = [];
      const chunkSize = 50;
      for (let i = 0; i < payloads.length; i += chunkSize) {
        const chunk = payloads.slice(i, i + chunkSize);
        const combinedPhones = chunk.map((c) => formatBdPhoneForGateway(c.toPhone)).filter(Boolean).join(',');

        if (combinedPhones) {
          const res = await this.sendSms({
            toPhone: combinedPhones,
            message: firstMsg,
            isMarketing: true,
            templateKey: 'MARKETING_PROMO',
          });

          for (const item of chunk) {
            results.push({
              success: res.success,
              messageId: res.messageId,
              recipient: item.toPhone,
              status: res.status,
              error: res.error,
              rawResponse: res.rawResponse,
            });
          }
        }

        if (i + chunkSize < payloads.length) {
          await new Promise((res) => setTimeout(res, 250));
        }
      }
      return results;
    }

    // Individual personalized messages
    const results: SmsSendResult[] = [];
    for (let i = 0; i < payloads.length; i += 5) {
      const chunk = payloads.slice(i, i + 5);
      const chunkResults = await Promise.all(chunk.map((p) => this.sendSms(p)));
      results.push(...chunkResults);
      if (i + 5 < payloads.length) {
        await new Promise((res) => setTimeout(res, 250));
      }
    }
    return results;
  }

  async getBalance(): Promise<{ balance: number; currency: string }> {
    try {
      const res = await fetch(
        `https://bulksmsbd.net/api/getBalanceApi?api_key=${encodeURIComponent(this.apiKey)}`
      );
      const data = await res.json();
      const numBalance = typeof data.balance === 'number'
        ? data.balance
        : parseFloat(data.balance);
      return {
        balance: isNaN(numBalance) ? 0 : numBalance,
        currency: 'BDT',
      };
    } catch {
      return { balance: 0, currency: 'BDT' };
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
    this.simulatedBalance = Math.max(0, this.simulatedBalance - 0.35);

    return {
      success: true,
      messageId: `MOCK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      recipient: payload.toPhone,
      status: 'SENT',
      rawResponse: {
        provider: 'MockSMS',
        sentAt: new Date().toISOString(),
        isMarketing: Boolean(payload.isMarketing),
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
  const apiKey = (process.env.BULKSMSBD_API_KEY || process.env.SMS_API_KEY || '').trim();
  const senderId = (process.env.SMS_SENDER_ID || '8809617644359').trim();

  if (apiKey && apiKey.length > 5) {
    return new BulkSmsBdProvider(apiKey, senderId);
  }

  return new MockSmsProvider();
}
