import { useCallback, useEffect, useState } from 'react';
import { apiRequestWithoutSessionInvalidation } from '@/lib/api';

export type TransferStatus = 'draft' | 'pending' | 'approved' | 'completed' | 'cancelled' | 'processing' | 'failed';
export type TransferType = 'local' | 'international' | 'mobile';

export type TransferItemRecord = {
  id: string;
  stockTransferId?: string;
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  sortOrder?: number;
};

export type TransferRecord = {
  id: string;
  referenceNumber: string;
  transferDate: string;
  status: TransferStatus;
  locationFromId: string;
  locationToId: string;
  locationFromName?: string;
  locationToName?: string;
  currency: string;
  shippingCharges: number;
  subtotal: number;
  totalAmount: number;
  itemsCount?: number;
  totalQuantity?: number;
  items: TransferItemRecord[];
  notes: string;
  type: TransferType;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateTransferInput = {
  referenceNumber: string;
  transferDate: string;
  status: TransferStatus;
  locationFromId: string;
  locationToId: string;
  locationFromName?: string;
  locationToName?: string;
  currency: string;
  shippingCharges: number;
  notes: string;
  type: TransferType;
  items: TransferItemRecord[];
};

type TransferApiItem = {
  id: string;
  referenceNumber?: string;
  reference_number?: string;
  transferDate?: string;
  transfer_date?: string;
  status?: TransferStatus;
  locationFromId?: string;
  location_from_id?: string;
  locationToId?: string;
  location_to_id?: string;
  locationFromName?: string;
  location_from_name?: string;
  locationToName?: string;
  location_to_name?: string;
  currency?: string;
  shippingCharges?: number;
  shipping_charges?: number;
  subtotal?: number;
  totalAmount?: number;
  total_amount?: number;
  itemsCount?: number;
  items_count?: number;
  totalQuantity?: number;
  total_quantity?: number;
  items?: Array<{
    id: string;
    stockTransferId?: string;
    stock_transfer_id?: string;
    productId?: string;
    product_id?: string;
    productName?: string;
    product_name?: string;
    sku?: string;
    unit?: string;
    quantity?: number;
    unitPrice?: number;
    unit_cost?: number;
    subtotal?: number;
    line_total?: number;
    sortOrder?: number;
    sort_order?: number;
  }>;
  notes?: string;
  type?: TransferType;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
};

type TransfersApiResponse = {
  transfers?: TransferApiItem[];
  transfer?: TransferApiItem;
  data?: TransferApiItem[];
  items?: TransferApiItem[];
  message?: string;
};

type TransferApiResponse = {
  transfer?: TransferApiItem;
  data?: TransferApiItem;
  items?: TransferApiItem[];
  message?: string;
};

type TransfersStore = {
  transfers: TransferRecord[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  loadTransfers: () => Promise<TransferRecord[]>;
  createTransfer: (input: CreateTransferInput) => Promise<TransferRecord>;
  clearError: () => void;
};

function normalizeTransfer(item: TransferApiItem): TransferRecord {
  const items = (item.items ?? []).map((entry) => {
    const quantity = Number(entry.quantity ?? 0);
    const unitPrice = Number(entry.unitPrice ?? entry.unit_cost ?? 0);
    const subtotal = Number(entry.subtotal ?? entry.line_total ?? quantity * unitPrice);

    return {
      id: entry.id,
      stockTransferId: entry.stockTransferId ?? entry.stock_transfer_id,
      productId: entry.productId ?? entry.product_id ?? '',
      productName: entry.productName ?? entry.product_name ?? '',
      sku: entry.sku ?? '',
      unit: entry.unit ?? '',
      quantity,
      unitPrice,
      subtotal,
      sortOrder: entry.sortOrder ?? entry.sort_order,
    };
  });

  const subtotal = Number(item.subtotal ?? items.reduce((sum, current) => sum + Number(current.subtotal ?? 0), 0));
  const shippingCharges = Number(item.shippingCharges ?? item.shipping_charges ?? 0);

  return {
    id: item.id,
    referenceNumber: item.referenceNumber ?? item.reference_number ?? '',
    transferDate: item.transferDate ?? item.transfer_date ?? '',
    status: item.status ?? 'draft',
    locationFromId: item.locationFromId ?? item.location_from_id ?? '',
    locationToId: item.locationToId ?? item.location_to_id ?? '',
    locationFromName: item.locationFromName ?? item.location_from_name ?? '',
    locationToName: item.locationToName ?? item.location_to_name ?? '',
    currency: item.currency ?? 'USD',
    shippingCharges,
    subtotal,
    totalAmount: Number(item.totalAmount ?? item.total_amount ?? subtotal + shippingCharges),
    itemsCount: Number(item.itemsCount ?? item.items_count ?? items.length),
    totalQuantity: Number(item.totalQuantity ?? item.total_quantity ?? items.reduce((sum, current) => sum + Number(current.quantity ?? 0), 0)),
    items,
    notes: item.notes ?? '',
    type: item.type ?? 'local',
    createdAt: item.createdAt ?? item.created_at,
    updatedAt: item.updatedAt ?? item.updated_at,
  };
}

export function useBusinessTransfers() {
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTransfers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequestWithoutSessionInvalidation<TransfersApiResponse>('/business/transfers');
      const nextTransfers = (response.transfers ?? response.data ?? response.items ?? [])
        .map(normalizeTransfer);
      setTransfers(nextTransfers);
      return nextTransfers;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load transfers.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createTransfer = useCallback(async (input: CreateTransferInput) => {
    setIsSaving(true);
    setError(null);

    const payload = {
      reference_number: input.referenceNumber,
      transfer_date: input.transferDate,
      status: input.status,
      type: input.type,
      location_from_id: input.locationFromId,
      location_to_id: input.locationToId,
      location_from_name: input.locationFromName ?? '',
      location_to_name: input.locationToName ?? '',
      currency: input.currency,
      shipping_charges: input.shippingCharges,
      notes: input.notes,
      items: input.items.map((item, index) => ({
        id: item.id,
        product_id: item.productId,
        product_name: item.productName,
        sku: item.sku,
        unit: item.unit,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        subtotal: item.subtotal,
        sort_order: item.sortOrder ?? index,
      })),
    };

    try {
      const response = await apiRequestWithoutSessionInvalidation<TransferApiResponse>('/business/transfers', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const nextTransfer = normalizeTransfer(response.transfer ?? response.data ?? response.items?.[0] ?? { id: '' });
      setTransfers((current) => [nextTransfer, ...current.filter((transfer) => transfer.id !== nextTransfer.id)]);
      return nextTransfer;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to create transfer.';
      setError(message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    void loadTransfers().catch(() => undefined);
  }, [loadTransfers]);

  return {
    transfers,
    isLoading,
    isSaving,
    error,
    loadTransfers,
    createTransfer,
    clearError,
  } satisfies TransfersStore;
}
