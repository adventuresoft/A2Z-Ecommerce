import React from 'react';
import type { FreelancerAvailability } from '../../lib/freelancer-client';
import { AVAILABILITY_STYLES } from '../../lib/marketplace-format';

export function AvailabilityBadge({
  availability,
  className = '',
}: {
  availability: FreelancerAvailability;
  className?: string;
}) {
  const style = AVAILABILITY_STYLES[availability];
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${style.badge} ${className}`}
    >
      {style.label}
    </span>
  );
}

/** The 4px leading edge that carries availability on cards and the profile. */
export function AvailabilityEdge({
  availability,
}: {
  availability: FreelancerAvailability;
}) {
  return (
    <span
      aria-hidden="true"
      className={`absolute inset-y-0 left-0 w-1 ${AVAILABILITY_STYLES[availability].edge}`}
    />
  );
}

