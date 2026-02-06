import apiClient from './client';
import { PageResponse } from './tenants';

export interface CreatePlanRequest {
  planProductId?: string;
  planName: string;
  planDescription?: string;
  planAmount: string;
  planCurrency?: string;
  planBillingInterval: string;
  planIntervalCount?: number;
  planTrialDays?: number;
  planSetupFee?: string;
  planIsPopular?: boolean;
  planSortOrder?: number;
}

export interface UpdatePlanRequest {
  planName?: string;
  planDescription?: string;
  planAmount?: string;
  planCurrency?: string;
  planBillingInterval?: string;
  planIntervalCount?: number;
  planTrialDays?: number;
  planSetupFee?: string;
  planIsPopular?: boolean;
  planSortOrder?: number;
  planStatus?: string;
}

export interface PlanResponse {
  planId: string;
  planProductId: string | null;
  planName: string | null;
  planDescription: string | null;
  planAmount: string | null;
  planCurrency: string | null;
  planBillingInterval: string | null;
  planIntervalCount: number | null;
  planTrialDays: number | null;
  planSetupFee: string | null;
  planIsPopular: boolean | null;
  planSortOrder: number | null;
  planStatus: string | null;
  planCreatedAt: string | null;
  planUpdatedAt: string | null;
}

export const plansApi = {
  async create(data: CreatePlanRequest): Promise<PlanResponse> {
    const response = await apiClient.post<PlanResponse>('/api/plan', data);
    return response.data;
  },

  async findAll(page = 0, size = 20): Promise<PageResponse<PlanResponse>> {
    const response = await apiClient.get<PageResponse<PlanResponse>>('/api/plan', {
      params: { page, size },
    });
    return response.data;
  },

  async getById(planId: string): Promise<PlanResponse> {
    const response = await apiClient.get<PlanResponse>(`/api/plan/${planId}`);
    return response.data;
  },

  async update(planId: string, data: UpdatePlanRequest): Promise<PlanResponse> {
    const response = await apiClient.put<PlanResponse>(`/api/plan/${planId}`, data);
    return response.data;
  },

  async delete(planId: string): Promise<void> {
    await apiClient.delete(`/api/plan/${planId}`);
  },
};

export default plansApi;
