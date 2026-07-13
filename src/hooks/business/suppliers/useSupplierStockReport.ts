import { useCallback, useState } from 'react';
import { ApiError, apiRequest } from '@/lib/api';
import type { SupplierProfileStockReportItem } from '@/pages/business/contacts/suppliers/supplierProfileTypes';

type SupplierStockReportResponse = {
  items: SupplierProfileStockReportItem[];
};

export function useSupplierStockReport() {
  const [items, setItems] = useState<SupplierProfileStockReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSupplierStockReport = useCallback(async (supplierId: string) => {
    const trimmedSupplierId = supplierId.trim();
    if (!trimmedSupplierId) {
      setItems([]);
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest<SupplierStockReportResponse>(`/business/suppliers/${trimmedSupplierId}/stock-report`);
      const nextItems = response.items ?? [];
      setItems(nextItems);
      return nextItems;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Unable to load supplier stock report.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    items,
    isLoading,
    error,
    clearError,
    fetchSupplierStockReport,
  };
}
