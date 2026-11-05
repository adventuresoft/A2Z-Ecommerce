'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, MapPin, Building2, Trees, Landmark } from 'lucide-react';
import {
  useLocationCascade,
  type LocationSelectionState,
  type AreaType,
} from '../../lib/useLocationCascade';
import { useSafeReducedMotion } from '../../lib/useSafeReducedMotion';

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
  const prefersReducedMotion = useSafeReducedMotion();

  const {
    state,
    divisions,
    districts,
    thanas,
    postOffices,
    cityCorporations,
    paurashavas,
    unions,
    wards,
    loading,
    setDivision,
    setDistrict,
    setThana,
    setPostOffice,
    setAreaType,
    setCityCorporation,
    setWard,
    setPaurashava,
    setUnion,
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

  const isBaseComplete = Boolean(
    state.divisionId && state.districtId && state.thanaId && state.postOfficeId,
  );

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

      {/* Progressive Disclosure: Local Area Type Selector */}
      {isBaseComplete && (
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="pt-2 border-t border-slate-200/80 dark:border-slate-800"
        >
          <label className={labelClass}>
            Local Area Type / স্থানীয় এলাকা ধরন {required && <span className="text-rose-500">*</span>}
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2.5">
            Choose whether your location is under a City Corporation, Municipality (Paurashava), or Rural Union.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" role="radiogroup">
            <button
              type="button"
              role="radio"
              aria-checked={state.areaType === 'city_corporation'}
              disabled={disabled}
              onClick={() => setAreaType('city_corporation')}
              className={`flex items-center justify-center gap-2 min-h-[44px] px-3 py-2 text-xs font-semibold rounded-lg border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                state.areaType === 'city_corporation'
                  ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Landmark className="h-4 w-4" />
              <span>City Corporation</span>
            </button>

            <button
              type="button"
              role="radio"
              aria-checked={state.areaType === 'paurashava'}
              disabled={disabled}
              onClick={() => setAreaType('paurashava')}
              className={`flex items-center justify-center gap-2 min-h-[44px] px-3 py-2 text-xs font-semibold rounded-lg border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                state.areaType === 'paurashava'
                  ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Building2 className="h-4 w-4" />
              <span>Paurashava (পৌরসভা)</span>
            </button>

            <button
              type="button"
              role="radio"
              aria-checked={state.areaType === 'union'}
              disabled={disabled}
              onClick={() => setAreaType('union')}
              className={`flex items-center justify-center gap-2 min-h-[44px] px-3 py-2 text-xs font-semibold rounded-lg border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                state.areaType === 'union'
                  ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Trees className="h-4 w-4" />
              <span>Union (ইউনিয়ন)</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Dependent Dynamic Sub-Fields */}
      <AnimatePresence mode="wait">
        {state.areaType === 'city_corporation' && (
          <motion.div
            key="city-corp-section"
            initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2"
          >
            <div>
              <label htmlFor="loc-city-corp" className={labelClass}>
                City Corporation / সিটি কর্পোরেশন <span className="text-rose-500">*</span>
              </label>
              <select
                id="loc-city-corp"
                className={selectBaseClass}
                disabled={disabled || loading.cityCorporations}
                value={state.cityCorporationId ?? ''}
                onChange={(e) =>
                  setCityCorporation(e.target.value ? Number(e.target.value) : null)
                }
              >
                <option value="">Select City Corporation</option>
                {cityCorporations.map((c) => (
                  <option key={c.id} value={c.id}>
                    {formatBilingual(c.name, c.bnName)}
                  </option>
                ))}
              </select>
              {cityCorporations.length === 0 && (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  No city corporation found in this district. Select Paurashava or Union instead.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="loc-ward" className={labelClass}>
                Ward No / ওয়ার্ড নম্বর <span className="text-rose-500">*</span>
              </label>
              <select
                id="loc-ward"
                className={selectBaseClass}
                disabled={disabled || !state.cityCorporationId || loading.wards}
                value={state.wardId ?? ''}
                onChange={(e) => setWard(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">
                  {!state.cityCorporationId ? 'Select city corporation first' : 'Select Ward'}
                </option>
                {wards.map((w) => (
                  <option key={w.id} value={w.id}>
                    {formatBilingual(w.name || `Ward ${w.wardNo}`, w.bnName)}
                  </option>
                ))}
              </select>
            </div>
          </motion.div>
        )}

        {state.areaType === 'paurashava' && (
          <motion.div
            key="paurashava-section"
            initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="pt-2"
          >
            <label htmlFor="loc-paurashava" className={labelClass}>
              Paurashava / পৌরসভা <span className="text-rose-500">*</span>
            </label>
            <select
              id="loc-paurashava"
              className={selectBaseClass}
              disabled={disabled || loading.paurashavas}
              value={state.paurashavaId ?? ''}
              onChange={(e) =>
                setPaurashava(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">Select Municipality / পৌরসভা নির্বাচন করুন</option>
              {paurashavas.map((p) => (
                <option key={p.id} value={p.id}>
                  {formatBilingual(p.name, p.bnName)}
                </option>
              ))}
            </select>
            {paurashavas.length === 0 && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                No paurashavas found for this district. Please choose Union or City Corporation.
              </p>
            )}
          </motion.div>
        )}

        {state.areaType === 'union' && (
          <motion.div
            key="union-section"
            initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="pt-2"
          >
            <label htmlFor="loc-union" className={labelClass}>
              Union / ইউনিয়ন <span className="text-rose-500">*</span>
            </label>
            <select
              id="loc-union"
              className={selectBaseClass}
              disabled={disabled || loading.unions}
              value={state.unionId ?? ''}
              onChange={(e) => setUnion(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Select Rural Union / ইউনিয়ন নির্বাচন করুন</option>
              {unions.map((u) => (
                <option key={u.id} value={u.id}>
                  {formatBilingual(u.name, u.bnName)}
                </option>
              ))}
            </select>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Error Banner */}
      {error && (
        <p className="text-xs font-medium text-rose-600 dark:text-rose-400 mt-2" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

