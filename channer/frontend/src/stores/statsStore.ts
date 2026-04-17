import { create } from 'zustand';
import { statsApi, DashboardStats, UsageStats, UsageLog } from '../api/stats';

interface StatsState {
  dashboardStats: DashboardStats | null;
  usageStats: UsageStats | null;
  logs: UsageLog[];
  loading: boolean;
  fetchDashboardStats: () => Promise<void>;
  fetchUsageStats: (params?: { key_id?: number; channel_id?: number; start?: string; end?: string }) => Promise<void>;
  fetchLogs: (params?: { limit?: number; offset?: number }) => Promise<void>;
}

export const useStatsStore = create<StatsState>((set) => ({
  dashboardStats: null,
  usageStats: null,
  logs: [],
  loading: false,
  
  fetchDashboardStats: async () => {
    set({ loading: true });
    try {
      const response = await statsApi.dashboard();
      set({ dashboardStats: response.data });
    } finally {
      set({ loading: false });
    }
  },
  
  fetchUsageStats: async (params) => {
    set({ loading: true });
    try {
      const response = await statsApi.usage(params);
      set({ usageStats: response.data });
    } finally {
      set({ loading: false });
    }
  },
  
  fetchLogs: async (params) => {
    set({ loading: true });
    try {
      const response = await statsApi.logs(params);
      set({ logs: response.data.data });
    } finally {
      set({ loading: false });
    }
  },
}));
