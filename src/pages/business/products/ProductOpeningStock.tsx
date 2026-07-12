import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
} from 'lucide-react';

type BatchDraft = {
  id: string;
  remainingQuantity: string;
  unitCost: string;
  expiryDate: string;
  lotNumber: string;
  notes: string;
};

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

function createBatch(): BatchDraft {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    remainingQuantity: '',
    unitCost: '',
    expiryDate: '',
    lotNumber: '',
    notes: '',
  };
}

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

function BatchCard({
  batch,
  index,
  canRemove,
  showExpiry,
  showLotNumber,
  onChange,
  onRemove,
}: {
  batch: BatchDraft;
  index: number;
  canRemove: boolean;
  showExpiry: boolean;
  showLotNumber: boolean;
  onChange: (id: string, field: keyof Omit<BatchDraft, 'id'>, value: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="rounded-sm border border-border bg-background p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Batch</p>
          <h3 className="text-sm font-semibold text-foreground">Batch {index + 1}</h3>
        </div>
        {canRemove ? (
          <button
            type="button"
            onClick={() => onRemove(batch.id)}
            className="inline-flex items-center gap-2 rounded-sm border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/40"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Remaining Quantity</span>
          <input
            type="number"
            min={0}
            step={1}
            value={batch.remainingQuantity}
            onChange={(event) => onChange(batch.id, 'remainingQuantity', event.target.value)}
            className="w-full rounded-sm border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="0"
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unit Cost (before Tax)</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={batch.unitCost}
            onChange={(event) => onChange(batch.id, 'unitCost', event.target.value)}
            className="w-full rounded-sm border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="0.00"
          />
        </label>

        {showExpiry ? (
          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expiry Date</span>
            <DatePickerField
              value={batch.expiryDate}
              onChange={(value) => onChange(batch.id, 'expiryDate', value)}
              placeholder="Select expiry date"
            />
          </label>
        ) : null}

        {showLotNumber ? (
          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lot Number</span>
            <input
              type="text"
              value={batch.lotNumber}
              onChange={(event) => onChange(batch.id, 'lotNumber', event.target.value)}
              className="w-full rounded-sm border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Lot number"
            />
          </label>
        ) : null}

        <label className={`${showExpiry || showLotNumber ? 'md:col-span-2' : 'md:col-span-2'} space-y-1.5`}>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</span>
          <textarea
            value={batch.notes}
            onChange={(event) => onChange(batch.id, 'notes', event.target.value)}
            className="min-h-[96px] w-full rounded-sm border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="Optional notes for this batch"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1 rounded-sm border border-border bg-muted/40 px-2.5 py-1">
          <Clock3 className="h-3.5 w-3.5" />
          Batch pricing and quantity can be reviewed before saving
        </span>
        {showExpiry ? (
          <span className="inline-flex items-center gap-1 rounded-sm border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700">
            <CalendarDays className="h-3.5 w-3.5" />
            Expiry tracking enabled
          </span>
        ) : null}
      </div>
    </div>
  );
}

function LocationCard({
  location,
  selected,
  onSelect,
}: {
  location: BusinessLocationRecord;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(location.id)}
      className={`flex w-full items-start gap-3 rounded-sm border p-4 text-left transition-colors ${
        selected ? 'border-primary bg-primary/5' : 'border-border bg-background hover:bg-muted/30'
      }`}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
          selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background'
        }`}
      >
        {selected ? <Check className="h-3 w-3" /> : null}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{location.locationName}</p>
        <p className="truncate text-xs text-muted-foreground">{location.city || location.exactAddress || 'Location details'}</p>
      </div>
    </button>
  );
}

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
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [batches, setBatches] = useState<BatchDraft[]>([createBatch()]);

  const currencyCode = businessSettings?.currency || 'USD';
  const currencyPrecision = typeof businessSettings?.currencyPrecision === 'number' ? businessSettings.currencyPrecision : 2;
  const currencyPlacement = businessSettings?.currencySymbolPlacement === 'after' ? 'after' : 'before';
  const skuPrefix = businessSettings?.skuPrefix || '';
  const showExpiry = Boolean(productSettings?.enableProductExpiry);
  const showLotNumber = Boolean(purchasesSettings?.enableLotNumber);

  useEffect(() => {
    if (!productId) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const productData = await getProduct(productId);
        setProduct(productData);
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
  }, [productId, getProduct]);

  useEffect(() => {
    if (selectedLocationId || locations.length === 0) return;

    const nextLocationId = product?.locationIds?.[0] || locations[0]?.id || '';
    if (nextLocationId) {
      setSelectedLocationId(nextLocationId);
    }
  }, [locations, product, selectedLocationId]);

  const formattedSku = product?.sku ? formatProductSkuDisplay(product.sku, skuPrefix) : 'N/A';
  const heroImageSrc = useMemo(() => getProductImageSrc(product), [product]);

  const totalQuantity = useMemo(
    () => batches.reduce((sum, batch) => sum + (Number(batch.remainingQuantity) || 0), 0),
    [batches],
  );

  const totalValue = useMemo(
    () => batches.reduce((sum, batch) => sum + (Number(batch.remainingQuantity) || 0) * (Number(batch.unitCost) || 0), 0),
    [batches],
  );

  const selectedLocation = locations.find((location) => location.id === selectedLocationId);

  const updateBatch = (id: string, field: keyof Omit<BatchDraft, 'id'>, value: string) => {
    setBatches((current) => current.map((batch) => (batch.id === id ? { ...batch, [field]: value } : batch)));
  };

  const removeBatch = (id: string) => {
    setBatches((current) => (current.length > 1 ? current.filter((batch) => batch.id !== id) : current));
  };

  const addBatch = () => {
    setBatches((current) => [...current, createBatch()]);
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
      <div className="sticky top-0 z-20 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm sm:px-6">
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

      <div className="px-4 sm:px-6">
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
                  value={showExpiry ? 'Enabled' : 'Disabled'}
                  hint="Controlled from product settings"
                />
                <StatCard
                  icon={MapPin}
                  label="Lot Numbers"
                  value={showLotNumber ? 'Enabled' : 'Disabled'}
                  hint="Controlled from purchase settings"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6">
        <SectionCard
          title="Stock Location"
          icon={MapPin}
        >
          {locations.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {locations.map((location) => (
                <LocationCard
                  key={location.id}
                  location={location}
                  selected={selectedLocationId === location.id}
                  onSelect={setSelectedLocationId}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-sm border border-dashed border-border p-4 text-sm text-muted-foreground">
              No business locations were found.
            </div>
          )}
          {selectedLocation ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Opening stock will be tracked under <span className="font-medium text-foreground">{selectedLocation.locationName}</span>.
            </p>
          ) : null}
        </SectionCard>
      </div>

      <div className="px-4 sm:px-6">
        <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Opening Batches</p>
            <p className="text-sm text-muted-foreground">
              Add one or more batches for this product. Batch expiry is shown only when enabled.
            </p>
          </div>
          {showExpiry ? (
            <button
              type="button"
              onClick={addBatch}
              className="inline-flex items-center gap-2 rounded-sm bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Batch
            </button>
          ) : null}
        </div>

        <div className="mt-4 space-y-4">
          {batches.map((batch, index) => (
            <BatchCard
              key={batch.id}
              batch={batch}
              index={index}
              canRemove={showExpiry && batches.length > 1}
              showExpiry={showExpiry}
              showLotNumber={showLotNumber}
              onChange={updateBatch}
              onRemove={removeBatch}
            />
          ))}
        </div>
      </div>

      <div className="px-4 sm:px-6">
        <SectionCard title="Opening Stock Summary" icon={Check}>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard icon={Package} label="Total Quantity" value={totalQuantity.toLocaleString()} />
            <StatCard icon={DollarSign} label="Estimated Cost" value={formatMoney(totalValue, currencyCode, currencyPrecision, currencyPlacement)} />
            <StatCard icon={MapPin} label="Location" value={selectedLocation?.locationName || 'Not selected'} />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            This screen is ready for recording opening stock batches. Once the save flow is connected, these batch cards can be submitted to the API.
          </p>
        </SectionCard>
      </div>

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
