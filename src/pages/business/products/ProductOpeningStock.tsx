import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Select, { type StylesConfig } from 'react-select';
import DatePickerField from '@/components/forms/DatePickerField';
import { useBusinessLocations, type BusinessLocationRecord } from '@/hooks/business/settings/useBusinessLocations';
import { useBusinessSettings } from '@/hooks/business/settings/useBusinessSettings';
import { useProductSettings } from '@/hooks/business/settings/useProductSettings';
import { usePurchasesSettings } from '@/hooks/business/settings/usePurchasesSettings';
import { useProduct, type ProductDetails as ProductDetailsType } from '@/hooks/business/products/useProducts';
import { formatProductSkuDisplay } from '@/lib/productSku';
import { ApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  DollarSign,
  Hash,
  Layers,
  MapPin,
  Package,
  Plus,
  X,
  Trash2,
  Edit,
  Eye,
  Calendar,
  Tag,
  FileText,
  AlertCircle,
} from 'lucide-react';

type SelectOption = {
  value: string;
  label: string;
};

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

type Batch = {
  id: string;
  locationId: string;
  quantity: number;
  unitCost: number;
  sellingPrice: number;
  expiryDate: string;
  lotNumber: string;
  notes: string;
};

type BatchFormData = Omit<Batch, 'id'>;

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function formatMoney(amount: number, currencyCode: string, precision: number, placement: 'before' | 'after') {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const currencySymbol = getCurrencySymbol(currencyCode);
  const numeric = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(safeAmount);

  return placement === 'after' ? `${numeric} ${currencySymbol}` : `${currencySymbol} ${numeric}`;
}

