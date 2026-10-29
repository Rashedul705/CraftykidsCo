export interface CourierConsignmentPayload {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  district: string;
  codAmount: number; // in whole BDT
  customerNote?: string;
  weightInKg?: number;
}

export interface CourierConsignmentResult {
  success: boolean;
  courier: 'STEADFAST' | 'PATHAO' | 'REDX' | 'MOCK';
  consignmentId: string;
  trackingCode: string;
  courierCharge?: number;
  message?: string;
  rawResponse?: Record<string, unknown>;
}

export interface CourierStatusResult {
  consignmentId: string;
  trackingCode: string;
  status: 'IN_REVIEW' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';
  deliveryDate?: Date;
  returnReason?: string;
  rawResponse?: Record<string, unknown>;
}

export interface ICourierProvider {
  name: string;
  createConsignment(payload: CourierConsignmentPayload): Promise<CourierConsignmentResult>;
  checkStatus(trackingCodeOrConsignmentId: string): Promise<CourierStatusResult>;
  checkCustomerRisk(phone: string): Promise<{
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
    serviceStatus?: 'available' | 'unavailable' | 'rate_limited' | 'error';
    statusMessage?: string;
    rateLimit?: { limit: number; current: number };
  }>;
  getBalance?(): Promise<{ success: boolean; balance: number; currency: string; message?: string }>;
}
