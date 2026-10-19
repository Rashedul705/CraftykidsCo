import { ICourierProvider } from './courier.interface';
import { MockCourierProvider } from './mock-courier.provider';
import { SteadfastCourierProvider } from './steadfast.provider';

export function getCourierProvider(): ICourierProvider {
  const useMock = process.env.USE_MOCK_COURIER === 'true' || !process.env.STEADFAST_API_KEY;
  if (useMock) {
    return new MockCourierProvider();
  }
  return new SteadfastCourierProvider();
}

export * from './courier.interface';
export * from './mock-courier.provider';
export * from './steadfast.provider';
