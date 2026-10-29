import {
  ICourierProvider,
  CourierConsignmentPayload,
  CourierConsignmentResult,
  CourierStatusResult,
} from './courier.interface';

// Fast In-Memory Cache for Steadfast Fraud Check Scores (10 minutes TTL)
interface CacheEntry<T> {
  data: T;
  expiry: number;
}
const steadfastScoreCache = new Map<string, CacheEntry<any>>();

export function clearSteadfastCache(phone?: string) {
  if (phone) {
    const clean = (phone || '').replace(/\D/g, '');
    const cleanPhone = clean.startsWith('880') ? clean.substring(2) : clean;
    steadfastScoreCache.delete(cleanPhone);
  } else {
    steadfastScoreCache.clear();
  }
}

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
    serviceStatus?: 'available' | 'unavailable' | 'rate_limited' | 'error';
    statusMessage?: string;
    rateLimit?: { limit: number; current: number };
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
          serviceStatus: 'error',
          statusMessage: 'Invalid phone number format',
        };
      }

      // Check In-Memory Cache first (instant 0ms response)
      const cached = steadfastScoreCache.get(cleanPhone);
      if (cached && cached.expiry > Date.now()) {
        return cached.data;
      }

      let scoreData: any = null;
      let isRateLimited = false;
      let rateLimitInfo = { limit: 30, current: 30 };

      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Api-Key': this.apiKey,
        'Secret-Key': this.secretKey,
      };

      // 1. Try standard /fraud_check/{phone} endpoint
      try {
        const response = await fetch(`${this.baseUrl}/fraud_check/${cleanPhone}`, {
          headers,
          cache: 'no-store',
          signal: AbortSignal.timeout(3000),
        });
        if (response.status === 429) {
          isRateLimited = true;
          const body = await response.json().catch(() => null);
          if (body?.limit) {
            rateLimitInfo = { limit: Number(body.limit), current: Number(body.current || body.limit) };
          }
        } else if (response.ok) {
          scoreData = await response.json().catch(() => null);
        }
      } catch {
        // Fall through to next endpoint on timeout or error
      }

      // 2. If rate limited, return specific rate_limited status immediately
      if (isRateLimited) {
        const rateLimitResult = {
          hasHistory: false,
          serviceStatus: 'rate_limited' as const,
          statusMessage: `স্টিডফাস্ট এপিআই দৈনিক সার্চ লিমিট (${rateLimitInfo.limit}টি) শেষ হয়ে গেছে`,
          rateLimit: rateLimitInfo,
          pastSuccessRate: 0,
          returnRatio: 0,
          isRisky: false,
          totalReports: 0,
          totalDeliveries: 0,
          returnCount: 0,
          totalParcels: 0,
        };
        steadfastScoreCache.set(cleanPhone, {
          data: rateLimitResult,
          expiry: Date.now() + 2 * 60 * 1000,
        });
        return rateLimitResult;
      }

      // 3. If no valid data, try score-specific endpoint /fraud_check/score/{phone}
      if (!scoreData || (scoreData.status !== 200 && scoreData.delivery_ratio === undefined && scoreData.total_delivered === undefined)) {
        try {
          const response = await fetch(`${this.baseUrl}/fraud_check/score/${cleanPhone}`, {
            headers,
            cache: 'no-store',
            signal: AbortSignal.timeout(3000),
          });
          if (response.status === 429) {
            const body = await response.json().catch(() => null);
            const rateResult = {
              hasHistory: false,
              serviceStatus: 'rate_limited' as const,
              statusMessage: `স্টিডফাস্ট এপিআই দৈনিক সার্চ লিমিট (${body?.limit || 30}টি) শেষ হয়ে গেছে`,
              rateLimit: { limit: Number(body?.limit || 30), current: Number(body?.current || 30) },
              pastSuccessRate: 0,
              returnRatio: 0,
              isRisky: false,
              totalReports: 0,
              totalDeliveries: 0,
              returnCount: 0,
              totalParcels: 0,
            };
            steadfastScoreCache.set(cleanPhone, {
              data: rateResult,
              expiry: Date.now() + 2 * 60 * 1000,
            });
            return rateResult;
          } else if (response.ok) {
            scoreData = await response.json().catch(() => null);
          }
        } catch {
          // Handled below
        }
      }

      // 3. Process Authentic Live Response from Steadfast (handles all payload variants)
      if (scoreData && (scoreData.status === 200 || scoreData.delivery_ratio !== undefined || scoreData.total_delivered !== undefined || scoreData.Total_parcels !== undefined)) {
        const delivered = Number(scoreData.total_delivered ?? scoreData.delivered_count ?? scoreData.total_deliveries ?? 0);
        const cancelled = Number(scoreData.total_cancelled ?? scoreData.cancelled_count ?? scoreData.total_return ?? scoreData.return_count ?? 0);
        const parcels = Number(scoreData.Total_parcels ?? scoreData.total_parcels ?? (delivered + cancelled));
        const totalReports = Array.isArray(scoreData.total_fraud_reports)
          ? scoreData.total_fraud_reports.length
          : Number(scoreData.total_reports || 0);

        let pastSuccessRate = 0;
        if (scoreData.delivery_ratio !== undefined && scoreData.delivery_ratio !== null) {
          pastSuccessRate = Math.round(Number(scoreData.delivery_ratio));
        } else if (parcels > 0) {
          pastSuccessRate = Math.round((delivered / parcels) * 100);
        }

        let returnRatio = 0;
        if (scoreData.return_ratio !== undefined && scoreData.return_ratio !== null) {
          returnRatio = Math.round(Number(scoreData.return_ratio));
        } else if (scoreData.cancellation_ratio !== undefined && scoreData.cancellation_ratio !== null) {
          returnRatio = Math.round(Number(scoreData.cancellation_ratio));
        } else if (parcels > 0) {
          returnRatio = Math.round((cancelled / parcels) * 100);
        }

        const volumeBand = scoreData.volume_band || (parcels > 0 ? (parcels >= 20 ? 'high' : parcels >= 5 ? 'medium' : 'low') : 'none');
        const volumeRange = scoreData.volume_range || (parcels > 0 ? `${parcels} টি পার্সেল` : null);

        // A customer has history if they have parcels recorded, or delivery ratio provided
        const hasHistory = parcels > 0 || delivered > 0 || cancelled > 0 || (scoreData.delivery_ratio !== undefined && scoreData.delivery_ratio !== null && volumeBand !== 'none');

        if (hasHistory) {
          const isRisky = returnRatio > 30 || totalReports > 0 || (pastSuccessRate < 70 && pastSuccessRate > 0 && parcels >= 3);
          const result = {
            hasHistory: true,
            serviceStatus: 'available' as const,
            pastSuccessRate,
            returnRatio,
            deliveryRatio: pastSuccessRate,
            volumeRange: volumeRange || volumeBand,
            volumeBand,
            totalReports,
            isRisky,
            totalDeliveries: delivered,
            returnCount: cancelled,
            totalParcels: parcels,
          };
          steadfastScoreCache.set(cleanPhone, {
            data: result,
            expiry: Date.now() + 10 * 60 * 1000, // 10 minutes cache
          });
          return result;
        }

        // Authentic New Customer with 0 previous history on Steadfast
        const result = {
          hasHistory: false,
          serviceStatus: 'available' as const,
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
        steadfastScoreCache.set(cleanPhone, {
          data: result,
          expiry: Date.now() + 5 * 60 * 1000,
        });
        return result;
      }

      // Courier Gateway Server is Offline / Unreachable (HTTP 500, network timeout, etc.)
      const unavailableResult = {
        hasHistory: false,
        serviceStatus: 'unavailable' as const,
        statusMessage: 'স্টিডফাস্ট কুরিয়ার গেটওয়ে সাময়িকভাবে অফলাইন বা রেসপন্স করেনি (HTTP 500 / টাইমআউট)',
        pastSuccessRate: 0,
        returnRatio: 0,
        isRisky: false,
        totalReports: 0,
        totalDeliveries: 0,
        returnCount: 0,
        totalParcels: 0,
      };
      // Short cache (15 seconds) so retry button re-attempts immediately
      steadfastScoreCache.set(cleanPhone, {
        data: unavailableResult,
        expiry: Date.now() + 15 * 1000,
      });
      return unavailableResult;
    } catch {
      return {
        hasHistory: false,
        serviceStatus: 'unavailable',
        statusMessage: 'কুরিয়ার নেটওয়ার্ক সংযোগ বিঘ্নিত হয়েছে',
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
