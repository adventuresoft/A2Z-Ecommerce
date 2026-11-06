import { request } from './api-client';

export type FreelancerStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED';

export type FreelancerAvailability = 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE';

export type ServicePriceType = 'FIXED' | 'HOURLY' | 'DAILY' | 'NEGOTIABLE';

export interface FreelancerLocationData {
  id?: string;
  divisionId: number;
  districtId: number;
  thanaId: number;
  postOfficeId: number;
  cityCorporationId?: number | null;
  wardId?: number | null;
  paurashavaId?: number | null;
  unionId?: number | null;
  localityText?: string | null;
  isPrimary: boolean;
  division?: { id: number; name: string; bnName: string };
  district?: { id: number; name: string; bnName: string | null };
  thana?: { id: number; name: string; bnName: string | null };
  postOffice?: { id: number; name: string | null; bnName: string | null; postalCode: string | null };
  cityCorporation?: { id: number; name: string; bnName: string | null } | null;
  ward?: { id: number; wardNo: number; name: string | null; bnName: string | null } | null;
  paurashava?: { id: number; name: string; bnName: string | null } | null;
  union?: { id: number; name: string; bnName: string | null } | null;
}

export interface FreelancerServiceData {
  id?: string;
  title: string;
  description?: string | null;
  priceType: ServicePriceType;
  amount?: number | null;
}

export interface FreelancerSkillData {
  skillId: string;
  skill?: {
    id: string;
    name: string;
    bnName?: string | null;
  };
}

export interface PortfolioItemData {
  id?: string;
  imageUrl: string;
  caption?: string | null;
  sortOrder?: number;
}

export interface ProfileRevisionData {
  id: string;
  payload: Record<string, any>;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason?: string | null;
  createdAt: string;
}

export interface FreelancerProfileData {
  id: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
  } | null;
  status: FreelancerStatus;
  displayName: string;
  nidNumber?: string | null;
  photoUrl?: string | null;
  professionId?: string | null;
  title?: string | null;
  about?: string | null;
  experienceYears: number;
  email?: string | null;
  address?: string | null;
  availability: FreelancerAvailability;
  startingPrice?: number | null;
  rejectionReason?: string | null;
  rejectionCount: number;
  approvedAt?: string | null;
  suspendedAt?: string | null;
  suspendReason?: string | null;
  profession?: {
    id: string;
    name: string;
    bnName?: string | null;
    category?: {
      id: string;
      name: string;
      bnName?: string | null;
    };
  } | null;
  locations?: FreelancerLocationData[];
  services?: FreelancerServiceData[];
  skills?: FreelancerSkillData[];
  portfolio?: PortfolioItemData[];
  revisions?: ProfileRevisionData[];
}

export const freelancerClient = {
  async requestOtp(phone: string) {
    return request<{ success: boolean; phone: string; expiresInSeconds: number; message: string }>(
      '/freelancer/register/otp',
      {
        method: 'POST',
        body: JSON.stringify({ phone }),
      },
    );
  },

  async verifyOtp(phone: string, code: string) {
    return request<{ success: boolean; message: string; profile: FreelancerProfileData }>(
      '/freelancer/register/verify',
      {
        method: 'POST',
        body: JSON.stringify({ phone, code }),
      },
    );
  },

  async getProfile(): Promise<FreelancerProfileData> {
    return request<FreelancerProfileData>('/freelancer/profile');
  },

  async uploadPhoto(file: File): Promise<{ photoUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return request<{ photoUrl: string }>('/freelancer/profile/upload-photo', {
      method: 'POST',
      body: formData,
    });
  },

  async uploadPortfolioImage(file: File): Promise<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return request<{ imageUrl: string }>('/freelancer/profile/upload-portfolio', {
      method: 'POST',
      body: formData,
    });
  },

  async updateProfile(data: Partial<FreelancerProfileData>) {
    return request<{ message: string; profile?: FreelancerProfileData; isRevisionPending?: boolean }>(
      '/freelancer/profile',
      {
        method: 'PUT',
        body: JSON.stringify(data),
      },
    );
  },

  async updateAvailability(availability: FreelancerAvailability) {
    return request<{ message: string; availability: FreelancerAvailability }>(
      '/freelancer/availability',
      {
        method: 'PUT',
        body: JSON.stringify({ availability }),
      },
    );
  },

  async updateLocations(locations: FreelancerLocationData[]) {
    const sanitized = locations.map((loc) => {
      const item: Record<string, any> = {
        divisionId: Number(loc.divisionId),
        districtId: Number(loc.districtId),
        thanaId: Number(loc.thanaId),
        postOfficeId: Number(loc.postOfficeId),
        isPrimary: Boolean(loc.isPrimary),
      };
      if (loc.cityCorporationId) item.cityCorporationId = Number(loc.cityCorporationId);
      if (loc.wardId) item.wardId = Number(loc.wardId);
      if (loc.paurashavaId) item.paurashavaId = Number(loc.paurashavaId);
      if (loc.unionId) item.unionId = Number(loc.unionId);
      if (loc.localityText) item.localityText = String(loc.localityText);
      return item;
    });

    return request<{ message: string }>('/freelancer/locations', {
      method: 'PUT',
      body: JSON.stringify({ locations: sanitized }),
    });
  },

  async updateServices(services: FreelancerServiceData[]) {
    const sanitized = services.map((s) => ({
      ...(s.id ? { id: s.id } : {}),
      title: s.title,
      description: s.description || undefined,
      priceType: s.priceType,
      amount: s.priceType === 'NEGOTIABLE' ? undefined : s.amount ? Number(s.amount) : undefined,
    }));

    return request<{ message: string; startingPrice?: number | null }>('/freelancer/services', {
      method: 'PUT',
      body: JSON.stringify({ services: sanitized }),
    });
  },

  async updateSkills(skillIds: string[]) {
    return request<{ message: string; skillCount: number }>('/freelancer/skills', {
      method: 'PUT',
      body: JSON.stringify({ skillIds }),
    });
  },

  async updatePortfolio(items: PortfolioItemData[]) {
    const sanitized = items.map((item, idx) => ({
      ...(item.id ? { id: item.id } : {}),
      imageUrl: item.imageUrl,
      caption: item.caption || undefined,
      sortOrder: typeof item.sortOrder === 'number' ? item.sortOrder : idx,
    }));

    return request<{ message: string; itemCount?: number; isRevisionPending?: boolean }>(
      '/freelancer/portfolio',
      {
        method: 'PUT',
        body: JSON.stringify({ items: sanitized }),
      },
    );
  },

  async submitProfile() {
    return request<{ success: boolean; message: string; status: FreelancerStatus }>(
      '/freelancer/profile/submit',
      {
        method: 'POST',
      },
    );
  },

  async getCategories() {
    return request<Array<{ id: string; name: string; bnName?: string; icon?: string }>>(
      '/taxonomy/categories',
      { skipAuth: true },
    );
  },

  async getProfessions(categoryId?: string) {
    const query = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : '';
    return request<Array<{ id: string; name: string; bnName?: string; categoryId: string }>>(
      `/taxonomy/professions${query}`,
      { skipAuth: true },
    );
  },

  async getSkills(professionId: string) {
    return request<Array<{ id: string; name: string; bnName?: string; professionId: string }>>(
      `/taxonomy/skills?professionId=${encodeURIComponent(professionId)}`,
      { skipAuth: true },
    );
  },

  async getReveals() {
    return request<Array<{ id: string; revealedAt: string; client: { id: string; name: string } }>>(
      '/freelancer/reveals',
    );
  },
};

