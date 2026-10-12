import {
  ICourierProvider,
  CourierConsignmentPayload,
  CourierConsignmentResult,
  CourierStatusResult,
} from './courier.interface';

export class SteadfastCourierProvider implements ICourierProvider {
  name = 'STEADFAST';
  private apiKey: string;
  private secretKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.STEADFAST_API_KEY || '';
    this.secretKey = process.env.STEADFAST_SECRET_KEY || '';
    this.baseUrl = process.env.STEADFAST_BASE_URL || 'https://portal.steadfast.courier/api/v1';
  }

  async createConsignment(payload: CourierConsignmentPayload): Promise<CourierConsignmentResult> {
    try {
      const response = await fetch(`${this.baseUrl}/create_order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': this.apiKey,
          'Secret-Key': this.secretKey,
        },
        body: JSON.stringify({
          invoice: payload.orderNumber,
          recipient_name: payload.customerName,
          recipient_phone: payload.customerPhone,
          recipient_address: payload.customerAddress,
          cod_amount: payload.codAmount,
          note: payload.customerNote || 'Kids Art & Toy Delivery',
        }),
      });

      const data = await response.json();

      if (data.status === 200 && data.consignment) {
        return {
          success: true,
          courier: 'STEADFAST',
          consignmentId: String(data.consignment.consignment_id),
          trackingCode: data.consignment.tracking_code,
          rawResponse: data,
        };
      }

      return {
        success: false,
        courier: 'STEADFAST',
        consignmentId: '',
        trackingCode: '',
        message: data.message || 'Failed to create Steadfast consignment',
        rawResponse: data,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return {
        success: false,
        courier: 'STEADFAST',
        consignmentId: '',
        trackingCode: '',
        message: errorMessage,
      };
    }
  }

  async checkStatus(trackingCodeOrConsignmentId: string): Promise<CourierStatusResult> {
    try {
      const response = await fetch(`${this.baseUrl}/status_by_trackingcode/${trackingCodeOrConsignmentId}`, {
        method: 'GET',
        headers: {
          'Api-Key': this.apiKey,
          'Secret-Key': this.secretKey,
        },
      });

      const data = await response.json();
      let status: CourierStatusResult['status'] = 'IN_REVIEW';

      const courierStatus = (data.delivery_status || '').toLowerCase();
      if (courierStatus.includes('delivered')) status = 'DELIVERED';
      else if (courierStatus.includes('cancelled')) status = 'CANCELLED';
      else if (courierStatus.includes('returned')) status = 'RETURNED';
      else if (courierStatus.includes('transit') || courierStatus.includes('shipped')) status = 'SHIPPED';

      return {
        consignmentId: trackingCodeOrConsignmentId,
        trackingCode: trackingCodeOrConsignmentId,
        status,
        rawResponse: data,
      };
    } catch {
      return {
        consignmentId: trackingCodeOrConsignmentId,
        trackingCode: trackingCodeOrConsignmentId,
        status: 'IN_REVIEW',
      };
    }
  }

  async checkCustomerRisk(phone: string): Promise<{ pastSuccessRate: number; isRisky: boolean; totalDeliveries: number; returnCount: number }> {
    // Steadfast provides fraud check API endpoint
    try {
      const response = await fetch(`${this.baseUrl}/fraud_check/${phone}`, {
        headers: { 'Api-Key': this.apiKey, 'Secret-Key': this.secretKey },
      });
      const data = await response.json();
      return {
        pastSuccessRate: data.success_rate || 90,
        isRisky: (data.return_rate || 0) > 30,
        totalDeliveries: data.total_orders || 0,
        returnCount: data.total_returns || 0,
      };
    } catch {
      return { pastSuccessRate: 100, isRisky: false, totalDeliveries: 0, returnCount: 0 };
    }
  }
}
