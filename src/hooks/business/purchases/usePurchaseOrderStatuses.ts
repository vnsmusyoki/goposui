import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

export type PurchaseOrderStatusDefinition = {
  code: string;
  name: string;
  whatHappens: string;
  editableNote: string;
  stockAffectedNote: string;
  prepareInvoice: boolean;
  sortOrder: number;
};

type PurchaseOrderStatusesResponse = {
  statuses?: PurchaseOrderStatusDefinition[];
  message?: string;
};

export function usePurchaseOrderStatuses() {
  const [statuses, setStatuses] = useState<PurchaseOrderStatusDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPurchaseOrderStatuses = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest<PurchaseOrderStatusesResponse>('/purchases/order-statuses');
      const nextStatuses = (response.statuses ?? []).slice().sort((left, right) => left.sortOrder - right.sortOrder);
      setStatuses(nextStatuses);
      return nextStatuses;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load purchase order statuses.';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPurchaseOrderStatuses();
  }, [fetchPurchaseOrderStatuses]);

  return {
    statuses,
    loading,
    error,
    fetchPurchaseOrderStatuses,
  };
}
