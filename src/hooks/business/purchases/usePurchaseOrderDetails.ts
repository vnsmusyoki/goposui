import { useCallback, useState } from 'react';
import { ApiError, apiRequest } from '@/lib/api';

export type PurchaseOrderDetailItem = {
  id: string;
  purchaseOrderId?: string | null;
  businessId: string;
  productId: string;
  productName: string;
  sku: string;
  unit: string;
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
  manufactureDate: string;
  expiryDate: string;
  lotNumber: string;
  currentStock: number;
  receivedQuantity?: number | null;
  balanceQuantity: number;
  itemsReceived: number;
  receivedStatus: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type PurchaseOrderDetailActivity = {
  id: string;
  businessId: string;
  purchaseOrderId: string;
  action: string;
  actionedBy?: {
    id?: string;
    name: string;
  } | null;
  note: string;
  actionDate: string;
};

export type PurchaseOrderDetailResponse = {
  purchaseOrder: {
    id: string;
    businessId: string;
    supplierId: string;
    supplierName: string;
    locationId: string;
    locationName: string;
    referenceNumber: string;
    orderDate: string;
    deliveryDate: string;
    paymentTermValue: number;
    paymentTermUnit: string;
    attachmentName: string;
    attachmentUrl: string;
    deliveryAddress: string;
    deliveryCharges: number;
    deliveryDocumentName: string;
    deliveryDocumentUrl: string;
    orderDiscountAmount: number;
    notes: string;
    status: string;
    deliveryStatus: string;
    paymentStatus: string;
    subtotal: number;
    totalDiscount: number;
    totalTax: number;
    totalAmount: number;
    itemsCount: number;
    totalQuantity: number;
    createdBy?: {
      id?: string;
      name: string;
    } | null;
    additionalExpenses?: Array<{
      name: string;
      amount: number;
      sortOrder: number;
    }>;
    createdAt: string;
    updatedAt: string;
  };
  supplier: {
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
  items: PurchaseOrderDetailItem[];
  activities: PurchaseOrderDetailActivity[];
  message?: string;
};

function normalizeNumber(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function normalizeDetail(response: PurchaseOrderDetailResponse): PurchaseOrderDetailResponse {
  return {
    ...response,
    purchaseOrder: {
      ...response.purchaseOrder,
      paymentTermValue: normalizeNumber(response.purchaseOrder.paymentTermValue),
      deliveryCharges: normalizeNumber(response.purchaseOrder.deliveryCharges),
      orderDiscountAmount: normalizeNumber(response.purchaseOrder.orderDiscountAmount),
      subtotal: normalizeNumber(response.purchaseOrder.subtotal),
      totalDiscount: normalizeNumber(response.purchaseOrder.totalDiscount),
      totalTax: normalizeNumber(response.purchaseOrder.totalTax),
      totalAmount: normalizeNumber(response.purchaseOrder.totalAmount),
      itemsCount: normalizeNumber(response.purchaseOrder.itemsCount),
      totalQuantity: normalizeNumber(response.purchaseOrder.totalQuantity),
      additionalExpenses: (response.purchaseOrder.additionalExpenses ?? []).map((expense) => ({
        ...expense,
        amount: normalizeNumber(expense.amount),
        sortOrder: normalizeNumber(expense.sortOrder),
      })),
    },
    items: (response.items ?? []).map((item) => ({
      ...item,
      orderQuantity: normalizeNumber(item.orderQuantity),
      unitCostBeforeDiscount: normalizeNumber(item.unitCostBeforeDiscount),
      discountPercentage: normalizeNumber(item.discountPercentage),
      discountAmount: normalizeNumber(item.discountAmount),
      unitCostBeforeTax: normalizeNumber(item.unitCostBeforeTax),
      productTaxRate: normalizeNumber(item.productTaxRate),
      taxAmount: normalizeNumber(item.taxAmount),
      netCost: normalizeNumber(item.netCost),
      sellingPrice: normalizeNumber(item.sellingPrice),
      lineCost: normalizeNumber(item.lineCost),
      manufactureDate: item.manufactureDate || '',
      lotNumber: item.lotNumber || '',
      currentStock: normalizeNumber(item.currentStock),
      receivedQuantity: item.receivedQuantity === null || item.receivedQuantity === undefined ? null : normalizeNumber(item.receivedQuantity),
      balanceQuantity: normalizeNumber(item.balanceQuantity),
      itemsReceived: normalizeNumber(item.itemsReceived),
      sortOrder: normalizeNumber(item.sortOrder),
    })),
  };
}

export function usePurchaseOrderDetails() {
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrderDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPurchaseOrder = useCallback(async (id: string) => {
    const purchaseOrderId = id.trim();
    if (!purchaseOrderId) {
      throw new ApiError('Purchase order ID is required.', 400, { message: 'Purchase order ID is required.' });
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest<PurchaseOrderDetailResponse>(`/purchases/orders/${purchaseOrderId}`);
      const normalized = normalizeDetail(response);
      setPurchaseOrder(normalized);
      return normalized;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Unable to load purchase order.';
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
    purchaseOrder,
    loading,
    error,
    fetchPurchaseOrder,
    clearError,
  };
}
