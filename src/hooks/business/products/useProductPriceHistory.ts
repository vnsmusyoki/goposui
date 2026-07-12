import { useCallback, useState } from 'react';
import { ApiError, apiRequest } from '@/lib/api';

export type PriceHistoryEntry = {
  id: string;
  createdAt: string;
  buyingPrice: number;
  sellingPrice: number;
  reason: string | null;
  changedBy: string;
};

type PriceHistoryResponse = {
  items: PriceHistoryEntry[];
  message: string;
};

export function useProductPriceHistory() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPriceHistory = useCallback(async (productId: string) => {
    const id = productId.trim();
    if (!id) {
      throw new ApiError('Product ID is required.', 400, { message: 'Product ID is required.' });
    }
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<PriceHistoryResponse>(`/products/${id}/price-history`);
      return response.items ?? [];
    } catch (err) {
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Unable to load price history.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    getPriceHistory,
    loading,
    error,
  };
}
