import { useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Edit2,
  FileSpreadsheet,
  Loader2,
  MapPin,
  PackageSearch,
  Save,
  Search,
  Upload,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useBusinessLocations } from '@/hooks/business/settings/useBusinessLocations';
import { useProducts, type ProductSearchResult } from '@/hooks/business/products/useProducts';
import {
  useOpeningStockImports,
  type OpeningStockImportBatch,
  type OpeningStockImportRow,
} from '@/hooks/business/openingstock/useOpeningStockImports';
type ImportRow = OpeningStockImportRow;

type ImportRowFormState = {
  sku: string;
  location: string;
  quantity: string;
  unitCostBeforeTax: string;
  lotNumber: string;
  expiryDate: string;
};

const EMPTY_ROW_FORM: ImportRowFormState = {
  sku: '',
  location: '',
  quantity: '',
  unitCostBeforeTax: '',
  lotNumber: '',
  expiryDate: '',
};

function SectionCard({
  title,
  description,
  icon: Icon,
  headerAction,
  children,
}: {
  title: string;
  description?: string;
  icon: ComponentType<{ className?: string }>;
  headerAction?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-sm border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
          </div>
        </div>
        {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
      </div>
      {children}
    </section>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-sm font-medium text-foreground">{children}</label>;
}

function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
    />
  );
}

function formatValue(value: string | number | null | undefined) {
  if (value === null || value === undefined) return '';
  return String(value);
}

