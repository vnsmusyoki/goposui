import { create } from 'zustand';
import { apiRequest, apiRequestWithoutSessionInvalidation } from '@/lib/api';

export type BrandRecord = {
  id: string;
  name: string;
  shortDescription: string;
  addedBy: string;
  addedAt: string;
  message?: string;
};

export type BrandInput = {
  name: string;
  shortDescription: string;
};

type BrandsResponse = {
  brands: BrandRecord[];
  message?: string;
};

type BrandResponse = BrandRecord;

type BrandDeleteResponse = {
  id: string;
  message?: string;
};

type BrandStore = {
  brands: BrandRecord[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  loadBrands: () => Promise<BrandRecord[]>;
  createBrand: (data: BrandInput) => Promise<BrandResponse>;
  updateBrand: (id: string, data: BrandInput) => Promise<BrandResponse>;
  deleteBrand: (id: string) => Promise<BrandDeleteResponse>;
  clearError: () => void;
};

const useBrandStore = create<BrandStore>((set, get) => ({
  brands: [],
  isLoading: false,
  isSaving: false,
  error: null,

  loadBrands: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiRequestWithoutSessionInvalidation<BrandsResponse>('/brands');
      set({ brands: response.brands ?? [] });
      return response.brands ?? [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load brands.';
      set({ error: message });
      return [];
    } finally {
      set({ isLoading: false });
    }
  },

  createBrand: async (data) => {
    set({ isSaving: true, error: null });
    try {
      const response = await apiRequest<BrandResponse>('/brands', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name,
          short_description: data.shortDescription,
        }),
      });

      set((state) => ({
        brands: [response, ...state.brands.filter((brand) => brand.id !== response.id)],
      }));

      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to create brand.';
      set({ error: message });
      throw err;
    } finally {
      set({ isSaving: false });
    }
  },

  updateBrand: async (id, data) => {
    set({ isSaving: true, error: null });
    try {
      const response = await apiRequest<BrandResponse>(`/brands/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: data.name,
          short_description: data.shortDescription,
        }),
      });

      set((state) => ({
        brands: state.brands.map((brand) => (brand.id === id ? response : brand)),
      }));

      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update brand.';
      set({ error: message });
      throw err;
    } finally {
      set({ isSaving: false });
    }
  },

  deleteBrand: async (id) => {
    set({ isSaving: true, error: null });
    try {
      const response = await apiRequest<BrandDeleteResponse>(`/brands/${id}`, {
        method: 'DELETE',
      });

      set((state) => ({
        brands: state.brands.filter((brand) => brand.id !== id),
      }));

      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to delete brand.';
      set({ error: message });
      throw err;
    } finally {
      set({ isSaving: false });
    }
  },

  clearError: () => set({ error: null }),
}));

export function useBusinessBrands() {
  return useBrandStore();
}
