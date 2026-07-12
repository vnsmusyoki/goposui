import { useCallback, useState } from 'react';

export type StockTransaction = {
  id: string;
  type: string;
  quantity: number;
  balance: number;
  reference: string;
  note: string;
  notes?: string;
  createdAt: string;
};

export function useProductStock() {
  const [loading, setLoading] = useState(false);

  const getStockTransactions = useCallback(async (_productId: string) => {
    setLoading(true);
    try {
      return [] as StockTransaction[];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    getStockTransactions,
    loading,
  };
}
