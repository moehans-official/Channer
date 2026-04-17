import { create } from 'zustand';
import { channelApi, Channel, CreateChannelRequest } from '../api/channel';

interface ChannelState {
  channels: Channel[];
  loading: boolean;
  fetchChannels: () => Promise<void>;
  createChannel: (data: CreateChannelRequest) => Promise<void>;
  updateChannel: (id: number, data: Partial<CreateChannelRequest>) => Promise<void>;
  deleteChannel: (id: number) => Promise<void>;
}

export const useChannelStore = create<ChannelState>((set, get) => ({
  channels: [],
  loading: false,
  
  fetchChannels: async () => {
    set({ loading: true });
    try {
      const response = await channelApi.list();
      set({ channels: response.data.data });
    } finally {
      set({ loading: false });
    }
  },
  
  createChannel: async (data) => {
    await channelApi.create(data);
    await get().fetchChannels();
  },
  
  updateChannel: async (id, data) => {
    await channelApi.update(id, data);
    await get().fetchChannels();
  },
  
  deleteChannel: async (id) => {
    await channelApi.delete(id);
    await get().fetchChannels();
  },
}));
