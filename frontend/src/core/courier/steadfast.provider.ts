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
    this.baseUrl = process.env.STEADFAST_BASE_URL || 'https://portal.packzy.com/api/v1';
  }

  /**
   * Normalize Bangladeshi phone number to 11 digits (e.g., 01712345678)
   */
  private normalizePhone(phone: string): string {
    let cleaned = (phone || '').replace(/\D/g, '');
    if (cleaned.startsWith('880')) {
      cleaned = cleaned.substring(2);
    } else if (cleaned.startsWith('88')) {
      cleaned = cleaned.substring(2);
    }
    return cleaned;
  }

  /**
   * Create Consignment with Steadfast Courier
   */
  async createConsignment(payload: CourierConsignmentPayload): Promise<CourierConsignmentResult> {
    if (!this.apiKey || !this.secretKey) {
      return {
        success: false,
        courier: 'STEADFAST',
        consignmentId: '',
        trackingCode: '',
        message: 'Steadfast Courier API credentials (STEADFAST_API_KEY / STEADFAST_SECRET_KEY) are not configured.',
      };
    }

    try {
      const recipientPhone = this.normalizePhone(payload.customerPhone);
      const codAmount = Math.max(0, Math.round(Number(payload.codAmount) || 0));
      const invoiceNumber = String(payload.orderNumber || payload.orderId);

      const requestBody = {
        invoice: invoiceNumber,
        recipient_name: (payload.customerName || 'Customer').substring(0, 100),
        recipient_phone: recipientPhone,
        recipient_address: payload.customerAddress || 'Dhaka, Bangladesh',
        cod_amount: codAmount,
        note: payload.customerNote || 'CraftyKidsCo Plaster Painting Kits Delivery',
      };

      const response = await fetch(`${this.baseUrl}/create_order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Api-Key': this.apiKey,
          'Secret-Key': this.secretKey,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data && (data.status === 200 || data.status === '200') && data.consignment) {
        return {
          success: true,
          courier: 'STEADFAST',
          consignmentId: String(data.consignment.consignment_id),
          trackingCode: String(data.consignment.tracking_code),
          courierCharge: Number(data.consignment.delivery_fee || 0),
          rawResponse: data,
        };
      }

      let errorMessage = data?.message || 'Failed to create Steadfast consignment';
      if (data?.errors) {
        const errorDetails = Object.entries(data.errors)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join('; ');
        if (errorDetails) {
          errorMessage = `${errorMessage} (${errorDetails})`;
        }
      }

      return {
        success: false,
        courier: 'STEADFAST',
        consignmentId: '',
        trackingCode: '',
        message: errorMessage,
        rawResponse: data,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown network error communicating with Steadfast';
      return {
        success: false,
        courier: 'STEADFAST',
        consignmentId: '',
        trackingCode: '',
        message: errorMessage,
      };
    }
  }

  /**
   * Check Real-time Consignment Delivery Status
   */
  async checkStatus(trackingCodeOrConsignmentId: string): Promise<CourierStatusResult> {
    try {
      const target = encodeURIComponent((trackingCodeOrConsignmentId || '').trim());
      let response = await fetch(`${this.baseUrl}/status_by_trackingcode/${target}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Api-Key': this.apiKey,
          'Secret-Key': this.secretKey,
        },
      });

      // Fallback: If not found and target is purely numeric, try consignment ID endpoint
      if (!response.ok && /^\d+$/.test(target)) {
        response = await fetch(`${this.baseUrl}/status_by_cid/${target}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Api-Key': this.apiKey,
            'Secret-Key': this.secretKey,
          },
        });
      }

      const data = await response.json().catch(() => null);
      let status: CourierStatusResult['status'] = 'IN_REVIEW';

      const courierStatus = (data?.delivery_status || '').toLowerCase();
      if (courierStatus.includes('delivered')) status = 'DELIVERED';
      else if (courierStatus.includes('cancelled')) status = 'CANCELLED';
      else if (courierStatus.includes('returned')) status = 'RETURNED';
      else if (
        courierStatus.includes('transit') ||
        courierStatus.includes('shipped') ||
        courierStatus.includes('pending')
      ) {
        status = 'SHIPPED';
      }

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

  /**
   * Check Customer Delivery Success / Fraud Risk using Steadfast score endpoint
   */
  async checkCustomerRisk(phone: string): Promise<{
    pastSuccessRate: number;
    isRisky: boolean;
    totalDeliveries: number;
    returnCount: number;
    totalParcels?: number;
    hasHistory?: boolean;
    returnRatio?: number;
    deliveryRatio?: number;
    cancellationRatio?: number;
    totalReports?: number;
    volumeRange?: string;
    volumeBand?: string;
  }> {
    try {
      const cleanPhone = this.normalizePhone(phone);
      if (!cleanPhone || cleanPhone.length < 10) {
        return {
          pastSuccessRate: 0,
          isRisky: false,
          totalDeliveries: 0,
          returnCount: 0,
          totalParcels: 0,
          hasHistory: false,
        };
      }

      let scoreData: any = null;
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Api-Key': this.apiKey,
        'Secret-Key': this.secretKey,
      };

      // 1. Query Official Steadfast Live Score Endpoint
      try {
        const response = await fetch(`${this.baseUrl}/fraud_check/score/${cleanPhone}`, {
          headers,
          cache: 'no-store',
        });
        if (response.ok) {
          scoreData = await response.json().catch(() => null);
        }
      } catch (err) {
        console.warn('Steadfast score API error:', err);
      }

      // 2. Fallback to direct packzy endpoint if primary failed
      if (!scoreData || scoreData.status !== 200) {
        try {
          const response = await fetch(`https://portal.packzy.com/api/v1/fraud_check/score/${cleanPhone}`, {
            headers,
            cache: 'no-store',
          });
          if (response.ok) {
            scoreData = await response.json().catch(() => null);
          }
        } catch {}
      }

      // 3. Process Authentic Live Response from Steadfast
      if (scoreData && (scoreData.status === 200 || scoreData.delivery_ratio !== undefined)) {
        const volumeBand = scoreData.volume_band || 'none';
        const volumeRange = scoreData.volume_range || null;
        const totalReports = Number(scoreData.total_reports || 0);

        // A customer has history if delivery_ratio is not null and volume_band is not none
        const hasHistory =
          scoreData.delivery_ratio !== null &&
          scoreData.delivery_ratio !== undefined &&
          volumeBand !== 'none';

        if (hasHistory) {
          const pastSuccessRate = Number(scoreData.delivery_ratio ?? 0);
          const returnRatio = Number(scoreData.return_ratio ?? scoreData.cancellation_ratio ?? 0);
          const isRisky = returnRatio > 30 || totalReports > 0 || (pastSuccessRate < 70 && pastSuccessRate > 0);

          return {
            hasHistory: true,
            pastSuccessRate,
            returnRatio,
            deliveryRatio: pastSuccessRate,
            volumeRange: volumeRange || volumeBand,
            volumeBand,
            totalReports,
            isRisky,
            totalDeliveries: scoreData.delivered_count ?? undefined,
            returnCount: scoreData.cancelled_count ?? undefined,
            totalParcels: scoreData.total_parcels ?? undefined,
          };
        }

        // Authentic New Customer with 0 previous history on Steadfast
        return {
          hasHistory: false,
          pastSuccessRate: 0,
          returnRatio: 0,
          deliveryRatio: 0,
          volumeRange: 'none',
          volumeBand: 'none',
          totalReports,
          isRisky: totalReports > 0,
          totalDeliveries: 0,
          returnCount: 0,
          totalParcels: 0,
        };
      }

      return {
        hasHistory: false,
        pastSuccessRate: 0,
        returnRatio: 0,
        isRisky: false,
        totalReports: 0,
        totalDeliveries: 0,
        returnCount: 0,
        totalParcels: 0,
      };
    } catch {
      return {
        hasHistory: false,
        totalParcels: 0,
        totalDeliveries: 0,
        returnCount: 0,
        pastSuccessRate: 0,
        isRisky: false,
      };
    }
  }

  /**
   * Get Current Steadfast Account COD Balance
   */
  async getBalance(): Promise<{ success: boolean; balance: number; currency: string; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/get_balance`, {
        headers: {
          'Accept': 'application/json',
          'Api-Key': this.apiKey,
          'Secret-Key': this.secretKey,
        },
      });
      const data = await response.json().catch(() => null);
      if (data && (data.status === 200 || data.current_balance !== undefined)) {
        return {
          success: true,
          balance: Number(data.current_balance || 0),
          currency: 'BDT',
        };
      }
      return {
        success: false,
        balance: 0,
        currency: 'BDT',
        message: data?.message || 'Failed to fetch balance from Steadfast',
      };
    } catch (err: unknown) {
      return {
        success: false,
        balance: 0,
        currency: 'BDT',
        message: err instanceof Error ? err.message : 'Balance fetch error',
      };
    }
  }
}
