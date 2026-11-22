import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { CheckoutScreen } from '@/features/checkout/screens/checkout-screen';

export default function CheckoutRoute() {
  const { coupon } = useLocalSearchParams<{ coupon?: string }>();
  return <CheckoutScreen initialCoupon={typeof coupon === 'string' ? coupon : undefined} />;
}
