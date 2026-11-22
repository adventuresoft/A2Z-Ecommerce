import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { PaymentCallbackScreen } from '@/features/checkout/screens/payment-callback-screen';

export default function PaymentCallbackRoute() {
  const params = useLocalSearchParams<{
    invoice_number?: string;
    trx_id?: string;
    orderId?: string;
    orderNumber?: string;
  }>();

  return (
    <PaymentCallbackScreen
      invoiceNumber={typeof params.invoice_number === 'string' ? params.invoice_number : undefined}
      trxId={typeof params.trx_id === 'string' ? params.trx_id : undefined}
      orderId={typeof params.orderId === 'string' ? params.orderId : undefined}
      orderNumber={typeof params.orderNumber === 'string' ? params.orderNumber : undefined}
    />
  );
}
