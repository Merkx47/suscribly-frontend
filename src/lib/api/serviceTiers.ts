import apiClient from './client';

// ========== INTERFACES (matches backend ServiceTierDto.kt) ==========

export interface ServiceTierResponse {
  serviceTierId: string | null;
  serviceTierName: string | null;
  serviceTierDescription: string | null;
  serviceTierMonthlyPrice: string | null;
  serviceTierYearlyPrice: string | null;
  serviceTierTransactionFeePercent: string | null;
  serviceTierTransactionFeeCap: string | null;
  serviceTierMaxCustomers: number | null;
  serviceTierMaxProducts: number | null;
  serviceTierMaxTeamMembers: number | null;
  serviceTierMaxMandates: number | null;
  serviceTierMaxSubscriptions: number | null;
  serviceTierNddEnabled: boolean | null;
  serviceTierAllowCustomerManagement: boolean | null;
  serviceTierFeatures: string | null;
  serviceTierIsPopular: boolean | null;
  serviceTierSortOrder: number | null;
  serviceTierStatus: string | null;
  serviceTierCreatedAt: string | null;
  serviceTierUpdatedAt: string | null;
}

export interface TierInfoResponse {
  tierName: string | null;
  tierId: string | null;
  maxCustomers: number | null;
  currentCustomers: number;
  maxProducts: number | null;
  currentProducts: number;
  maxTeamMembers: number | null;
  currentTeamMembers: number;
  maxMandates: number | null;
  currentMandates: number;
  maxSubscriptions: number | null;
  currentSubscriptions: number;
  nddEnabled: boolean;
  customerManagementEnabled: boolean;
  billingCycle: string | null;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  mandateStatus: string | null;
  monthlyPrice: string | null;
  yearlyPrice: string | null;
}

export interface CreateServiceTierRequest {
  serviceTierName?: string;
  serviceTierDescription?: string;
  serviceTierMonthlyPrice?: string;
  serviceTierYearlyPrice?: string;
  serviceTierTransactionFeePercent?: string;
  serviceTierTransactionFeeCap?: string;
  serviceTierMaxCustomers?: number;
  serviceTierMaxProducts?: number;
  serviceTierMaxTeamMembers?: number;
  serviceTierFeatures?: string;
  serviceTierIsPopular?: boolean;
  serviceTierSortOrder?: number;
  serviceTierStatus?: string;
}

export interface UpdateServiceTierRequest {
  serviceTierName?: string;
  serviceTierDescription?: string;
  serviceTierMonthlyPrice?: string;
  serviceTierYearlyPrice?: string;
  serviceTierTransactionFeePercent?: string;
  serviceTierTransactionFeeCap?: string;
  serviceTierMaxCustomers?: number;
  serviceTierMaxProducts?: number;
  serviceTierMaxTeamMembers?: number;
  serviceTierFeatures?: string;
  serviceTierIsPopular?: boolean;
  serviceTierSortOrder?: number;
  serviceTierStatus?: string;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// ========== ADMIN API (for platform admins managing service tiers) ==========

export const adminServiceTierApi = {
  async createTier(data: CreateServiceTierRequest): Promise<ServiceTierResponse> {
    const response = await apiClient.post<ServiceTierResponse>('/api/service_tier', data);
    return response.data;
  },

  async listTiers(page = 0, size = 50): Promise<ServiceTierResponse[]> {
    const response = await apiClient.get<PageResponse<ServiceTierResponse>>(
      `/api/service_tier?page=${page}&size=${size}`
    );
    return response.data.content;
  },

  async getTier(tierId: string): Promise<ServiceTierResponse> {
    const response = await apiClient.get<ServiceTierResponse>(`/api/service_tier/${tierId}`);
    return response.data;
  },

  async updateTier(tierId: string, data: UpdateServiceTierRequest): Promise<ServiceTierResponse> {
    const response = await apiClient.put<ServiceTierResponse>(`/api/service_tier/${tierId}`, data);
    return response.data;
  },

  async deleteTier(tierId: string): Promise<void> {
    await apiClient.delete(`/api/service_tier/${tierId}`);
  },
};

// ========== UTILITY FUNCTIONS ==========

export const formatPrice = (price: string | number | null, currency: string = 'NGN'): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : (price ?? 0);
  if (isNaN(numPrice) || numPrice === 0) return 'Free';
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numPrice);
};

export const formatLimit = (limit: number | null | undefined): string => {
  return (limit == null || limit < 0) ? 'Unlimited' : limit.toLocaleString();
};

// ========== BUSINESS TIER API (for businesses checking their own tier) ==========

export const businessTierApi = {
  async getMyTier(): Promise<TierInfoResponse> {
    const response = await apiClient.get<TierInfoResponse>('/api/business_subscription/my-tier');
    return response.data;
  },

  async listAvailableTiers(): Promise<ServiceTierResponse[]> {
    const response = await apiClient.get<ServiceTierResponse[]>('/api/tier-upgrade/available-tiers');
    return response.data;
  },
};

export default {
  admin: adminServiceTierApi,
  business: businessTierApi,
  formatPrice,
  formatLimit,
};
