import {
  ICourierProvider,
  CourierConsignmentPayload,
  CourierConsignmentResult,
  CourierStatusResult,
} from './courier.interface';

export class MockCourierProvider implements ICourierProvider {
  name = 'MOCK_STEADFAST';

  async createConsignment(payload: CourierConsignmentPayload): Promise<CourierConsignmentResult> {
    // Generate realistic mock consignment and tracking code
    const mockConsignmentId = `STF-${Math.floor(100000 + Math.random() * 900000)}`;
    const mockTrackingCode = `TRK-${Date.now().toString().slice(-6)}`;
    const courierCharge = payload.district.toLowerCase().includes('dhaka') ? 60 : 120;

    return {
      success: true,
      courier: 'STEADFAST',
      consignmentId: mockConsignmentId,
      trackingCode: mockTrackingCode,
      courierCharge,
      message: 'Mock consignment created successfully for Steadfast.',
      rawResponse: {
        status: 200,
        consignment: {
          consignment_id: mockConsignmentId,
          tracking_code: mockTrackingCode,
          recipient_name: payload.customerName,
          recipient_phone: payload.customerPhone,
          recipient_address: payload.customerAddress,
          cod_amount: payload.codAmount,
          status: 'in_review',
        },
      },
    };
  }

  async checkStatus(trackingCodeOrConsignmentId: string): Promise<CourierStatusResult> {
    return {
      consignmentId: trackingCodeOrConsignmentId,
      trackingCode: trackingCodeOrConsignmentId,
      status: 'SHIPPED',
      deliveryDate: new Date(),
      rawResponse: {
        status: 200,
        delivery_status: 'in_transit',
        updated_at: new Date().toISOString(),
      },
    };
  }

  async checkCustomerRisk(phone: string): Promise<{
    pastSuccessRate: number;
    isRisky: boolean;
    totalDeliveries: number;
    returnCount: number;
    totalParcels?: number;
    hasHistory?: boolean;
  }> {
    // High-risk mock if phone ends in '0000'
    const isMockRisky = phone.endsWith('0000');
    const totalParcels = isMockRisky ? 8 : 25;
    const totalDeliveries = isMockRisky ? 5 : 24;
    const returnCount = isMockRisky ? 3 : 1;
    const pastSuccessRate = Math.round((totalDeliveries / totalParcels) * 100);

    return {
      hasHistory: true,
      totalParcels,
      totalDeliveries,
      returnCount,
      pastSuccessRate,
      isRisky: isMockRisky,
    };
  }
}
