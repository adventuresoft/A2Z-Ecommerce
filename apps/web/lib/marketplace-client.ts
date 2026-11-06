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
  averageRating?: number | null;
  totalReviews?: number;
  profession: { id: string; name: string; bnName: string | null } | null;
  skills: MarketplaceSkill[];
  extraSkillCount: number;
  primaryLocation: MarketplaceLocation | null;
}

export interface MarketplaceList {
  items: MarketplaceCard[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
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
  averageRating?: number | null;
  totalReviews?: number;
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

export interface FreelancerReviewItem {
  id: string;
  rating: number;
  comment: string;
  images: string[];
  freelancerReply: string | null;
  repliedAt: string | null;
  isVerifiedContact: boolean;
  editCount: number;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    name: string;
  };
}

export interface FreelancerReviewsSummary {
  averageRating: number | null;
  totalReviews: number;
  distribution: Record<number, number>;
}

export interface FreelancerReviewsResponse {
  reviews: FreelancerReviewItem[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
  summary: FreelancerReviewsSummary;
}

export interface CreateFreelancerReviewInput {
  rating: number;
  comment: string;
  images?: string[];
}

export interface UpdateFreelancerReviewInput {
  rating?: number;
  comment?: string;
  images?: string[];
}

export type MarketplaceSort = 'default' | 'top_rated' | 'price_asc' | 'price_desc' | 'experience';
export type MarketplaceAddressType = 'CITY_CORPORATION' | 'PAURASHAVA' | 'UNION';

export interface MarketplaceFilters {
  page?: string | number;
  limit?: string | number;
  search?: string;
  categoryId?: string;
  professionId?: string;
  skillIds?: string;
  minExperience?: string;
  maxExperience?: string;
  minPrice?: string;
  maxPrice?: string;
  minRating?: string | number;
  divisionId?: string;
  districtId?: string;
  thanaId?: string;
  addressType?: MarketplaceAddressType | '';
  availability?: string;
  sort?: MarketplaceSort;
}

export const FILTER_KEYS: Array<keyof MarketplaceFilters> = [
  'page',
  'limit',
  'search',
  'categoryId',
  'professionId',
  'skillIds',
  'minExperience',
  'maxExperience',
  'minPrice',
  'maxPrice',
  'minRating',
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

  getReviews(id: string, page = 1, limit = 10) {
    return request<FreelancerReviewsResponse>(
      `/marketplace/freelancers/${encodeURIComponent(id)}/reviews?page=${page}&limit=${limit}`,
    );
  },

  getMyReview(id: string) {
    return request<FreelancerReviewItem | null>(
      `/marketplace/freelancers/${encodeURIComponent(id)}/reviews/me`,
    );
  },

  createReview(id: string, input: CreateFreelancerReviewInput) {
    return request<FreelancerReviewItem>(
      `/marketplace/freelancers/${encodeURIComponent(id)}/reviews`,
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    );
  },

  updateReview(id: string, input: UpdateFreelancerReviewInput) {
    return request<FreelancerReviewItem>(
      `/marketplace/freelancers/${encodeURIComponent(id)}/reviews/me`,
      {
        method: 'PUT',
        body: JSON.stringify(input),
      },
    );
  },

  replyToReview(reviewId: string, reply: string) {
    return request<FreelancerReviewItem>(
      `/freelancer/reviews/${encodeURIComponent(reviewId)}/reply`,
      {
        method: 'POST',
        body: JSON.stringify({ reply }),
      },
    );
  },

  reportReview(reviewId: string, reason: string, details?: string) {
    return request<{ id: string; status: string }>(
      `/freelancer/reviews/${encodeURIComponent(reviewId)}/report`,
      {
        method: 'POST',
        body: JSON.stringify({ reason, details }),
      },
    );
  },
};

