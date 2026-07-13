import { useCallback, useEffect, useState } from 'react';
import { ApiError, apiRequest } from '@/lib/api';

export type PurchaseOrderReturnStatus =
  | 'draft'
  | 'pending_approval'
  | 'pending'
  | 'approved'
  | 'sent'
  | 'ordered'
  | 'received'
  | 'partially_received'
  | 'completed'
  | 'closed'
  | 'cancelled'
  | 'returned'
  | 'partially_returned'
  | 'rejected'
  | 'refunded'
  | 'exchange';

export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid' | 'pending_refund' | 'credit_note' | 'refunded';

export type PurchaseOrderReturn = {
  id: string;
  orderDate?: string;
  returnDate: string;
  referenceNumber: string;
  parentPurchaseId?: string;
  parentPurchaseReference: string;
  locationId: string;
  locationName: string;
  supplierId: string;
  supplierName: string;
  status: PurchaseOrderReturnStatus;
  paymentStatus: PaymentStatus;
  grandTotal: number;
  paymentDue: number;
  returnReason?: string;
  notes?: string;
  itemsCount?: number;
  totalQuantity?: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: {
    id?: string;
    name: string;
  } | null;
};

type PurchaseOrderReturnsResponse = {
  purchaseOrderReturns?: PurchaseOrderReturn[];
  returns?: PurchaseOrderReturn[];
  data?: PurchaseOrderReturn[];
  message?: string;
};

type PurchaseOrderReturnResponse = PurchaseOrderReturn & {
  message?: string;
};

export function usePurchaseOrderReturns() {
  const [purchaseOrderReturns, setPurchaseOrderReturns] = useState<PurchaseOrderReturn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPurchaseOrderReturns = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest<PurchaseOrderReturnsResponse>('/purchases/returns');
      const nextReturns = (response.purchaseOrderReturns ?? response.returns ?? response.data ?? []).map((entry) => ({
        ...entry,
        grandTotal: Number(entry.grandTotal ?? 0),
        paymentDue: Number(entry.paymentDue ?? 0),
      }));
      setPurchaseOrderReturns(nextReturns);
      return nextReturns;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load purchase returns.';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePurchaseOrderReturn = useCallback(async (id: string) => {
    const purchaseReturnId = id.trim();
    if (!purchaseReturnId) {
      throw new ApiError('Purchase return ID is required.', 400, { message: 'Purchase return ID is required.' });
    }

    try {
      const response = await apiRequest<PurchaseOrderReturnResponse>(`/purchases/returns/${purchaseReturnId}`, {
        method: 'DELETE',
      });

      setPurchaseOrderReturns((current) => current.filter((entry) => entry.id !== purchaseReturnId));
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to delete purchase return.';
      setError(message);
      throw err;
    }
  }, []);

  useEffect(() => {
    void fetchPurchaseOrderReturns();
  }, [fetchPurchaseOrderReturns]);

  return {
    purchaseOrderReturns,
    loading,
    error,
    fetchPurchaseOrderReturns,
    deletePurchaseOrderReturn,
  };
}
