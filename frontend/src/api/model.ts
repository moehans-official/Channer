import api from './index';

export interface AIModel {
  id: number;
  channel_id: number;
  model_id: string;
  name: string;
  input_price: number;
  output_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  channel?: {
    id: number;
    name: string;
    type: string;
  };
}

export interface CreateModelRequest {
  channel_id: number;
  model_id: string;
  name: string;
  input_price: number;
  output_price: number;
  is_active: boolean;
}

export const modelApi = {
  list: () => api.get<{ data: AIModel[] }>('/admin/models'),
  
  get: (id: number) => api.get<AIModel>(`/admin/models/${id}`),
  
  create: (data: CreateModelRequest) =>
    api.post<AIModel>('/admin/models', data),
  
  update: (id: number, data: Partial<CreateModelRequest>) =>
    api.put<AIModel>(`/admin/models/${id}`, data),
  
  delete: (id: number) => api.delete(`/admin/models/${id}`),
};
