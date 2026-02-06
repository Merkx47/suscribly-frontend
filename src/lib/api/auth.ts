import apiClient, { setTokens, clearTokens } from './client';

export interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  businessName?: string;  // Optional: creates a business if provided
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  roles: string[] | null;
  permissions: string[] | null;
  businessId: string | null;
  businessName: string | null;
  businessSlug: string | null;
  mustChangePassword: boolean | null;
  message: string | null;
}

export interface UserProfileResponse {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  isVerified: boolean;
  roles: string[];
  permissions: string[];
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface MessageResponse {
  message: string;
}

export interface VerifyOtpRequest {
  email: string;
  otpCode: string;
}

export interface ResetPasswordRequest {
  email: string;
  otpCode: string;
  newPassword: string;
}

export const authApi = {
  async signup(data: SignupRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/signup', data);
    if (response.data.accessToken && response.data.refreshToken) {
      setTokens(response.data.accessToken, response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify({
        userId: response.data.userId,
        email: response.data.email,
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        roles: response.data.roles,
        permissions: response.data.permissions,
        businessId: response.data.businessId,
        businessName: response.data.businessName,
      }));
    }
    return response.data;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/login', data);
    if (response.data.accessToken && response.data.refreshToken) {
      setTokens(response.data.accessToken, response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify({
        userId: response.data.userId,
        email: response.data.email,
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        roles: response.data.roles,
        permissions: response.data.permissions,
        businessId: response.data.businessId,
        businessName: response.data.businessName,
      }));
    }
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout');
    } finally {
      clearTokens();
    }
  },

  async getProfile(): Promise<UserProfileResponse> {
    const response = await apiClient.get<UserProfileResponse>('/api/auth/me');
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },

  async updateProfile(data: UpdateProfileRequest): Promise<UserProfileResponse> {
    const response = await apiClient.put<UserProfileResponse>('/api/auth/me', data);
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },

  async verifyEmail(email: string, otpCode: string): Promise<MessageResponse> {
    const response = await apiClient.post<MessageResponse>('/api/auth/verify-email', { email, otpCode });
    return response.data;
  },

  async resendVerification(email: string): Promise<MessageResponse> {
    const response = await apiClient.post<MessageResponse>('/api/auth/resend-verification', { email });
    return response.data;
  },

  async forgotPassword(email: string): Promise<MessageResponse> {
    const response = await apiClient.post<MessageResponse>('/api/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(email: string, otpCode: string, newPassword: string): Promise<MessageResponse> {
    const response = await apiClient.post<MessageResponse>('/api/auth/reset-password', { email, otpCode, newPassword });
    return response.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<MessageResponse> {
    const response = await apiClient.post<MessageResponse>('/api/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  // Helper to get stored user
  getStoredUser(): (UserProfileResponse & { businessId?: string; businessName?: string }) | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  },
};

export default authApi;
