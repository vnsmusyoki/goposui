import { useCallback, useState } from 'react';
import { ApiError } from '@/lib/api';
import { usePurchaseOrders, type UpdatePurchaseOrderInput } from '@/hooks/business/purchases/usePurchaseOrders';

export function useUpdatePurchaseOrderStatus() {
  const { updatePurchaseOrder, loading } = usePurchaseOrders();
  const [error, setError] = useState<string | null>(null);

  const savePurchaseOrderStatus = useCallback(
    async (id: string, data: UpdatePurchaseOrderInput) => {
      setError(null);
      try {
        return await updatePurchaseOrder(id, data);
      } catch (err) {
        const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Failed to update purchase order status.';
        setError(message);
        throw err;
      }
    },
    [updatePurchaseOrder],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    savePurchaseOrderStatus,
    loading,
    error,
    clearError,
  };
}
