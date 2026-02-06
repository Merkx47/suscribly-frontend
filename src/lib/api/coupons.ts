import apiClient from './client';
import { PageResponse } from './tenants';

export interface CreateCouponRequest {
  couponCode: string;
  couponName?: string;
  couponDescription?: string;
  couponType?: string;
  couponValue?: string;
  couponMaxRedemptions?: number;
  couponMinAmount?: string;
  couponMaxDiscount?: string;
  couponValidFrom?: string;
  couponValidUntil?: string;
  couponStatus?: string;
}

export interface UpdateCouponRequest {
  couponCode?: string;
  couponName?: string;
  couponDescription?: string;
  couponType?: string;
  couponValue?: string;
  couponMaxRedemptions?: number;
  couponMinAmount?: string;
  couponMaxDiscount?: string;
  couponValidFrom?: string;
  couponValidUntil?: string;
  couponStatus?: string;
}

export interface CouponResponse {
  couponId: string;
  couponBusinessId: string | null;
  couponCode: string | null;
  couponName: string | null;
  couponDescription: string | null;
  couponType: string | null;
  couponValue: string | null;
  couponMaxRedemptions: number | null;
  couponRedemptionCount: number | null;
  couponMinAmount: string | null;
  couponMaxDiscount: string | null;
  couponValidFrom: string | null;
  couponValidUntil: string | null;
  couponStatus: string | null;
  couponCreatedAt: string | null;
  couponUpdatedAt: string | null;
}

export interface ValidateCouponRequest {
  couponCode: string;
  amount: number;
}

export interface ValidateCouponResponse {
  valid: boolean;
  couponId: string | null;
  couponCode: string | null;
  couponType: string | null;
  couponValue: string | null;
  discountAmount: number;
  finalAmount: number;
  message: string;
}

export const couponsApi = {
  async create(data: CreateCouponRequest): Promise<CouponResponse> {
    const response = await apiClient.post<CouponResponse>('/api/coupon', data);
    return response.data;
  },

  async findAll(page = 0, size = 20): Promise<PageResponse<CouponResponse>> {
    const response = await apiClient.get<PageResponse<CouponResponse>>('/api/coupon', {
      params: { page, size },
    });
    return response.data;
  },

  async findById(id: string): Promise<CouponResponse> {
    const response = await apiClient.get<CouponResponse>(`/api/coupon/${id}`);
    return response.data;
  },

  async update(id: string, data: UpdateCouponRequest): Promise<CouponResponse> {
    const response = await apiClient.put<CouponResponse>(`/api/coupon/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/coupon/${id}`);
  },

  async validate(data: ValidateCouponRequest): Promise<ValidateCouponResponse> {
    const response = await apiClient.post<ValidateCouponResponse>('/api/coupon/validate', data);
    return response.data;
  },
};

export default couponsApi;
