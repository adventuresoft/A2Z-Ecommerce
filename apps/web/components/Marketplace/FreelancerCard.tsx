'use client';

import React from 'react';
import Link from 'next/link';
import { Briefcase, MapPin, Star } from 'lucide-react';
import type { MarketplaceCard } from '../../lib/marketplace-client';
import {
  experienceLabel,
  formatPrice,
  initials,
  locationLabel,
} from '../../lib/marketplace-format';
import { AvailabilityBadge, AvailabilityEdge } from './AvailabilityBadge';
import { ContactActions } from './ContactActions';

export function RatingBadge({
  averageRating,
  totalReviews,
}: {
  averageRating?: number | null;
  totalReviews?: number;
}) {
  const hasReviews = (totalReviews ?? 0) > 0 && averageRating != null;

  if (hasReviews) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/20">
        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" aria-hidden="true" />
        <span>{averageRating.toFixed(1)}</span>
        <span className="font-normal text-amber-700/80">({totalReviews})</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/15">
      <Star className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
      <span>New</span>
    </span>
  );
}

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
  layout = 'list',
}: {
  freelancer: MarketplaceCard;
  isMember: boolean;
  membershipLoading: boolean;
  layout?: 'list' | 'grid';
}) {
  const dim = freelancer.availability !== 'AVAILABLE';

  // Card / Grid layout
  if (layout === 'grid') {
    return (
      <li
        className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:border-slate-300 hover:shadow-xs ${
          dim ? 'bg-slate-50/70' : ''
        }`}
      >
        <AvailabilityEdge availability={freelancer.availability} />

        <div>
          {/* Header: Avatar, Name, Profession & Badge */}
          <div className="flex items-start gap-3.5">
            <Avatar name={freelancer.displayName} photoUrl={freelancer.photoUrl} size={54} />
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base font-semibold text-slate-900 group-hover:text-primary transition-colors">
                <Link
                  href={`/hire/${freelancer.id}`}
                  className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {freelancer.displayName}
                </Link>
              </h2>
              <p className="truncate text-xs font-medium text-slate-600 mt-0.5">
                {freelancer.profession?.name ?? 'Professional'}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <AvailabilityBadge availability={freelancer.availability} />
                <RatingBadge
                  averageRating={freelancer.averageRating}
                  totalReviews={freelancer.totalReviews}
                />
              </div>
            </div>
          </div>

          {/* Subtitle / Bio */}
          {freelancer.title && (
            <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
              {freelancer.title}
            </p>
          )}

          {/* Meta: Experience & Location */}
          <div className="mt-3.5 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs text-slate-500 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
              <span>{experienceLabel(freelancer.experienceYears)}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
              <span className="truncate max-w-[150px]">{locationLabel(freelancer.primaryLocation)}</span>
            </div>
          </div>

          {/* Top Skills */}
          {freelancer.skills.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Top skills">
              {freelancer.skills.slice(0, 3).map((skill) => (
                <li
                  key={skill.id}
                  className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                >
                  {skill.name}
                </li>
              ))}
              {freelancer.extraSkillCount > 0 && (
                <li className="self-center px-1 text-[11px] text-slate-400">
                  +{freelancer.extraSkillCount}
                </li>
              )}
            </ul>
          )}
        </div>

        {/* Footer: Price + Action Buttons */}
        <div className="mt-5 pt-3.5 border-t border-slate-100">
          <div className="flex items-baseline justify-between mb-3">
            <span className="text-[11px] text-slate-500 font-medium">Starting from</span>
            <span className="text-base font-bold tabular-nums text-slate-900">
              {formatPrice(freelancer.startingPrice, freelancer.startingPriceType)}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <Link
              href={`/hire/${freelancer.id}`}
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition"
            >
              View profile
            </Link>
            <ContactActions
              freelancerId={freelancer.id}
              isMember={isMember}
              isLoading={membershipLoading}
              layout="stacked"
            />
          </div>
        </div>
      </li>
    );
  }

  // Horizontal List layout
  return (
    <li
      className={`group relative overflow-hidden rounded-xl border border-slate-200 bg-white py-4 pl-6 pr-4 transition-all duration-200 hover:border-slate-300 hover:shadow-xs ${
        dim ? 'bg-slate-50/60' : ''
      }`}
    >
      <AvailabilityEdge availability={freelancer.availability} />

      <div className="flex gap-4">
        <Avatar name={freelancer.displayName} photoUrl={freelancer.photoUrl} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="text-base font-semibold text-slate-900 group-hover:text-primary transition-colors">
              <Link
                href={`/hire/${freelancer.id}`}
                className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {freelancer.displayName}
              </Link>
            </h2>
            <AvailabilityBadge availability={freelancer.availability} />
            <RatingBadge
              averageRating={freelancer.averageRating}
              totalReviews={freelancer.totalReviews}
            />
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

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <p className="text-sm text-slate-700 sm:hidden">
          From{' '}
          <span className="font-semibold tabular-nums">
            {formatPrice(freelancer.startingPrice, freelancer.startingPriceType)}
          </span>
        </p>
        <Link
          href={`/hire/${freelancer.id}`}
          className="inline-flex min-h-11 items-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition"
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
