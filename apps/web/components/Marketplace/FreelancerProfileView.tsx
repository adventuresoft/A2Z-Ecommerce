'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Briefcase, MapPin } from 'lucide-react';
import {
  marketplaceClient,
  type MarketplaceProfile,
} from '../../lib/marketplace-client';
import {
  experienceLabel,
  formatPrice,
  priceTypeLabel,
} from '../../lib/marketplace-format';
import { useMembership } from '../../lib/useMembership';
import { AvailabilityBadge, AvailabilityEdge } from './AvailabilityBadge';
import { ContactActions } from './ContactActions';
import { Avatar, RatingBadge } from './FreelancerCard';
import { FreelancerReviewsSection } from './FreelancerReviewsSection';
import { EmptyState, ErrorState, PageSkeleton } from './States';

function areaLine(loc: MarketplaceProfile['locations'][number]): string {
  const parts: string[] = [];
  if (loc.thana?.name) parts.push(loc.thana.name);
  if (loc.district?.name) parts.push(loc.district.name);
  if (loc.division?.name) parts.push(loc.division.name);
  return parts.join(', ');
}

export function FreelancerProfileView({ id }: { id: string }) {
  const { isMember, isLoading: membershipLoading } = useMembership();
  const [profile, setProfile] = useState<MarketplaceProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ status?: number; message: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProfile(await marketplaceClient.getProfile(id));
    } catch (err: any) {
      setError({ status: err?.status, message: err?.message || 'Could not load this profile.' });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const back = (
    <Link
      href="/hire"
      className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      All professionals
    </Link>
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <PageSkeleton rows={3} />
      </div>
    );
  }

  if (error?.status === 404) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        {back}
        <EmptyState
          title="This professional is not listed"
          body="The profile may have been removed or is not available right now."
          action={{ label: 'Browse professionals', href: '/hire' }}
        />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        {back}
        <ErrorState message={error?.message ?? 'Could not load this profile.'} onRetry={load} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      {back}

      <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-5 pl-7">
            <AvailabilityEdge availability={profile.availability} />
            <div className="flex items-center gap-4">
              <Avatar name={profile.displayName} photoUrl={profile.photoUrl} size={72} />
              <div className="min-w-0">
                <h1 className="text-xl font-semibold text-slate-900">{profile.displayName}</h1>
                <p className="text-sm text-slate-700">{profile.profession?.name ?? 'Professional'}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <AvailabilityBadge availability={profile.availability} />
                  <RatingBadge
                    averageRating={profile.averageRating}
                    totalReviews={profile.totalReviews}
                  />
                </div>
              </div>
            </div>

            <dl className="mt-4 space-y-2 text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <dt className="sr-only">Experience</dt>
                <Briefcase className="h-4 w-4 text-slate-500" aria-hidden="true" />
                <dd>{experienceLabel(profile.experienceYears)} experience</dd>
              </div>
              {profile.locations[0] && (
                <div className="flex items-center gap-2">
                  <dt className="sr-only">Based in</dt>
                  <MapPin className="h-4 w-4 text-slate-500" aria-hidden="true" />
                  <dd>
                    {profile.locations[0].thana.name}, {profile.locations[0].district.name}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-slate-500">Starting from</dt>
                <dd className="text-lg font-semibold tabular-nums text-slate-900">
                  {profile.startingPrice === null
                    ? 'Negotiable'
                    : formatPrice(profile.startingPrice, 'FIXED')}
                </dd>
              </div>
            </dl>

            <div className="mt-5 border-t border-slate-100 pt-4">
              <ContactActions
                freelancerId={profile.id}
                isMember={isMember}
                isLoading={membershipLoading}
                layout="stacked"
              />
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          {(profile.title || profile.about) && (
            <section aria-labelledby="about-h" className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 id="about-h" className="text-base font-semibold text-slate-900">
                {profile.title || 'About'}
              </h2>
              {profile.about && (
                <p className="mt-2 max-w-prose whitespace-pre-line text-sm leading-relaxed text-slate-700">
                  {profile.about}
                </p>
              )}
            </section>
          )}

          <section aria-labelledby="services-h" className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 id="services-h" className="text-base font-semibold text-slate-900">Services and prices</h2>
            <ul className="mt-3 divide-y divide-slate-100">
              {profile.services.map((s) => (
                <li key={s.id} className="flex flex-wrap items-start justify-between gap-2 py-3">
                  <div className="min-w-0 max-w-prose">
                    <p className="text-sm font-medium text-slate-900">{s.title}</p>
                    {s.description && <p className="mt-0.5 text-sm text-slate-600">{s.description}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums text-slate-900">
                      {formatPrice(s.amount, s.priceType)}
                    </p>
                    <p className="text-xs text-slate-500">{priceTypeLabel(s.priceType)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {profile.skills.length > 0 && (
            <section aria-labelledby="skills-h" className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 id="skills-h" className="text-base font-semibold text-slate-900">Skills</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {profile.skills.map((s) => (
                  <li key={s.id} className="rounded bg-slate-100 px-2.5 py-1 text-sm text-slate-700">
                    {s.name}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {profile.portfolio.length > 0 && (
            <section aria-labelledby="portfolio-h" className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 id="portfolio-h" className="text-base font-semibold text-slate-900">Past work</h2>
              <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {profile.portfolio.map((p) => (
                  <li key={p.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.imageUrl}
                      alt={p.caption || `Work by ${profile.displayName}`}
                      loading="lazy"
                      className="aspect-square w-full rounded-md object-cover ring-1 ring-slate-200"
                    />
                    {p.caption && <p className="mt-1 text-xs text-slate-600">{p.caption}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="areas-h" className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 id="areas-h" className="text-base font-semibold text-slate-900">Areas served</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {profile.locations.map((l) => (
                <li key={l.id} className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                  <span>
                    {areaLine(l)}
                    {l.isPrimary && (
                      <span className="ml-2 rounded bg-primary-soft px-1.5 py-0.5 text-xs font-semibold text-primary">
                        Main area
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <FreelancerReviewsSection
            freelancerId={profile.id}
            freelancerName={profile.displayName}
            onReviewsUpdated={load}
          />
        </div>
      </div>
    </div>
  );
}

