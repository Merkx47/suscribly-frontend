import apiClient from './client';
import { PageResponse } from './tenants';

export interface CreateSubscriptionRequest {
  subscriptionCustomerId: string;
  subscriptionPlanId: string;
  subscriptionCouponCode?: string;
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

export interface SubscriptionCheckResponse {
  isActive: boolean;
  isPaid: boolean;
  inTrial: boolean;
  trialEndsAt: string | null;
  nextBillingDate: string | null;
  subscriptionId: string | null;
  planName: string | null;
  subscriptionStatus: string | null;
}

export interface ActiveSubscriberResponse {
  customerId: string | null;
  customerName: string | null;
  customerEmail: string | null;
  planId: string | null;
  planName: string | null;
  productName: string | null;
  planAmount: string | null;
  subscriptionStatus: string | null;
  subscriptionStartDate: string | null;
  nextBillingDate: string | null;
  subscriptionId: string | null;
}

export interface ActivePlanInfo {
  subscriptionId: string | null;
  planName: string | null;
  planAmount: string | null;
  status: string | null;
  startDate: string | null;
  nextBillingDate: string | null;
}

export interface CustomerSubscriptionStatusResponse {
  customerId: string;
  isSubscribed: boolean;
  totalActive: number;
  subscriptions: ActivePlanInfo[];
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

  async activate(subscriptionId: string): Promise<SubscriptionResponse> {
    const response = await apiClient.post<SubscriptionResponse>(`/api/subscription/${subscriptionId}/activate`);
    return response.data;
  },

  async cancel(subscriptionId: string, data?: CancelSubscriptionRequest): Promise<SubscriptionResponse> {
    const response = await apiClient.put<SubscriptionResponse>(`/api/subscription/${subscriptionId}`, {
      subscriptionStatus: 'CANCELLED',
      ...data,
    });
    return response.data;
  },

  async delete(subscriptionId: string): Promise<void> {
    await apiClient.delete(`/api/subscription/${subscriptionId}`);
  },

  async checkActive(customerId: string, planId: string): Promise<SubscriptionCheckResponse> {
    const response = await apiClient.get<SubscriptionCheckResponse>('/api/subscription/check-active', {
      params: { customerId, planId },
    });
    return response.data;
  },

  async checkCustomerStatus(customerId: string): Promise<CustomerSubscriptionStatusResponse> {
    const response = await apiClient.get<CustomerSubscriptionStatusResponse>('/api/subscription/customer-status', {
      params: { customerId },
    });
    return response.data;
  },

  async getActiveSubscribers(page = 0, size = 20): Promise<PageResponse<ActiveSubscriberResponse>> {
    const response = await apiClient.get<PageResponse<ActiveSubscriberResponse>>('/api/subscription/active-subscribers', {
      params: { page, size },
    });
    return response.data;
  },
};

export default subscriptionsApi;
