import apiClient from './client';
import type { PageResponse } from './tenants';

export interface AuditLogResponse {
  auditLogId: string;
  auditLogEntityName: string;
  auditLogEntityId: string;
  auditLogAction: string;
  auditLogUserId?: string;
  auditLogOldValues?: string;
  auditLogNewValues?: string;
  auditLogIpAddress?: string;
  auditLogUserAgent?: string;
  auditLogStatus: string;
  auditLogCreatedAt: string;
  auditLogUpdatedAt: string;
}

export const auditLogsApi = {
  list: async (page: number, size: number): Promise<PageResponse<AuditLogResponse>> => {
    const response = await apiClient.get<PageResponse<AuditLogResponse>>('/api/admin/audit-logs', {
      params: { page, size },
    });
    return response.data;
  },
};
