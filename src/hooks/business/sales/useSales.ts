import { useCallback, useState } from "react";
import { apiRequest } from "@/lib/api";

export type SaleListItem = {
  id: string;
  businessId: string;
  locationId: string;
  customerId: string;
  locationName: string;
  referenceNumber: string;
  saleDate: string;
  customerName: string;
  customerPhone: string;
  status: string;
  shippingStatus: string;
  itemsCount: number;
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
  saleId: string;
  convertedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type SaleOrderStatus = string;
export type SalesOrderListItem = SaleListItem;

type SalesResponse = {
  salesOrders: SaleListItem[];
  message?: string;
};

type SaleActionResponse = {
  sale?: {
    id: string;
    referenceNumber: string;
    status: string;
  };
  message?: string;
};

type SaleStore = {
  salesOrders: SaleListItem[];
  loading: boolean;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  loadSalesOrders: (
    filters?: Record<string, string | undefined>,
  ) => Promise<SaleListItem[]>;
  createSaleOrder: (
    data: Record<string, unknown>,
  ) => Promise<SaleActionResponse>;
  updateSaleOrder: (
    id: string,
    data: Record<string, unknown>,
  ) => Promise<SaleActionResponse>;
  updateSaleOrderStatus: (
    id: string,
    data: Record<string, unknown>,
  ) => Promise<SaleActionResponse>;
  deleteSaleOrder: (id: string) => Promise<{ message?: string }>;
  clearError: () => void;
};

export function useSales() {
  const [salesOrders, setSalesOrders] = useState<SaleListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const loadSalesOrders = useCallback(
    async (filters: Record<string, string | undefined> = {}) => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value && value.trim()) {
            params.set(key, value.trim());
          }
        });
        const response = await apiRequest<SalesResponse>(
          `/sales${params.toString() ? `?${params.toString()}` : ""}`,
        );
        const nextOrders = response.salesOrders ?? [];
        setSalesOrders(nextOrders);
        return nextOrders;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to load sales.";
        setError(message);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const createSaleOrder = useCallback(async (data: Record<string, unknown>) => {
    setLoading(true);
    setError(null);

    try {
      return await apiRequest<SaleActionResponse>("/sales/orders", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to create sale.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSaleOrder = useCallback(
    async (id: string, data: Record<string, unknown>) => {
      setLoading(true);
      setError(null);

      try {
        return await apiRequest<SaleActionResponse>(`/sales/orders/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to update sale.";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const updateSaleOrderStatus = useCallback(
    async (id: string, data: Record<string, unknown>) => {
      setIsSaving(true);
      setError(null);

      try {
        return await apiRequest<SaleActionResponse>(
          `/sales/orders/${id}/status`,
          {
            method: "PATCH",
            body: JSON.stringify(data),
          },
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to update sale status.";
        setError(message);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [],
  );

  const deleteSaleOrder = useCallback(async (id: string) => {
    setIsSaving(true);
    setError(null);

    try {
      return await apiRequest<{ message?: string }>(`/sales/orders/${id}`, {
        method: "DELETE",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to delete sale.";
      setError(message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  return {
    salesOrders,
    loading,
    isLoading,
    isSaving,
    error,
    loadSalesOrders,
    createSaleOrder,
    updateSaleOrder,
    updateSaleOrderStatus,
    deleteSaleOrder,
    clearError,
  } satisfies SaleStore;
}

export { useSales as useSalesOrders };
