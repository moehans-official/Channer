import api from './index';

export interface Channel {
  id: number;
  name: string;
  type: 'openai' | 'anthropic' | 'gemini';
  base_url: string;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateChannelRequest {
  name: string;
  type: 'openai' | 'anthropic' | 'gemini';
  base_url: string;
  api_key: string;
  priority: number;
  is_active: boolean;
}

export const channelApi = {
  list: () => api.get<{ data: Channel[] }>('/admin/channels'),
  
  get: (id: number) => api.get<Channel>(`/admin/channels/${id}`),
  
  create: (data: CreateChannelRequest) =>
    api.post<Channel>('/admin/channels', data),
  
  update: (id: number, data: Partial<CreateChannelRequest>) =>
    api.put<Channel>(`/admin/channels/${id}`, data),
  
  delete: (id: number) => api.delete(`/admin/channels/${id}`),
};
