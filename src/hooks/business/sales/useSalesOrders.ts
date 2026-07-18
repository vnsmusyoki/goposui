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

type SaleOrderResponse = {
  sale?: {
    id: string;
    referenceNumber: string;
    status: SaleOrderStatus;
  };
  message?: string;
};

type SaleOrdersStore = {
  loading: boolean;
  error: string | null;
  createSaleOrder: (data: CreateSaleOrderInput) => Promise<SaleOrderResponse>;
  clearError: () => void;
};

export function useSalesOrders() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

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

  return {
    loading,
    error,
    createSaleOrder,
    clearError,
  };
}
