import apiClient from './client';

export interface CreateBusinessRequest {
  businessName: string;
  businessEmail: string;
  businessSlug?: string;
  businessPhone?: string;
  businessAddress?: string;
  businessLogoUrl?: string;
  businessWebsite?: string;
}

export interface UpdateBusinessRequest {
  businessName?: string;
  businessEmail?: string;
  businessPhone?: string;
  businessAddress?: string;
  businessLogoUrl?: string;
  businessWebsite?: string;
  businessBankCode?: string;
  businessAccountName?: string;
  businessAccountNumber?: string;
}

export interface BusinessResponse {
  businessId: string;
  businessName: string | null;
  businessSlug: string | null;
  businessEmail: string | null;
  businessPhone: string | null;
  businessAddress: string | null;
  businessLogoUrl: string | null;
  businessWebsite: string | null;
  businessNotificationUrl: string | null;
  businessBankCode: string | null;
  businessAccountName: string | null;
  businessAccountNumber: string | null;
  businessNddBillerNibssId: string | null;
  businessNddSyncStatus: string | null;
  businessNddSyncedAt: string | null;
  businessOwnerId: string | null;
  businessStatus: string | null;
  businessCreatedAt: string | null;
  businessUpdatedAt: string | null;
}

export interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  size: number;
  number: number;
}

export const businessesApi = {
  async create(data: CreateBusinessRequest): Promise<BusinessResponse> {
    const response = await apiClient.post<BusinessResponse>('/api/businesses', data);
    localStorage.setItem('business', JSON.stringify(response.data));
    return response.data;
  },

  async getMyBusiness(): Promise<BusinessResponse> {
    const response = await apiClient.get<BusinessResponse>('/api/businesses/me');
    localStorage.setItem('business', JSON.stringify(response.data));
    return response.data;
  },

  async getById(businessId: string): Promise<BusinessResponse> {
    const response = await apiClient.get<BusinessResponse>(`/api/businesses/${businessId}`);
    return response.data;
  },

  async getBySlug(slug: string): Promise<BusinessResponse> {
    const response = await apiClient.get<BusinessResponse>(`/api/businesses/slug/${slug}`);
    return response.data;
  },

  async update(businessId: string, data: UpdateBusinessRequest): Promise<BusinessResponse> {
    const response = await apiClient.put<BusinessResponse>(`/api/businesses/${businessId}`, data);
    localStorage.setItem('business', JSON.stringify(response.data));
    return response.data;
  },

  async delete(businessId: string): Promise<void> {
    await apiClient.delete(`/api/businesses/${businessId}`);
    localStorage.removeItem('business');
  },

  // Admin endpoints
  async findAll(page = 0, size = 20): Promise<PageResponse<BusinessResponse>> {
    const response = await apiClient.get<PageResponse<BusinessResponse>>('/api/businesses', {
      params: { page, size },
    });
    return response.data;
  },

  async suspend(businessId: string, reason?: string): Promise<BusinessResponse> {
    const response = await apiClient.post<BusinessResponse>(`/api/businesses/${businessId}/suspend`, { reason });
    return response.data;
  },

  async activate(businessId: string): Promise<BusinessResponse> {
    const response = await apiClient.post<BusinessResponse>(`/api/businesses/${businessId}/activate`);
    return response.data;
  },

  // Helper to get stored business
  getStoredBusiness(): BusinessResponse | null {
    const businessStr = localStorage.getItem('business');
    return businessStr ? JSON.parse(businessStr) : null;
  },
};

export default businessesApi;
