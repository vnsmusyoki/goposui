import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

export type SalesOrderStatusDefinition = {
  code: string;
  name: string;
  whatHappens: string;
  requiresFurtherAction: boolean;
  sortOrder: number;
};

type SalesOrderStatusesResponse = {
  statuses?: SalesOrderStatusDefinition[];
  message?: string;
};

export function useSalesOrderStatuses() {
  const [statuses, setStatuses] = useState<SalesOrderStatusDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSalesOrderStatuses = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest<SalesOrderStatusesResponse>('/sales/order-statuses');
      const nextStatuses = (response.statuses ?? []).slice().sort((left, right) => left.sortOrder - right.sortOrder);
      setStatuses(nextStatuses);
      return nextStatuses;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load sales order statuses.';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSalesOrderStatuses();
  }, [fetchSalesOrderStatuses]);

  return {
    statuses,
    loading,
    error,
    fetchSalesOrderStatuses,
  };
}
