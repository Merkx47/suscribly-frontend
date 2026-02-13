import apiClient from './client';

export interface PlatformConfigResponse {
  platformConfigId: string | null;
  platformConfigBankCode: string | null;
  platformConfigAccountNumber: string | null;
  platformConfigAccountName: string | null;
  platformConfigBillerNibssId: string | null;
  platformConfigBillerLocalId: string | null;
  platformConfigSyncStatus: string | null;
  platformConfigSyncedAt: string | null;
  platformConfigNotificationUrl: string | null;
  platformConfigCreatedAt: string | null;
  platformConfigUpdatedAt: string | null;
}

export interface CreatePlatformConfigRequest {
  platformConfigBankCode: string;
  platformConfigAccountNumber: string;
  platformConfigAccountName: string;
  platformConfigNotificationUrl?: string;
}

export const platformConfigApi = {
  async getConfig(): Promise<PlatformConfigResponse> {
    const response = await apiClient.get<PlatformConfigResponse>('/api/platform-config');
    return response.data;
  },

  async createOrUpdate(data: CreatePlatformConfigRequest): Promise<PlatformConfigResponse> {
    const response = await apiClient.post<PlatformConfigResponse>('/api/platform-config', data);
    return response.data;
  },

  async registerAsBiller(): Promise<PlatformConfigResponse> {
    const response = await apiClient.post<PlatformConfigResponse>('/api/platform-config/register-biller');
    return response.data;
  },
};
