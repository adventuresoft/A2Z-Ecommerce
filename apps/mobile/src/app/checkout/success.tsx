import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { OrderSuccessScreen } from '@/features/checkout/screens/order-success-screen';

export default function OrderSuccessRoute() {
  const params = useLocalSearchParams<{
    orderId?: string;
    orderNumber?: string;
    paymentMethod?: string;
  }>();

  return (
    <OrderSuccessScreen
      orderId={typeof params.orderId === 'string' ? params.orderId : undefined}
      orderNumber={typeof params.orderNumber === 'string' ? params.orderNumber : undefined}
      paymentMethod={typeof params.paymentMethod === 'string' ? params.paymentMethod : undefined}
    />
  );
}
