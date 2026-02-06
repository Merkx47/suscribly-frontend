import apiClient from './client';
import { PageResponse } from './tenants';

export interface SettlementResponse {
  settlementId: string;
  settlementBusinessId: string | null;
  settlementReference: string | null;
  settlementAmount: string | null;
  settlementFees: string | null;
  settlementNetAmount: string | null;
  settlementCurrency: string | null;
  settlementPeriodStart: string | null;
  settlementPeriodEnd: string | null;
  settlementBankAccountNumber: string | null;
  settlementBankCode: string | null;
  settlementPaidAt: string | null;
  settlementStatus: string | null;
  settlementCreatedAt: string | null;
  settlementUpdatedAt: string | null;
}

export const settlementsApi = {
  async findAll(page = 0, size = 20): Promise<PageResponse<SettlementResponse>> {
    const response = await apiClient.get<PageResponse<SettlementResponse>>('/api/settlement', {
      params: { page, size, sort: 'settlementCreatedAt', direction: 'desc' },
    });
    return response.data;
  },

  async findById(id: string): Promise<SettlementResponse> {
    const response = await apiClient.get<SettlementResponse>(`/api/settlement/${id}`);
    return response.data;
  },
};

export default settlementsApi;
