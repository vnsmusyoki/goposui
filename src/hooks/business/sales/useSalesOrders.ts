import { useCallback, useState } from 'react';
import { ApiError, apiRequest } from '@/lib/api';

export type SaleOrderStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'processing'
  | 'ready_for_shipment'
  | 'completed';

export type CreateSaleOrderItemInput = {
  product_id: string;
  quantity: number;
  unit_cost: number;
  discount_percentage: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  unit_price: number;
  line_total: number;
  batch_tracking_enabled: boolean;
  sort_order: number;
};

export type CreateSaleOrderInput = {
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  reference_number: string;
  sale_date: string;
  location_id: string;
  notes: string;
  status: SaleOrderStatus;
  subtotal: number;
  total_discount: number;
  total_tax: number;
  grand_total: number;
  reserve_order_items: boolean;
  items_count: number;
  total_quantity: number;
  items: CreateSaleOrderItemInput[];
};

export type SalesOrderListItem = {
  id: string;
  businessId: string;
  locationId: string;
  customerId: string;
  locationName: string;
  referenceNumber: string;
  saleDate: string;
  customerName: string;
  customerPhone: string;
  status: SaleOrderStatus;
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

type SaleOrderResponse = {
  sale?: {
    id: string;
    referenceNumber: string;
    status: SaleOrderStatus;
  };
  message?: string;
};

type SalesOrdersResponse = {
  salesOrders: SalesOrderListItem[];
  message?: string;
};

type UpdateSalesOrderStatusInput = {
  status: SaleOrderStatus;
  reserve_order_items: boolean;
};

type SaleOrdersStore = {
  salesOrders: SalesOrderListItem[];
  loading: boolean;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  loadSalesOrders: (filters?: Record<string, string | undefined>) => Promise<SalesOrderListItem[]>;
  createSaleOrder: (data: CreateSaleOrderInput) => Promise<SaleOrderResponse>;
  updateSaleOrderStatus: (id: string, data: UpdateSalesOrderStatusInput) => Promise<SaleOrderResponse>;
  clearError: () => void;
};

export function useSalesOrders() {
  const [salesOrders, setSalesOrders] = useState<SalesOrderListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const loadSalesOrders = useCallback(async (filters: Record<string, string | undefined> = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.trim()) {
          params.set(key, value.trim());
        }
      });
      const response = await apiRequest<SalesOrdersResponse>(`/sales/orders${params.toString() ? `?${params.toString()}` : ''}`);
      const nextOrders = response.salesOrders ?? [];
      setSalesOrders(nextOrders);
      return nextOrders;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load sales orders.';
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createSaleOrder = useCallback(async (data: CreateSaleOrderInput) => {
    setLoading(true);
    setError(null);

    try {
      return await apiRequest<SaleOrderResponse>('/sales/orders', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to create sale order.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSaleOrderStatus = useCallback(async (id: string, data: UpdateSalesOrderStatusInput) => {
    setIsSaving(true);
    setError(null);

    try {
      return await apiRequest<SaleOrderResponse>(`/sales/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update sale order status.';
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
    updateSaleOrderStatus,
    clearError,
  };
}
