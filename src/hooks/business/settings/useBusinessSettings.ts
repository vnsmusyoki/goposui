import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

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

type BusinessSettingsStore = {
  settings: BusinessSettingsRecord | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  loadBusinessSettings: () => Promise<BusinessSettingsRecord | null>;
  saveBusinessSettings: (data: UpdateBusinessSettingsInput) => Promise<BusinessSettingsRecord>;
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

export function useBusinessSettings() {
  const [settings, setSettings] = useState<BusinessSettingsRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBusinessSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest<BusinessSettingsApiResponse>('/business/settings');
      const nextSettings = normalizeBusinessSettings(response);
      setSettings(nextSettings);
      return nextSettings;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load business settings.';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveBusinessSettings = useCallback(async (data: UpdateBusinessSettingsInput) => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await apiRequest<BusinessSettingsApiResponse>('/business/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      const nextSettings = normalizeBusinessSettings(response);
      setSettings(nextSettings);
      return nextSettings;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to save business settings.';
      setError(message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    void loadBusinessSettings();
  }, [loadBusinessSettings]);

  return {
    settings,
    isLoading,
    isSaving,
    error,
    loadBusinessSettings,
    saveBusinessSettings,
    clearError,
  } satisfies BusinessSettingsStore;
}
