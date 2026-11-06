'use client';

import React, { useEffect, useState } from 'react';
import { request } from '../../lib/api-client';
import { freelancerClient } from '../../lib/freelancer-client';
import type { MarketplaceFilters } from '../../lib/marketplace-client';

type Option = { id: string | number; name: string };

const AVAILABILITY_OPTIONS = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'BUSY', label: 'Busy' },
  { value: 'UNAVAILABLE', label: 'Unavailable' },
];

const RATING_OPTIONS = [
  { value: '', label: 'All ratings' },
  { value: '4', label: '4.0★ and above' },
  { value: '3', label: '3.0★ and above' },
];

const field =
  'mt-1 block min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary';
const label = 'block text-sm font-medium text-slate-800';

function csvToggle(csv: string | undefined, value: string): string {
  const set = new Set((csv ?? '').split(',').filter(Boolean));
  if (set.has(value)) set.delete(value);
  else set.add(value);
  return Array.from(set).join(',');
}

export function FilterPanel({
  applied,
  onApply,
  onClear,
}: {
  applied: MarketplaceFilters;
  onApply: (next: MarketplaceFilters) => void;
  onClear: () => void;
}) {
  const [draft, setDraft] = useState<MarketplaceFilters>(applied);
  const [categories, setCategories] = useState<Option[]>([]);
  const [professions, setProfessions] = useState<Option[]>([]);
  const [skills, setSkills] = useState<Option[]>([]);
  const [divisions, setDivisions] = useState<Option[]>([]);
  const [districts, setDistricts] = useState<Option[]>([]);
  const [thanas, setThanas] = useState<Option[]>([]);

  useEffect(() => setDraft(applied), [applied]);

  const set = (patch: Partial<MarketplaceFilters>) => setDraft((d) => ({ ...d, ...patch }));

  useEffect(() => {
    freelancerClient.getCategories().then(setCategories).catch(() => setCategories([]));
    request<Option[]>('/locations/divisions', { skipAuth: true })
      .then(setDivisions)
      .catch(() => setDivisions([]));
  }, []);

  useEffect(() => {
    freelancerClient
      .getProfessions(draft.categoryId || undefined)
      .then(setProfessions)
      .catch(() => setProfessions([]));
  }, [draft.categoryId]);

  useEffect(() => {
    if (!draft.professionId) {
      setSkills([]);
      return;
    }
    freelancerClient.getSkills(draft.professionId).then(setSkills).catch(() => setSkills([]));
  }, [draft.professionId]);

  useEffect(() => {
    if (!draft.divisionId) {
      setDistricts([]);
      return;
    }
    request<Option[]>(`/locations/districts?divisionId=${draft.divisionId}`, { skipAuth: true })
      .then(setDistricts)
      .catch(() => setDistricts([]));
  }, [draft.divisionId]);

  useEffect(() => {
    if (!draft.districtId) {
      setThanas([]);
      return;
    }
    request<Option[]>(`/locations/thanas?districtId=${draft.districtId}`, { skipAuth: true })
      .then(setThanas)
      .catch(() => setThanas([]));
  }, [draft.districtId]);

  const selectedAvailability = new Set((draft.availability ?? '').split(',').filter(Boolean));
  const selectedSkills = new Set((draft.skillIds ?? '').split(',').filter(Boolean));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onApply(draft);
      }}
      className="space-y-5"
      aria-label="Filter professionals"
    >
      <div>
        <label htmlFor="f-category" className={label}>Category</label>
        <select
          id="f-category"
          className={field}
          value={draft.categoryId ?? ''}
          onChange={(e) => set({ categoryId: e.target.value, professionId: '', skillIds: '' })}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="f-profession" className={label}>Profession</label>
        <select
          id="f-profession"
          className={field}
          value={draft.professionId ?? ''}
          onChange={(e) => set({ professionId: e.target.value, skillIds: '' })}
        >
          <option value="">All professions</option>
          {professions.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {skills.length > 0 && (
        <fieldset>
          <legend className={label}>Skills</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {skills.map((s) => {
              const on = selectedSkills.has(String(s.id));
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set({ skillIds: csvToggle(draft.skillIds, String(s.id)) })}
                  className={`min-h-11 rounded-full border px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                    on
                      ? 'border-primary bg-primary-soft font-semibold text-primary'
                      : 'border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="space-y-3">
        <div>
          <label htmlFor="f-division" className={label}>Division</label>
          <select
            id="f-division"
            className={field}
            value={draft.divisionId ?? ''}
            onChange={(e) => set({ divisionId: e.target.value, districtId: '', thanaId: '' })}
          >
            <option value="">All divisions</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-district" className={label}>District</label>
          <select
            id="f-district"
            className={field}
            value={draft.districtId ?? ''}
            disabled={!draft.divisionId}
            onChange={(e) => set({ districtId: e.target.value, thanaId: '' })}
          >
            <option value="">All districts</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-thana" className={label}>Thana</label>
          <select
            id="f-thana"
            className={field}
            value={draft.thanaId ?? ''}
            disabled={!draft.districtId}
            onChange={(e) => set({ thanaId: e.target.value })}
          >
            <option value="">All thanas</option>
            {thanas.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      <fieldset>
        <legend className={label}>Experience (years)</legend>
        <div className="mt-1 grid grid-cols-2 gap-2">
          <input
            aria-label="Minimum years of experience"
            inputMode="numeric"
            type="number"
            min={0}
            placeholder="Min"
            className={field}
            value={draft.minExperience ?? ''}
            onChange={(e) => set({ minExperience: e.target.value })}
          />
          <input
            aria-label="Maximum years of experience"
            inputMode="numeric"
            type="number"
            min={0}
            placeholder="Max"
            className={field}
            value={draft.maxExperience ?? ''}
            onChange={(e) => set({ maxExperience: e.target.value })}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className={label}>Starting price (৳)</legend>
        <div className="mt-1 grid grid-cols-2 gap-2">
          <input
            aria-label="Minimum starting price"
            inputMode="numeric"
            type="number"
            min={0}
            placeholder="Min"
            className={field}
            value={draft.minPrice ?? ''}
            onChange={(e) => set({ minPrice: e.target.value })}
          />
          <input
            aria-label="Maximum starting price"
            inputMode="numeric"
            type="number"
            min={0}
            placeholder="Max"
            className={field}
            value={draft.maxPrice ?? ''}
            onChange={(e) => set({ maxPrice: e.target.value })}
          />
        </div>
      </fieldset>

      <div>
        <label htmlFor="f-rating" className={label}>Minimum rating</label>
        <select
          id="f-rating"
          className={field}
          value={draft.minRating ?? ''}
          onChange={(e) => set({ minRating: e.target.value })}
        >
          {RATING_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className={label}>Availability</legend>
        <div className="mt-1 space-y-1">
          {AVAILABILITY_OPTIONS.map((o) => (
            <label key={o.value} className="flex min-h-11 items-center gap-3 text-sm text-slate-800">
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-slate-400 text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                checked={selectedAvailability.has(o.value)}
                onChange={() => set({ availability: csvToggle(draft.availability, o.value) })}
              />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex gap-2">
        <button
          type="submit"
          className="min-h-11 flex-1 rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Apply filters
        </button>
        <button
          type="button"
          onClick={onClear}
          className="min-h-11 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Clear
        </button>
      </div>
    </form>
  );
}

