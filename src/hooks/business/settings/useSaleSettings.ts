import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

export type SaleSettingsRecord = {
  id: string;
  defaultSaleDiscount: number;
  defaultSaleTax: number;
  saleItemAdditionMethod: 'new_row' | 'increase_quantity';
  enableSaleOrder: boolean;
  isPayTermRequired: boolean;
  salePriceIsMinimumSellingPrice: boolean;
  enableSaleCommissionAgent: boolean;
  commissionCalculationType: 'percentage' | 'fixed_amount';
  isCommissionAgentRequired: boolean;
  message?: string;
};

export type UpdateSaleSettingsInput = {
  defaultSaleDiscount: number;
  defaultSaleTax: number;
  saleItemAdditionMethod: 'new_row' | 'increase_quantity';
  enableSaleOrder: boolean;
  isPayTermRequired: boolean;
  salePriceIsMinimumSellingPrice: boolean;
  enableSaleCommissionAgent: boolean;
  commissionCalculationType: 'percentage' | 'fixed_amount';
  isCommissionAgentRequired: boolean;
};

type SaleSettingsApiResponse = {
  id: string;
  defaultSaleDiscount: number;
  defaultSaleTax: number;
  saleItemAdditionMethod: 'new_row' | 'increase_quantity';
  enableSaleOrder: boolean;
  isPayTermRequired: boolean;
  salePriceIsMinimumSellingPrice: boolean;
  enableSaleCommissionAgent: boolean;
  commissionCalculationType: 'percentage' | 'fixed_amount';
  isCommissionAgentRequired: boolean;
  message?: string;
};

type SaleSettingsStore = {
  settings: SaleSettingsRecord | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  loadSaleSettings: () => Promise<SaleSettingsRecord | null>;
  saveSaleSettings: (data: UpdateSaleSettingsInput) => Promise<SaleSettingsRecord>;
  clearError: () => void;
};

function normalizeSaleSettings(response: SaleSettingsApiResponse): SaleSettingsRecord {
  return {
    id: response.id,
    defaultSaleDiscount: typeof response.defaultSaleDiscount === 'number' ? response.defaultSaleDiscount : 0,
    defaultSaleTax: typeof response.defaultSaleTax === 'number' ? response.defaultSaleTax : 0,
    saleItemAdditionMethod:
      response.saleItemAdditionMethod === 'increase_quantity' ? 'increase_quantity' : 'new_row',
    enableSaleOrder: response.enableSaleOrder,
    isPayTermRequired: response.isPayTermRequired,
    salePriceIsMinimumSellingPrice: response.salePriceIsMinimumSellingPrice,
    enableSaleCommissionAgent: response.enableSaleCommissionAgent,
    commissionCalculationType: response.commissionCalculationType === 'fixed_amount' ? 'fixed_amount' : 'percentage',
    isCommissionAgentRequired: response.isCommissionAgentRequired,
    message: response.message,
  };
}

export function useSaleSettings() {
  const [settings, setSettings] = useState<SaleSettingsRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSaleSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest<SaleSettingsApiResponse>('/business/settings/sale');
      const nextSettings = normalizeSaleSettings(response);
      setSettings(nextSettings);
      return nextSettings;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load sale settings.';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveSaleSettings = useCallback(async (data: UpdateSaleSettingsInput) => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await apiRequest<SaleSettingsApiResponse>('/business/settings/sale', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      const nextSettings = normalizeSaleSettings(response);
      setSettings(nextSettings);
      return nextSettings;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to save sale settings.';
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
    void loadSaleSettings();
  }, [loadSaleSettings]);

  return {
    settings,
    isLoading,
    isSaving,
    error,
    loadSaleSettings,
    saveSaleSettings,
    clearError,
  } satisfies SaleSettingsStore;
}
