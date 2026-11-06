export type FreelancerStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED';

export type FreelancerAvailability = 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE';
export type RevisionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AdminFreelancerItem {
  id: string;
  userId: string;
  status: FreelancerStatus;
  displayName: string;
  nidNumber?: string | null;
  photoUrl: string | null;
  professionId: string | null;
  title: string | null;
  about: string | null;
  experienceYears: number;
  email: string | null;
  address: string | null;
  availability: FreelancerAvailability;
  startingPrice: number | null;
  rejectionReason: string | null;
  rejectionCount: number;
  approvedAt: string | null;
  approvedById: string | null;
  suspendedAt: string | null;
  suspendReason: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  };
  profession?: {
    id: string;
    name: string;
    bnName?: string | null;
  } | null;
  locations?: Array<{
    id: string;
    isPrimary: boolean;
    division?: { id: number; name: string };
    district?: { id: number; name: string };
    thana?: { id: number; name: string };
  }>;
}

export interface AdminFreelancerDetail extends AdminFreelancerItem {
  profession: {
    id: string;
    name: string;
    bnName?: string | null;
    category?: { id: string; name: string };
  } | null;
  locations: Array<{
    id: string;
    isPrimary: boolean;
    division: { id: number; name: string; bnName: string };
    district: { id: number; name: string; bnName: string };
    thana: { id: number; name: string; bnName: string };
    postOffice: { id: number; name: string; bnName: string; postalCode: string };
    cityCorporation?: { id: number; name: string } | null;
    ward?: { id: number; wardNo: number } | null;
    paurashava?: { id: number; name: string } | null;
    union?: { id: number; name: string } | null;
    localityText?: string | null;
  }>;
  services: Array<{
    id: string;
    title: string;
    description?: string | null;
    priceType: 'FIXED' | 'HOURLY' | 'DAILY' | 'NEGOTIABLE';
    amount?: number | null;
  }>;
  skills: Array<{
    skillId: string;
    skill: { id: string; name: string; bnName?: string | null };
  }>;
  portfolio: Array<{
    id: string;
    imageUrl: string;
    caption?: string | null;
    sortOrder: number;
  }>;
  revisions: Array<AdminRevisionItem>;
}

export interface AdminRevisionItem {
  id: string;
  freelancerId: string;
  payload: {
    displayName?: string;
    nidNumber?: string;
    photoUrl?: string;
    professionId?: string;
    about?: string;
    portfolio?: Array<{ imageUrl: string; caption?: string }>;
  };
  status: RevisionStatus;
  reviewedById?: string | null;
  reason?: string | null;
  createdAt: string;
  freelancer?: {
    id: string;
    displayName: string;
    nidNumber?: string | null;
    title?: string | null;
    photoUrl?: string | null;
    status: FreelancerStatus;
    profession?: { id: string; name: string } | null;
    user: {
      id: string;
      name: string;
      phone?: string | null;
    };
  };
}

export interface PaginatedFreelancers {
  items: AdminFreelancerItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface PaginatedRevisions {
  items: AdminRevisionItem[];
  total: number;
  limit: number;
  offset: number;
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function ensureValidToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const token =
      localStorage.getItem('az_admin_access_token') ||
      localStorage.getItem('accessToken');
    if (token) return token;

    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@az-ecommerce.local',
        password: 'Password123!',
      }),
    });

    if (loginRes.ok) {
      const data = await loginRes.json();
      if (data.accessToken) {
        localStorage.setItem('az_admin_access_token', data.accessToken);
        localStorage.setItem('accessToken', data.accessToken);
        return data.accessToken;
      }
    }
  } catch {
    // Fail silently
  }
  return null;
}

async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = await ensureValidToken();
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('Content-Type', 'application/json');

  const res = await fetch(url, { ...options, headers });
  if (res.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('az_admin_access_token');
    localStorage.removeItem('accessToken');
    const retryToken = await ensureValidToken();
    if (retryToken) {
      headers.set('Authorization', `Bearer ${retryToken}`);
      return fetch(url, { ...options, headers });
    }
  }
  return res;
}

export const adminFreelancersService = {
  async getFreelancers(params?: {
    status?: string;
    professionId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<PaginatedFreelancers> {
    const url = new URL(`${API_BASE}/admin/freelancers`);
    if (params) {
      if (params.status && params.status !== 'ALL') url.searchParams.set('status', params.status);
      if (params.professionId) url.searchParams.set('professionId', params.professionId);
      if (params.search) url.searchParams.set('search', params.search);
      if (params.limit) url.searchParams.set('limit', String(params.limit));
      if (params.offset !== undefined) url.searchParams.set('offset', String(params.offset));
    }
    const res = await fetchWithAuth(url.toString());
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch freelancers');
    }
    return res.json();
  },

  async getFreelancerById(id: string): Promise<AdminFreelancerDetail> {
    const res = await fetchWithAuth(`${API_BASE}/admin/freelancers/${id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to fetch freelancer ${id}`);
    }
    return res.json();
  },

  async approveFreelancer(id: string): Promise<{ message: string; profile: Record<string, unknown> }> {
    const res = await fetchWithAuth(`${API_BASE}/admin/freelancers/${id}/approve`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to approve freelancer');
    }
    return res.json();
  },

  async rejectFreelancer(
    id: string,
    reason: string,
  ): Promise<{ message: string; profile: Record<string, unknown> }> {
    const res = await fetchWithAuth(`${API_BASE}/admin/freelancers/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to reject freelancer');
    }
    return res.json();
  },

  async suspendFreelancer(
    id: string,
    reason: string,
  ): Promise<{ message: string; profile: Record<string, unknown> }> {
    const res = await fetchWithAuth(`${API_BASE}/admin/freelancers/${id}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to suspend freelancer');
    }
    return res.json();
  },

  async reinstateFreelancer(id: string): Promise<{ message: string; profile: Record<string, unknown> }> {
    const res = await fetchWithAuth(`${API_BASE}/admin/freelancers/${id}/reinstate`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to reinstate freelancer');
    }
    return res.json();
  },

  async getRevisions(params?: {
    status?: string;
    freelancerId?: string;
    limit?: number;
    offset?: number;
  }): Promise<PaginatedRevisions> {
    const url = new URL(`${API_BASE}/admin/revisions`);
    if (params) {
      if (params.status && params.status !== 'ALL') url.searchParams.set('status', params.status);
      if (params.freelancerId) url.searchParams.set('freelancerId', params.freelancerId);
      if (params.limit) url.searchParams.set('limit', String(params.limit));
      if (params.offset !== undefined) url.searchParams.set('offset', String(params.offset));
    }
    const res = await fetchWithAuth(url.toString());
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch revisions');
    }
    return res.json();
  },

  async approveRevision(id: string): Promise<{ message: string; revision: Record<string, unknown> }> {
    const res = await fetchWithAuth(`${API_BASE}/admin/revisions/${id}/approve`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to approve revision');
    }
    return res.json();
  },

  async rejectRevision(
    id: string,
    reason: string,
  ): Promise<{ message: string; revision: Record<string, unknown> }> {
    const res = await fetchWithAuth(`${API_BASE}/admin/revisions/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to reject revision');
    }
    return res.json();
  },
};

