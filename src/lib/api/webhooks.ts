import apiClient from './client';
import type { PageResponse } from './tenants';

export interface WebhookResponse {
  webhookId: string;
  webhookBusinessId: string | null;
  webhookUrl: string | null;
  webhookEvents: string[];
  webhookIsActive: boolean;
  webhookDescription: string | null;
  webhookFailureCount: number | null;
  webhookLastDeliveredAt: string | null;
  webhookStatus: string | null;
  webhookCreatedAt: string | null;
  webhookUpdatedAt: string | null;
}

export interface CreateWebhookRequest {
  webhookUrl: string;
  webhookEvents: string[];
  webhookIsActive: boolean;
  webhookDescription?: string;
}

export interface UpdateWebhookRequest {
  webhookUrl?: string;
  webhookEvents?: string[];
  webhookIsActive?: boolean;
  webhookDescription?: string;
}

export const webhooksApi = {
  list: async (page: number, size: number): Promise<PageResponse<WebhookResponse>> => {
    const response = await apiClient.get<PageResponse<WebhookResponse>>('/api/webhook', {
      params: { page, size },
    });
    return response.data;
  },

  getById: async (id: string): Promise<WebhookResponse> => {
    const response = await apiClient.get<WebhookResponse>(`/api/webhook/${id}`);
    return response.data;
  },

  create: async (request: CreateWebhookRequest): Promise<WebhookResponse> => {
    const response = await apiClient.post<WebhookResponse>('/api/webhook', request);
    return response.data;
  },

  update: async (id: string, request: UpdateWebhookRequest): Promise<WebhookResponse> => {
    const response = await apiClient.put<WebhookResponse>(`/api/webhook/${id}`, request);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/webhook/${id}`);
  },

  test: async (id: string): Promise<void> => {
    await apiClient.post(`/api/webhook/${id}/test`);
  },
};
