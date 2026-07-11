import { create } from 'zustand';
import { apiRequest } from '@/lib/api';

export type AdminBusinessItem = {
  id: string;
  name: string;
  legalName: string;
  ein: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  industry: string;
  status: 'active' | 'suspended' | 'pending' | 'onboarding' | string;
  tier: 'free' | 'pro' | 'premium' | 'enterprise' | string;
  subscriptionStatus: 'paid' | 'overdue' | 'trialing' | 'canceled' | string;
  totalUsers: number;
  totalLocations: number;
  totalProducts: number;
  totalOrders: number;
  monthlyRevenue: number;
  createdAt: string;
  lastActive: string;
  isVerified: boolean;
  isFeatured: boolean;
  flags: string[];
  supportTickets: number;
  apiCalls: number;
};

type ListBusinessesResponse = {
  businesses: AdminBusinessItem[];
  message: string;
};

export type SyncBusinessModulesResponse = {
  business_id: string;
  inserted_modules: number;
  inserted_submodules: number;
  message: string;
};

type AdminBusinessesStore = {
  businesses: AdminBusinessItem[];
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  fetchBusinesses: () => Promise<AdminBusinessItem[]>;
  syncBusinessModules: (businessId: string) => Promise<SyncBusinessModulesResponse | null>;
  clearError: () => void;
};

const useAdminBusinessesStore = create<AdminBusinessesStore>((set) => ({
  businesses: [],
  isLoading: false,
  isSyncing: false,
  error: null,

  fetchBusinesses: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiRequest<ListBusinessesResponse>('/admin/businesses');
      set({ businesses: response.businesses ?? [] });
      return response.businesses ?? [];
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unable to load businesses.',
      });
      return [];
    } finally {
      set({ isLoading: false });
    }
  },

  syncBusinessModules: async (businessId) => {
    set({ isSyncing: true, error: null });
    try {
      const response = await apiRequest<SyncBusinessModulesResponse>(`/admin/businesses/${businessId}/sync-modules`, {
        method: 'POST',
      });
      await useAdminBusinessesStore.getState().fetchBusinesses();
      return response;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unable to sync business modules.',
      });
      return null;
    } finally {
      set({ isSyncing: false });
    }
  },

  clearError: () => set({ error: null }),
}));

export function useAdminBusinesses() {
  return useAdminBusinessesStore();
}
