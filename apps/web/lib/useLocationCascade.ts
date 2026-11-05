'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { request } from './api-client.js';

export type AreaType = 'city_corporation' | 'paurashava' | 'union';

export interface LocationItem {
  id: number;
  name: string;
  bnName?: string | null;
  divisionId?: number;
  districtId?: number;
  thanaId?: number;
  cityCorporationId?: number;
  wardNo?: number;
  postalCode?: string | null;
}

export interface LocationSelectionState {
  divisionId: number | null;
  districtId: number | null;
  thanaId: number | null;
  postOfficeId: number | null;
  areaType: AreaType | null;
  cityCorporationId: number | null;
  wardId: number | null;
  paurashavaId: number | null;
  unionId: number | null;
}

export interface UseLocationCascadeProps {
  initialValue?: Partial<LocationSelectionState>;
  onChange?: (state: LocationSelectionState) => void;
  apiFetcher?: <T = any>(endpoint: string) => Promise<T>;
}

const memoryCache = new Map<string, LocationItem[]>();

export function useLocationCascade({
  initialValue,
  onChange,
  apiFetcher = (ep: string) => request(ep, { skipAuth: true }),
}: UseLocationCascadeProps = {}) {
  const [state, setState] = useState<LocationSelectionState>({
    divisionId: initialValue?.divisionId ?? null,
    districtId: initialValue?.districtId ?? null,
    thanaId: initialValue?.thanaId ?? null,
    postOfficeId: initialValue?.postOfficeId ?? null,
    areaType: initialValue?.areaType ?? null,
    cityCorporationId: initialValue?.cityCorporationId ?? null,
    wardId: initialValue?.wardId ?? null,
    paurashavaId: initialValue?.paurashavaId ?? null,
    unionId: initialValue?.unionId ?? null,
  });

  const [divisions, setDivisions] = useState<LocationItem[]>([]);
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [thanas, setThanas] = useState<LocationItem[]>([]);
  const [postOffices, setPostOffices] = useState<LocationItem[]>([]);
  const [cityCorporations, setCityCorporations] = useState<LocationItem[]>([]);
  const [paurashavas, setPaurashavas] = useState<LocationItem[]>([]);
  const [unions, setUnions] = useState<LocationItem[]>([]);
  const [wards, setWards] = useState<LocationItem[]>([]);

  const [loading, setLoading] = useState<Record<string, boolean>>({
    divisions: false,
    districts: false,
    thanas: false,
    postOffices: false,
    cityCorporations: false,
    paurashavas: false,
    unions: false,
    wards: false,
  });

  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const stateRef = useRef(state);
  stateRef.current = state;

  const updateState = useCallback(
    (updater: Partial<LocationSelectionState>) => {
      setState((prev) => {
        const next = { ...prev, ...updater };
        onChange?.(next);
        return next;
      });
    },
    [onChange],
  );

  const fetchCached = useCallback(
    async (endpoint: string, key: string, setter: (data: LocationItem[]) => void) => {
      if (memoryCache.has(endpoint)) {
        setter(memoryCache.get(endpoint)!);
        return;
      }
      setLoading((prev) => ({ ...prev, [key]: true }));
      setErrors((prev) => ({ ...prev, [key]: null }));
      try {
        const data = await apiFetcher<LocationItem[]>(endpoint);
        const list = Array.isArray(data) ? data : [];
        memoryCache.set(endpoint, list);
        setter(list);
      } catch (err: any) {
        setErrors((prev) => ({
          ...prev,
          [key]: err.message || `Failed to load ${key}`,
        }));
      } finally {
        setLoading((prev) => ({ ...prev, [key]: false }));
      }
    },
    [apiFetcher],
  );

  // 1. Initial load: Divisions
  useEffect(() => {
    fetchCached('/locations/divisions', 'divisions', setDivisions);
  }, [fetchCached]);

  // 2. When division changes -> fetch districts
  useEffect(() => {
    if (!state.divisionId) {
      setDistricts([]);
      return;
    }
    fetchCached(
      `/locations/districts?divisionId=${state.divisionId}`,
      'districts',
      setDistricts,
    );
  }, [state.divisionId, fetchCached]);

  // 3. When district changes -> fetch thanas, city corporations, and paurashavas
  useEffect(() => {
    if (!state.districtId) {
      setThanas([]);
      setCityCorporations([]);
      setPaurashavas([]);
      return;
    }
    fetchCached(`/locations/thanas?districtId=${state.districtId}`, 'thanas', setThanas);
    fetchCached(
      `/locations/city-corporations?districtId=${state.districtId}`,
      'cityCorporations',
      setCityCorporations,
    );
    fetchCached(
      `/locations/paurashavas?districtId=${state.districtId}`,
      'paurashavas',
      setPaurashavas,
    );
  }, [state.districtId, fetchCached]);

  // 4. When thana changes -> fetch post offices and unions
  useEffect(() => {
    if (!state.thanaId) {
      setPostOffices([]);
      setUnions([]);
      return;
    }
    fetchCached(
      `/locations/post-offices?thanaId=${state.thanaId}`,
      'postOffices',
      setPostOffices,
    );
    fetchCached(`/locations/unions?thanaId=${state.thanaId}`, 'unions', setUnions);
  }, [state.thanaId, fetchCached]);

  // 5. When city corporation changes -> fetch wards
  useEffect(() => {
    if (!state.cityCorporationId) {
      setWards([]);
      return;
    }
    fetchCached(
      `/locations/wards?cityCorporationId=${state.cityCorporationId}`,
      'wards',
      setWards,
    );
  }, [state.cityCorporationId, fetchCached]);

  // Handlers
  const setDivision = useCallback(
    (divisionId: number | null) => {
      updateState({
        divisionId,
        districtId: null,
        thanaId: null,
        postOfficeId: null,
        areaType: null,
        cityCorporationId: null,
        wardId: null,
        paurashavaId: null,
        unionId: null,
      });
    },
    [updateState],
  );

  const setDistrict = useCallback(
    (districtId: number | null) => {
      updateState({
        districtId,
        thanaId: null,
        postOfficeId: null,
        areaType: null,
        cityCorporationId: null,
        wardId: null,
        paurashavaId: null,
        unionId: null,
      });
    },
    [updateState],
  );

  const setThana = useCallback(
    (thanaId: number | null) => {
      updateState({
        thanaId,
        postOfficeId: null,
        unionId: null,
      });
    },
    [updateState],
  );

  const setPostOffice = useCallback(
    (postOfficeId: number | null) => {
      updateState({ postOfficeId });
    },
    [updateState],
  );

  const setAreaType = useCallback(
    (areaType: AreaType | null) => {
      updateState({
        areaType,
        cityCorporationId: null,
        wardId: null,
        paurashavaId: null,
        unionId: null,
      });
    },
    [updateState],
  );

  const setCityCorporation = useCallback(
    (cityCorporationId: number | null) => {
      updateState({
        cityCorporationId,
        wardId: null,
      });
    },
    [updateState],
  );

  const setWard = useCallback(
    (wardId: number | null) => {
      updateState({ wardId });
    },
    [updateState],
  );

  const setPaurashava = useCallback(
    (paurashavaId: number | null) => {
      updateState({ paurashavaId });
    },
    [updateState],
  );

  const setUnion = useCallback(
    (unionId: number | null) => {
      updateState({ unionId });
    },
    [updateState],
  );

  const resetAll = useCallback(() => {
    updateState({
      divisionId: null,
      districtId: null,
      thanaId: null,
      postOfficeId: null,
      areaType: null,
      cityCorporationId: null,
      wardId: null,
      paurashavaId: null,
      unionId: null,
    });
  }, [updateState]);

  return {
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
    errors,
    setDivision,
    setDistrict,
    setThana,
    setPostOffice,
    setAreaType,
    setCityCorporation,
    setWard,
    setPaurashava,
    setUnion,
    resetAll,
  };
}

