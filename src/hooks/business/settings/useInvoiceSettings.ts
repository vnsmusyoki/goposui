import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import type { InvoiceLayoutForm } from '@/pages/business/settings/invoice/InvoiceLayoutEditor';

export type InvoiceLayoutRecord = InvoiceLayoutForm & {
  id: string;
  businessId: string;
  createdAt: string;
  updatedAt: string;
  message?: string;
};

type InvoiceLayoutApiRecord = InvoiceLayoutRecord;

type InvoiceLayoutListResponse = {
  layouts: InvoiceLayoutApiRecord[];
  message?: string;
};

type InvoiceLayoutResponse = InvoiceLayoutApiRecord;

type InvoiceSettingsStore = {
  layouts: InvoiceLayoutRecord[];
  selectedLayout: InvoiceLayoutRecord | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  loadInvoiceLayouts: () => Promise<InvoiceLayoutRecord[]>;
  loadInvoiceLayout: (id: string) => Promise<InvoiceLayoutRecord | null>;
  createInvoiceLayout: (data: InvoiceLayoutForm) => Promise<InvoiceLayoutRecord>;
  updateInvoiceLayout: (id: string, data: InvoiceLayoutForm) => Promise<InvoiceLayoutRecord>;
  clearError: () => void;
};

function normalizeInvoiceLayout(response: InvoiceLayoutApiRecord): InvoiceLayoutRecord {
  return {
    ...response,
    logoUrl: response.logoUrl ?? '',
    message: response.message,
  };
}

export function useInvoiceSettings() {
  const [layouts, setLayouts] = useState<InvoiceLayoutRecord[]>([]);
  const [selectedLayout, setSelectedLayout] = useState<InvoiceLayoutRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInvoiceLayouts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest<InvoiceLayoutListResponse>('/business/settings/invoice');
      const nextLayouts = (response.layouts ?? []).map(normalizeInvoiceLayout);
      setLayouts(nextLayouts);
      return nextLayouts;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load invoice layouts.';
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadInvoiceLayout = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest<InvoiceLayoutResponse>(`/business/settings/invoice/${id}`);
      const nextLayout = normalizeInvoiceLayout(response);
      setSelectedLayout(nextLayout);
      return nextLayout;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load invoice layout.';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createInvoiceLayout = useCallback(async (data: InvoiceLayoutForm) => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await apiRequest<InvoiceLayoutResponse>('/business/settings/invoice', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      const nextLayout = normalizeInvoiceLayout(response);
      setLayouts((current) => [nextLayout, ...current.filter((layout) => layout.id !== nextLayout.id)]);
      setSelectedLayout(nextLayout);
      return nextLayout;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to save invoice layout.';
      setError(message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const updateInvoiceLayout = useCallback(async (id: string, data: InvoiceLayoutForm) => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await apiRequest<InvoiceLayoutResponse>(`/business/settings/invoice/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      const nextLayout = normalizeInvoiceLayout(response);
      setLayouts((current) => [nextLayout, ...current.filter((layout) => layout.id !== nextLayout.id)]);
      setSelectedLayout(nextLayout);
      return nextLayout;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update invoice layout.';
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
    void loadInvoiceLayouts();
  }, [loadInvoiceLayouts]);

  return {
    layouts,
    selectedLayout,
    isLoading,
    isSaving,
    error,
    loadInvoiceLayouts,
    loadInvoiceLayout,
    createInvoiceLayout,
    updateInvoiceLayout,
    clearError,
  } satisfies InvoiceSettingsStore;
}
