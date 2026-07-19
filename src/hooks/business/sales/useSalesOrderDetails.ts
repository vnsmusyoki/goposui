import { useCallback, useState } from 'react';
import { ApiError, apiRequest } from '@/lib/api';

export type SalesOrderDetailActivity = {
  id: string;
  businessId: string;
  salesOrderId: string;
  action: string;
  actionedBy?: {
    id?: string;
    name: string;
  } | null;
  note: string;
  actionDate: string;
};

type SalesOrderDetailApiResponse = {
  salesOrder: {
    saleOrder: {
      id: string;
      businessId: string;
      locationId: string;
      customerId: string;
      referenceNumber: string;
      saleDate: string;
      customerName: string;
      customerPhone: string;
      customerEmail: string;
      status: string;
      subtotal: number;
      totalDiscount: number;
      totalTax: number;
      grandTotal: number;
      itemsCount: number;
      totalQuantity: number;
      notes: string;
      stockAccountingMethod: string;
      reserveOrderItems: boolean;
      shippingStatus: string;
      paidAmount: number;
      balanceDue: number;
      saleId: string;
      convertedAt: string;
      createdBy: string;
      createdAt: string;
      updatedAt: string;
    };
    customer: {
      name: string;
      email: string;
      phone: string;
      address: string;
    };
    business: {
      name: string;
      email: string;
      phone: string;
      branchName: string;
      branchAddress: string;
    };
    location: {
      name: string;
      email: string;
      phone: string;
      address: string;
    };
    items: Array<{
      id: string;
      saleId: string;
      businessId: string;
      productId: string;
      productName: string;
      sku: string;
      unit: string;
      quantity: number;
      unitCost: number;
      discountPercentage: number;
      discountAmount: number;
      taxRate: number;
      taxAmount: number;
      unitPrice: number;
      lineTotal: number;
      batchTrackingEnabled: boolean;
      sortOrder: number;
      createdAt: string;
      updatedAt: string;
    }>;
    activities: SalesOrderDetailActivity[];
    message?: string;
  };
};

export type SalesOrderDetailResponse = {
  saleOrder: {
    id: string;
    businessId: string;
    locationId: string;
    customerId: string;
    referenceNumber: string;
    saleDate: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    status: string;
    subtotal: number;
    totalDiscount: number;
    totalTax: number;
    grandTotal: number;
    itemsCount: number;
    totalQuantity: number;
    notes: string;
    stockAccountingMethod: string;
    reserveOrderItems: boolean;
    shippingStatus: string;
    paidAmount: number;
    balanceDue: number;
    saleId: string;
    convertedAt: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
  };
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  business: {
    name: string;
    email: string;
    phone: string;
    branchName: string;
    branchAddress: string;
  };
  location: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  items: Array<{
    id: string;
    saleId: string;
    businessId: string;
    productId: string;
    productName: string;
    sku: string;
    unit: string;
    quantity: number;
    unitCost: number;
    discountPercentage: number;
    discountAmount: number;
    taxRate: number;
    taxAmount: number;
    unitPrice: number;
    lineTotal: number;
    batchTrackingEnabled: boolean;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
  }>;
  activities: SalesOrderDetailActivity[];
  message?: string;
};

function normalizeNumber(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

export function useSalesOrderDetails() {
  const [salesOrder, setSalesOrder] = useState<SalesOrderDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSalesOrder = useCallback(async (id: string) => {
    const salesOrderId = id.trim();
    if (!salesOrderId) {
      throw new ApiError('Sales order ID is required.', 400, { message: 'Sales order ID is required.' });
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest<SalesOrderDetailApiResponse>(`/sales/orders/${salesOrderId}`);
      const normalized: SalesOrderDetailResponse = {
        saleOrder: {
          ...response.salesOrder.saleOrder,
          subtotal: normalizeNumber(response.salesOrder.saleOrder.subtotal),
          totalDiscount: normalizeNumber(response.salesOrder.saleOrder.totalDiscount),
          totalTax: normalizeNumber(response.salesOrder.saleOrder.totalTax),
          grandTotal: normalizeNumber(response.salesOrder.saleOrder.grandTotal),
          itemsCount: normalizeNumber(response.salesOrder.saleOrder.itemsCount),
          totalQuantity: normalizeNumber(response.salesOrder.saleOrder.totalQuantity),
          reserveOrderItems: Boolean(response.salesOrder.saleOrder.reserveOrderItems),
          paidAmount: normalizeNumber(response.salesOrder.saleOrder.paidAmount),
          balanceDue: normalizeNumber(response.salesOrder.saleOrder.balanceDue),
        },
        customer: response.salesOrder.customer,
        business: response.salesOrder.business,
        location: response.salesOrder.location,
        items: (response.salesOrder.items ?? []).map((item) => ({
          ...item,
          quantity: normalizeNumber(item.quantity),
          unitCost: normalizeNumber(item.unitCost),
          discountPercentage: normalizeNumber(item.discountPercentage),
          discountAmount: normalizeNumber(item.discountAmount),
          taxRate: normalizeNumber(item.taxRate),
          taxAmount: normalizeNumber(item.taxAmount),
          unitPrice: normalizeNumber(item.unitPrice),
          lineTotal: normalizeNumber(item.lineTotal),
          sortOrder: normalizeNumber(item.sortOrder),
        })),
        activities: response.salesOrder.activities ?? [],
      };
      setSalesOrder(normalized);
      return normalized;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Unable to load sales order.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    salesOrder,
    loading,
    error,
    fetchSalesOrder,
    clearError,
  };
}
