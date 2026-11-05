'use client';

import React from 'react';
import Link from 'next/link';
import { Briefcase, MapPin } from 'lucide-react';
import type { MarketplaceCard } from '../../lib/marketplace-client';
import {
  experienceLabel,
  formatPrice,
  initials,
  locationLabel,
} from '../../lib/marketplace-format';
import { AvailabilityBadge, AvailabilityEdge } from './AvailabilityBadge';
import { ContactActions } from './ContactActions';

export function Avatar({
  name,
  photoUrl,
  size = 64,
}: {
  name: string;
  photoUrl: string | null;
  size?: number;
}) {
  const style = { width: size, height: size };
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={`Photo of ${name}`}
        loading="lazy"
        style={style}
        className="shrink-0 rounded-full object-cover ring-1 ring-slate-200"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      style={style}
      className="flex shrink-0 items-center justify-center rounded-full bg-primary-soft text-lg font-semibold text-primary ring-1 ring-slate-200"
    >
      {initials(name)}
    </span>
  );
}

export function FreelancerCard({
  freelancer,
  isMember,
  membershipLoading,
}: {
  freelancer: MarketplaceCard;
  isMember: boolean;
  membershipLoading: boolean;
}) {
  const dim = freelancer.availability !== 'AVAILABLE';
  return (
    <li
      className={`relative overflow-hidden rounded-lg border border-slate-200 bg-white py-4 pl-6 pr-4 ${
        dim ? 'bg-slate-50/60' : ''
      }`}
    >
      <AvailabilityEdge availability={freelancer.availability} />

      <div className="flex gap-4">
        <Avatar name={freelancer.displayName} photoUrl={freelancer.photoUrl} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="text-base font-semibold text-slate-900">
              <Link
                href={`/hire/${freelancer.id}`}
                className="hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {freelancer.displayName}
              </Link>
            </h2>
            <AvailabilityBadge availability={freelancer.availability} />
          </div>

          <p className="mt-0.5 text-sm text-slate-700">
            {freelancer.profession?.name ?? 'Professional'}
            {freelancer.title ? `, ${freelancer.title}` : ''}
          </p>

          <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Experience</dt>
              <Briefcase className="h-4 w-4" aria-hidden="true" />
              <dd>{experienceLabel(freelancer.experienceYears)}</dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Location</dt>
              <MapPin className="h-4 w-4" aria-hidden="true" />
              <dd>{locationLabel(freelancer.primaryLocation)}</dd>
            </div>
          </dl>

          {freelancer.skills.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Top skills">
              {freelancer.skills.map((skill) => (
                <li
                  key={skill.id}
                  className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                >
                  {skill.name}
                </li>
              ))}
              {freelancer.extraSkillCount > 0 && (
                <li className="px-1 py-0.5 text-xs text-slate-500">
                  +{freelancer.extraSkillCount} more
                </li>
              )}
            </ul>
          )}
        </div>

        <div className="hidden shrink-0 text-right sm:block">
          <p className="text-xs text-slate-500">Starting from</p>
          <p className="text-lg font-semibold tabular-nums text-slate-900">
            {formatPrice(freelancer.startingPrice, freelancer.startingPriceType)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3 border-t border-slate-100 pt-3">
        <p className="text-sm text-slate-700 sm:hidden">
          From{' '}
          <span className="font-semibold tabular-nums">
            {formatPrice(freelancer.startingPrice, freelancer.startingPriceType)}
          </span>
        </p>
        <Link
          href={`/hire/${freelancer.id}`}
          className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          View profile
        </Link>
        <ContactActions
          freelancerId={freelancer.id}
          isMember={isMember}
          isLoading={membershipLoading}
        />
      </div>
    </li>
  );
}

