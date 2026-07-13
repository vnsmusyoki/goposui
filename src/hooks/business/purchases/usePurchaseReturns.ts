import { useCallback, useEffect, useState } from 'react';
import { ApiError, apiRequest } from '@/lib/api';

export type ReturnableStockItem = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  supplierId: string;
  supplierName: string;
  locationId: string;
  locationName: string;
  lotNumber: string;
  expiryDate: string | null;
  suppliedBySupplier: number;
  soldAlreadyForSupplier: number;
  availableQuantity: number;
  unitPrice: number;
  unitCostBeforeTax?: number;
  currentStock?: number;
  batchNumber?: string;
  manufactureDate?: string | null;
};

export type ReturnableStockBatch = {
  productId: string;
  productName: string;
  sku: string;
  supplierId: string;
  supplierName: string;
  locationId: string;
  locationName: string;
  lotNumber: string;
  batchNumber?: string;
  expiryDate: string | null;
  suppliedBySupplier: number;
  soldAlreadyForSupplier: number;
  availableQuantity: number;
  unitPrice: number;
  unitCostBeforeTax?: number;
  currentStock?: number;
  receivedAt?: string;
  sourceReference?: string;
  sourceId?: string;
};

export type ReturnableStockGroup = {
  groupKey: string;
  productId: string;
  productName: string;
  sku: string;
  supplierId: string;
  supplierName: string;
  locationName: string;
  suppliedBySupplier: number;
  soldAlreadyForSupplier: number;
  availableQuantity: number;
  unitPrice: number;
};

export type CreatePurchaseReturnInput = {
  locationId: string;
  supplierId?: string;
  reason?: string;
  note?: string;
  items: Array<{
    productId: string;
    batchId: string;
    quantity: number;
    unitPrice: number;
  }>;
};

type ReturnableStockResponse = {
  items?: ReturnableStockGroup[];
  data?: ReturnableStockGroup[];
  message?: string;
};

type CreatePurchaseReturnResponse = {
  id?: string;
  message?: string;
};

function normalizeReturnableStockGroup(group: ReturnableStockGroup): ReturnableStockGroup {
  return {
    ...group,
    availableQuantity: Number(group.availableQuantity ?? 0),
    suppliedBySupplier: Number(group.suppliedBySupplier ?? 0),
    soldAlreadyForSupplier: Number(group.soldAlreadyForSupplier ?? 0),
    unitPrice: Number(group.unitPrice ?? 0),
  };
}

function shouldSearchReturnableStock(query: string) {
  const trimmed = query.trim();
  if (trimmed.length >= 3) {
    return true;
  }

  return trimmed.length >= 2 && /^[A-Za-z0-9._-]+$/.test(trimmed) && (/^[A-Z0-9._-]+$/.test(trimmed) || /\d/.test(trimmed));
}

export function usePurchaseReturns() {
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchReturnableStock = useCallback(async (filters: { query: string; locationId?: string; supplierId?: string }) => {
    const query = filters.query.trim();
    if (!shouldSearchReturnableStock(query)) {
      return [];
    }

    const params = new URLSearchParams();
    params.set('query', query);
    if (filters.locationId) params.set('locationId', filters.locationId);
    if (filters.supplierId) params.set('supplierId', filters.supplierId);

    try {
      const response = await apiRequest<ReturnableStockResponse>(`/purchases/returns/search?${params.toString()}`);
      return (response.items ?? response.data ?? []).map(normalizeReturnableStockGroup);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to search returnable stock.';
      setError(message);
      throw err;
    }
  }, []);

  const createPurchaseReturn = useCallback(async (payload: CreatePurchaseReturnInput) => {
    setSubmitting(true);
    setError(null);

    try {
      return await apiRequest<CreatePurchaseReturnResponse>('/purchases/returns', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create purchase return.';
      setError(message);
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      setError(null);
    };
  }, []);

  return {
    searchReturnableStock,
    createPurchaseReturn,
    submitting,
    loading,
    error,
  };
}
