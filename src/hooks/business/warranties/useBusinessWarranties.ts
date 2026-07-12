import { create } from 'zustand';
import { apiRequest } from '@/lib/api';

export type WarrantyRecord = {
  id: string;
  name: string;
  description: string;
  durationValue: number;
  durationUnit: 'days' | 'months';
  addedBy: string;
  addedAt: string;
  message?: string;
};

export type WarrantyInput = {
  name: string;
  description: string;
  durationValue: number;
  durationUnit: 'days' | 'months';
};

type WarrantiesResponse = {
  warranties: WarrantyRecord[];
  message?: string;
};

type WarrantyResponse = WarrantyRecord;

type WarrantyDeleteResponse = {
  id: string;
  message?: string;
};

type WarrantyStore = {
  warranties: WarrantyRecord[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  loadWarranties: () => Promise<WarrantyRecord[]>;
  createWarranty: (data: WarrantyInput) => Promise<WarrantyResponse>;
  updateWarranty: (id: string, data: WarrantyInput) => Promise<WarrantyResponse>;
  deleteWarranty: (id: string) => Promise<WarrantyDeleteResponse>;
  clearError: () => void;
};

const useWarrantyStore = create<WarrantyStore>((set) => ({
  warranties: [],
  isLoading: false,
  isSaving: false,
  error: null,

  loadWarranties: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiRequest<WarrantiesResponse>('/warranties');
      set({ warranties: response.warranties ?? [] });
      return response.warranties ?? [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load warranties.';
      set({ error: message });
      return [];
    } finally {
      set({ isLoading: false });
    }
  },

  createWarranty: async (data) => {
    set({ isSaving: true, error: null });
    try {
      const response = await apiRequest<WarrantyResponse>('/warranties', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          duration_value: data.durationValue,
          duration_unit: data.durationUnit,
        }),
      });

      set((state) => ({
        warranties: [response, ...state.warranties.filter((warranty) => warranty.id !== response.id)],
      }));

      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to create warranty.';
      set({ error: message });
      throw err;
    } finally {
      set({ isSaving: false });
    }
  },

  updateWarranty: async (id, data) => {
    set({ isSaving: true, error: null });
    try {
      const response = await apiRequest<WarrantyResponse>(`/warranties/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          duration_value: data.durationValue,
          duration_unit: data.durationUnit,
        }),
      });

      set((state) => ({
        warranties: state.warranties.map((warranty) => (warranty.id === id ? response : warranty)),
      }));

      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update warranty.';
      set({ error: message });
      throw err;
    } finally {
      set({ isSaving: false });
    }
  },

  deleteWarranty: async (id) => {
    set({ isSaving: true, error: null });
    try {
      const response = await apiRequest<WarrantyDeleteResponse>(`/warranties/${id}`, {
        method: 'DELETE',
      });

      set((state) => ({
        warranties: state.warranties.filter((warranty) => warranty.id !== id),
      }));

      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to delete warranty.';
      set({ error: message });
      throw err;
    } finally {
      set({ isSaving: false });
    }
  },

  clearError: () => set({ error: null }),
}));

export function useBusinessWarranties() {
  return useWarrantyStore();
}
