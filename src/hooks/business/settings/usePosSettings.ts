import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

export type PosSettingsRecord = {
  id: string;
  disableMultiplePay: boolean;
  disableDraft: boolean;
  disableExpressCheckout: boolean;
  disableDiscount: boolean;
  disableOrderTax: boolean;
  disableCreditSaleButton: boolean;
  disableSuspendSale: boolean;
  subtotalEditable: boolean;
  hideProductSuggestion: boolean;
  showPricingOnProductSuggestionTooltip: boolean;
  hideRecentTransactions: boolean;
  enableTransactionDateOnPosScreen: boolean;
  enableWeighingScale: boolean;
  enableServiceStaffInProductLine: boolean;
  isServiceStaffRequired: boolean;
  invoiceScheme: 'default' | 'scheme_a' | 'scheme_b';
  invoiceLayout: 'default' | 'compact' | 'detailed';
  printInvoiceOnSuspend: boolean;
  message?: string;
};

export type UpdatePosSettingsInput = {
  disableMultiplePay: boolean;
  disableDraft: boolean;
  disableExpressCheckout: boolean;
  disableDiscount: boolean;
  disableOrderTax: boolean;
  disableCreditSaleButton: boolean;
  disableSuspendSale: boolean;
  subtotalEditable: boolean;
  hideProductSuggestion: boolean;
  showPricingOnProductSuggestionTooltip: boolean;
  hideRecentTransactions: boolean;
  enableTransactionDateOnPosScreen: boolean;
  enableWeighingScale: boolean;
  enableServiceStaffInProductLine: boolean;
  isServiceStaffRequired: boolean;
  invoiceScheme: 'default' | 'scheme_a' | 'scheme_b';
  invoiceLayout: 'default' | 'compact' | 'detailed';
  printInvoiceOnSuspend: boolean;
};

type PosSettingsApiResponse = {
  id: string;
  disableMultiplePay: boolean;
  disableDraft: boolean;
  disableExpressCheckout: boolean;
  disableDiscount: boolean;
  disableOrderTax: boolean;
  disableCreditSaleButton: boolean;
  disableSuspendSale: boolean;
  subtotalEditable: boolean;
  hideProductSuggestion: boolean;
  showPricingOnProductSuggestionTooltip: boolean;
  hideRecentTransactions: boolean;
  enableTransactionDateOnPosScreen: boolean;
  enableWeighingScale: boolean;
  enableServiceStaffInProductLine: boolean;
  isServiceStaffRequired: boolean;
  invoiceScheme: string;
  invoiceLayout: string;
  printInvoiceOnSuspend: boolean;
  message?: string;
};

type PosSettingsStore = {
  settings: PosSettingsRecord | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  loadPosSettings: () => Promise<PosSettingsRecord | null>;
  savePosSettings: (data: UpdatePosSettingsInput) => Promise<PosSettingsRecord>;
  clearError: () => void;
};

function normalizePosSettings(response: PosSettingsApiResponse): PosSettingsRecord {
  const invoiceScheme: PosSettingsRecord['invoiceScheme'] =
    response.invoiceScheme === 'scheme_a' || response.invoiceScheme === 'scheme_b'
      ? response.invoiceScheme
      : 'default';
  const invoiceLayout: PosSettingsRecord['invoiceLayout'] =
    response.invoiceLayout === 'compact' || response.invoiceLayout === 'detailed'
      ? response.invoiceLayout
      : 'default';

  return {
    id: response.id,
    disableMultiplePay: response.disableMultiplePay,
    disableDraft: response.disableDraft,
    disableExpressCheckout: response.disableExpressCheckout,
    disableDiscount: response.disableDiscount,
    disableOrderTax: response.disableOrderTax,
    disableCreditSaleButton: response.disableCreditSaleButton,
    disableSuspendSale: response.disableSuspendSale,
    subtotalEditable: response.subtotalEditable,
    hideProductSuggestion: response.hideProductSuggestion,
    showPricingOnProductSuggestionTooltip: response.showPricingOnProductSuggestionTooltip,
    hideRecentTransactions: response.hideRecentTransactions,
    enableTransactionDateOnPosScreen: response.enableTransactionDateOnPosScreen,
    enableWeighingScale: response.enableWeighingScale,
    enableServiceStaffInProductLine: response.enableServiceStaffInProductLine,
    isServiceStaffRequired: response.isServiceStaffRequired,
    invoiceScheme,
    invoiceLayout,
    printInvoiceOnSuspend: response.printInvoiceOnSuspend,
    message: response.message,
  };
}

export function usePosSettings() {
  const [settings, setSettings] = useState<PosSettingsRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPosSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest<PosSettingsApiResponse>('/business/settings/pos');
      const nextSettings = normalizePosSettings(response);
      setSettings(nextSettings);
      return nextSettings;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load POS settings.';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const savePosSettings = useCallback(async (data: UpdatePosSettingsInput) => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await apiRequest<PosSettingsApiResponse>('/business/settings/pos', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      const nextSettings = normalizePosSettings(response);
      setSettings(nextSettings);
      return nextSettings;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to save POS settings.';
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
    void loadPosSettings();
  }, [loadPosSettings]);

  return {
    settings,
    isLoading,
    isSaving,
    error,
    loadPosSettings,
    savePosSettings,
    clearError,
  } satisfies PosSettingsStore;
}
