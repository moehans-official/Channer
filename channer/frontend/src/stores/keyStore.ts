import { create } from 'zustand';
import { keyApi, APIKey, CreateKeyRequest } from '../api/key';

interface KeyState {
  keys: APIKey[];
  loading: boolean;
  fetchKeys: () => Promise<void>;
  createKey: (data: CreateKeyRequest) => Promise<void>;
  updateKey: (id: number, data: Partial<CreateKeyRequest>) => Promise<void>;
  deleteKey: (id: number) => Promise<void>;
  rechargeKey: (id: number, amount: number) => Promise<void>;
}

export const useKeyStore = create<KeyState>((set, get) => ({
  keys: [],
  loading: false,
  
  fetchKeys: async () => {
    set({ loading: true });
    try {
      const response = await keyApi.list();
      set({ keys: response.data.data });
    } finally {
      set({ loading: false });
    }
  },
  
  createKey: async (data) => {
    await keyApi.create(data);
    await get().fetchKeys();
  },
  
  updateKey: async (id, data) => {
    await keyApi.update(id, data);
    await get().fetchKeys();
  },
  
  deleteKey: async (id) => {
    await keyApi.delete(id);
    await get().fetchKeys();
  },
  
  rechargeKey: async (id, amount) => {
    await keyApi.recharge(id, amount);
    await get().fetchKeys();
  },
}));
