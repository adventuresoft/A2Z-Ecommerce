'use client';

import React from 'react';
import { Loader2, MapPin } from 'lucide-react';
import {
  useLocationCascade,
  type LocationSelectionState,
} from '../../lib/useLocationCascade';

export interface CascadingLocationSelectorProps {
  value?: Partial<LocationSelectionState>;
  onChange?: (state: LocationSelectionState) => void;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string | null;
}

export function CascadingLocationSelector({
  value,
  onChange,
  className = '',
  disabled = false,
  required = true,
  error,
}: CascadingLocationSelectorProps) {
  const {
    state,
    divisions,
    districts,
    thanas,
    postOffices,
    loading,
    setDivision,
    setDistrict,
    setThana,
    setPostOffice,
  } = useLocationCascade({
    initialValue: value,
    onChange,
  });

  const selectBaseClass =
    'w-full min-h-[44px] px-3.5 py-2.5 text-sm rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  const labelClass = 'block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5';

  const formatBilingual = (name?: string | null, bnName?: string | null) => {
    if (!name) return bnName || '';
    if (!bnName || name === bnName) return name;
    return `${name} (${bnName})`;
  };

  return (
    <div
      className={`space-y-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 p-4 sm:p-5 ${className}`}
      aria-busy={Object.values(loading).some(Boolean)}
    >
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <MapPin className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Location & Jurisdiction
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              এলাকা ও প্রশাসনিক তথ্য নির্বাচন করুন
            </p>
          </div>
        </div>
        {Object.values(loading).some(Boolean) && (
          <div
            className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400"
            aria-live="polite"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Loading...</span>
          </div>
        )}
      </div>

      {/* Grid: Division & District */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label htmlFor="loc-division" className={labelClass}>
            Division / বিভাগ {required && <span className="text-rose-500">*</span>}
          </label>
          <div className="relative">
            <select
              id="loc-division"
              className={selectBaseClass}
              disabled={disabled || loading.divisions}
              value={state.divisionId ?? ''}
              onChange={(e) => setDivision(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Select Division / বিভাগ নির্বাচন করুন</option>
              {divisions.map((d) => (
                <option key={d.id} value={d.id}>
                  {formatBilingual(d.name, d.bnName)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="loc-district" className={labelClass}>
            District / জেলা {required && <span className="text-rose-500">*</span>}
          </label>
          <select
            id="loc-district"
            className={selectBaseClass}
            disabled={disabled || !state.divisionId || loading.districts}
            value={state.districtId ?? ''}
            onChange={(e) => setDistrict(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">
              {!state.divisionId
                ? 'Select division first'
                : 'Select District / জেলা নির্বাচন করুন'}
            </option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {formatBilingual(d.name, d.bnName)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid: Thana & Post Office */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label htmlFor="loc-thana" className={labelClass}>
            Thana / থানা {required && <span className="text-rose-500">*</span>}
          </label>
          <select
            id="loc-thana"
            className={selectBaseClass}
            disabled={disabled || !state.districtId || loading.thanas}
            value={state.thanaId ?? ''}
            onChange={(e) => setThana(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">
              {!state.districtId
                ? 'Select district first'
                : 'Select Thana / থানা নির্বাচন করুন'}
            </option>
            {thanas.map((t) => (
              <option key={t.id} value={t.id}>
                {formatBilingual(t.name, t.bnName)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="loc-post-office" className={labelClass}>
            Post Office / ডাকঘর {required && <span className="text-rose-500">*</span>}
          </label>
          <select
            id="loc-post-office"
            className={selectBaseClass}
            disabled={disabled || !state.thanaId || loading.postOffices}
            value={state.postOfficeId ?? ''}
            onChange={(e) => setPostOffice(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">
              {!state.thanaId
                ? 'Select thana first'
                : 'Select Post Office / ডাকঘর নির্বাচন করুন'}
            </option>
            {postOffices.map((p) => (
              <option key={p.id} value={p.id}>
                {formatBilingual(p.name, p.bnName)} {p.postalCode ? `(${p.postalCode})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <p className="text-xs font-medium text-rose-600 dark:text-rose-400 mt-2" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

