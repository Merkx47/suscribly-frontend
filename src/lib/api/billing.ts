import apiClient from './client';
import { PageResponse } from './tenants';

// ========== BANK TYPES ==========
export interface BankResponse {
  bankId: string;
  bankCode: string | null;
  bankName: string | null;
  bankShortName: string | null;
  bankCategory: string | null;
  bankCbnCode: string | null;
  bankNubanCode: string | null;
  bankLogoUrl: string | null;
  bankStatus: string | null;
  bankCreatedAt: string | null;
  bankUpdatedAt: string | null;
}

// ========== NAME ENQUIRY / ACCOUNT VERIFICATION TYPES ==========
export interface NameEnquiryRequest {
  bankCode: string;
  accountNumber: string;
}

export interface NameEnquiryResponse {
  responseCode: string;
  responseMessage: string | null;
  accountNumber: string | null;
  accountName: string | null;
  bankCode: string | null;
  bvn: string | null;
  kycLevel: string | null;
  sessionId: string | null;
}

// ========== MANDATE TYPES ==========
export interface CreateMandateRequest {
  mandateSubscriptionId?: string;
  mandateProductId?: string;
  mandateAccountNumber: string;
  mandateAccountName?: string;
  mandateBankId: string;
  mandatePayerName: string;
  mandatePayerEmail?: string;
  mandatePayerPhone?: string;
  mandatePayerAddress?: string;
  mandateAmount: string;
  mandateNarration?: string;
  mandateStartDate?: string;
  mandateEndDate?: string;
  mandateFrequency: string;
}

export interface UpdateMandateRequest {
  mandateWorkflowStatus?: string;
  mandateRejectionReason?: string;
  mandateStatus?: string;
}

export interface MandateResponse {
  mandateId: string;
  mandateSubscriptionId: string | null;
  mandateProductId: string | null;
  mandateCode: string | null;
  mandateAccountNumber: string | null;
  mandateAccountName: string | null;
  mandateBankId: string | null;
  mandateSubscriberCode: string | null;
  mandatePayerName: string | null;
  mandatePayerEmail: string | null;
  mandatePayerPhone: string | null;
  mandatePayerAddress: string | null;
  mandateAmount: string | null;
  mandateNarration: string | null;
  mandateStartDate: string | null;
  mandateEndDate: string | null;
  mandateFrequency: string | null;
  mandateWorkflowStatus: string | null;
  mandateRejectionReason: string | null;
  mandateStatus: string | null;
  mandateCreatedAt: string | null;
  mandateUpdatedAt: string | null;
}

// ========== TRANSACTION TYPES ==========
export interface TransactionResponse {
  transactionId: string;
  transactionInvoiceId: string | null;
  transactionDebitInstructionId: string | null;
  transactionReference: string | null;
  transactionAmount: string | null;
  transactionFee: string | null;
  transactionCurrency: string | null;
  transactionPaymentMethod: string | null;
  transactionChannel: string | null;
  transactionDescription: string | null;
  transactionStatus: string | null;
  transactionCreatedAt: string | null;
  transactionUpdatedAt: string | null;
}

// ========== NDD TYPES ==========
export interface NddCreateMandateRequest {
  billerNibssId: string;
  productNibssId: string;
  payerName: string;
  payerEmail: string;
  payerPhone: string;
  payerAddress: string;
  payerBankCode: string;
  payerAccountNumber: string;
  amount: number;
  narration: string;
  startDate: string;
  endDate: string;
  frequency: string;
}

export interface NddCreateMandateResponse {
  responseCode: string;
  responseMessage: string | null;
  mandateCode: string | null;
  subscriberCode: string | null;
}

export interface NddChargePayerRequest {
  amount: number;
  narration: string;
  mandateId: string;
}

export interface NddChargePayerResponse {
  responseCode: string;
  responseMessage: string | null;
  sessionId: string | null;
}

export const billingApi = {
  // ========== BANK METHODS ==========
  async getBanks(page = 0, size = 100): Promise<PageResponse<BankResponse>> {
    const response = await apiClient.get<PageResponse<BankResponse>>('/api/bank', {
      params: { page, size },
    });
    return response.data;
  },

  async getBankById(bankId: string): Promise<BankResponse> {
    const response = await apiClient.get<BankResponse>(`/api/bank/${bankId}`);
    return response.data;
  },

  // ========== NAME ENQUIRY / ACCOUNT VERIFICATION ==========
  async verifyBankAccount(data: NameEnquiryRequest, stage = 'dev'): Promise<NameEnquiryResponse> {
    const response = await apiClient.post<NameEnquiryResponse>(
      `/api/${stage}/ndd/name-enquiry`,
      data
    );
    return response.data;
  },

  async getValidNddBanks(stage = 'dev'): Promise<{ responseCode: string; responseMessage: string; data: any[] }> {
    const response = await apiClient.get(`/api/${stage}/ndd/valid-banks`);
    return response.data;
  },

  // ========== MANDATE METHODS ==========
  async listMandates(page = 0, size = 20): Promise<PageResponse<MandateResponse>> {
    const response = await apiClient.get<PageResponse<MandateResponse>>('/api/mandate', {
      params: { page, size },
    });
    return response.data;
  },

  async createMandate(data: CreateMandateRequest): Promise<MandateResponse> {
    const response = await apiClient.post<MandateResponse>('/api/mandate', data);
    return response.data;
  },

  async getMandate(mandateId: string): Promise<MandateResponse> {
    const response = await apiClient.get<MandateResponse>(`/api/mandate/${mandateId}`);
    return response.data;
  },

  async updateMandate(mandateId: string, data: UpdateMandateRequest): Promise<MandateResponse> {
    const response = await apiClient.put<MandateResponse>(`/api/mandate/${mandateId}`, data);
    return response.data;
  },

  async deleteMandate(mandateId: string): Promise<void> {
    await apiClient.delete(`/api/mandate/${mandateId}`);
  },

  // ========== NDD MANDATE METHODS (Direct NDD Integration) ==========
  async createNddMandate(data: NddCreateMandateRequest, stage = 'dev'): Promise<NddCreateMandateResponse> {
    const response = await apiClient.post<NddCreateMandateResponse>(
      `/api/${stage}/ndd/create-mandate`,
      data
    );
    return response.data;
  },

  async chargeNddMandate(data: NddChargePayerRequest, stage = 'dev'): Promise<NddChargePayerResponse> {
    const response = await apiClient.post<NddChargePayerResponse>(
      `/api/${stage}/ndd/charge-payer`,
      data
    );
    return response.data;
  },

  // ========== TRANSACTION METHODS ==========
  async listTransactions(page = 0, size = 20): Promise<PageResponse<TransactionResponse>> {
    const response = await apiClient.get<PageResponse<TransactionResponse>>('/api/transaction', {
      params: { page, size },
    });
    return response.data;
  },

  async getTransaction(transactionId: string): Promise<TransactionResponse> {
    const response = await apiClient.get<TransactionResponse>(`/api/transaction/${transactionId}`);
    return response.data;
  },
};

export default billingApi;
