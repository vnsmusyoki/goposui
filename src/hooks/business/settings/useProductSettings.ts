import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

export type ProductSettingsRecord = {
  id: string;
  skuPrefix: string;
  enableProductExpiry: boolean;
  expiryTrackingMethod: string;
  expirySellingBehavior: string;
  stopSellingDaysBefore: number | null;
  enableBrands: boolean;
  enableCategories: boolean;
  enableSubCategories: boolean;
  enablePriceTaxInfo: boolean;
  defaultUnit: string;
  enableSubUnits: boolean;
  enableSecondaryUnit: boolean;
  enableRacks: boolean;
  enableRow: boolean;
  enablePosition: boolean;
  enableWarranty: boolean;
  message?: string;
};

export type UpdateProductSettingsInput = {
  skuPrefix: string;
  enableProductExpiry: boolean;
  expiryTrackingMethod: string;
  expirySellingBehavior: string;
  stopSellingDaysBefore: number | null;
  enableBrands: boolean;
  enableCategories: boolean;
  enableSubCategories: boolean;
  enablePriceTaxInfo: boolean;
  defaultUnit: string;
  enableSubUnits: boolean;
  enableSecondaryUnit: boolean;
  enableRacks: boolean;
  enableRow: boolean;
  enablePosition: boolean;
  enableWarranty: boolean;
};

type ProductSettingsApiResponse = {
  id: string;
  skuPrefix: string;
  enableProductExpiry: boolean;
  expiryTrackingMethod: string;
  expirySellingBehavior: string;
  stopSellingDaysBefore?: number | null;
  enableBrands: boolean;
  enableCategories: boolean;
  enableSubCategories: boolean;
  enablePriceTaxInfo: boolean;
  defaultUnit: string;
  enableSubUnits: boolean;
  enableSecondaryUnit: boolean;
  enableRacks: boolean;
  enableRow: boolean;
  enablePosition: boolean;
  enableWarranty: boolean;
  message?: string;
};

type ProductSettingsStore = {
  settings: ProductSettingsRecord | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  loadProductSettings: () => Promise<ProductSettingsRecord | null>;
  saveProductSettings: (data: UpdateProductSettingsInput) => Promise<ProductSettingsRecord>;
  clearError: () => void;
};

function normalizeProductSettings(response: ProductSettingsApiResponse): ProductSettingsRecord {
  return {
    id: response.id,
    skuPrefix: response.skuPrefix,
    enableProductExpiry: response.enableProductExpiry,
    expiryTrackingMethod: response.expiryTrackingMethod,
    expirySellingBehavior: response.expirySellingBehavior,
    stopSellingDaysBefore: typeof response.stopSellingDaysBefore === 'number' ? response.stopSellingDaysBefore : null,
    enableBrands: response.enableBrands,
    enableCategories: response.enableCategories,
    enableSubCategories: response.enableSubCategories,
    enablePriceTaxInfo: response.enablePriceTaxInfo,
    defaultUnit: response.defaultUnit,
    enableSubUnits: response.enableSubUnits,
    enableSecondaryUnit: response.enableSecondaryUnit,
    enableRacks: response.enableRacks,
    enableRow: response.enableRow,
    enablePosition: response.enablePosition,
    enableWarranty: response.enableWarranty,
    message: response.message,
  };
}

export function useProductSettings() {
  const [settings, setSettings] = useState<ProductSettingsRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProductSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest<ProductSettingsApiResponse>('/business/settings/product');
      const nextSettings = normalizeProductSettings(response);
      setSettings(nextSettings);
      return nextSettings;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load product settings.';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveProductSettings = useCallback(async (data: UpdateProductSettingsInput) => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await apiRequest<ProductSettingsApiResponse>('/business/settings/product', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      const nextSettings = normalizeProductSettings(response);
      setSettings(nextSettings);
      return nextSettings;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to save product settings.';
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
    void loadProductSettings();
  }, [loadProductSettings]);

  return {
    settings,
    isLoading,
    isSaving,
    error,
    loadProductSettings,
    saveProductSettings,
    clearError,
  } satisfies ProductSettingsStore;
}
