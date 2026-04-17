import api from './index';

export interface APIKey {
  id: number;
  key: string;
  name: string;
  balance: number;
  rpm_limit: number;
  tpm_limit: number;
  rpd_limit: number;
  tpd_limit: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateKeyRequest {
  name: string;
  balance?: number;
  rpm_limit?: number;
  tpm_limit?: number;
  rpd_limit?: number;
  tpd_limit?: number;
  is_active?: boolean;
}

export const keyApi = {
  list: () => api.get<{ data: APIKey[] }>('/admin/keys'),
  
  get: (id: number) => api.get<APIKey>(`/admin/keys/${id}`),
  
  create: (data: CreateKeyRequest) =>
    api.post<APIKey>('/admin/keys', data),
  
  update: (id: number, data: Partial<CreateKeyRequest>) =>
    api.put<APIKey>(`/admin/keys/${id}`, data),
  
  delete: (id: number) => api.delete(`/admin/keys/${id}`),
  
  recharge: (id: number, amount: number) =>
    api.post(`/admin/keys/${id}/recharge`, { amount }),
};
