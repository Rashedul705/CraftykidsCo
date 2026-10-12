export interface SendSmsPayload {
  toPhone: string;
  message: string;
  templateKey?: 'OTP_LOGIN' | 'ORDER_PLACED' | 'ORDER_CONFIRMED' | 'ORDER_SHIPPED' | 'ORDER_DELIVERED';
}

export interface SmsSendResult {
  success: boolean;
  messageId: string;
  recipient: string;
  status: 'SENT' | 'FAILED';
  rawResponse?: Record<string, unknown>;
}

export interface INotificationProvider {
  name: string;
  sendSms(payload: SendSmsPayload): Promise<SmsSendResult>;
}

export class MockSmsProvider implements INotificationProvider {
  name = 'MOCK_BANGLADESH_SMS';

  async sendSms(payload: SendSmsPayload): Promise<SmsSendResult> {
    console.log(`[SMS DISPATCHED -> ${payload.toPhone}]: ${payload.message}`);
    return {
      success: true,
      messageId: `SMS-${Date.now()}`,
      recipient: payload.toPhone,
      status: 'SENT',
      rawResponse: { provider: 'MockSMS', sentAt: new Date().toISOString() },
    };
  }
}

export function getNotificationProvider(): INotificationProvider {
  return new MockSmsProvider();
}
