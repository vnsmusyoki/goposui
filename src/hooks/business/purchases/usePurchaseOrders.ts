import { useCallback, useEffect, useState } from 'react';
import { ApiError, apiRequest } from '@/lib/api';

export type PurchaseOrderStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'ordered'
  | 'received'
  | 'partially_received'
  | 'cancelled'
  | 'completed';

export type DeliveryStatus = 'pending_delivery' | 'in_transit' | 'delivered';

export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid';

export type PurchaseOrder = {
  id: string;
  orderDate: string;
  referenceNumber: string;
  locationId: string;
  locationName: string;
  supplierId: string;
  supplierName: string;
  status: PurchaseOrderStatus;
  deliveryStatus: DeliveryStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  itemsCount: number;
  createdBy?: {
    id?: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt?: string;
};

type PurchaseOrdersResponse = {
  purchaseOrders?: PurchaseOrder[];
  orders?: PurchaseOrder[];
  data?: PurchaseOrder[];
  message?: string;
};

type PurchaseOrderResponse = PurchaseOrder & {
  message?: string;
};

type CreatePurchaseOrderInput = {
  supplierId: string;
  referenceNumber: string;
  orderDate: string;
  deliveryDate: string;
  locationId: string;
  paymentTerm: {
    value: number;
    unit: 'days' | 'months' | 'years';
  };
  attachment: File | null;
  notes: string;
  status: PurchaseOrderStatus;
  items: Array<{
    productId: string;
    orderQuantity: number;
    unitCostBeforeDiscount: number;
    discountPercentage: number;
    discountAmount: number;
    unitCostBeforeTax: number;
    productTaxRate: number;
    taxAmount: number;
    netCost: number;
    sellingPrice: number;
    lineCost: number;
    expiryDate: string;
    lotNumber: string;
  }>;
  totals: {
    subtotal: number;
    totalDiscount: number;
    totalTax: number;
    total: number;
    itemCount: number;
    totalQuantity: number;
  };
};

function normalizePurchaseOrder(order: PurchaseOrder): PurchaseOrder {
  return {
    ...order,
    totalAmount: Number(order.totalAmount ?? 0),
    itemsCount: Number(order.itemsCount ?? 0),
    createdBy: order.createdBy ?? null,
  };
}

export function usePurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPurchaseOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest<PurchaseOrdersResponse>('/purchases/orders');
      const nextPurchaseOrders = (response.purchaseOrders ?? response.orders ?? response.data ?? []).map(normalizePurchaseOrder);
      setPurchaseOrders(nextPurchaseOrders);
      return nextPurchaseOrders;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load purchase orders.';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePurchaseOrder = useCallback(async (id: string) => {
    if (!id) {
      throw new ApiError('Purchase order ID is required.', 400, { message: 'Purchase order ID is required.' });
    }

    try {
      const response = await apiRequest<PurchaseOrderResponse>(`/purchases/orders/${id}`, {
        method: 'DELETE',
      });

      setPurchaseOrders((current) => current.filter((order) => order.id !== id));
      return normalizePurchaseOrder(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to delete purchase order.';
      setError(message);
      throw err;
    }
  }, []);

  const createPurchaseOrder = useCallback(async (data: CreatePurchaseOrderInput) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest<PurchaseOrderResponse>('/purchases/orders', {
        method: 'POST',
        body: JSON.stringify({
          supplier_id: data.supplierId,
          reference_number: data.referenceNumber,
          order_date: data.orderDate,
          delivery_date: data.deliveryDate || null,
          location_id: data.locationId,
          payment_term_value: data.paymentTerm.value,
          payment_term_unit: data.paymentTerm.unit,
          attachment: data.attachment ? data.attachment.name : null,
          notes: data.notes,
          status: data.status,
          // Keep the API payload explicit so the backend can persist per-line selling price.
          items: data.items.map((item) => ({
            ...item,
          })),
          totals: data.totals,
        }),
      });

      const nextOrder = normalizePurchaseOrder(response);
      setPurchaseOrders((current) => [nextOrder, ...current.filter((order) => order.id !== nextOrder.id)]);
      return nextOrder;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to create purchase order.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPurchaseOrders();
  }, [fetchPurchaseOrders]);

  return {
    purchaseOrders,
    loading,
    error,
    fetchPurchaseOrders,
    createPurchaseOrder,
    deletePurchaseOrder,
  };
}