function previewStatusClass(status: string) {
  switch (status) {
    case 'valid':
      return 'bg-emerald-100 text-emerald-700';
    case 'invalid':
      return 'bg-amber-100 text-amber-700';
    case 'processed':
    case 'imported':
      return 'bg-primary/10 text-primary';
    case 'error':
      return 'bg-rose-100 text-rose-700';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function previewStatusLabel(status: string) {
  switch (status) {
    case 'valid':
      return 'Ready';
    case 'invalid':
      return 'Needs Fixing';
    case 'processed':
    case 'imported':
      return 'Processed';
    case 'error':
      return 'Error';
    default:
      return status || 'Pending';
  }
}

function isProcessedStatus(status: string) {
  return status === 'processed' || status === 'imported';
}

export default function ImportOpeningStock() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [editingRow, setEditingRow] = useState<ImportRow | null>(null);
  const [editForm, setEditForm] = useState<ImportRowFormState>(EMPTY_ROW_FORM);
  const [editError, setEditError] = useState<string | null>(null);
  const [skuQuery, setSkuQuery] = useState('');
  const [skuResults, setSkuResults] = useState<ProductSearchResult[]>([]);
  const [skuSearching, setSkuSearching] = useState(false);
  const [isTemplateHelperOpen, setIsTemplateHelperOpen] = useState(false);
  const [submitConfirmRow, setSubmitConfirmRow] = useState<ImportRow | null>(null);

  const { locations, loadBusinessLocations } = useBusinessLocations();
  const { searchProducts } = useProducts();
  const {
    batch,
    rows,
    errorMessage,
    isUploading,
    isSavingRow,
    isProcessingRows,
    loadLatestBatch,
    uploadPreview,
    updateRow,
    processRow,
    processReadyRows,
    clearBatch,
    setErrorMessage,
  } = useOpeningStockImports();

  const firstLocation = locations[0];

  useEffect(() => {
    void loadBusinessLocations();
  }, [loadBusinessLocations]);

  useEffect(() => {
    const trimmed = skuQuery.trim();
    if (trimmed.length < 3) {
      setSkuResults([]);
      setSkuSearching(false);
      return;
    }

    let active = true;
    const timeout = window.setTimeout(() => {
      setSkuSearching(true);
      void searchProducts(trimmed, 'single')
        .then((results) => {
          if (active) {
            setSkuResults(results);
          }
        })
        .catch(() => {
          if (active) {
            setSkuResults([]);
          }
        })
        .finally(() => {
          if (active) {
            setSkuSearching(false);
          }
        });
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [searchProducts, skuQuery]);

  useEffect(() => {
    void loadLatestBatch();
  }, [loadLatestBatch]);

  useEffect(() => {
    if (!selectedFile) {
      return;
    }
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      const message = 'Please upload a CSV file.';
      setErrorMessage(message);
      toast.error(message);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    void uploadPreview(selectedFile)
      .then((payload) => {
        toast.success(payload.message || 'Opening stock import preview loaded successfully');
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Failed to upload opening stock import file';
        toast.error(message);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFile]);

  const handleDownloadTemplate = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api'}/products/opening-stock/import/template.csv`,
        {
          credentials: 'include',
          cache: 'no-store',
        },
      );
      if (!response.ok) {
        throw new Error('Failed to download template');
      }
      const blob = await response.blob();
      const contentDisposition = response.headers.get('content-disposition') || '';
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
      const filename = filenameMatch?.[1];
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'opening_stock_import_template.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Template downloaded successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to download template';
      toast.error(message);
    } finally {
      setIsDownloading(false);
    }
  };

  const openEditRow = (row: ImportRow) => {
    if (isProcessedStatus(row.status)) {
      toast.error('Processed rows cannot be edited.');
      return;
    }
    setEditingRow(row);
    setEditError(null);
    setEditForm({
      sku: row.sku || row.rowData.sku || '',
      location: row.rowData.location || row.locationId || '',
      quantity: row.quantity || row.rowData.quantity || '',
      unitCostBeforeTax: row.unitCostBeforeTax || row.rowData.unit_cost_before_tax || '',
      lotNumber: row.lotNumber || row.rowData.lot_number || '',
      expiryDate: row.expiryDate || row.rowData.expiry_date || '',
    });
  };

  const closeEditRow = () => {
    setEditingRow(null);
    setEditForm(EMPTY_ROW_FORM);
    setEditError(null);
  };

  const handleSaveEditedRow = async () => {
    if (!batch || !editingRow) {
      return;
    }
    if (isProcessedStatus(editingRow.status)) {
      setEditError('This opening stock row has already been processed and cannot be edited.');
      return;
    }

    setEditError(null);

    try {
      const response = await updateRow(batch.id, editingRow.id, {
        sku: editForm.sku,
        location: editForm.location,
        quantity: editForm.quantity,
        unitCostBeforeTax: editForm.unitCostBeforeTax,
        lotNumber: editForm.lotNumber,
        expiryDate: editForm.expiryDate,
      });
      setEditingRow(null);
      setEditForm(EMPTY_ROW_FORM);
      toast.success(response.message || 'Row updated successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update import row';
      setEditError(message);
      toast.error(message);
    }
  };

  const handleImportRow = async (row: ImportRow) => {
    if (!batch) {
      return;
    }

    try {
      const response = await processRow(batch.id, row.id);
      toast.success(response?.message || 'Opening stock processed successfully');
      setSubmitConfirmRow(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process opening stock row';
      toast.error(message);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    clearBatch();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const editFieldErrors = useMemo(() => {
    if (!editingRow) {
      return {
        sku: [] as string[],
        location: [] as string[],
        quantity: [] as string[],
        unitCostBeforeTax: [] as string[],
        lotNumber: [] as string[],
        expiryDate: [] as string[],
      };
    }

    const rowErrors = editingRow.validationErrors ?? [];
    return {
      sku: rowErrors.filter((error) => /sku|product/i.test(error)),
      location: rowErrors.filter((error) => /location/i.test(error)),
      quantity: rowErrors.filter((error) => /quantity/i.test(error)),
      unitCostBeforeTax: rowErrors.filter((error) => /unit cost|cost/i.test(error)),
      lotNumber: rowErrors.filter((error) => /lot/i.test(error)),
      expiryDate: rowErrors.filter((error) => /expiry/i.test(error)),
    };
  }, [editingRow]);

  const readyRows = rows.filter((row) => row.status === 'valid' && (row.validationErrors ?? []).length === 0);
  const processedRows = rows.filter((row) => row.status === 'processed' || row.status === 'imported');
  const invalidRows = rows.filter((row) => row.status === 'invalid' || (row.validationErrors ?? []).length > 0);
  const readyRowIds = readyRows.map((row) => row.id);

  return (
    <div className="space-y-6 pb-10">
      <div className="sticky top-0 z-20 border-b border-border bg-background/95 py-4 backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-lg p-2 hover:bg-muted/60"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">Import Opening Stock</h1>
              <p className="text-sm text-muted-foreground">
                Upload the CSV, fix staged rows, then import stock into inventory.
              </p>
            </div>
          </div>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6">
        <SectionCard
          icon={PackageSearch}
          title="Template Helper"
          description="Search product SKUs and review the expected file structure."
          headerAction={
            <button
              type="button"
              onClick={() => setIsTemplateHelperOpen((current) => !current)}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted/60"
              aria-expanded={isTemplateHelperOpen}
              aria-controls="template-helper-body"
            >
              {isTemplateHelperOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {isTemplateHelperOpen ? 'Hide' : 'Show'}
            </button>
          }
        >
          <div id="template-helper-body" className="space-y-5">
            {isTemplateHelperOpen ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="bg-muted/20 p-4">
                    <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                      <p>Use the location codes below for your business locations.</p>
                      {firstLocation ? (
                        <div>
                          <div className="flex items-start gap-2">
                            <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                            <div>
                              <p className="font-medium text-foreground">
                                {firstLocation.locationName}({firstLocation.locationCode || firstLocation.locationId})
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-amber-600">No locations have been created yet.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-muted/20 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">SKU Search</p>
                      <p className="text-xs text-muted-foreground">Quickly find a product SKU before preparing the CSV.</p>
                    </div>
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input value={skuQuery} onChange={setSkuQuery} placeholder="Type a product SKU or name..." />
                  <div className="mt-3 max-h-72 space-y-2 overflow-auto pr-1">
                    {skuSearching ? (
                      <div className="flex items-center gap-2 rounded-lg border border-border bg-background p-3 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Searching products...
                      </div>
                    ) : skuResults.length > 0 ? (
                      skuResults.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => setSkuQuery(product.sku || product.name)}
                          className="flex w-full items-start justify-between gap-3 rounded-lg border border-border bg-background p-3 text-left transition hover:border-primary/50 hover:bg-primary/5"
                        >
                          <div>
                            <p className="font-medium text-foreground">{product.name}</p>
                            <p className="text-xs text-muted-foreground">SKU: {product.sku || 'N/A'}</p>
                          </div>
                          <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                            {product.productType}
                          </span>
                        </button>
                      ))
                    ) : skuQuery.trim().length >= 3 ? (
                      <div className="rounded-lg border border-border bg-background p-3 text-sm text-muted-foreground">
                        No products matched that search.
                      </div>
                    ) : (
                      <div className="rounded-lg border border-border bg-background p-3 text-sm text-muted-foreground">
                        Search by SKU to quickly reference the product before importing stock.
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </SectionCard>
        <SectionCard
          icon={Upload}
          title="Upload CSV"
          description="Use the template to stage opening stock rows before importing them."
        >
          <div className="space-y-4">
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center">
              <FileSpreadsheet className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium text-foreground">Drop your CSV here or choose a file</p>
              <p className="mt-1 text-xs text-muted-foreground">
                CSV only. The template includes SKU, location, quantity, unit cost, lot number, and expiry date.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {selectedFile ? 'Replace File' : 'Choose File'}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  disabled={isDownloading}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted/60 disabled:opacity-60"
                >
                  {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Download Template
                </button>
                {batch ? (
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted/60"
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </button>
                ) : null}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              />
              {selectedFile ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  Selected file: <span className="font-medium text-foreground">{selectedFile.name}</span>
                </p>
              ) : null}
            </div>
            
          </div>
        </SectionCard>

        
      </div>

      {batch ? (
        <SectionCard
          icon={FileSpreadsheet}
          title="Preview Uploaded Products"
          description={`File: ${batch.fileName || 'Opening stock import'} · ${rows.length} row(s) loaded`}
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span>
                <span className="font-medium text-foreground">{readyRows.length}</span> ready to submit
              </span>
              <span>
                <span className="font-medium text-foreground">{processedRows.length}</span> processed
              </span>
              <span>
                <span className="font-medium text-foreground">{invalidRows.length}</span> need fixing
              </span>
            </div>
            {readyRowIds.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  void processReadyRows(batch.id, readyRowIds).then(() => {
                    toast.success('Ready rows processed successfully');
                  }).catch((err) => {
                    const message = err instanceof Error ? err.message : 'Failed to process ready rows';
                    toast.error(message);
                  });
                }}
                disabled={isProcessingRows}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {isProcessingRows ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Submit Ready Rows
              </button>
            ) : null}
          </div>
          <div className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-[1200px] divide-y divide-border text-sm">
                <thead className="bg-muted/40">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Qty</th>
                    <th className="px-4 py-3">Unit Cost</th>
                    <th className="px-4 py-3">Lot Number</th>
                    <th className="px-4 py-3">Expiry</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Errors</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-background">
                  {rows.map((row) => {
                    const locationValue = row.rowData.location || row.locationId || 'First location';
                    const rowErrors = row.validationErrors ?? [];
                    const canImport = row.status === 'valid' && rowErrors.length === 0;
                    return (
                      <tr key={row.id}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{formatValue(row.sku || row.rowData.sku || 'Unknown SKU')}</p> 
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{formatValue(locationValue)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatValue(row.quantity || row.rowData.quantity)}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatValue(row.unitCostBeforeTax || row.rowData.unit_cost_before_tax)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{formatValue(row.lotNumber || row.rowData.lot_number)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatValue(row.expiryDate || row.rowData.expiry_date)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${previewStatusClass(row.status)}`}>
                            {previewStatusLabel(row.status)}
                          </span>
                          {rowErrors.length > 0 ? (
                            <p className="mt-2 text-xs text-rose-600">{rowErrors.length} validation issue(s)</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {rowErrors.length > 0 ? (
                            <div className="space-y-1">
                              {rowErrors.slice(0, 2).map((error) => (
                                <p key={error}>{error}</p>
                              ))}
                              {rowErrors.length > 2 ? <p>+{rowErrors.length - 2} more</p> : null}
                            </div>
                          ) : (
                            <span className="text-emerald-600">No errors</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => openEditRow(row)}
                              disabled={isProcessedStatus(row.status)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              {isProcessedStatus(row.status) ? 'Locked' : 'Update'}
                            </button>
                            {canImport ? (
                              <button
                                type="button"
                                onClick={() => setSubmitConfirmRow(row)}
                                disabled={isProcessingRows}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Submit
                              </button>
                            ) : null}
                            {isProcessedStatus(row.status) ? (
                              <span className="inline-flex items-center rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
                                Processed
                              </span>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </SectionCard>
      ) : null}

      {editingRow ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-0 lg:p-6">
          <div className="flex h-full w-full flex-col overflow-hidden bg-background lg:h-[90vh] lg:w-[80vw] lg:rounded-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Update Opening Stock Row</h3>
                <p className="text-sm text-muted-foreground">Fix the staged data before importing.</p>
              </div>
              <button
                type="button"
                onClick={closeEditRow}
                className="rounded-lg p-2 hover:bg-muted/60"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {editError ? (
                <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>{editError}</p>
                  </div>
                </div>
              ) : null}

              {(editingRow.validationErrors ?? []).length > 0 ? (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  <p className="font-medium">Current validation issues</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {(editingRow.validationErrors ?? []).map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="grid gap-4 xl:grid-cols-2">
                <SectionCard
                  icon={PackageSearch}
                  title="Product & Location"
                  description="Edit the product SKU and the branch/location for this row."
                >
                  <div className="space-y-4">
                    <div>
                      <FieldLabel>SKU</FieldLabel>
                      <Input value={editForm.sku} onChange={(value) => setEditForm((current) => ({ ...current, sku: value }))} />
                      {editFieldErrors.sku.length > 0 ? (
                        <p className="mt-1 text-xs text-destructive">{editFieldErrors.sku[0]}</p>
                      ) : null}
                    </div>
                    <div>
                      <FieldLabel>Location</FieldLabel>
                      <Input
                        value={editForm.location}
                        onChange={(value) => setEditForm((current) => ({ ...current, location: value }))}
                        placeholder="Location name or code"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Leave blank to use the first business location.
                      </p>
                      {editFieldErrors.location.length > 0 ? (
                        <p className="mt-1 text-xs text-destructive">{editFieldErrors.location[0]}</p>
                      ) : null}
                    </div>
                  </div>
                </SectionCard>

                <SectionCard
                  icon={FileSpreadsheet}
                  title="Stock Details"
                  description="Correct the opening stock numbers and batch information."
                >
                  <div className="space-y-4">
                    <div>
                      <FieldLabel>Quantity</FieldLabel>
                      <Input
                        value={editForm.quantity}
                        onChange={(value) => setEditForm((current) => ({ ...current, quantity: value }))}
                        type="number"
                        placeholder="0"
                      />
                      {editFieldErrors.quantity.length > 0 ? (
                        <p className="mt-1 text-xs text-destructive">{editFieldErrors.quantity[0]}</p>
                      ) : null}
                    </div>
                    <div>
                      <FieldLabel>Unit Cost (Before Tax)</FieldLabel>
                      <Input
                        value={editForm.unitCostBeforeTax}
                        onChange={(value) => setEditForm((current) => ({ ...current, unitCostBeforeTax: value }))}
                        type="number"
                        placeholder="0.00"
                      />
                      {editFieldErrors.unitCostBeforeTax.length > 0 ? (
                        <p className="mt-1 text-xs text-destructive">{editFieldErrors.unitCostBeforeTax[0]}</p>
                      ) : null}
                    </div>
                    <div>
                      <FieldLabel>Lot Number</FieldLabel>
                      <Input
                        value={editForm.lotNumber}
                        onChange={(value) => setEditForm((current) => ({ ...current, lotNumber: value }))}
                      />
                      {editFieldErrors.lotNumber.length > 0 ? (
                        <p className="mt-1 text-xs text-destructive">{editFieldErrors.lotNumber[0]}</p>
                      ) : null}
                    </div>
                    <div>
                      <FieldLabel>Expiry Date</FieldLabel>
                      <Input
                        value={editForm.expiryDate}
                        onChange={(value) => setEditForm((current) => ({ ...current, expiryDate: value }))}
                        placeholder="mm/dd/yyyy"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">Use the business date format mm/dd/yyyy.</p>
                      {editFieldErrors.expiryDate.length > 0 ? (
                        <p className="mt-1 text-xs text-destructive">{editFieldErrors.expiryDate[0]}</p>
                      ) : null}
                    </div>
                  </div>
                </SectionCard>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border px-5 py-4">
              <button
                type="button"
                onClick={closeEditRow}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted/60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditedRow}
                disabled={isSavingRow || isProcessedStatus(editingRow.status)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {isSavingRow ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {submitConfirmRow ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-background shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Confirm Opening Stock Submission</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Review the row details before processing it into inventory.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSubmitConfirmRow(null)}
                className="rounded-lg p-2 hover:bg-muted/60"
                aria-label="Close confirmation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <div className="grid gap-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Product</span>
                    <span className="font-medium text-foreground">
                      {formatValue(submitConfirmRow.sku || submitConfirmRow.rowData.sku || 'Unknown SKU')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Cost Price</span>
                    <span className="font-medium text-foreground">
                      {formatValue(submitConfirmRow.unitCostBeforeTax || submitConfirmRow.rowData.unit_cost_before_tax || '0')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Quantity</span>
                    <span className="font-medium text-foreground">
                      {Math.max(0, Number(submitConfirmRow.quantity || submitConfirmRow.rowData.quantity || 0))}
                    </span>
                  </div>
                </div>
                {Number(submitConfirmRow.quantity || submitConfirmRow.rowData.quantity || 0) < 0 ? (
                  <p className="mt-3 text-xs text-rose-600">Quantity cannot be negative.</p>
                ) : null}
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSubmitConfirmRow(null)}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted/60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleImportRow(submitConfirmRow)}
                  disabled={isProcessingRows || Number(submitConfirmRow.quantity || submitConfirmRow.rowData.quantity || 0) < 0}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                >
                  {isProcessingRows ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Confirm & Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {batch ? (
        <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{readyRows.length}</span> ready to submit
          <span className="mx-2">•</span>
          <span className="font-medium text-foreground">{processedRows.length}</span> processed
          <span className="mx-2">•</span>
          <span className="font-medium text-foreground">{invalidRows.length}</span> need fixing
        </div>
      ) : null}
    </div>
  );
}
