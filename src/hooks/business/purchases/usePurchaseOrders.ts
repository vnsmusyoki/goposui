import { useCallback, useEffect, useState } from 'react';
import { ApiError, apiRequest } from '@/lib/api';

export type PurchaseOrderStatus =
  | 'draft'
  | 'pending_approval'
  | 'pending'
  | 'approved'
  | 'sent'
  | 'ordered'
  | 'received'
  | 'partially_received'
  | 'closed'
  | 'cancelled'
  | 'completed';

export type DeliveryStatus = 'pending_delivery' | 'in_transit' | 'delivered';

export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid';

type PurchaseOrderLineInput = {
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
  manufactureDate?: string;
  expiryDate: string;
  lotNumber: string;
  receivedQuantity?: number | null;
};

type PurchaseOrderExpenseInput = {
  name: string;
  amount: number;
  sortOrder?: number;
};

export type PurchaseOrderNotificationMode = 'email' | 'sms_whatsapp';

export type SendPurchaseOrderNotificationInput = {
  mode: PurchaseOrderNotificationMode;
  emailTo?: string[];
  emailCc?: string[];
  emailBcc?: string[];
  emailSubject?: string;
  emailMessage?: string;
  smsWhatsappReceivers?: string[];
  smsWhatsappMessage?: string;
  note?: string;
};

type SendPurchaseOrderNotificationResponse = {
  message?: string;
};

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
  deliveryAddress?: string;
  deliveryCharges?: number;
  deliveryDocument?: File | string | null;
  orderDiscountAmount?: number;
  approvalReminderMessage?: string;
  approvalReminderReceivers?: string[];
  paymentTerm: {
    value: number;
    unit: 'days' | 'months' | 'years';
  };
  attachment: File | string | null;
  notes: string;
  status: PurchaseOrderStatus;
  deliveryStatus?: DeliveryStatus;
  paymentStatus?: PaymentStatus;
  approvalReminderChannels?: ('notification' | 'sms' | 'whatsapp')[];
  statusChangeReason?: string;
  items: PurchaseOrderLineInput[];
  additionalExpenses?: PurchaseOrderExpenseInput[];
  grandTotal?: number;
  totals: {
    subtotal: number;
    totalDiscount: number;
    totalTax: number;
    total: number;
    itemCount: number;
    totalQuantity: number;
  };
};

export type UpdatePurchaseOrderInput = CreatePurchaseOrderInput;

function normalizePurchaseOrder(order: PurchaseOrder): PurchaseOrder {
  return {
    ...order,
    totalAmount: Number(order.totalAmount ?? 0),
    itemsCount: Number(order.itemsCount ?? 0),
    createdBy: order.createdBy ?? null,
  };
}

function buildPurchaseOrderPayload(data: CreatePurchaseOrderInput) {
  const attachmentName =
    typeof data.attachment === 'string'
      ? data.attachment
      : typeof File !== 'undefined' && data.attachment instanceof File
        ? data.attachment.name
        : null;
  const deliveryDocumentName =
    typeof data.deliveryDocument === 'string'
      ? data.deliveryDocument
      : typeof File !== 'undefined' && data.deliveryDocument instanceof File
        ? data.deliveryDocument.name
        : null;

  return {
    supplier_id: data.supplierId,
    reference_number: data.referenceNumber,
    order_date: data.orderDate,
    delivery_date: data.deliveryDate || null,
    location_id: data.locationId,
    delivery_address: data.deliveryAddress ?? null,
    delivery_charges: data.deliveryCharges ?? 0,
    delivery_document: deliveryDocumentName,
    order_discount_amount: data.orderDiscountAmount ?? 0,
    payment_term_value: data.paymentTerm.value,
    payment_term_unit: data.paymentTerm.unit,
    attachment: attachmentName,
    notes: data.notes,
    status: data.status,
    delivery_status: data.deliveryStatus ?? 'pending_delivery',
    payment_status: data.paymentStatus ?? 'unpaid',
    approval_reminder_channels: data.approvalReminderChannels ?? null,
    approval_reminder_message: data.approvalReminderMessage ?? null,
    status_change_reason: data.statusChangeReason ?? null,
    items: data.items.map((item) => ({
      ...item,
    })),
    additionalExpenses: (data.additionalExpenses ?? []).map((expense, index) => ({
      name: expense.name,
      amount: expense.amount,
      sortOrder: expense.sortOrder ?? index,
    })),
    subtotal: data.totals.subtotal,
    total_discount: data.totals.totalDiscount,
    total_tax: data.totals.totalTax,
    grand_total: data.grandTotal ?? data.totals.total,
    items_count: data.totals.itemCount,
    total_quantity: data.totals.totalQuantity,
    totals: data.totals,
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
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to delete purchase order.';
      setError(message);
      throw err;
    }
  }, []);

  const sendPurchaseOrderNotification = useCallback(async (id: string, data: SendPurchaseOrderNotificationInput) => {
    const purchaseOrderId = id.trim();
    if (!purchaseOrderId) {
      throw new ApiError('Purchase order ID is required.', 400, { message: 'Purchase order ID is required.' });
    }

    try {
      return await apiRequest<SendPurchaseOrderNotificationResponse>(`/purchases/orders/${purchaseOrderId}/notify`, {
        method: 'POST',
        body: JSON.stringify({
          notification_mode: data.mode,
          email_to: data.emailTo ?? [],
          email_cc: data.emailCc ?? [],
          email_bcc: data.emailBcc ?? [],
          email_subject: data.emailSubject ?? '',
          email_message: data.emailMessage ?? '',
          sms_whatsapp_receivers: data.smsWhatsappReceivers ?? [],
          sms_whatsapp_message: data.smsWhatsappMessage ?? '',
          note: data.note ?? '',
        }),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to send purchase order notification.';
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
        body: JSON.stringify(buildPurchaseOrderPayload(data)),
      });

      const nextOrder = normalizePurchaseOrder(response);
      setPurchaseOrders((current) => [nextOrder, ...current.filter((order) => order.id !== nextOrder.id)]);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to create purchase order.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePurchaseOrder = useCallback(async (id: string, data: UpdatePurchaseOrderInput) => {
    const purchaseOrderId = id.trim();
    if (!purchaseOrderId) {
      throw new ApiError('Purchase order ID is required.', 400, { message: 'Purchase order ID is required.' });
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest<PurchaseOrderResponse>(`/purchases/orders/${purchaseOrderId}`, {
        method: 'PUT',
        body: JSON.stringify(buildPurchaseOrderPayload(data)),
      });

      const nextOrder = normalizePurchaseOrder(response);
      setPurchaseOrders((current) => [nextOrder, ...current.filter((order) => order.id !== nextOrder.id)]);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update purchase order.';
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
    updatePurchaseOrder,
    deletePurchaseOrder,
    sendPurchaseOrderNotification,
  };
}
