import { create } from 'zustand';
import { apiRequest } from '@/lib/api';

export type BusinessUnitRecord = {
  id: string;
  businessId: string;
  name: string;
  shortName: string;
  allowDecimal: boolean;
  isMultipleOfOther: boolean;
  baseUnitId: string;
  conversionRate: number;
  createdByUserId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  message?: string;
};

export type BusinessUnitInput = {
  name: string;
  shortName: string;
  allowDecimal: boolean;
  isMultipleOfOther: boolean;
  baseUnitId: string;
  conversionRate: number;
};

type BusinessUnitsResponse = {
  units: BusinessUnitRecord[];
  message?: string;
};

type BusinessUnitResponse = BusinessUnitRecord & {
  message?: string;
};

type BusinessUnitDeleteResponse = {
  id: string;
  message?: string;
};

type BusinessUnitsStore = {
  units: BusinessUnitRecord[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  loadUnits: () => Promise<BusinessUnitRecord[]>;
  createUnit: (data: BusinessUnitInput) => Promise<BusinessUnitRecord>;
  updateUnit: (id: string, data: BusinessUnitInput) => Promise<BusinessUnitRecord>;
  deleteUnit: (id: string) => Promise<BusinessUnitDeleteResponse>;
  clearError: () => void;
};

function normalizeUnit(record: BusinessUnitRecord): BusinessUnitRecord {
  return {
    ...record,
    baseUnitId: record.baseUnitId ?? '',
    conversionRate: typeof record.conversionRate === 'number' ? record.conversionRate : 0,
    createdByUserId: record.createdByUserId ?? '',
    createdBy: record.createdBy ?? '',
    message: record.message,
  };
}

const useBusinessUnitsStore = create<BusinessUnitsStore>((set, get) => ({
  units: [],
  isLoading: false,
  isSaving: false,
  error: null,

  loadUnits: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiRequest<BusinessUnitsResponse>('/business/units');
      const nextUnits = (response.units ?? []).map(normalizeUnit);
      set({ units: nextUnits });
      return nextUnits;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load units.';
      set({ error: message });
      return [];
    } finally {
      set({ isLoading: false });
    }
  },

  createUnit: async (data) => {
    set({ isSaving: true, error: null });
    try {
      const response = await apiRequest<BusinessUnitResponse>('/business/units', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name,
          shortName: data.shortName,
          allowDecimal: data.allowDecimal,
          isMultipleOfOther: data.isMultipleOfOther,
          baseUnitId: data.baseUnitId,
          conversionRate: data.conversionRate,
        }),
      });

      const nextUnit = normalizeUnit(response);
      set((state) => ({
        units: [nextUnit, ...state.units.filter((unit) => unit.id !== nextUnit.id)],
      }));
      return nextUnit;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to save unit.';
      set({ error: message });
      throw err;
    } finally {
      set({ isSaving: false });
    }
  },

  updateUnit: async (id, data) => {
    set({ isSaving: true, error: null });
    try {
      const response = await apiRequest<BusinessUnitResponse>(`/business/units/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: data.name,
          shortName: data.shortName,
          allowDecimal: data.allowDecimal,
          isMultipleOfOther: data.isMultipleOfOther,
          baseUnitId: data.baseUnitId,
          conversionRate: data.conversionRate,
        }),
      });

      const nextUnit = normalizeUnit(response);
      set((state) => ({
        units: state.units.map((unit) => (unit.id === nextUnit.id ? nextUnit : unit)),
      }));
      return nextUnit;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update unit.';
      set({ error: message });
      throw err;
    } finally {
      set({ isSaving: false });
    }
  },

  deleteUnit: async (id) => {
    set({ isSaving: true, error: null });
    try {
      const response = await apiRequest<BusinessUnitDeleteResponse>(`/business/units/${id}`, {
        method: 'DELETE',
      });
      set((state) => ({
        units: state.units.filter((unit) => unit.id !== id),
      }));
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to delete unit.';
      set({ error: message });
      throw err;
    } finally {
      set({ isSaving: false });
    }
  },

  clearError: () => set({ error: null }),
}));

export function useBusinessUnits() {
  return useBusinessUnitsStore();
}
