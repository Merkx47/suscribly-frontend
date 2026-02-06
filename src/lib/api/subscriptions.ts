import apiClient from './client';
import { PageResponse } from './tenants';

export interface CreateSubscriptionRequest {
  subscriptionCustomerId: string;
  subscriptionPlanId: string;
  subscriptionCouponCode?: string;
  subscriptionStartDate?: string;
  subscriptionTrialStart?: string;
  subscriptionTrialEnd?: string;
}

export interface UpdateSubscriptionRequest {
  subscriptionEndDate?: string;
  subscriptionCancelledAt?: string;
  subscriptionCancellationReason?: string;
  subscriptionStatus?: string;
}

export interface CancelSubscriptionRequest {
  subscriptionCancellationReason?: string;
}

export interface SubscriptionResponse {
  subscriptionId: string;
  subscriptionCustomerId: string | null;
  subscriptionPlanId: string | null;
  subscriptionCouponId: string | null;
  subscriptionDiscountAmount: string | null;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  subscriptionCurrentPeriodStart: string | null;
  subscriptionCurrentPeriodEnd: string | null;
  subscriptionTrialStart: string | null;
  subscriptionTrialEnd: string | null;
  subscriptionCancelledAt: string | null;
  subscriptionCancellationReason: string | null;
  subscriptionStatus: string | null;
  subscriptionCreatedAt: string | null;
  subscriptionUpdatedAt: string | null;
}

export const subscriptionsApi = {
  async create(data: CreateSubscriptionRequest): Promise<SubscriptionResponse> {
    const response = await apiClient.post<SubscriptionResponse>('/api/subscription', data);
    return response.data;
  },

  async findAll(page = 0, size = 20): Promise<PageResponse<SubscriptionResponse>> {
    const response = await apiClient.get<PageResponse<SubscriptionResponse>>('/api/subscription', {
      params: { page, size },
    });
    return response.data;
  },

  async getById(subscriptionId: string): Promise<SubscriptionResponse> {
    const response = await apiClient.get<SubscriptionResponse>(`/api/subscription/${subscriptionId}`);
    return response.data;
  },

  async update(subscriptionId: string, data: UpdateSubscriptionRequest): Promise<SubscriptionResponse> {
    const response = await apiClient.put<SubscriptionResponse>(`/api/subscription/${subscriptionId}`, data);
    return response.data;
  },

  async cancel(subscriptionId: string, data?: CancelSubscriptionRequest): Promise<SubscriptionResponse> {
    const response = await apiClient.put<SubscriptionResponse>(`/api/subscription/${subscriptionId}`, {
      subscriptionStatus: 'CANCELLED',
      subscriptionCancelledAt: new Date().toISOString(),
      ...data,
    });
    return response.data;
  },

  async delete(subscriptionId: string): Promise<void> {
    await apiClient.delete(`/api/subscription/${subscriptionId}`);
  },
};

export default subscriptionsApi;
