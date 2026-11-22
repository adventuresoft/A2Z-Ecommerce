import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { TrackShipmentScreen } from '@/features/orders/screens/track-shipment-screen';

export default function TrackShipmentRoute() {
  const { trackingNumber } = useLocalSearchParams<{ trackingNumber: string }>();
  const initial =
    typeof trackingNumber === 'string' && trackingNumber !== 'lookup'
      ? trackingNumber
      : '';
  return <TrackShipmentScreen initialTrackingNumber={initial} />;
}
