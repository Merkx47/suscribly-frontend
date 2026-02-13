import apiClient from './client';
import { PageResponse } from './tenants';

export interface CreateCustomerRequest {
  customerBusinessId?: string;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhone?: string;
  customerAddress?: string;
  customerExternalId?: string;
  customerMetadata?: string;
  customerBankCode?: string;
  customerAccountNumber?: string;
  customerAccountName?: string;
  createUserAccount?: boolean;
}

export interface UpdateCustomerRequest {
  customerEmail?: string;
  customerFirstName?: string;
  customerLastName?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerExternalId?: string;
  customerMetadata?: string;
  customerStatus?: string;
}

export interface CustomerResponse {
  customerId: string;
  customerBusinessId: string | null;
  customerEmail: string | null;
  customerFirstName: string | null;
  customerLastName: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  customerExternalId: string | null;
  customerMetadata: string | null;
  customerBankCode: string | null;
  customerAccountNumber: string | null;
  customerAccountName: string | null;
  customerStatus: string | null;
  customerCreatedAt: string | null;
  customerUpdatedAt: string | null;
}

// ========== CUSTOMER PORTAL TYPES ==========

export interface CustomerBusinessInfo {
  businessId: string | null;
  businessName: string | null;
  businessLogoUrl: string | null;
  customerId: string | null;
  products: CustomerProductInfo[];
  standalonePlans: CustomerPlanInfo[];
}

export interface CustomerProductInfo {
  productId: string | null;
  productName: string | null;
  productDescription: string | null;
  plans: CustomerPlanInfo[];
}

export interface CustomerPlanInfo {
  planId: string | null;
  planName: string | null;
  planDescription: string | null;
  planAmount: string | null;
  planCurrency: string | null;
  planBillingInterval: string | null;
  planTrialDays: number | null;
  planSetupFee: string | null;
  planIsPopular: boolean | null;
  features: string[];
  subscriptionStatus: string | null;
}

// ========== CUSTOMER EMAIL OTP TYPES ==========

export interface SendCustomerEmailOtpResponse {
  message: string;
  emailMasked: string;
}

export interface VerifyCustomerEmailOtpResponse {
  message: string;
  verified: boolean;
}

// ========== BUSINESS PAYMENT DETAILS ==========

export interface BusinessPaymentDetails {
  businessName: string | null;
  accountNumber: string | null;
  accountName: string | null;
  bankCode: string | null;
  bankName: string | null;
  validationAmount: string;
}

// ========== MANDATE OTP TYPES ==========

export interface SendMandateOtpResponse {
  message: string;
  phoneLastFour: string | null;
  emailMasked: string | null;
  channel: string;
}

export interface VerifyMandateOtpResponse {
  verificationToken: string;
  expiresInSeconds: number;
}

export const customersApi = {
  async create(data: CreateCustomerRequest): Promise<CustomerResponse> {
    const response = await apiClient.post<CustomerResponse>('/api/customer', data);
    return response.data;
  },

  async findAll(page = 0, size = 20): Promise<PageResponse<CustomerResponse>> {
    const response = await apiClient.get<PageResponse<CustomerResponse>>('/api/customer', {
      params: { page, size },
    });
    return response.data;
  },

  async getById(customerId: string): Promise<CustomerResponse> {
    const response = await apiClient.get<CustomerResponse>(`/api/customer/${customerId}`);
    return response.data;
  },

  async update(customerId: string, data: UpdateCustomerRequest): Promise<CustomerResponse> {
    const response = await apiClient.put<CustomerResponse>(`/api/customer/${customerId}`, data);
    return response.data;
  },

  async delete(customerId: string): Promise<void> {
    await apiClient.delete(`/api/customer/${customerId}`);
  },

  async resendWelcomeEmail(customerId: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(`/api/customer/${customerId}/resend-welcome-email`);
    return response.data;
  },

  async getMyBusinesses(): Promise<CustomerBusinessInfo[]> {
    const response = await apiClient.get<CustomerBusinessInfo[]>('/api/customer-portal/my-businesses');
    return response.data;
  },

  async sendMandateOtp(customerId: string, channel: 'whatsapp' | 'email' = 'whatsapp'): Promise<SendMandateOtpResponse> {
    const response = await apiClient.post<SendMandateOtpResponse>('/api/customer-portal/send-mandate-otp', { customerId, channel });
    return response.data;
  },

  async verifyMandateOtp(customerId: string, otpCode: string): Promise<VerifyMandateOtpResponse> {
    const response = await apiClient.post<VerifyMandateOtpResponse>('/api/customer-portal/verify-mandate-otp', { customerId, otpCode });
    return response.data;
  },

  async getBusinessPaymentDetails(businessId: string): Promise<BusinessPaymentDetails> {
    const response = await apiClient.get<BusinessPaymentDetails>(`/api/customer-portal/business-payment-details/${businessId}`);
    return response.data;
  },

  async sendCustomerEmailOtp(email: string): Promise<SendCustomerEmailOtpResponse> {
    const response = await apiClient.post<SendCustomerEmailOtpResponse>('/api/customer/send-email-otp', { email });
    return response.data;
  },

  async verifyCustomerEmailOtp(email: string, otpCode: string): Promise<VerifyCustomerEmailOtpResponse> {
    const response = await apiClient.post<VerifyCustomerEmailOtpResponse>('/api/customer/verify-email-otp', { email, otpCode });
    return response.data;
  },
};

export default customersApi;
