import apiClient from './client';
import { PageResponse } from './tenants';

export interface CreateProductRequest {
  productName: string;
  productDescription?: string;
  productAmount?: number;
  productBusinessId?: string;
  productStatus?: string;
}

export interface UpdateProductRequest {
  productName?: string;
  productDescription?: string;
  productAmount?: number;
  productStatus?: string;
}

export interface ProductResponse {
  productId: string;
  productBusinessId: string | null;
  productName: string | null;
  productDescription: string | null;
  productAmount: number | null;
  productNddProductNibssId: string | null;
  productNddProductLocalId: string | null;
  productNddSyncStatus: string | null;
  productNddSyncedAt: string | null;
  productStatus: string | null;
  productCreatedAt: string | null;
  productUpdatedAt: string | null;
}

export const productsApi = {
  async create(data: CreateProductRequest): Promise<ProductResponse> {
    const response = await apiClient.post<ProductResponse>('/api/product', data);
    return response.data;
  },

  async findAll(page = 0, size = 20): Promise<PageResponse<ProductResponse>> {
    const response = await apiClient.get<PageResponse<ProductResponse>>('/api/product', {
      params: { page, size },
    });
    return response.data;
  },

  async findById(id: string): Promise<ProductResponse> {
    const response = await apiClient.get<ProductResponse>(`/api/product/${id}`);
    return response.data;
  },

  async update(id: string, data: UpdateProductRequest): Promise<ProductResponse> {
    const response = await apiClient.put<ProductResponse>(`/api/product/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/product/${id}`);
  },
};

export default productsApi;
