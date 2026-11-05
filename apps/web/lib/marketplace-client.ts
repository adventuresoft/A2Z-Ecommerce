import { request } from './api-client';
import type { FreelancerAvailability, ServicePriceType } from './freelancer-client';

export interface MarketplaceNamed {
  id: number;
  name: string;
  bnName: string | null;
}

export interface MarketplaceLocation {
  division: MarketplaceNamed;
  district: MarketplaceNamed;
  thana: MarketplaceNamed;
}

export interface MarketplaceSkill {
  id: string;
  name: string;
  bnName?: string | null;
}

export interface MarketplaceCard {
  id: string;
  displayName: string;
  photoUrl: string | null;
  title: string | null;
  experienceYears: number;
  availability: FreelancerAvailability;
  startingPrice: number | null;
  startingPriceType: ServicePriceType | null;
  profession: { id: string; name: string; bnName: string | null } | null;
  skills: MarketplaceSkill[];
  extraSkillCount: number;
  primaryLocation: MarketplaceLocation | null;
}

export interface MarketplaceList {
  items: MarketplaceCard[];
  nextCursor: string | null;
}

export interface MarketplaceProfile {
  id: string;
  displayName: string;
  photoUrl: string | null;
  title: string | null;
  about: string | null;
  experienceYears: number;
  availability: FreelancerAvailability;
  startingPrice: number | null;
  lastActiveAt: string | null;
  profession: {
    id: string;
    name: string;
    bnName: string | null;
    category: { id: string; name: string; bnName: string | null };
  } | null;
  skills: MarketplaceSkill[];
  services: Array<{
    id: string;
    title: string;
    description: string | null;
    priceType: ServicePriceType;
    amount: number | null;
  }>;
  portfolio: Array<{ id: string; imageUrl: string; caption: string | null }>;
  locations: Array<
    MarketplaceLocation & {
      id: string;
      isPrimary: boolean;
      localityText: string | null;
      cityCorporation: MarketplaceNamed | null;
      ward: { id: number; wardNo: number; name: string | null; bnName: string | null } | null;
      paurashava: MarketplaceNamed | null;
      union: MarketplaceNamed | null;
    }
  >;
}

export type MarketplaceSort = 'default' | 'price_asc' | 'price_desc' | 'experience';
export type MarketplaceAddressType = 'CITY_CORPORATION' | 'PAURASHAVA' | 'UNION';

export interface MarketplaceFilters {
  search?: string;
  categoryId?: string;
  professionId?: string;
  skillIds?: string;
  minExperience?: string;
  maxExperience?: string;
  minPrice?: string;
  maxPrice?: string;
  divisionId?: string;
  districtId?: string;
  thanaId?: string;
  addressType?: MarketplaceAddressType | '';
  availability?: string;
  sort?: MarketplaceSort;
}

export const FILTER_KEYS: Array<keyof MarketplaceFilters> = [
  'search',
  'categoryId',
  'professionId',
  'skillIds',
  'minExperience',
  'maxExperience',
  'minPrice',
  'maxPrice',
  'divisionId',
  'districtId',
  'thanaId',
  'addressType',
  'availability',
  'sort',
];

/** Builds a query string, dropping empty values. */
export function toQueryString(
  filters: MarketplaceFilters,
  extra: Record<string, string | undefined> = {},
): string {
  const qs = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = filters[key];
    if (value !== undefined && value !== '' && !(key === 'sort' && value === 'default')) {
      qs.set(key, String(value));
    }
  }
  for (const [key, value] of Object.entries(extra)) {
    if (value) qs.set(key, value);
  }
  return qs.toString();
}

/** Reads filters back from URL search params. */
export function filtersFromParams(params: { get(name: string): string | null }): MarketplaceFilters {
  const filters: Record<string, string> = {};
  for (const key of FILTER_KEYS) {
    const value = params.get(key);
    if (value) filters[key] = value;
  }
  return filters as MarketplaceFilters;
}

export const marketplaceClient = {
  list(filters: MarketplaceFilters, cursor?: string | null) {
    const qs = toQueryString(filters, { cursor: cursor ?? undefined });
    return request<MarketplaceList>(`/marketplace/freelancers${qs ? `?${qs}` : ''}`);
  },

  getProfile(id: string) {
    return request<MarketplaceProfile>(`/marketplace/freelancers/${encodeURIComponent(id)}`);
  },

  revealPhone(id: string) {
    return request<{ phone: string }>(
      `/marketplace/freelancers/${encodeURIComponent(id)}/reveal-phone`,
      { method: 'POST' },
    );
  },
};

