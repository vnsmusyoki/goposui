import { useCallback, useState } from 'react';
import { ApiError, apiRequest } from '@/lib/api';

export type OpeningStockImportBatch = {
  id: string;
  businessId: string;
  fileName: string;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type OpeningStockImportRow = {
  id: string;
  batchId: string;
  rowNumber: number;
  sku: string;
  productId: string;
  locationId: string;
  quantity: string;
  unitCostBeforeTax: string;
  lotNumber: string;
  expiryDate: string;
  rowData: Record<string, string>;
  validationErrors: string[] | null;
  status: string;
  importedInventoryBatchId: string;
  createdAt: string;
  updatedAt: string;
};

export type OpeningStockImportPreviewResponse = {
  batch: OpeningStockImportBatch;
  rows: OpeningStockImportRow[];
  message: string;
};

type UpdateRowResponse = {
  message: string;
  row: OpeningStockImportRow;
  validationErrors: string[];
};

function normalizeRow(row: OpeningStockImportRow): OpeningStockImportRow {
  return {
    ...row,
    status: row.status === 'imported' ? 'processed' : row.status,
    validationErrors: row.validationErrors ?? [],
  };
}

function normalizeRows(rows: OpeningStockImportRow[]): OpeningStockImportRow[] {
  return rows.map(normalizeRow);
}

export function useOpeningStockImports() {
  const [batch, setBatch] = useState<OpeningStockImportBatch | null>(null);
  const [rows, setRows] = useState<OpeningStockImportRow[]>([]);
  const [isLoadingBatch, setIsLoadingBatch] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingRow, setIsSavingRow] = useState(false);
  const [isProcessingRows, setIsProcessingRows] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshBatch = useCallback(async (batchId: string) => {
    const response = await apiRequest<OpeningStockImportPreviewResponse>(`/products/opening-stock/import/batches/${batchId}`);
    setBatch(response.batch);
    setRows(normalizeRows(response.rows ?? []));
    return response;
  }, []);

  const loadLatestBatch = useCallback(async () => {
    setIsLoadingBatch(true);
    try {
      const response = await apiRequest<OpeningStockImportPreviewResponse>('/products/opening-stock/import/batches/latest');
      setBatch(response.batch);
      setRows(normalizeRows(response.rows ?? []));
      return response;
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setBatch(null);
        setRows([]);
        return null;
      }
      const message = err instanceof ApiError ? err.message : 'Failed to load staged opening stock imports';
      setErrorMessage(message);
      throw err;
    } finally {
      setIsLoadingBatch(false);
    }
  }, []);

  const uploadPreview = useCallback(async (fileToUpload: File) => {
    setErrorMessage(null);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', fileToUpload);

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api'}/products/opening-stock/import/preview`,
        {
          method: 'POST',
          credentials: 'include',
          body: formData,
        },
      );

      const payload = (await response.json()) as OpeningStockImportPreviewResponse & {
        message?: string;
        errors?: Record<string, string>;
      };

      if (!response.ok) {
        const message = payload?.message || 'Failed to upload opening stock import file';
        throw new ApiError(message, response.status, payload);
      }

      setBatch(payload.batch);
      setRows(normalizeRows(payload.rows ?? []));
      return payload;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to upload opening stock import file';
      setErrorMessage(message);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const updateRow = useCallback(
    async (
      batchId: string,
      rowId: string,
      payload: {
        sku: string;
        location: string;
        quantity: string;
        unitCostBeforeTax: string;
        lotNumber: string;
        expiryDate: string;
      },
    ) => {
      setIsSavingRow(true);
      try {
        const response = await apiRequest<UpdateRowResponse>(
          `/products/opening-stock/import/batches/${batchId}/rows/${rowId}`,
          {
            method: 'PUT',
            body: JSON.stringify({
              sku: payload.sku,
              location: payload.location,
              quantity: payload.quantity,
              unitCostBeforeTax: payload.unitCostBeforeTax,
              lotNumber: payload.lotNumber,
              expiryDate: payload.expiryDate,
            }),
          },
        );

        const nextRow = normalizeRow({
          ...response.row,
          validationErrors: response.row.validationErrors ?? response.validationErrors ?? [],
        });
        setRows((current) => current.map((item) => (item.id === nextRow.id ? nextRow : item)));
        return { ...response, row: nextRow };
      } finally {
        setIsSavingRow(false);
      }
    },
    [],
  );

  const processRow = useCallback(
    async (batchId: string, rowId: string) => {
      setIsProcessingRows(true);
      try {
        const response = await apiRequest<{ message: string }>(
          `/products/opening-stock/import/batches/${batchId}/rows/${rowId}/import`,
          {
            method: 'POST',
          },
        );
        await refreshBatch(batchId);
        return response;
      } finally {
        setIsProcessingRows(false);
      }
    },
    [refreshBatch],
  );

  const processReadyRows = useCallback(
    async (batchId: string, readyRowIds: string[]) => {
      setIsProcessingRows(true);
      try {
        for (const rowId of readyRowIds) {
          await apiRequest(`/products/opening-stock/import/batches/${batchId}/rows/${rowId}/import`, {
            method: 'POST',
          });
        }
        await refreshBatch(batchId);
      } finally {
        setIsProcessingRows(false);
      }
    },
    [refreshBatch],
  );

  const clearBatch = useCallback(() => {
    setBatch(null);
    setRows([]);
    setErrorMessage(null);
  }, []);

  return {
    batch,
    rows,
    errorMessage,
    isLoadingBatch,
    isUploading,
    isSavingRow,
    isProcessingRows,
    loadLatestBatch,
    refreshBatch,
    uploadPreview,
    updateRow,
    processRow,
    processReadyRows,
    clearBatch,
    setErrorMessage,
    setBatch,
    setRows,
  };
}
