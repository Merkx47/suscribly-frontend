import apiClient from './client';

// ============ Interfaces ============

export interface KycValidateRequest {
  kycType: string;   // "RC", "CAC", "TIN"
  kycNumber: string;
}

export interface KycValidateResponse {
  legalName: string | null;
  registrationNumber: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  companyType: string | null;
  industry: string | null;
  status: string | null;
  registrationDate: string | null;
  responseCode: string | null;
  responseMessage: string | null;
  businessNameMatch: number | null;
  isBusinessNameMatch: boolean | null;
}

export interface KycSubmissionRequest {
  kycType: string;
  kycNumber: string;
  kycDocumentUrl: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

export interface KycStatusResponse {
  businessId: string | null;
  businessName: string | null;
  businessStatus: string | null;
  kycType: string | null;
  kycNumber: string | null;
  kycDocumentUrl: string | null;
  kycLegalName: string | null;
  kycVerified: boolean | null;
  kycStatus: string | null;
  kycReviewNotes: string | null;
  kycSubmittedAt: string | null;
  kycReviewedAt: string | null;
  bankCode: string | null;
  accountName: string | null;
  accountNumber: string | null;
}

export interface KycReviewRequest {
  action: 'APPROVE' | 'REJECT' | 'RETURN_FOR_REVIEW';
  reviewNotes?: string;
}

export interface PresignedUploadResponse {
  uploadUrl: string;
  fileKey: string;
  expiresInSeconds: number;
}

export interface CommercialBankResponse {
  bankId: string | null;
  bankCode: string | null;
  bankName: string | null;
  bankShortName: string | null;
  bankCbnCode: string | null;
}

export interface NameMatchResponse {
  accountName: string | null;
  businessName: string | null;
  similarityScore: number;
  isMatch: boolean;
  responseCode: string | null;
  responseMessage: string | null;
}

// ============ API Methods ============

export const kycApi = {
  // Business owner: validate RC/CAC/TIN
  async validateKyc(data: KycValidateRequest): Promise<KycValidateResponse> {
    const response = await apiClient.post<KycValidateResponse>('/api/businesses/me/kyc/validate', data);
    return response.data;
  },

  // Business owner: submit KYC for review
  async submitKyc(data: KycSubmissionRequest): Promise<KycStatusResponse> {
    const response = await apiClient.post<KycStatusResponse>('/api/businesses/me/kyc', data);
    return response.data;
  },

  // Business owner: get own KYC status
  async getMyKycStatus(): Promise<KycStatusResponse> {
    const response = await apiClient.get<KycStatusResponse>('/api/businesses/me/kyc');
    return response.data;
  },

  // Business owner: get presigned upload URL
  async getUploadUrl(fileName: string): Promise<PresignedUploadResponse> {
    const response = await apiClient.post<PresignedUploadResponse>(
      `/api/businesses/me/kyc/upload-url?fileName=${encodeURIComponent(fileName)}`
    );
    return response.data;
  },

  // Business owner: verify bank account name match
  async verifyAccount(bankCode: string, accountNumber: string): Promise<NameMatchResponse> {
    const response = await apiClient.post<NameMatchResponse>(
      `/api/businesses/me/kyc/verify-account?bankCode=${encodeURIComponent(bankCode)}&accountNumber=${encodeURIComponent(accountNumber)}`
    );
    return response.data;
  },

  // Shared: get commercial banks list
  async getCommercialBanks(): Promise<CommercialBankResponse[]> {
    const response = await apiClient.get<CommercialBankResponse[]>('/api/businesses/banks/commercial');
    return response.data;
  },

  // Upload file to S3 using presigned URL
  async uploadToS3(uploadUrl: string, file: File): Promise<void> {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
    });
    if (!response.ok) {
      throw new Error(`File upload failed (${response.status})`);
    }
  },

  // Admin: get KYC review queue
  async getKycReviewQueue(): Promise<KycStatusResponse[]> {
    const response = await apiClient.get<KycStatusResponse[]>('/api/businesses/kyc/review-queue');
    return response.data;
  },

  // Admin: get specific business KYC
  async getBusinessKycStatus(businessId: string): Promise<KycStatusResponse> {
    const response = await apiClient.get<KycStatusResponse>(`/api/businesses/${businessId}/kyc`);
    return response.data;
  },

  // Admin: get presigned document URL for viewing
  async getKycDocumentUrl(businessId: string): Promise<string> {
    const response = await apiClient.get<{ url: string }>(`/api/businesses/${businessId}/kyc/document-url`);
    return response.data.url;
  },

  // Admin: review KYC (approve/reject/return)
  async reviewKyc(businessId: string, data: KycReviewRequest): Promise<KycStatusResponse> {
    const response = await apiClient.post<KycStatusResponse>(`/api/businesses/${businessId}/kyc/review`, data);
    return response.data;
  },
};

export default kycApi;
