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
  paymentMethodDetails: Array<{
    id: string;
    code: string;
    name: string;
    alias: string;
    description: string;
    isEnabled: boolean;
    isCredit: boolean;
    requiresReference: boolean;
    requiresPhone: boolean;
    sortOrder: number;
  }>;
  blockingReasons: string[];
  warnings: string[];
  message?: string;
};

type OpenRegisterResponse = {
  register: PosReadiness['activeRegister'];
  message?: string;
};

export type CompletePosSalePayload = {
  locationId: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  saleDate: string;
  notes?: string;
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
  itemsCount: number;
  totalQuantity: number;
  items: Array<{
    productId: string;
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
  }>;
  payments: Array<{
    paymentMethodCode: string;
    amount: number;
    referenceNumber?: string;
    phone?: string;
    notes?: string;
  }>;
};

type CompletePosSaleResponse = {
  sale: unknown;
  payments: unknown[];
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

  const completeSale = useCallback(async (payload: CompletePosSalePayload) => {
    return apiRequest<CompletePosSaleResponse>('/pos/sales', {
      method: 'POST',
      body: JSON.stringify({
        location_id: payload.locationId,
        customer_id: payload.customerId ?? '',
        customer_name: payload.customerName ?? '',
        customer_phone: payload.customerPhone ?? '',
        customer_email: payload.customerEmail ?? '',
        sale_date: payload.saleDate,
        notes: payload.notes ?? '',
        subtotal: payload.subtotal,
        total_discount: payload.totalDiscount,
        total_tax: payload.totalTax,
        grand_total: payload.grandTotal,
        items_count: payload.itemsCount,
        total_quantity: payload.totalQuantity,
        items: payload.items.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
          unit_cost: item.unitCost,
          discount_percentage: item.discountPercentage,
          discount_amount: item.discountAmount,
          tax_rate: item.taxRate,
          tax_amount: item.taxAmount,
          unit_price: item.unitPrice,
          line_total: item.lineTotal,
          batch_tracking_enabled: item.batchTrackingEnabled,
          sort_order: item.sortOrder,
        })),
        payments: payload.payments.map((payment) => ({
          payment_method_code: payment.paymentMethodCode,
          amount: payment.amount,
          reference_number: payment.referenceNumber ?? '',
          phone: payment.phone ?? '',
          notes: payment.notes ?? '',
        })),
      }),
    });
  }, []);

  return {
    readiness,
    isLoading,
    error,
    loadReadiness,
    openRegister,
    completeSale,
  };
}
