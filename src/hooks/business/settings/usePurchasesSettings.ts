import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

export type PurchasesSettingsRecord = {
  id: string;
  enableEditingProductPriceFromPurchaseScreen: boolean;
  enablePurchaseStatus: boolean;
  enableLotNumber: boolean;
  enablePurchaseOrder: boolean;
  message?: string;
};

export type UpdatePurchasesSettingsInput = {
  enableEditingProductPriceFromPurchaseScreen: boolean;
  enablePurchaseStatus: boolean;
  enableLotNumber: boolean;
  enablePurchaseOrder: boolean;
};

type PurchasesSettingsApiResponse = {
  id: string;
  enableEditingProductPriceFromPurchaseScreen: boolean;
  enablePurchaseStatus: boolean;
  enableLotNumber: boolean;
  enablePurchaseOrder: boolean;
  message?: string;
};

type PurchasesSettingsStore = {
  settings: PurchasesSettingsRecord | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  loadPurchasesSettings: () => Promise<PurchasesSettingsRecord | null>;
  savePurchasesSettings: (data: UpdatePurchasesSettingsInput) => Promise<PurchasesSettingsRecord>;
  clearError: () => void;
};

function normalizePurchasesSettings(response: PurchasesSettingsApiResponse): PurchasesSettingsRecord {
  return {
    id: response.id,
    enableEditingProductPriceFromPurchaseScreen: response.enableEditingProductPriceFromPurchaseScreen,
    enablePurchaseStatus: response.enablePurchaseStatus,
    enableLotNumber: response.enableLotNumber,
    enablePurchaseOrder: response.enablePurchaseOrder,
    message: response.message,
  };
}

export function usePurchasesSettings() {
  const [settings, setSettings] = useState<PurchasesSettingsRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPurchasesSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest<PurchasesSettingsApiResponse>('/business/settings/purchases');
      const nextSettings = normalizePurchasesSettings(response);
      setSettings(nextSettings);
      return nextSettings;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load purchases settings.';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const savePurchasesSettings = useCallback(async (data: UpdatePurchasesSettingsInput) => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await apiRequest<PurchasesSettingsApiResponse>('/business/settings/purchases', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      const nextSettings = normalizePurchasesSettings(response);
      setSettings(nextSettings);
      return nextSettings;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to save purchases settings.';
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
    void loadPurchasesSettings();
  }, [loadPurchasesSettings]);

  return {
    settings,
    isLoading,
    isSaving,
    error,
    loadPurchasesSettings,
    savePurchasesSettings,
    clearError,
  } satisfies PurchasesSettingsStore;
}
