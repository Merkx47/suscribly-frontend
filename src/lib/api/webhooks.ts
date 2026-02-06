import apiClient from './client';
import type { PageResponse } from './tenants';

export interface WebhookResponse {
  webhookId: string;
  webhookUrl: string;
  webhookEvents: string[];
  webhookIsActive: boolean;
  webhookCreatedAt: string;
  webhookUpdatedAt: string;
  webhookBusinessId?: string;
}

export interface CreateWebhookRequest {
  webhookUrl: string;
  webhookEvents: string[];
  webhookIsActive: boolean;
}

export interface UpdateWebhookRequest {
  webhookUrl?: string;
  webhookEvents?: string[];
  webhookIsActive?: boolean;
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
    // Test endpoint if available, otherwise this is a client-side placeholder
    await apiClient.post(`/api/webhook/${id}/test`);
  },
};
