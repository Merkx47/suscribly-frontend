import apiClient from './client';

export interface InitiateTierUpgradeRequest {
  serviceTierId: string;
  billingCycle: string;
}

export interface TierUpgradeResponse {
  businessSubscriptionId: string | null;
  mandateId: string | null;
  mandateCode: string | null;
  mandateNddMandateCode: string | null;
  mandateStatus: string | null;
  businessSubscriptionStatus: string | null;
  serviceTierName: string | null;
  amount: string | null;
  billingCycle: string | null;
  message: string | null;
  // Platform (destination) account for ₦50 validation transfer
  platformBankCode: string | null;
  platformBankName: string | null;
  platformAccountNumber: string | null;
  platformAccountName: string | null;
  // Payer (business) account details
  payerBankCode: string | null;
  payerBankName: string | null;
  payerAccountNumber: string | null;
  payerAccountName: string | null;
}

export interface TierUpgradeStatusResponse {
  businessSubscriptionId: string | null;
  mandateId: string | null;
  mandateStatus: string | null;
  businessSubscriptionStatus: string | null;
  serviceTierName: string | null;
  amount: string | null;
  billingCycle: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  validationChargeStatus: string | null;
}

export interface TierMandateAdminResponse {
  businessSubscriptionId: string | null;
  businessName: string | null;
  businessEmail: string | null;
  mandateId: string | null;
  mandateCode: string | null;
  mandateNddMandateCode: string | null;
  mandateStatus: string | null;
  mandateAmount: string | null;
  subscriptionStatus: string | null;
  serviceTierName: string | null;
  billingCycle: string | null;
  createdAt: string | null;
}

export interface PlatformAccountInfo {
  bankCode: string | null;
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
}

export const tierUpgradeApi = {
  async initiate(data: InitiateTierUpgradeRequest): Promise<TierUpgradeResponse> {
    const response = await apiClient.post<TierUpgradeResponse>('/api/tier-upgrade/initiate', data);
    return response.data;
  },

  async getStatus(): Promise<TierUpgradeStatusResponse> {
    const response = await apiClient.get<TierUpgradeStatusResponse>('/api/tier-upgrade/status');
    return response.data;
  },

  async cancel(): Promise<void> {
    await apiClient.post('/api/tier-upgrade/cancel');
  },

  async getPlatformAccount(): Promise<PlatformAccountInfo> {
    const response = await apiClient.get<PlatformAccountInfo>('/api/tier-upgrade/platform-account');
    return response.data;
  },

  async adminListMandates(): Promise<TierMandateAdminResponse[]> {
    const response = await apiClient.get<TierMandateAdminResponse[]>('/api/tier-upgrade/admin/mandates');
    return response.data;
  },

  async adminActivateMandate(mandateId: string): Promise<void> {
    await apiClient.post(`/api/tier-upgrade/admin/activate-mandate/${mandateId}`);
  },
};
