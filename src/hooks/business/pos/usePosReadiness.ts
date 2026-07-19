import { useCallback, useState } from 'react';
import { ApiError, apiRequest } from '@/lib/api';

export type PosReadiness = {
  businessLocationId: string;
  businessLocationName: string;
  hasActiveCashRegister: boolean;
  activeRegister: {
    id: string;
    registerNumber?: string;
    openedAt?: string;
    openingCashAmount?: number;
    expectedClosingCashAmount?: number;
  } | null;
  printerConfigured: boolean;
  printerTestRequired: boolean;
  mpesaConfigured: boolean;
  mpesaStkPushEnabled: boolean;
  paymentMethods: string[];
  blockingReasons: string[];
  warnings: string[];
  message?: string;
};

type OpenRegisterResponse = {
  register: PosReadiness['activeRegister'];
  message?: string;
};

export function usePosReadiness() {
  const [readiness, setReadiness] = useState<PosReadiness | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReadiness = useCallback(async (businessLocationId?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (businessLocationId) {
        params.set('business_location_id', businessLocationId);
      }
      const query = params.toString();
      const response = await apiRequest<PosReadiness>(`/pos/readiness${query ? `?${query}` : ''}`);
      setReadiness(response);
      return response;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Unable to load POS readiness checks.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openRegister = useCallback(async (payload: {
    businessLocationId: string;
    openingCashAmount: number;
    notes?: string;
  }) => {
    const response = await apiRequest<OpenRegisterResponse>('/pos/registers/open', {
      method: 'POST',
      body: JSON.stringify({
        business_location_id: payload.businessLocationId,
        opening_cash_amount: payload.openingCashAmount,
        notes: payload.notes ?? '',
      }),
    });
    await loadReadiness(payload.businessLocationId);
    return response;
  }, [loadReadiness]);

  return {
    readiness,
    isLoading,
    error,
    loadReadiness,
    openRegister,
  };
}