function getCurrencySymbol(currencyCode?: string) {
  if (!currencyCode) return '$';
  try {
    const formatter = new Intl.NumberFormat('en', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return formatter.formatToParts(1).find((part) => part.type === 'currency')?.value ?? '$';
  } catch {
    return '$';
  }
}

function getProductImageSrc(product: ProductDetailsType | null) {
  if (!product) return `https://ui-avatars.com/api/?name=Product`;
  if (product.imageUrl) return product.imageUrl;
  const primaryImage = product.images?.find((image) => image.isPrimary)?.url ?? product.images?.[0]?.url;
  if (primaryImage) return primaryImage;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name || 'Product')}`;
}

function createEmptyBatch(): BatchFormData {
  return {
    locationId: '',
    quantity: 0,
    unitCost: 0,
    sellingPrice: 0,
    expiryDate: '',
    lotNumber: '',
    notes: '',
  };
}

function generateId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const selectStyles: StylesConfig<SelectOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: '42px',
    borderRadius: '0.125rem',
    borderColor: state.isFocused ? 'hsl(var(--primary))' : 'hsl(var(--border))',
    backgroundColor: 'hsl(var(--background))',
    boxShadow: state.isFocused ? '0 0 0 1px hsl(var(--primary))' : 'none',
    '&:hover': { borderColor: 'hsl(var(--primary))' },
  }),
  valueContainer: (base) => ({ ...base, padding: '0 0.75rem' }),
  placeholder: (base) => ({ ...base, color: 'hsl(var(--muted-foreground))' }),
  singleValue: (base) => ({ ...base, color: 'hsl(var(--foreground))' }),
  input: (base) => ({ ...base, color: 'hsl(var(--foreground))' }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? 'hsl(var(--primary))'
      : state.isFocused
        ? 'hsl(var(--muted))'
        : 'hsl(var(--background))',
    color: state.isSelected ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
  }),
  menu: (base) => ({ ...base, zIndex: 60, backgroundColor: 'hsl(var(--background))' }),
  menuPortal: (base) => ({ ...base, zIndex: 60 }),
  indicatorSeparator: (base) => ({ ...base, backgroundColor: 'hsl(var(--border))' }),
};

// --------------------------------------------------------------------------
// Sub-components
// --------------------------------------------------------------------------

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-sm border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="text-lg font-semibold text-foreground">{value}</div>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-sm border border-border bg-card p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-border bg-muted/50 text-foreground">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-foreground">{title}</h2>
      </div>
      {children}
    </section>
  );
}

// --------------------------------------------------------------------------
// Main Component
// --------------------------------------------------------------------------

export default function ProductOpeningStock() {
  const { id: productId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { settings: businessSettings } = useBusinessSettings();
  const { settings: productSettings } = useProductSettings();
  const { settings: purchasesSettings } = usePurchasesSettings();
  const { locations } = useBusinessLocations();
  const { getProduct, error } = useProduct();

  const [product, setProduct] = useState<ProductDetailsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [formData, setFormData] = useState<BatchFormData>(createEmptyBatch());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const currencyCode = businessSettings?.currency || 'USD';
  const currencyPrecision = typeof businessSettings?.currencyPrecision === 'number' ? businessSettings.currencyPrecision : 2;
  const currencyPlacement = businessSettings?.currencySymbolPlacement === 'after' ? 'after' : 'before';
  const skuPrefix = businessSettings?.skuPrefix || '';
  
  // Business settings flags
  const enableExpiry = Boolean(productSettings?.enableProductExpiry);
  const enableLotNumber = Boolean(purchasesSettings?.enableLotNumber);
  
  // Determine if we can have multiple batches
  const canHaveMultipleBatches = enableExpiry;

  useEffect(() => {
    if (!productId) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const productData = await getProduct(productId);
        setProduct(productData);
        
        // If no expiry, initialize with one batch if none exist
        if (!enableExpiry && productData) {
          // Check if we need to load existing opening stock
          // For now, initialize with empty batch
          setBatches([{
                id: generateId(),
            locationId: '',
            quantity: 0,
            unitCost: 0,
            sellingPrice: productData.defaultSellingPrice || 0,
            expiryDate: '',
            lotNumber: '',
            notes: '',
          }]);
        }
      } catch (err) {
        if (err instanceof ApiError) {
          toast.error(err.message || 'Failed to load opening stock details');
        } else {
          toast.error('Failed to load opening stock details');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [productId, getProduct, enableExpiry]);

  const formattedSku = product?.sku ? formatProductSkuDisplay(product.sku, skuPrefix) : 'N/A';
  const heroImageSrc = useMemo(() => getProductImageSrc(product), [product]);
  const locationOptions = useMemo(
    () => locations.map((location) => ({ value: location.id, label: location.locationName })),
    [locations],
  );
  const locationNameById = useMemo(
    () => new Map(locations.map((location) => [location.id, location.locationName])),
    [locations],
  );

  useEffect(() => {
    if (!formData.locationId && locations.length > 0) {
      setFormData((current) => ({
        ...current,
        locationId: product?.locationIds?.[0] || locations[0].id,
      }));
    }
  }, [formData.locationId, locations, product]);

  const totalQuantity = useMemo(
    () => batches.reduce((sum, batch) => sum + (batch.quantity || 0), 0),
    [batches],
  );

  const totalValue = useMemo(
    () => batches.reduce((sum, batch) => sum + (batch.quantity || 0) * (batch.unitCost || 0), 0),
    [batches],
  );

  // Reset form
  const resetForm = () => {
    setFormData({
      locationId: product?.locationIds?.[0] || locations[0]?.id || '',
      quantity: 0,
      unitCost: 0,
      sellingPrice: product?.defaultSellingPrice || 0,
      expiryDate: '',
      lotNumber: '',
      notes: '',
    });
    setFormErrors({});
    setEditingBatchId(null);
  };

  // Open modal for adding batch
  const handleOpenAddModal = () => {
    resetForm();
    setFormData((current) => ({
      ...current,
      locationId: current.locationId || locationOptions[0]?.value || '',
    }));
    setIsModalOpen(true);
  };

  // Open modal for editing batch
  const handleOpenEditModal = (batch: Batch) => {
    setFormData({
      locationId: batch.locationId,
      quantity: batch.quantity,
      unitCost: batch.unitCost,
      sellingPrice: batch.sellingPrice,
      expiryDate: batch.expiryDate,
      lotNumber: batch.lotNumber,
      notes: batch.notes,
    });
    setEditingBatchId(batch.id);
    setIsModalOpen(true);
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.quantity || formData.quantity <= 0) {
      errors.quantity = 'Quantity must be greater than 0';
    }

    if (!formData.unitCost || formData.unitCost < 0) {
      errors.unitCost = 'Unit cost must be 0 or greater';
    }

    if (!formData.locationId) {
      errors.locationId = 'Please select a stock location';
    }

    if (enableExpiry && !formData.expiryDate) {
      errors.expiryDate = 'Expiry date is required';
    }

    if (enableLotNumber && !formData.lotNumber.trim()) {
      errors.lotNumber = 'Lot number is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save batch (add or update)
  const handleSaveBatch = () => {
    if (!validateForm()) return;

    const batchData: Batch = {
      id: editingBatchId || generateId(),
      locationId: formData.locationId,
      quantity: formData.quantity,
      unitCost: formData.unitCost,
      sellingPrice: formData.sellingPrice || product?.defaultSellingPrice || 0,
      expiryDate: formData.expiryDate,
      lotNumber: formData.lotNumber,
      notes: formData.notes,
    };

    if (editingBatchId) {
      // Update existing batch
      setBatches((prev) => prev.map((b) => (b.id === editingBatchId ? batchData : b)));
      toast.success('Batch updated successfully');
    } else {
      // Add new batch
      setBatches((prev) => [...prev, batchData]);
      toast.success('Batch added successfully');
    }

    setIsModalOpen(false);
    resetForm();
  };

  // Remove batch
  const handleRemoveBatch = (id: string) => {
    if (batches.length <= 1 && !enableExpiry) {
      toast.error('You must have at least one batch for this product');
      return;
    }
    setBatches((prev) => prev.filter((b) => b.id !== id));
    toast.success('Batch removed successfully');
  };

  // Render table headers based on enabled features
  const renderTableHeaders = () => {
    const headers = ['#', 'Location', 'Quantity', 'Unit Cost', 'Selling Price'];
    if (enableLotNumber) headers.push('Lot Number');
    if (enableExpiry) headers.push('Expiry Date');
    headers.push('Notes', 'Actions');
    return headers;
  };

  // Render table row data
  const renderTableRow = (batch: Batch, index: number) => {
    const cells = [
      <td key="index" className="px-4 py-3 text-sm text-muted-foreground">
        {index + 1}
      </td>,
      <td key="location" className="px-4 py-3 text-sm text-foreground">
        {locationNameById.get(batch.locationId) || 'Not selected'}
      </td>,
      <td key="quantity" className="px-4 py-3 text-sm font-medium text-foreground">
        {batch.quantity.toLocaleString()}
      </td>,
      <td key="unitCost" className="px-4 py-3 text-sm text-foreground">
        {formatMoney(batch.unitCost, currencyCode, currencyPrecision, currencyPlacement)}
      </td>,
      <td key="sellingPrice" className="px-4 py-3 text-sm text-foreground">
        {formatMoney(batch.sellingPrice, currencyCode, currencyPrecision, currencyPlacement)}
      </td>,
    ];

    if (enableLotNumber) {
      cells.push(
        <td key="lotNumber" className="px-4 py-3 text-sm font-mono text-muted-foreground">
          {batch.lotNumber || '—'}
        </td>
      );
    }

    if (enableExpiry) {
      cells.push(
        <td key="expiryDate" className="px-4 py-3 text-sm text-muted-foreground">
          {batch.expiryDate || '—'}
        </td>
      );
    }

    cells.push(
      <td key="notes" className="px-4 py-3 text-sm text-muted-foreground max-w-[150px] truncate">
        {batch.notes || '—'}
      </td>,
      <td key="actions" className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenEditModal(batch)}
            className="rounded-sm p-1.5 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            aria-label="Edit batch"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleRemoveBatch(batch.id)}
            className="rounded-sm p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label="Remove batch"
            disabled={!canHaveMultipleBatches && batches.length <= 1}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>,
    );

    return cells;
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading opening stock...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-sm border border-border bg-muted/40">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Product not found</h2>
        <p className="max-w-sm text-center text-sm text-muted-foreground">
          The product you are trying to open stock for could not be loaded.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-2 rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header - Keep as is */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-border bg-card text-foreground transition-colors hover:bg-muted/50"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="hidden sm:block">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Opening Stock</p>
              <p className="text-sm font-semibold text-foreground">{product.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/products/${productId}/edit`)}
            className="inline-flex items-center gap-2 rounded-sm border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
          >
            <Package className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Edit Product</span>
          </button>
        </div>
      </div>

      {/* Product Summary Card - Keep as is */}
      <div className="">
        <div className="overflow-hidden rounded-sm border border-border bg-card">
          <div className="grid gap-0 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="flex flex-col items-center justify-center gap-3 border-b border-border bg-muted/20 p-6 lg:border-b-0 lg:border-r">
              <button type="button" onClick={() => setPreviewImage(heroImageSrc)} className="h-32 w-32 overflow-hidden rounded-sm border border-border bg-background">
                <img src={heroImageSrc} alt={product.name} className="h-full w-full object-cover" />
              </button>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="rounded-sm border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {product.productType.charAt(0).toUpperCase() + product.productType.slice(1)}
                </span>
                <span className="rounded-sm border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  SKU {formattedSku}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-5 p-5 sm:p-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-sm border border-border bg-muted/40 px-2 py-0.5 font-medium text-foreground">
                    {product.categoryName || 'Uncategorized'}
                  </span>
                  {product.subCategoryName ? <span>{product.subCategoryName}</span> : null}
                  {product.brandName ? <span>{product.brandName}</span> : null}
                </div>
                <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{product.name}</h1>
                {product.description ? (
                  <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                    {product.description.replace(/<[^>]+>/g, '').slice(0, 220)}
                    {product.description.length > 220 ? '...' : ''}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">No description has been added yet.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-border pt-5 xl:grid-cols-4">
                <StatCard
                  icon={Package}
                  label="Current Stock"
                  value={Number(product.currentStock || 0).toLocaleString()}
                  hint="Existing quantity on hand"
                />
                <StatCard
                  icon={DollarSign}
                  label="Stock Value"
                  value={formatMoney(Number(product.currentStockValue || 0), currencyCode, currencyPrecision, currencyPlacement)}
                  hint="Current value at cost"
                />
                <StatCard
                  icon={Layers}
                  label="Expiry Dates"
                  value={enableExpiry ? 'Enabled' : 'Disabled'}
                  hint="Controlled from product settings"
                />
                <StatCard
                  icon={Hash}
                  label="Lot Numbers"
                  value={enableLotNumber ? 'Enabled' : 'Disabled'}
                  hint="Controlled from purchase settings"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Opening Batches - Table View with Modal */}
      <div className="">
        <SectionCard title="Opening Stock Batches" icon={Package}>
          {/* Header with controls */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">
                {canHaveMultipleBatches
                  ? 'Add multiple batches for this product with different expiry dates and lot numbers. Opening stock batches are tracked separately, and each batch can have its own expiry date, lot number, and cost.'
                  : 'Add a single batch for this product and edit quantities directly in the table if needed. To enable multiple batches with expiry tracking, turn on "Product Expiry" in business settings.'}
              </p>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {enableExpiry && (
                <span className="inline-flex items-center gap-1 rounded-sm border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                  <Calendar className="h-3 w-3" />
                  Expiry enabled
                </span>
              )}
              {enableLotNumber && (
                <span className="inline-flex items-center gap-1 rounded-sm border border-purple-200 bg-purple-50 px-2 py-0.5 text-xs text-purple-700">
                  <Hash className="h-3 w-3" />
                  Lot numbers enabled
                </span>
              )}
            </div>
            {canHaveMultipleBatches && (
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-2 rounded-sm bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Add Batch
              </button>
            )}
          </div>

          {/* Batches Table */}
          {batches.length > 0 ? (
            <div className="overflow-x-auto rounded-sm border border-border">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/30">
                  <tr>
                    {renderTableHeaders().map((header) => (
                      <th
                        key={header}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-background">
                  {batches.map((batch, index) => (
                    <tr key={batch.id} className="hover:bg-muted/10 transition-colors">
                      {renderTableRow(batch, index)}
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/20">
                  <tr>
                    <td colSpan={1} className="px-4 py-3 text-sm font-semibold text-foreground">
                      Totals
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-foreground">
                      {totalQuantity.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-foreground">
                      {formatMoney(totalValue, currencyCode, currencyPrecision, currencyPlacement)}
                    </td>
                    <td colSpan={renderTableHeaders().length - 3} className="px-4 py-3" />
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-sm border-2 border-dashed border-border p-12 text-center">
              <Package className="mb-3 h-10 w-10 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">No opening stock batches</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {canHaveMultipleBatches
                  ? 'Click the "Add Batch" button to record opening stock for this product.'
                  : 'Add your opening stock batch using the form below.'}
              </p>
              {!canHaveMultipleBatches && (
                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="mt-4 inline-flex items-center gap-2 rounded-sm bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                  Add Opening Stock
                </button>
              )}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Add/Edit Batch Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3 backdrop-blur-sm">
          <div
            className="w-full max-w-[96vw] rounded-sm border border-border bg-background shadow-xl md:w-[80vw] md:max-w-[80vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-border p-5">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {editingBatchId ? 'Edit Batch' : 'Add Opening Stock Batch'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {product.name} • {locationNameById.get(formData.locationId) || 'Select location first'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="rounded-full p-2 text-muted-foreground hover:bg-surface-alt hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="lg:col-span-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Stock Location <span className="text-destructive">*</span>
                  </label>
                  <div className="mt-1.5">
                    <Select
                      instanceId="opening-stock-location"
                      value={locationOptions.find((option) => option.value === formData.locationId) ?? null}
                      options={locationOptions}
                      onChange={(option) => setFormData({ ...formData, locationId: option?.value || '' })}
                      placeholder="Select location"
                      isSearchable
                      classNamePrefix="react-select"
                      styles={selectStyles}
                      menuPortalTarget={document.body}
                    />
                  </div>
                  {formErrors.locationId && <p className="mt-1 text-xs text-destructive">{formErrors.locationId}</p>}
                </div>

                <div className="lg:col-span-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Quantity <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={formData.quantity || ''}
                    onChange={(e) => setFormData({ ...formData, quantity: Math.max(0, parseFloat(e.target.value) || 0) })}
                    className={`mt-1.5 w-full rounded-sm border ${formErrors.quantity ? 'border-destructive' : 'border-border'} bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary`}
                    placeholder="Enter quantity"
                  />
                  {formErrors.quantity && <p className="mt-1 text-xs text-destructive">{formErrors.quantity}</p>}
                </div>

                <div className="lg:col-span-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Unit Cost (Exclusive of Tax) <span className="text-destructive">*</span>
                  </label>
                  <div className="relative mt-1.5">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      {currencyPlacement === 'before' ? getCurrencySymbol(currencyCode) : ''}
                    </span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={formData.unitCost || ''}
                      onChange={(e) => setFormData({ ...formData, unitCost: Math.max(0, parseFloat(e.target.value) || 0) })}
                      className={`w-full rounded-sm border ${formErrors.unitCost ? 'border-destructive' : 'border-border'} bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary ${
                        currencyPlacement === 'before' ? 'pl-10' : 'pr-10'
                      }`}
                      placeholder="0.00"
                    />
                    {currencyPlacement === 'after' && (
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        {getCurrencySymbol(currencyCode)}
                      </span>
                    )}
                  </div>
                  {formErrors.unitCost && <p className="mt-1 text-xs text-destructive">{formErrors.unitCost}</p>}
                </div>

                <div className="lg:col-span-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Selling Price
                  </label>
                  <div className="relative mt-1.5">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      {currencyPlacement === 'before' ? getCurrencySymbol(currencyCode) : ''}
                    </span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={formData.sellingPrice || ''}
                      onChange={(e) => setFormData({ ...formData, sellingPrice: Math.max(0, parseFloat(e.target.value) || 0) })}
                      className={`w-full rounded-sm border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary ${
                        currencyPlacement === 'before' ? 'pl-10' : 'pr-10'
                      }`}
                      placeholder={`Default: ${formatMoney(product.defaultSellingPrice || 0, currencyCode, currencyPrecision, currencyPlacement)}`}
                    />
                    {currencyPlacement === 'after' && (
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        {getCurrencySymbol(currencyCode)}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Leave empty to use the product&apos;s default selling price ({formatMoney(product.defaultSellingPrice || 0, currencyCode, currencyPrecision, currencyPlacement)})
                  </p>
                </div>

                {enableLotNumber ? (
                  <div className="lg:col-span-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Lot Number <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.lotNumber}
                      onChange={(e) => setFormData({ ...formData, lotNumber: e.target.value })}
                      className={`mt-1.5 w-full rounded-sm border ${formErrors.lotNumber ? 'border-destructive' : 'border-border'} bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary`}
                      placeholder="Enter lot number"
                    />
                    {formErrors.lotNumber && <p className="mt-1 text-xs text-destructive">{formErrors.lotNumber}</p>}
                  </div>
                ) : null}

                {enableExpiry ? (
                  <div className="lg:col-span-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Expiry Date <span className="text-destructive">*</span>
                    </label>
                    <div className="mt-1.5">
                      <DatePickerField
                        value={formData.expiryDate}
                        onChange={(value) => setFormData({ ...formData, expiryDate: value })}
                        placeholder="Select expiry date"
                      />
                    </div>
                    {formErrors.expiryDate && <p className="mt-1 text-xs text-destructive">{formErrors.expiryDate}</p>}
                  </div>
                ) : null}

                <div className="lg:col-span-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="mt-1.5 min-h-[96px] w-full rounded-sm border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Optional notes for this batch"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border p-5">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="rounded-sm border border-border px-4 py-2 text-sm font-medium hover:bg-muted/30"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBatch}
                className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Check className="h-4 w-4" />
                {editingBatchId ? 'Update Batch' : 'Add Batch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal - Keep as is */}
      {previewImage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-6"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative flex h-[92vh] w-full max-w-[96vw] items-center justify-center overflow-hidden rounded-sm border border-white/10 bg-black"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute right-3 top-3 z-20 rounded-sm bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              aria-label="Close preview"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex h-full w-full items-center justify-center p-4">
              <img src={previewImage} alt="Product preview" className="max-h-full max-w-full rounded-sm object-contain" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
