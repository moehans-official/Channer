import api from './index';

export interface DashboardStats {
  total_requests: number;
  total_tokens: number;
  total_cost: number;
  active_keys: number;
  active_channels: number;
  today_requests: number;
  today_cost: number;
}

export interface UsageStats {
  total_requests: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_cost: number;
}

export interface UsageLog {
  id: number;
  api_key_id: number;
  model_id?: number;
  channel_id?: number;
  request_type: string;
  input_tokens: number;
  output_tokens: number;
  cost: number;
  status_code: number;
  error_message?: string;
  created_at: string;
}

export const statsApi = {
  dashboard: () => api.get<DashboardStats>('/admin/stats/dashboard'),
  
  usage: (params?: { key_id?: number; channel_id?: number; start?: string; end?: string }) => api.get<UsageStats>('/admin/stats/usage', { params }),
  
  logs: (params?: { limit?: number; offset?: number; key_id?: number; model_id?: number; channel_id?: number }) =>
    api.get<{ data: UsageLog[] }>('/admin/stats/logs', { params }),
};
