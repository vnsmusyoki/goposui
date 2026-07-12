import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Package,
  DollarSign,
  Tag,
  MapPin,
  Boxes,
  Image as ImageIcon,
  FileText,
  AlertCircle,
  TrendingUp,
  History,
  Plus,
  Download,
  Eye,
  X,
  Check,
  AlertTriangle,
  ShieldCheck,
  Truck,
  Hash,
  Barcode,
  Layers,
  Link,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useProduct, type ProductDetails as ProductDetailsType } from '@/hooks/business/products/useProducts';
import { useProductStock, type StockTransaction } from '@/hooks/business/products/useProductStock';
import { useProductPriceHistory, type PriceHistoryEntry } from '@/hooks/business/products/useProductPriceHistory';
import { useBusinessSettings } from '@/hooks/business/settings/useBusinessSettings';
import { formatProductSkuDisplay } from '@/lib/productSku';
import { ApiError } from '@/lib/api';

// --------------------------------------------------------------------------
// Types & Helpers
// --------------------------------------------------------------------------

type TabType = 'overview' | 'stock' | 'price-history' | 'variants' | 'combo-items' | 'media';

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

function getStatusBadge(status: string) {
  const statusMap: Record<string, { color: string; label: string }> = {
    active: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Active' },
    inactive: { color: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Inactive' },
    draft: { color: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Draft' },
    out_of_stock: { color: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Out of Stock' },
    low_stock: { color: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Low Stock' },
  };
  return statusMap[status] || { color: 'bg-slate-100 text-slate-600 border-slate-200', label: status };
}

function getProductImageSrc(product: ProductDetailsType | null) {
  if (!product) return `https://ui-avatars.com/api/?name=Product`;
  if (product.imageUrl) return product.imageUrl;
  const primaryImage = product.images?.find((image) => image.isPrimary)?.url ?? product.images?.[0]?.url;
  if (primaryImage) return primaryImage;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name || 'Product')}`;
}

// --------------------------------------------------------------------------
// Sub-components
// --------------------------------------------------------------------------

function SectionHeading({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-border bg-muted/50 text-foreground">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <h2 className="text-[13px] font-semibold uppercase tracking-wider text-foreground">{title}</h2>
    </div>
  );
}

function TabButton({
  label,
  icon: Icon,
  isActive,
  onClick,
  count,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
        isActive
          ? 'border-primary text-foreground'
          : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span className="ml-0.5 rounded-sm border border-border bg-muted/60 px-1.5 py-0.5 text-[11px] font-medium leading-none text-muted-foreground">
          {count}
        </span>
      )}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { color, label } = getStatusBadge(status);
  return (
    <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${color}`}>
      {label}
    </span>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-border py-14 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-sm border border-border bg-muted/40">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-sm border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="text-lg font-semibold text-foreground">{value}</div>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function FieldRow({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-border/60 py-3 last:border-0">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-border bg-muted/40 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className="mt-0.5 text-sm font-medium text-foreground">{value}</div>
        {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  );
}

function Panel({
  title,
  action,
  children,
  className = '',
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-sm border border-border bg-card p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

// --------------------------------------------------------------------------
// Main Component
// --------------------------------------------------------------------------

export default function ProductDetails() {
  const { id: productId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { settings: businessSettings } = useBusinessSettings();
  const { getProduct, loading, error } = useProduct();
  const { getStockTransactions, loading: stockLoading } = useProductStock();
  const { getPriceHistory, loading: priceHistoryLoading } = useProductPriceHistory();

  const [product, setProduct] = useState<ProductDetailsType | null>(null);
  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryEntry[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const currencyCode = businessSettings?.currency || 'USD';
  const currencyPrecision = typeof businessSettings?.currencyPrecision === 'number' ? businessSettings.currencyPrecision : 2;
  const currencyPlacement = businessSettings?.currencySymbolPlacement === 'after' ? 'after' : 'before';
  const skuPrefix = businessSettings?.skuPrefix || '';

  // Fetch product data
  useEffect(() => {
    if (!productId) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [productData, stockData, priceData] = await Promise.all([
          getProduct(productId),
          getStockTransactions(productId),
          getPriceHistory(productId),
        ]);
        setProduct(productData);
        setStockTransactions(stockData);
        setPriceHistory(priceData);
      } catch (err) {
        if (err instanceof ApiError) {
          toast.error(err.message || 'Failed to load product details');
        } else {
          toast.error('Failed to load product details');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [productId, getProduct, getStockTransactions, getPriceHistory]);

  // Computed values
  const totalStock = useMemo(() => {
    if (!product) return 0;
    if (product.productType === 'variable') {
      return product.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
    }
    return product.currentStock || 0;
  }, [product]);

  const stockStatus = useMemo(() => {
    if (!product) return 'unknown';
    if (totalStock === 0) return 'out_of_stock';
    if (product.alertQuantity && totalStock <= product.alertQuantity) return 'low_stock';
    return 'active';
  }, [product, totalStock]);

  const productStatus = product?.status || stockStatus;

  // Format product SKU with prefix
  const formattedSku = product?.sku ? formatProductSkuDisplay(product.sku, skuPrefix) : 'N/A';
  const heroImageSrc = useMemo(() => getProductImageSrc(product), [product]);
  const productTypeLabel = product?.productType
    ? product.productType.charAt(0).toUpperCase() + product.productType.slice(1)
    : '';
  const locationCount = product?.allLocations
    ? 'All locations'
    : `${product?.locationNames?.length || 0} locations`;
  const priceHistoryLastChange = priceHistory[0]?.createdAt ? format(new Date(priceHistory[0].createdAt), 'PPP p') : 'No changes yet';

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading product details…</p>
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
          The product you're looking for doesn't exist or has been removed.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-2 rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Top bar */}
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
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Product</p>
              <p className="text-sm font-semibold text-foreground">{product.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`/products/${productId}/edit`)}
              className="inline-flex items-center gap-2 rounded-sm border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
            >
              <Edit className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Edit Product</span>
            </button>
            <button
              type="button"
              onClick={() => navigate(`/products/${productId}/stock/add`)}
              className="inline-flex items-center gap-2 rounded-sm bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Add Stock</span>
            </button>
          </div>
        </div>
      </div>

      {/* Identity + summary bar */}
      <div className="px-4 sm:px-6">
        <div className="overflow-hidden rounded-sm border border-border bg-card">
          <div className="grid gap-0 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="flex flex-col items-center justify-center gap-3 border-b border-border bg-muted/20 p-6 lg:border-b-0 lg:border-r">
              <div className="h-32 w-32 overflow-hidden rounded-sm border border-border bg-background">
                <img src={heroImageSrc} alt={product.name} className="h-full w-full object-cover" />
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={productStatus} />
                <span className="rounded-sm border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {productTypeLabel}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-5 p-5 sm:p-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-sm border border-border bg-muted/40 px-2 py-0.5 font-mono font-medium text-foreground">
                    SKU {formattedSku}
                  </span>
                  <span>{product.categoryName || 'Uncategorized'}</span>
                  {product.subCategoryName ? <span>· {product.subCategoryName}</span> : null}
                </div>
                <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{product.name}</h1>
                {product.description ? (
                  <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                    {product.description.replace(/<[^>]+>/g, '').slice(0, 220)}
                    {product.description.length > 220 ? '…' : ''}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">No description has been added yet.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-border pt-5 sm:grid-cols-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Selling Price</p>
                  <p className="mt-1 text-base font-semibold text-foreground">
                    {formatMoney(product.defaultSellingPrice || 0, currencyCode, currencyPrecision, currencyPlacement)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Buying Price</p>
                  <p className="mt-1 text-base font-semibold text-foreground">
                    {formatMoney(product.defaultPurchasePrice || 0, currencyCode, currencyPrecision, currencyPlacement)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Stock Value</p>
                  <p className="mt-1 text-base font-semibold text-foreground">
                    {formatMoney(totalStock * (product.defaultPurchasePrice || 0), currencyCode, currencyPrecision, currencyPlacement)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Stock ({locationCount})
                  </p>
                  <p className="mt-1 text-base font-semibold text-foreground">
                    {totalStock}
                    <span className="ml-1.5 text-xs font-medium text-muted-foreground">
                      {stockStatus === 'out_of_stock' ? 'Out of stock' : stockStatus === 'low_stock' ? 'Low stock' : 'In stock'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 sm:px-6">
        <div className="overflow-x-auto border-b border-border">
          <div className="flex gap-1">
            <TabButton label="Overview" icon={Eye} isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
            <TabButton
              label="Stock"
              icon={Package}
              isActive={activeTab === 'stock'}
              onClick={() => setActiveTab('stock')}
              count={stockTransactions.length}
            />
            <TabButton
              label="Price History"
              icon={History}
              isActive={activeTab === 'price-history'}
              onClick={() => setActiveTab('price-history')}
              count={priceHistory.length}
            />
            {product.productType === 'variable' && product.variants && (
              <TabButton
                label="Variants"
                icon={Layers}
                isActive={activeTab === 'variants'}
                onClick={() => setActiveTab('variants')}
                count={product.variants.length}
              />
            )}
            {product.productType === 'combo' && product.comboItems && (
              <TabButton
                label="Combo Items"
                icon={Link}
                isActive={activeTab === 'combo-items'}
                onClick={() => setActiveTab('combo-items')}
                count={product.comboItems.length}
              />
            )}
            <TabButton
              label="Media"
              icon={ImageIcon}
              isActive={activeTab === 'media'}
              onClick={() => setActiveTab('media')}
              count={product.images?.length}
            />
          </div>
        </div>

        {/* Tab Content */}
        <div className="pt-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatTile
                  icon={Package}
                  label="Current Stock"
                  value={totalStock}
                  hint={stockStatus === 'low_stock' ? 'Needs attention' : 'Live inventory count'}
                />
                <StatTile
                  icon={DollarSign}
                  label="Selling Price"
                  value={formatMoney(product.defaultSellingPrice || 0, currencyCode, currencyPrecision, currencyPlacement)}
                  hint="Current sale price"
                />
                <StatTile
                  icon={MapPin}
                  label="Availability"
                  value={product.allLocations ? 'All locations' : locationCount}
                  hint="Where this product can be sold"
                />
                <StatTile
                  icon={ShieldCheck}
                  label="Status"
                  value={<StatusBadge status={productStatus} />}
                  hint={product.isForSelling ? 'Listed for sale' : 'Hidden from selling'}
                />
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-6">
                  <div className="grid gap-6 lg:grid-cols-2">
                    <Panel title="Identity">
                      <div>
                        <FieldRow icon={Hash} label="SKU" value={formattedSku} hint="Business-wide unique code" />
                        <FieldRow icon={Barcode} label="Barcode" value={product.barcode || 'Not set'} hint="Scan code on labels" />
                        <FieldRow
                          icon={Tag}
                          label="Category"
                          value={product.categoryName || 'Uncategorized'}
                          hint={product.subCategoryName || 'No sub category selected'}
                        />
                        <FieldRow
                          icon={Boxes}
                          label="Unit"
                          value={product.unitName || 'Not set'}
                          hint={product.subUnitIds?.length ? `${product.subUnitIds.length} linked sub units` : 'No sub units linked'}
                        />
                      </div>
                    </Panel>

                    <Panel title="Pricing & Tax">
                      <div>
                        <FieldRow
                          icon={DollarSign}
                          label="Selling Price"
                          value={formatMoney(product.defaultSellingPrice || 0, currencyCode, currencyPrecision, currencyPlacement)}
                          hint="Editable retail price"
                        />
                        <FieldRow
                          icon={DollarSign}
                          label="Buying Price"
                          value={formatMoney(product.defaultPurchasePrice || 0, currencyCode, currencyPrecision, currencyPlacement)}
                          hint="Your stock cost"
                        />
                        <FieldRow
                          icon={TrendingUp}
                          label="Profit Margin"
                          value={product.profitMargin ? `${product.profitMargin}%` : '0%'}
                          hint="Target profit on single items"
                        />
                        <FieldRow
                          icon={Truck}
                          label="Tax"
                          value={product.taxRate ? `${product.taxRate}%` : '0%'}
                          hint={product.taxType ? `${product.taxType.charAt(0).toUpperCase() + product.taxType.slice(1)} tax` : 'No tax set'}
                        />
                      </div>
                    </Panel>
                  </div>

                  <Panel title="Inventory & Policy">
                    <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                      <FieldRow
                        icon={Package}
                        label="Manage Stock"
                        value={product.manageStock ? 'Yes' : 'No'}
                        hint={product.manageStock ? 'Stock movements are tracked' : 'Manual stock handling'}
                      />
                      <FieldRow
                        icon={AlertCircle}
                        label="Alert Quantity"
                        value={product.manageStock ? (product.alertQuantity || 'Not set') : 'N/A'}
                        hint="Low stock warning level"
                      />
                      <FieldRow
                        icon={Check}
                        label="For Selling"
                        value={product.isForSelling ? 'Yes' : 'No'}
                        hint={product.isForSelling ? 'Available at POS' : 'Not shown for sale'}
                      />
                      <FieldRow
                        icon={Layers}
                        label="Product Type"
                        value={product.productType.charAt(0).toUpperCase() + product.productType.slice(1)}
                        hint={product.productType === 'single' ? 'Simple product' : 'Bundle or variant product'}
                      />
                    </div>
                  </Panel>

                  {product.description && (
                    <Panel title="Description">
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <div dangerouslySetInnerHTML={{ __html: product.description }} />
                      </div>
                    </Panel>
                  )}
                </div>

                <div className="space-y-6">
                  <Panel title="Availability">
                    {product.allLocations ? (
                      <div className="rounded-sm border border-emerald-200 bg-emerald-50 p-4 text-sm text-foreground">
                        <div className="mb-1.5 flex items-center gap-2 font-medium text-emerald-700">
                          <Check className="h-4 w-4" />
                          Available in all business locations
                        </div>
                        <p className="text-xs text-muted-foreground">This product can be sold from every active branch.</p>
                      </div>
                    ) : product.locationNames && product.locationNames.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">Available in:</p>
                        <div className="flex flex-wrap gap-2">
                          {product.locationNames.map((locationName) => (
                            <span
                              key={locationName}
                              className="inline-flex items-center rounded-sm border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground"
                            >
                              {locationName}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-sm border border-dashed border-border p-4 text-sm text-muted-foreground">
                        No locations selected for this product
                      </div>
                    )}
                  </Panel>

                  <Panel title="Lifecycle">
                    <div>
                      <FieldRow
                        icon={Plus}
                        label="Created"
                        value={product.createdAt ? format(new Date(product.createdAt), 'PPP p') : 'N/A'}
                      />
                      <FieldRow
                        icon={History}
                        label="Last Updated"
                        value={product.updatedAt ? format(new Date(product.updatedAt), 'PPP p') : 'N/A'}
                      />
                      <FieldRow
                        icon={ShieldCheck}
                        label="Warranty"
                        value={
                          product.hasWarranty
                            ? `${product.warrantyDuration || ''} ${product.warrantyPeriod || ''}${
                                product.warrantyCoverage ? ` - ${product.warrantyCoverage}` : ''
                              }`
                            : 'No warranty attached'
                        }
                      />
                    </div>
                  </Panel>
                </div>
              </div>
            </div>
          )}

          {/* Stock Tab */}
          {activeTab === 'stock' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatTile icon={Package} label="Current Stock" value={totalStock.toLocaleString()} hint="Units available now" />
                <StatTile
                  icon={DollarSign}
                  label="Current Stock Value"
                  value={formatMoney(product.currentStockValue || 0, currencyCode, currencyPrecision, currencyPlacement)}
                  hint="Inventory value at cost"
                />
                <StatTile icon={TrendingUp} label="Total Units Sold" value={(product.totalUnitsSold || 0).toLocaleString()} />
                <StatTile
                  icon={Truck}
                  label="Transferred / Adjusted"
                  value={`${(product.totalUnitsTransferred || 0).toLocaleString()} / ${(product.totalUnitsAdjusted || 0).toLocaleString()}`}
                />
              </div>

              <div className="overflow-hidden border border-border bg-card shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-[1100px] w-full divide-y divide-border text-sm">
                    <thead className="bg-surface-alt/60">
                      <tr>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">SKU</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Product</th>
                        <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Unit Price</th>
                        <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Current Stock</th>
                        <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Current Stock Value</th>
                        <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Units Sold</th>
                        <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Units Transfered</th>
                        <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Units Adjusted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-background">
                      <tr className="transition-colors hover:bg-muted/20">
                        <td className="whitespace-nowrap px-4 py-4 font-mono text-sm text-foreground">{formattedSku}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
                              <img src={heroImageSrc} alt={product.name} className="h-full w-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-foreground">{product.name}</p>
                              <p className="truncate text-xs text-muted-foreground">{product.categoryName || 'Uncategorized'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-right font-medium text-foreground">
                          {formatMoney(product.defaultPurchasePrice || 0, currencyCode, currencyPrecision, currencyPlacement)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-right font-medium text-foreground">
                          {totalStock.toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-right font-medium text-foreground">
                          {formatMoney(product.currentStockValue || 0, currencyCode, currencyPrecision, currencyPlacement)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-right font-medium text-foreground">
                          {(product.totalUnitsSold || 0).toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-right font-medium text-foreground">
                          {(product.totalUnitsTransferred || 0).toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-right font-medium text-foreground">
                          {(product.totalUnitsAdjusted || 0).toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate(`/products/${productId}/stock/add`)}
                  className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Stock
                </button>
              </div>
            </div>
          )}

          {/* Price History Tab */}
          {activeTab === 'price-history' && (
            <div className="space-y-6">
              {priceHistory.length === 0 ? (
                <EmptyState
                  icon={History}
                  title="No price history"
                  description="Price changes will be recorded here whenever the buying or selling price changes."
                />
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <StatTile
                      icon={DollarSign}
                      label="Latest Buying Price"
                      value={formatMoney(priceHistory[0]?.buyingPrice || product.defaultPurchasePrice || 0, currencyCode, currencyPrecision, currencyPlacement)}
                    />
                    <StatTile
                      icon={DollarSign}
                      label="Latest Selling Price"
                      value={formatMoney(priceHistory[0]?.sellingPrice || product.defaultSellingPrice || 0, currencyCode, currencyPrecision, currencyPlacement)}
                    />
                    <StatTile icon={History} label="Price Changes" value={priceHistory.length} hint={`Last update: ${priceHistoryLastChange}`} />
                  </div>

                  <div className="overflow-hidden rounded-sm border border-border">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-border text-sm">
                        <thead className="bg-muted/40">
                          <tr>
                            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                            <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Buying Price</th>
                            <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Selling Price</th>
                            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Changed By</th>
                            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Reason</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-background">
                          {priceHistory.map((entry) => (
                            <tr key={entry.id} className="transition-colors hover:bg-muted/20">
                              <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{format(new Date(entry.createdAt), 'PPP p')}</td>
                              <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-foreground">
                                {formatMoney(entry.buyingPrice || 0, currencyCode, currencyPrecision, currencyPlacement)}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-foreground">
                                {formatMoney(entry.sellingPrice || 0, currencyCode, currencyPrecision, currencyPlacement)}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{entry.changedBy || 'System'}</td>
                              <td className="px-4 py-3 text-muted-foreground">{entry.reason?.trim() ? entry.reason : 'Price changed by system'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Variants Tab */}
          {activeTab === 'variants' && product.variants && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <StatTile icon={Layers} label="Total Variants" value={product.variants.length} />
                <StatTile icon={Package} label="Total Stock" value={product.variants.reduce((sum, v) => sum + (v.stock || 0), 0)} />
                <StatTile
                  icon={DollarSign}
                  label="Price Range"
                  value={
                    <>
                      {formatMoney(Math.min(...product.variants.map((v) => v.selling || 0)), currencyCode, currencyPrecision, currencyPlacement)}
                      {' – '}
                      {formatMoney(Math.max(...product.variants.map((v) => v.selling || 0)), currencyCode, currencyPrecision, currencyPlacement)}
                    </>
                  }
                />
                <StatTile
                  icon={DollarSign}
                  label="Cost Range"
                  value={
                    <>
                      {formatMoney(Math.min(...product.variants.map((v) => v.cost || 0)), currencyCode, currencyPrecision, currencyPlacement)}
                      {' – '}
                      {formatMoney(Math.max(...product.variants.map((v) => v.cost || 0)), currencyCode, currencyPrecision, currencyPlacement)}
                    </>
                  }
                />
              </div>

              <div className="overflow-hidden rounded-sm border border-border">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border text-sm">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Variant</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">SKU</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Barcode</th>
                        <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cost</th>
                        <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Selling</th>
                        <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Stock</th>
                        <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Margin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-background">
                      {product.variants.map((variant) => {
                        const margin = variant.selling > 0 && variant.cost > 0 ? ((variant.selling - variant.cost) / variant.selling) * 100 : 0;
                        return (
                          <tr key={variant.id}>
                            <td className="px-4 py-3">
                              <p className="font-medium text-foreground">{variant.name}</p>
                              {variant.supplierCode && <p className="text-xs text-muted-foreground">Supplier: {variant.supplierCode}</p>}
                            </td>
                            <td className="px-4 py-3 font-mono text-sm text-foreground">{variant.sku}</td>
                            <td className="px-4 py-3 font-mono text-sm text-muted-foreground">{variant.barcode || '—'}</td>
                            <td className="px-4 py-3 text-right text-muted-foreground">
                              {formatMoney(variant.cost || 0, currencyCode, currencyPrecision, currencyPlacement)}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-foreground">
                              {formatMoney(variant.selling || 0, currencyCode, currencyPrecision, currencyPlacement)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={variant.stock === 0 ? 'text-rose-600' : variant.stock <= (variant.reorderLevel || 0) ? 'text-orange-600' : 'text-emerald-600'}>
                                {variant.stock || 0}
                              </span>
                              {variant.reorderLevel && <span className="ml-1 text-xs text-muted-foreground">/ {variant.reorderLevel}</span>}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={margin > 30 ? 'text-emerald-600' : margin > 15 ? 'text-amber-600' : 'text-rose-600'}>{margin.toFixed(1)}%</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Combo Items Tab */}
          {activeTab === 'combo-items' && product.comboItems && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatTile icon={Link} label="Total Items" value={product.comboItems.length} />
                <StatTile icon={Boxes} label="Total Quantity" value={product.comboItems.reduce((sum, item) => sum + item.quantity, 0)} />
                <StatTile
                  icon={DollarSign}
                  label="Total Value"
                  value={formatMoney(
                    product.comboItems.reduce((sum, item) => sum + item.subtotal, 0),
                    currencyCode,
                    currencyPrecision,
                    currencyPlacement
                  )}
                />
              </div>

              <div className="overflow-hidden rounded-sm border border-border">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border text-sm">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Product</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">SKU</th>
                        <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Quantity</th>
                        <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Unit</th>
                        <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Price Each</th>
                        <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-background">
                      {product.comboItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 font-medium text-foreground">{item.productName}</td>
                          <td className="px-4 py-3 font-mono text-sm text-muted-foreground">{item.sku || '—'}</td>
                          <td className="px-4 py-3 text-right text-foreground">{item.quantity}</td>
                          <td className="px-4 py-3 text-right text-muted-foreground">{item.unit || '—'}</td>
                          <td className="px-4 py-3 text-right text-muted-foreground">
                            {formatMoney(item.priceEach || 0, currencyCode, currencyPrecision, currencyPlacement)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-foreground">
                            {formatMoney(item.subtotal || 0, currencyCode, currencyPrecision, currencyPlacement)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-muted/30">
                        <td colSpan={5} className="px-4 py-3 text-right font-medium text-foreground">
                          Total Bundle Price
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-foreground">
                          {formatMoney(
                            product.comboItems.reduce((sum, item) => sum + item.subtotal, 0),
                            currencyCode,
                            currencyPrecision,
                            currencyPlacement
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Media Tab */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div>
                  <SectionHeading icon={ImageIcon} title="Product Images" />
                  {product.images && product.images.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {product.images.map((image) => (
                        <div key={image.id} className="group relative overflow-hidden rounded-sm border border-border bg-background">
                          <div className="aspect-square">
                            <img src={image.url} alt={image.name} className="h-full w-full object-cover" />
                          </div>
                          <button
                            type="button"
                            onClick={() => setPreviewImage(image.url)}
                            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <Eye className="h-5 w-5 text-white" />
                          </button>
                          {image.isPrimary && (
                            <div className="absolute left-2 top-2 rounded-sm bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
                              Primary
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState icon={ImageIcon} title="No images uploaded" description="Product photos will appear here once added." />
                  )}
                </div>

                <div>
                  <SectionHeading icon={FileText} title="Brochure" />
                  {product.brochureUrl ? (
                    <div className="rounded-sm border border-border bg-card p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-border bg-muted/40 text-foreground">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{product.brochureName || 'Product Brochure'}</p>
                          <p className="text-xs text-muted-foreground">PDF Document</p>
                        </div>
                        <a
                          href={product.brochureUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-sm border border-border p-2 hover:bg-muted/50"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <EmptyState icon={FileText} title="No brochure uploaded" description="A product brochure or spec sheet will appear here once added." />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
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
      )}
    </div>
  );
}
