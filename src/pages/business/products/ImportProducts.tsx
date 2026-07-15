import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Layers3,
  Loader2,
  Edit2,
  Shield,
  Save,
  X,
  Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { apiDownload, apiRequest, ApiError } from '@/lib/api';
import { useBusinessLocations } from '@/hooks/business/settings/useBusinessLocations';
import { useCategories } from '@/hooks/business/categories/useCategories';
import { useSubCategories } from '@/hooks/business/subcategories/useSubCategories';
import { useBusinessBrands } from '@/hooks/business/brands/useBusinessBrands';
import { useBusinessUnits } from '@/hooks/business/units/useBusinessUnits';

type ImportRow = {
  id: string;
  batchId: string;
  rowNumber: number;
  rowData: Record<string, string>;
  validationErrors: string[];
  status: string;
  importedProductId: string;
  createdAt: string;
  updatedAt: string;
};

type ImportBatch = {
  id: string;
  businessId: string;
  fileName: string;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

type ImportPreviewResponse = {
  batch: ImportBatch;
  rows: ImportRow[];
  message: string;
};

type ImportRowFormState = {
  name: string;
  sku: string;
  barcode: string;
  productType: string;
  unit: string;
  brand: string;
  categoryCode: string;
  subCategoryCode: string;
  locationCode: string;
  manageStock: boolean;
  alertQuantity: string;
  isForSelling: boolean;
  taxType: string;
  taxRate: string;
  defaultPurchasePrice: string;
  defaultSellingPrice: string;
  description: string;
};

const EMPTY_ROW_FORM: ImportRowFormState = {
  name: '',
  sku: '',
  barcode: '',
  productType: 'single',
  unit: '',
  brand: '',
  categoryCode: '',
  subCategoryCode: '',
  locationCode: '',
  manageStock: true,
  alertQuantity: '2',
  isForSelling: true,
  taxType: 'exclusive',
  taxRate: '16',
  defaultPurchasePrice: '',
  defaultSellingPrice: '',
  description: '',
};

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full border p-0.5 transition-colors ${
        checked ? 'border-primary bg-primary/20' : 'border-border bg-background'
      }`}
    >
      <span
        className={`h-5 w-5 rounded-full shadow-sm transition-transform ${
          checked ? 'translate-x-5 bg-primary' : 'translate-x-0 bg-muted-foreground'
        }`}
      />
    </button>
  );
}

function normalizeHeader(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[\s/-]+/g, '_')
    .replace(/__+/g, '_');
}

function labelForStatus(status: string) {
  switch (status) {
    case 'valid':
      return 'Ready';
    case 'invalid':
      return 'Needs Fixing';
    case 'imported':
      return 'Imported';
    case 'error':
      return 'Error';
    default:
      return status || 'Pending';
  }
}

function getStatusPillClass(status: string) {
  switch (status) {
    case 'valid':
      return 'bg-emerald-100 text-emerald-700';
    case 'invalid':
      return 'bg-amber-100 text-amber-700';
    case 'imported':
      return 'bg-primary/10 text-primary';
    case 'error':
      return 'bg-rose-100 text-rose-700';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function stringifyRowValue(value: string | number | boolean | null | undefined) {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value === null || value === undefined) return '';
  return String(value);
}

export default function ImportProducts() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [batch, setBatch] = useState<ImportBatch | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [editingRow, setEditingRow] = useState<ImportRow | null>(null);
  const [editForm, setEditForm] = useState<ImportRowFormState>(EMPTY_ROW_FORM);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showLocations, setShowLocations] = useState(true);
  const [showCategories, setShowCategories] = useState(true);
  const [showSubCategories, setShowSubCategories] = useState(false);
  const [showBrands, setShowBrands] = useState(false);

  const { locations, loadBusinessLocations, isLoading: loadingLocations } = useBusinessLocations();
  const { categories, fetchCategories, isLoading: loadingCategories } = useCategories();
  const { subCategories, fetchSubCategories, isLoading: loadingSubCategories } = useSubCategories();
  const { brands, loadBrands, isLoading: loadingBrands } = useBusinessBrands();
  const { units, loadUnits, isLoading: loadingUnits } = useBusinessUnits();

  useEffect(() => {
    void loadBusinessLocations();
    void fetchCategories();
    void fetchSubCategories();
    void loadBrands();
    void loadUnits();
  }, [fetchCategories, fetchSubCategories, loadBrands, loadUnits, loadBusinessLocations]);

  const importInstructions = useMemo(
    () => [
      'Download the CSV template.',
      'Fill one product per row and keep the headers unchanged.',
      'Upload the file to preview the staged rows.',
      'Fix any validation errors in the source file and re-upload.',
      'Import the valid rows one by one from the preview table.',
    ],
    [],
  );

  const templateDetails = useMemo(
    () => [
      {
        title: 'Location code',
        lines: locations.map((location) => ({
          primary: location.locationName,
          secondary: location.locationCode || location.locationId,
        })),
        enabled: showLocations,
        setEnabled: setShowLocations,
      },
      {
        title: 'Categories',
        lines: categories.map((category) => ({
          primary: category.name,
          secondary: category.categoryCode,
        })),
        enabled: showCategories,
        setEnabled: setShowCategories,
      },
      {
        title: 'Sub-categories',
        lines: subCategories.map((subCategory) => ({
          primary: subCategory.name,
          secondary: subCategory.subCategoryCode,
        })),
        enabled: showSubCategories,
        setEnabled: setShowSubCategories,
      },
      {
        title: 'Brands',
        lines: brands.map((brand) => ({
          primary: brand.name,
          secondary: brand.shortDescription || 'No description',
        })),
        enabled: showBrands,
        setEnabled: setShowBrands,
      },
    ],
    [brands, categories, locations, showBrands, showCategories, showLocations, showSubCategories, subCategories],
  );

  const handleDownloadTemplate = async () => {
    setIsDownloading(true);
    try {
      const { blob, filename } = await apiDownload('/products/import/template.csv');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'product_import_template.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Template downloaded successfully');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to download template';
      toast.error(message);
    } finally {
      setIsDownloading(false);
    }
  };

  const refreshBatch = async (batchId: string) => {
    const response = await apiRequest<ImportPreviewResponse>(`/products/import/batches/${batchId}`);
    setBatch(response.batch);
    setRows(response.rows ?? []);
  };

  const loadLatestBatch = useCallback(async () => {
    try {
      const response = await apiRequest<ImportPreviewResponse>('/products/import/batches/latest');
      setBatch(response.batch);
      setRows(response.rows ?? []);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return;
      }

      const message = err instanceof ApiError ? err.message : 'Failed to load staged imports';
      toast.error(message);
    }
  }, []);

  const openEditRow = (row: ImportRow) => {
    setEditingRow(row);
    setEditError(null);
    setEditForm({
      name: row.rowData.name || '',
      sku: row.rowData.sku || '',
      barcode: row.rowData.barcode || '',
      productType: row.rowData.product_type || 'single',
      unit: row.rowData.unit || '',
      brand: row.rowData.brand || '',
      categoryCode: row.rowData.category_code || '',
      subCategoryCode: row.rowData.sub_category_code || '',
      locationCode: row.rowData.location_code || '',
      manageStock: (row.rowData.manage_stock || 'true').toLowerCase() !== 'false',
      alertQuantity: row.rowData.alert_quantity || '2',
      isForSelling: (row.rowData.is_for_selling || 'true').toLowerCase() !== 'false',
      taxType: row.rowData.tax_type || 'exclusive',
      taxRate: row.rowData.tax_rate || '16',
      defaultPurchasePrice: row.rowData.default_purchase_price || '',
      defaultSellingPrice: row.rowData.default_selling_price || '',
      description: row.rowData.description || '',
    });
  };

  const closeEditRow = () => {
    setEditingRow(null);
    setEditForm(EMPTY_ROW_FORM);
    setEditError(null);
    setEditSaving(false);
  };

  const handleSaveEditedRow = async () => {
    if (!batch || !editingRow) {
      return;
    }

    setEditSaving(true);
    setEditError(null);

    try {
      const response = await apiRequest<{ message: string; row: ImportRow; validationErrors: string[] }>(
        `/products/import/batches/${batch.id}/rows/${editingRow.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            productName: editForm.name,
            sku: editForm.sku,
            barcode: editForm.barcode,
            productType: editForm.productType,
            unit: editForm.unit,
            brand: editForm.brand,
            categoryCode: editForm.categoryCode,
            subCategoryCode: editForm.subCategoryCode,
            locationCode: editForm.locationCode,
            manageStock: editForm.manageStock,
            alertQuantity: editForm.alertQuantity,
            isForSelling: editForm.isForSelling,
            taxType: editForm.taxType,
            taxRate: editForm.taxRate,
            defaultPurchasePrice: editForm.defaultPurchasePrice,
            defaultSellingPrice: editForm.defaultSellingPrice,
            description: editForm.description,
          }),
        },
      );

      setRows((current) => current.map((item) => (item.id === response.row.id ? response.row : item)));
      setEditingRow(null);
      setEditForm(EMPTY_ROW_FORM);
      toast.success(response.message || 'Row updated successfully');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update import row';
      setEditError(message);
      toast.error(message);
    } finally {
      setEditSaving(false);
    }
  };

  const editErrors = useMemo(
    () => ({
      productDetails: editingRow?.validationErrors.filter((error) =>
        /product name|sku|barcode|description/i.test(error),
      ) ?? [],
      classification: editingRow?.validationErrors.filter((error) =>
        /unit|category|sub-category|sub category|brand|location|product type/i.test(error),
      ) ?? [],
      pricing: editingRow?.validationErrors.filter((error) =>
        /stock|alert quantity|tax type|tax rate|purchase price|selling price|selling/i.test(error),
      ) ?? [],
    }),
    [editingRow],
  );

  const handleUpload = useCallback(async (fileToUpload: File) => {
    setErrorMessage(null);

    if (!fileToUpload.name.toLowerCase().endsWith('.csv')) {
      const message = 'Please upload a CSV file.';
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', fileToUpload);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api'}/products/import/preview`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const payload = (await response.json()) as ImportPreviewResponse & { message?: string; errors?: Record<string, string> };

      if (!response.ok) {
        const message = payload?.message || 'Failed to upload product import file';
        throw new ApiError(message, response.status, payload);
      }

      setBatch(payload.batch);
      setRows(payload.rows ?? []);
      toast.success(payload.message || 'Product import preview loaded successfully');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to upload product import file';
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  }, []);

  useEffect(() => {
    void loadLatestBatch();
  }, [loadLatestBatch]);

  useEffect(() => {
    if (!selectedFile) {
      return;
    }

    void handleUpload(selectedFile);
  }, [handleUpload, selectedFile]);

  const handleImportRow = async (rowId: string) => {
    if (!batch) {
      return;
    }

    try {
      await apiRequest(`/products/import/batches/${batch.id}/rows/${rowId}/import`, {
        method: 'POST',
      });
      await refreshBatch(batch.id);
      toast.success('Product imported successfully');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to import product row';
      toast.error(message);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setBatch(null);
    setRows([]);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">Import Products</h1>
              <p className="text-sm text-muted-foreground">
                Download the template, stage the rows, then import valid products one by one.
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

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard
          icon={Upload}
          title="Upload CSV"
          description="Use the template to stage products before importing them into the catalog."
        >
          <div className="space-y-4">
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center">
              <FileSpreadsheet className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium text-foreground">Drag and drop your CSV here</p>
              <p className="mt-1 text-xs text-muted-foreground">Only CSV is supported for now. Excel can open the template directly.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  disabled={isDownloading}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Download CSV
                </button>
                <label className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/40">
                  <Upload className="h-4 w-4" />
                  Choose File
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(event) => {
                      const nextFile = event.target.files?.[0] ?? null;
                      setBatch(null);
                      setRows([]);
                      setSelectedFile(nextFile);
                      setErrorMessage(null);
                    }}
                  />
                </label>
              </div>
              {selectedFile ? (
                <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-background px-3 py-2 text-sm text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{selectedFile.name}</span>
                  <span className="text-xs text-muted-foreground">({Math.round(selectedFile.size / 1024)} KB)</span>
                  <button type="button" onClick={clearSelection} className="ml-2 text-xs text-destructive hover:underline">
                    Remove
                  </button>
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-border bg-muted/20 p-4">
              <p className="text-sm font-semibold text-foreground">Import Steps</p>
              <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
                {importInstructions.map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          icon={Layers3}
          title="Template Helper"
          description="Open the toggles to review the names and codes you can use in the CSV file."
        >
          <div className="space-y-3">
            {templateDetails.map((section) => (
              <div key={section.title} className="rounded-2xl border border-border bg-background">
                <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{section.title}</p>
                    <p className="text-xs text-muted-foreground">{section.lines.length} records available</p>
                  </div>
                  <ToggleSwitch
                    checked={section.enabled}
                    onChange={() => section.setEnabled((current) => !current)}
                    label={section.title}
                  />
                </div>
                {section.enabled ? (
                  <div className="max-h-52 overflow-y-auto p-3">
                    {section.lines.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No records available yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {section.lines.map((item, index) => (
                          <div key={`${section.title}-${index}`} className="rounded-xl border border-border px-3 py-2">
                            <p className="text-sm font-medium text-foreground">{item.primary}</p>
                            <p className="text-xs text-muted-foreground">{item.secondary}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {batch ? (
        <SectionCard
          icon={Shield}
          title="Preview Staging"
          description={`Batch ${batch.fileName} is staged and ready. Fix any invalid rows before importing.`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div className="text-sm text-muted-foreground">
              {rows.length} rows staged
              <span className="mx-2">•</span>
              <span className="font-medium text-foreground">{rows.filter((row) => row.status === 'valid').length}</span> valid
              <span className="mx-2">•</span>
              <span className="font-medium text-foreground">{rows.filter((row) => row.status !== 'valid').length}</span> need attention
            </div>
            <button
              type="button"
              onClick={() => refreshBatch(batch.id).catch(() => undefined)}
              className="rounded-xl border border-border px-3 py-2 text-sm text-foreground hover:bg-muted/40"
            >
              Refresh Preview
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[1100px] w-full divide-y divide-border">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Row</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Unit</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">&nbsp;</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background">
                {rows.map((row) => {
                  const data = row.rowData;
                  const canImport = row.status === 'valid' || row.status === 'previewed' || row.status === 'pending';
                  return (
                    <tr key={row.id} className="align-top hover:bg-muted/10">
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">{row.rowNumber}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">{data.name || 'Unnamed product'}</p>
                        <p className="text-xs text-muted-foreground">
                          SKU: {data.sku || 'auto'}
                          {data.barcode ? ` • Barcode: ${data.barcode}` : ''}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        <p>{data.category_code || 'n/a'}</p>
                        <p className="text-xs">{data.sub_category_code || 'n/a'}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{data.location_code || 'n/a'}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{data.unit || 'n/a'}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-muted-foreground">
                        {stringifyRowValue(data.default_selling_price || data.default_purchase_price || 0)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusPillClass(row.status)}`}>
                          {labelForStatus(row.status)}
                        </span>
                        {row.validationErrors.length > 0 ? (
                          <ul className="mt-2 space-y-1 text-xs text-rose-600">
                            {row.validationErrors.map((error) => (
                              <li key={error}>• {error}</li>
                            ))}
                          </ul>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {row.validationErrors.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => openEditRow(row)}
                              className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/40"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              Update
                            </button>
                          ) : null}
                          <button
                            type="button"
                            disabled={!canImport}
                            onClick={() => handleImportRow(row.id)}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Import Row
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      ) : (
        <SectionCard
          icon={AlertCircle}
          title="No staged upload yet"
          description="Upload a CSV to create a temporary preview batch before importing."
        >
          <p className="text-sm text-muted-foreground">
            The staged preview lets the team fix errors first and then import rows one at a time.
          </p>
        </SectionCard>
      )}

      {editingRow ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4">
          <div className="flex h-full w-full max-h-[100vh] flex-col overflow-hidden rounded-2xl bg-background shadow-2xl lg:w-[80vw] lg:max-w-[80vw]">
            <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-4 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Edit staged row #{editingRow.rowNumber}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">
                  {editForm.name || 'Unnamed product'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Update the row data, save it, and the errors will clear once validation passes.
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditRow}
                className="rounded-xl p-2 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
              {editError ? (
                <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  {editError}
                </div>
              ) : null}

              {editingRow.validationErrors.length > 0 ? (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  <p className="font-semibold">Current issues</p>
                  <ul className="mt-2 space-y-1">
                    {editingRow.validationErrors.map((error) => (
                      <li key={error}>• {error}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="grid gap-4 lg:grid-cols-2">
                <CardGroup
                  title="Product Details"
                  description="Core product information from the upload."
                  errors={editErrors.productDetails}
                >
                  <FieldInput label="Product Name" value={editForm.name} onChange={(value) => setEditForm((current) => ({ ...current, name: value }))} />
                  <FieldInput label="SKU" value={editForm.sku} onChange={(value) => setEditForm((current) => ({ ...current, sku: value }))} />
                  <FieldInput label="Barcode" value={editForm.barcode} onChange={(value) => setEditForm((current) => ({ ...current, barcode: value }))} />
                  <FieldInput label="Description" value={editForm.description} onChange={(value) => setEditForm((current) => ({ ...current, description: value }))} textarea />
                </CardGroup>

                <CardGroup
                  title="Classification"
                  description="Link the product to the right catalog values."
                  errors={editErrors.classification}
                >
                  <FieldInput label="Product Type" value={editForm.productType} onChange={(value) => setEditForm((current) => ({ ...current, productType: value }))} />
                  <FieldInput label="Unit" value={editForm.unit} onChange={(value) => setEditForm((current) => ({ ...current, unit: value }))} />
                  <FieldInput label="Brand" value={editForm.brand} onChange={(value) => setEditForm((current) => ({ ...current, brand: value }))} />
                  <FieldInput label="Category Code" value={editForm.categoryCode} onChange={(value) => setEditForm((current) => ({ ...current, categoryCode: value }))} />
                  <FieldInput label="Sub-category Code" value={editForm.subCategoryCode} onChange={(value) => setEditForm((current) => ({ ...current, subCategoryCode: value }))} />
                  <FieldInput label="Location Code" value={editForm.locationCode} onChange={(value) => setEditForm((current) => ({ ...current, locationCode: value }))} />
                </CardGroup>

                <CardGroup
                  title="Pricing"
                  description="Quantities and prices used during import."
                  errors={editErrors.pricing}
                >
                  <FieldInput label="Manage Stock" value={editForm.manageStock ? 'true' : 'false'} onChange={(value) => setEditForm((current) => ({ ...current, manageStock: value.toLowerCase() !== 'false' }))} />
                  <FieldInput label="Alert Quantity" value={editForm.alertQuantity} onChange={(value) => setEditForm((current) => ({ ...current, alertQuantity: value }))} />
                  <FieldInput label="Is For Selling" value={editForm.isForSelling ? 'true' : 'false'} onChange={(value) => setEditForm((current) => ({ ...current, isForSelling: value.toLowerCase() !== 'false' }))} />
                  <FieldInput label="Tax Type" value={editForm.taxType} onChange={(value) => setEditForm((current) => ({ ...current, taxType: value }))} />
                  <FieldInput label="Tax Rate" value={editForm.taxRate} onChange={(value) => setEditForm((current) => ({ ...current, taxRate: value }))} />
                  <FieldInput label="Default Purchase Price" value={editForm.defaultPurchasePrice} onChange={(value) => setEditForm((current) => ({ ...current, defaultPurchasePrice: value }))} />
                  <FieldInput label="Default Selling Price" value={editForm.defaultSellingPrice} onChange={(value) => setEditForm((current) => ({ ...current, defaultSellingPrice: value }))} />
                </CardGroup>

                <CardGroup title="Status Summary" description="Validation updates after saving the row.">
                  <div className="rounded-xl border border-border bg-muted/20 p-3 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">Current status</p>
                    <p className="mt-1">{labelForStatus(editingRow.status)}</p>
                    <p className="mt-3 text-xs">
                      After you save, this record is re-validated and marked error-free if all required values are valid.
                    </p>
                  </div>
                </CardGroup>
              </div>
            </div>

            <div className="border-t border-border px-4 py-4 sm:px-6">
              <div className="flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEditRow}
                  className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/40"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditedRow}
                  disabled={editSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {editSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}

function CardGroup({
  title,
  description,
  errors,
  children,
}: {
  title: string;
  description?: string;
  errors?: string[];
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
        {errors && errors.length > 0 ? (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            <p className="font-semibold">Needs attention</p>
            <ul className="mt-1 space-y-1">
              {errors.map((error) => (
                <li key={error}>• {error}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      )}
    </label>
  );
}

 
