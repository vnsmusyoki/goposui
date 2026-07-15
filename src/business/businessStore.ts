import { create } from 'zustand';
import { useMemo } from 'react';
import { apiRequest, apiRequestWithoutSessionInvalidation, ApiError } from '@/lib/api';

export type BusinessSettingsRecord = {
  id: string;
  name: string;
  startDate: string;
  defaultProfitPercentage: number | null;
  currency: string;
  currencySymbolPlacement: string;
  timezone: string;
  logoUrl: string;
  financialYearStartMonth: string;
  stockAccountingMethod: string;
  transactionEditDays: number | null;
  dateFormat: string;
  timeFormat: string;
  currencyPrecision: number | null;
  quantityPrecision: number | null;
  skuPrefix?: string;
  message?: string;
};

export type UpdateBusinessSettingsInput = {
  name: string;
  startDate: string;
  defaultProfitPercentage: number;
  currency: string;
  currencySymbolPlacement: string;
  timezone: string;
  logoUrl: string;
  financialYearStartMonth: string;
  stockAccountingMethod: string;
  transactionEditDays: number;
  dateFormat: string;
  timeFormat: string;
  currencyPrecision: number;
  quantityPrecision: number;
};

type BusinessSettingsApiResponse = {
  id: string;
  name: string;
  startDate: string;
  defaultProfitPercentage?: number | null;
  currency: string;
  currencySymbolPlacement: string;
  timezone: string;
  logoUrl: string;
  financialYearStartMonth: string;
  stockAccountingMethod: string;
  transactionEditDays?: number | null;
  dateFormat: string;
  timeFormat: string;
  currencyPrecision?: number | null;
  quantityPrecision?: number | null;
  message?: string;
};

type BusinessStore = {
  settings: BusinessSettingsRecord | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  loadBusinessSettings: (options?: { force?: boolean }) => Promise<BusinessSettingsRecord | null>;
  saveBusinessSettings: (data: UpdateBusinessSettingsInput) => Promise<BusinessSettingsRecord>;
  clearBusinessSettings: () => void;
  clearError: () => void;
};

function normalizeBusinessSettings(response: BusinessSettingsApiResponse): BusinessSettingsRecord {
  return {
    id: response.id,
    name: response.name,
    startDate: response.startDate,
    defaultProfitPercentage: typeof response.defaultProfitPercentage === 'number' ? response.defaultProfitPercentage : null,
    currency: response.currency,
    currencySymbolPlacement: response.currencySymbolPlacement,
    timezone: response.timezone,
    logoUrl: response.logoUrl ?? '',
    financialYearStartMonth: response.financialYearStartMonth,
    stockAccountingMethod: response.stockAccountingMethod,
    transactionEditDays: typeof response.transactionEditDays === 'number' ? response.transactionEditDays : null,
    dateFormat: response.dateFormat,
    timeFormat: response.timeFormat,
    currencyPrecision: typeof response.currencyPrecision === 'number' ? response.currencyPrecision : null,
    quantityPrecision: typeof response.quantityPrecision === 'number' ? response.quantityPrecision : null,
    message: response.message,
  };
}

function formatCurrencyFromSettings(amount: number, settings: BusinessSettingsRecord | null): string {
  const currency = settings?.currency || 'USD';
  const precision = typeof settings?.currencyPrecision === 'number' ? settings.currencyPrecision : 2;
  const placement = settings?.currencySymbolPlacement === 'after' ? 'after' : 'before';

  try {
    const parts = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    }).formatToParts(amount);

    const currencySymbol = parts.find((part) => part.type === 'currency')?.value ?? currency;
    const numeric = parts
      .filter((part) => part.type !== 'currency')
      .map((part) => part.value)
      .join('')
      .trim();

    return placement === 'after' ? `${numeric} ${currencySymbol}` : `${currencySymbol} ${numeric}`;
  } catch {
    const numeric = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    }).format(amount);

    return placement === 'after' ? `${numeric} ${currency}` : `${currency} ${numeric}`;
  }
}

export const useBusinessStore = create<BusinessStore>((set, get) => ({
  settings: null,
  isLoading: false,
  isSaving: false,
  error: null,
  clearBusinessSettings: () =>
    set({
      settings: null,
      isLoading: false,
      isSaving: false,
      error: null,
    }),
  clearError: () => set({ error: null }),
  loadBusinessSettings: async (options) => {
    const current = get();

    if (current.isLoading) {
      return current.settings;
    }

    if (current.settings && !options?.force) {
      return current.settings;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await apiRequestWithoutSessionInvalidation<BusinessSettingsApiResponse>('/business/settings');
      const nextSettings = normalizeBusinessSettings(response);
      set({
        settings: nextSettings,
        error: null,
      });
      return nextSettings;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        set({
          settings: null,
          error: null,
        });
        return null;
      }

      const message = err instanceof Error ? err.message : 'Unable to load business settings.';
      set({ error: message });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
  saveBusinessSettings: async (data) => {
    set({ isSaving: true, error: null });

    try {
      const response = await apiRequestWithoutSessionInvalidation<BusinessSettingsApiResponse>('/business/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      const nextSettings = normalizeBusinessSettings(response);
      set({ settings: nextSettings, error: null });
      return nextSettings;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to save business settings.';
      set({ error: message });
      throw err;
    } finally {
      set({ isSaving: false });
    }
  },
}));

export function useBusinessCurrency() {
  const currency = useBusinessStore((state) => state.settings?.currency ?? 'USD');
  const precision = useBusinessStore((state) => state.settings?.currencyPrecision ?? 2);
  const symbolPlacement = useBusinessStore((state) => state.settings?.currencySymbolPlacement ?? 'before');
  const settings = useBusinessStore((state) => state.settings);

  return useMemo(
    () => ({
      currency,
      precision,
      symbolPlacement,
      formatCurrency: (amount: number) => formatCurrencyFromSettings(amount, settings),
    }),
    [currency, precision, symbolPlacement, settings],
  );
}

if (typeof window !== 'undefined') {
  window.addEventListener('pos:session-invalidated', () => {
    useBusinessStore.getState().clearBusinessSettings();
  });
}
