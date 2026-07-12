import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Edit,
  Eye,
  MoreVertical,
  Package,
  Tag,
  Trash2,
  Clock,
  Copy,
  ArrowUpRightFromSquare,
  Columns3,
  Download,
  Printer,
  FileText,
  X,
} from 'lucide-react';
import { useBusinessCurrency } from '@/business/businessStore';
import { useBusinessSettings } from '@/hooks/business/settings/useBusinessSettings';
import { useProductSettings } from '@/hooks/business/settings/useProductSettings';
import { formatProductSkuDisplay } from '@/lib/productSku';

function StatusBadge({ status }: { status: string }) {
  const config = {
    active: { color: 'bg-success/10 text-success', label: 'Active' },
    inactive: { color: 'bg-muted text-muted-foreground', label: 'Inactive' },
    draft: { color: 'bg-amber-500/10 text-amber-600', label: 'Draft' },
  } as const;
  const c = (config as any)[status] ?? config.active;
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${c.color}`}>{c.label}</span>;
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

function getProductImageSrc(product: any, businessLogoUrl?: string | null) {
  if (product?.imageUrl) return product.imageUrl;
  if (businessLogoUrl) return businessLogoUrl;
  const name = encodeURIComponent(product?.name ?? 'Product');
  return `https://ui-avatars.com/api/?name=${name}`;
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  destructive = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
        destructive ? 'text-destructive hover:bg-destructive/10' : 'text-foreground hover:bg-surface-alt'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border p-0.5 transition-colors overflow-hidden ${
        checked ? 'border-primary bg-primary/15' : 'border-border bg-background'
      }`}
    >
      <span
        className={`h-5 w-5 rounded-full shadow-sm transition-transform duration-200 ${
          checked ? 'translate-x-5 bg-primary' : 'translate-x-0 bg-muted-foreground'
        }`}
      />
    </button>
  );
}

export function ProductsAllProductsTab({
  filteredProducts,
  products,
  showActions,
  setShowActions,
  handleSort,
  sortConfig,
  getStockStatus,
  navigate,
}: {
  filteredProducts: any[];
  products: any[];
  showActions: string | null;
  setShowActions: (value: string | null) => void;
  handleSort: (key: any) => void;
  sortConfig: { key: string | null; direction: 'asc' | 'desc' };
  getStockStatus: (product: any) => { label: string; color: string; bg: string };
  navigate: (path: string) => void;
}) {
  const { currency } = useBusinessCurrency();
  const { settings: businessSettings } = useBusinessSettings();
  const { settings: productSettings } = useProductSettings();
  const currencySymbol = getCurrencySymbol(currency);
  const skuPrefix = productSettings?.skuPrefix ?? '';
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState({
    image: true,
    product: true,
    status: true,
    sku: true,
    location: true,
    unit: true,
    purchasePrice: true,
    sellingPrice: true,
    currentStock: true,
    stockValue: true,
    productType: true,
    category: true,
    brand: true,
    tax: true,
    actions: true,
  });
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; placement: 'top' | 'bottom' } | null>(null);
  const [activeRecord, setActiveRecord] = useState<any | null>(null);

  const columnOptions = [
    { key: 'image', label: 'Image' },
    { key: 'product', label: 'Product' },
    { key: 'status', label: 'Status' },
    { key: 'sku', label: 'SKU' },
    { key: 'location', label: 'Location' },
    { key: 'unit', label: 'Unit' },
    { key: 'purchasePrice', label: 'Purchase Price' },
    { key: 'sellingPrice', label: 'Selling Price' },
    { key: 'currentStock', label: 'Stock' },
    { key: 'stockValue', label: 'Stock Value' },
    { key: 'productType', label: 'Type' },
    { key: 'category', label: 'Category' },
    { key: 'brand', label: 'Brand' },
    { key: 'tax', label: 'Tax' },
    { key: 'actions', label: 'Actions' },
  ] as const;

  const closeMenu = () => {
    setShowActions(null);
    setMenuPosition(null);
    setActiveRecord(null);
  };

  const openMenu = (product: any, button: HTMLButtonElement) => {
    const rect = button.getBoundingClientRect();
    const menuHeight = 344;
    const menuWidth = 248;
    const gap = 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const placement: 'top' | 'bottom' = spaceBelow < menuHeight && spaceAbove > spaceBelow ? 'top' : 'bottom';
    const top = placement === 'bottom' ? rect.bottom + gap : Math.max(rect.top - menuHeight - gap, gap);
    const left = Math.min(Math.max(rect.right - menuWidth, gap), window.innerWidth - menuWidth - gap);

    setActiveRecord(product);
    setMenuPosition({ top, left, placement });
    setShowActions(product.id);
  };

  useEffect(() => {
    if (!showActions) return undefined;

    const handleGlobalClose = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (menuRef.current && target && menuRef.current.contains(target)) {
        return;
      }
      closeMenu();
    };

    const handleResizeOrScroll = () => closeMenu();

    document.addEventListener('mousedown', handleGlobalClose);
    window.addEventListener('resize', handleResizeOrScroll);
    window.addEventListener('scroll', handleResizeOrScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleGlobalClose);
      window.removeEventListener('resize', handleResizeOrScroll);
      window.removeEventListener('scroll', handleResizeOrScroll, true);
    };
  }, [showActions]);

  const actionTitle = useMemo(() => {
    if (!activeRecord) return 'Record actions';
    return `Actions for ${activeRecord.name ?? 'this product'}`;
  }, [activeRecord]);
  const businessLogoUrl = businessSettings?.logoUrl ?? '';

  const displayedProducts = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredProducts.slice(start, start + rowsPerPage);
  }, [currentPage, filteredProducts, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / rowsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredProducts, rowsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleResetColumns = () => {
    setVisibleColumns({
      image: true,
      product: true,
      status: true,
      sku: true,
      location: true,
      unit: true,
      purchasePrice: true,
      sellingPrice: true,
      currentStock: true,
      stockValue: true,
      productType: true,
      category: true,
      brand: true,
      tax: true,
      actions: true,
    });
  };

  const buildCsvRows = () =>
    filteredProducts.map((product) => [
      formatProductSkuDisplay(product.sku, skuPrefix),
      product.name,
      product.status,
      product.locationNames?.join(', ') ?? '',
      product.unitName ?? '',
      String(product.defaultPurchasePrice ?? 0),
      String(product.defaultSellingPrice ?? 0),
      String(product.currentStock ?? 0),
      String(product.currentStockValue ?? 0),
      product.productType ?? '',
      product.categoryName ?? '',
      product.brandName ?? '',
      `${product.taxType ?? ''} (${product.taxRate ?? 0}%)`,
    ]);

  const downloadCsv = () => {
    const headers = ['SKU', 'Product', 'Status', 'Location', 'Unit', 'Purchase Price', 'Selling Price', 'Stock', 'Stock Value', 'Type', 'Category', 'Brand', 'Tax'];
    const rows = buildCsvRows();
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'products.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const openPrintableWindow = (title: string) => {
    const popup = window.open('', '_blank', 'noopener,noreferrer,width=1200,height=800');
    if (!popup) return;
    const rows = filteredProducts
      .map(
        (product) => `
          <tr>
            <td>${formatProductSkuDisplay(product.sku, skuPrefix)}</td>
            <td>${product.name ?? ''}</td>
            <td>${product.status ?? ''}</td>
            <td>${(product.locationNames ?? []).join(', ')}</td>
            <td>${product.unitName ?? ''}</td>
            <td>${product.defaultPurchasePrice ?? 0}</td>
            <td>${product.defaultSellingPrice ?? 0}</td>
            <td>${product.currentStock ?? 0}</td>
            <td>${product.currentStockValue ?? 0}</td>
            <td>${product.productType ?? ''}</td>
            <td>${product.categoryName ?? ''}</td>
            <td>${product.brandName ?? ''}</td>
            <td>${product.taxType ?? ''} (${product.taxRate ?? 0}%)</td>
          </tr>`,
      )
      .join('');

    popup.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
            h1 { font-size: 18px; margin: 0 0 16px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top; }
            th { background: #f3f4f6; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <table>
            <thead>
              <tr>
                <th>SKU</th><th>Product</th><th>Status</th><th>Location</th><th>Unit</th><th>Purchase Price</th><th>Selling Price</th><th>Stock</th><th>Stock Value</th><th>Type</th><th>Category</th><th>Brand</th><th>Tax</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `);
    popup.document.close();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">All Products</p>
          <p className="text-xs text-muted-foreground">Configure the columns shown in this table only.</p>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setColumnsOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-alt"
          >
            <Columns3 className="h-3.5 w-3.5" />
            Columns
          </button>
          {columnsOpen ? (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm sm:p-6"
              onClick={() => setColumnsOpen(false)}
            >
              <div
                className="flex h-full w-full max-h-[100dvh] flex-col overflow-hidden rounded-none border border-border bg-card shadow-2xl sm:h-auto sm:max-h-[80vh] sm:w-[80vw] sm:max-w-6xl sm:rounded-sm"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Show columns</p>
                    <p className="text-xs text-muted-foreground">Turn columns on or off for this table.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setColumnsOpen(false)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-surface-alt hover:text-foreground"
                    aria-label="Close column picker"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {columnOptions.map((column) => (
                      <div
                        key={column.key}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background px-3 py-3 text-sm text-foreground"
                      >
                        <span className="font-medium">{column.label}</span>
                        <ToggleSwitch
                          checked={visibleColumns[column.key]}
                          onChange={() =>
                            setVisibleColumns((prev) => ({
                              ...prev,
                              [column.key]: !prev[column.key],
                            }))
                          }
                          ariaLabel={`Toggle ${column.label} column`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <p className="text-xs text-muted-foreground">Reset brings all columns back on.</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleResetColumns();
                        setColumnsOpen(false);
                      }}
                      className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-surface-alt"
                    >
                      Turn all on
                    </button>
                    <button
                      type="button"
                      onClick={() => setColumnsOpen(false)}
                      className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">
            Entries
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              className="ml-2 rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
            >
              {[10, 25, 50, 100].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={downloadCsv} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-alt">
            <Download className="h-3.5 w-3.5" />
            CSV
          </button>
          <button type="button" onClick={() => openPrintableWindow('Products Report - PDF Export')} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-alt">
            <FileText className="h-3.5 w-3.5" />
            Export PDF
          </button>
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-alt">
            <Printer className="h-3.5 w-3.5" />
            Print
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-sm border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="min-w-[1600px] w-full border-collapse">
            <thead className="border-b border-border bg-surface-alt">
              <tr>
                {visibleColumns.image && <th className="w-[96px] px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Image</th>}
                {visibleColumns.product && (
                  <th
                    className="w-[300px] cursor-pointer px-4 py-3 text-left text-xs font-semibold text-muted-foreground hover:text-foreground"
                    onClick={() => handleSort('name')}
                  >
                    Product {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                )}
                {visibleColumns.status && <th className="w-[120px] px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>}
                {visibleColumns.sku && (
                  <th
                    className="w-[140px] cursor-pointer px-4 py-3 text-left text-xs font-semibold text-muted-foreground hover:text-foreground"
                    onClick={() => handleSort('sku')}
                  >
                    SKU {sortConfig.key === 'sku' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                )}
                {visibleColumns.location && <th className="w-[190px] px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Location</th>}
                {visibleColumns.unit && <th className="w-[110px] px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Unit</th>}
                {visibleColumns.purchasePrice && (
                  <th
                    className="w-[150px] cursor-pointer px-4 py-3 text-right text-xs font-semibold text-muted-foreground hover:text-foreground"
                    onClick={() => handleSort('defaultPurchasePrice')}
                  >
                    Unit Purchase Price ({currencySymbol}) {sortConfig.key === 'defaultPurchasePrice' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                )}
                {visibleColumns.sellingPrice && (
                  <th
                    className="w-[150px] cursor-pointer px-4 py-3 text-right text-xs font-semibold text-muted-foreground hover:text-foreground"
                    onClick={() => handleSort('defaultSellingPrice')}
                  >
                    Selling Price ({currencySymbol}) {sortConfig.key === 'defaultSellingPrice' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                )}
                {visibleColumns.currentStock && (
                  <th
                    className="w-[120px] cursor-pointer px-4 py-3 text-right text-xs font-semibold text-muted-foreground hover:text-foreground"
                    onClick={() => handleSort('currentStock')}
                  >
                    Stock {sortConfig.key === 'currentStock' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                )}
                {visibleColumns.stockValue && (
                  <th
                    className="w-[160px] cursor-pointer px-4 py-3 text-right text-xs font-semibold text-muted-foreground hover:text-foreground"
                    onClick={() => handleSort('currentStockValue')}
                  >
                    Stock Value ({currencySymbol}) {sortConfig.key === 'currentStockValue' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                )}
                {visibleColumns.productType && <th className="w-[120px] px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Type</th>}
                {visibleColumns.category && <th className="w-[170px] px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Category</th>}
                {visibleColumns.brand && <th className="w-[170px] px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Brand</th>}
                {visibleColumns.tax && <th className="w-[130px] px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Tax</th>}
                {visibleColumns.actions && <th className="w-[80px] px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
                {displayedProducts.length > 0 ? (
                  displayedProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  return (
                    <tr key={product.id} className="group transition-colors hover:bg-surface-alt/30">
                      {visibleColumns.image && (
                        <td className="px-4 py-3">
                          <img
                            src={getProductImageSrc(product, businessLogoUrl)}
                            alt={product.name}
                            className="h-10 w-10 rounded-lg border border-border object-cover"
                            loading="lazy"
                          />
                        </td>
                      )}
                      {visibleColumns.product && (
                        <td className="w-[300px] px-4 py-3">
                          <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
                        </td>
                      )}
                      {visibleColumns.status && (
                        <td className="whitespace-nowrap px-4 py-3">
                          <StatusBadge status={product.status} />
                        </td>
                      )}
                      {visibleColumns.sku && (
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-muted-foreground">
                          {formatProductSkuDisplay(product.sku, skuPrefix)}
                        </td>
                      )}
                      {visibleColumns.location && (
                        <td className="max-w-[190px] px-4 py-3">
                          <p className="truncate text-sm text-muted-foreground" title={product.locationNames.join(', ')}>
                            {product.locationNames.length > 0 ? product.locationNames.join(', ') : '-'}
                          </p>
                        </td>
                      )}
                      {visibleColumns.unit && <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">{product.unitName}</td>}
                      {visibleColumns.purchasePrice && <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-foreground">{product.defaultPurchasePrice}</td>}
                      {visibleColumns.sellingPrice && <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-foreground">{product.defaultSellingPrice}</td>}
                      {visibleColumns.currentStock && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span
                              className={`text-sm font-semibold ${
                                product.currentStock === 0
                                  ? 'text-destructive'
                                  : product.currentStock <= product.alertQuantity
                                    ? 'text-amber-600'
                                    : 'text-foreground'
                              }`}
                            >
                              {product.currentStock}
                            </span>
                            <span
                              className={`inline-flex h-2 w-2 rounded-full ${
                                stockStatus.color === 'text-success'
                                  ? 'bg-success'
                                  : stockStatus.color === 'text-destructive'
                                    ? 'bg-destructive'
                                    : stockStatus.color === 'text-amber-600'
                                      ? 'bg-amber-500'
                                      : 'bg-muted'
                              }`}
                            />
                          </div>
                        </td>
                      )}
                      {visibleColumns.stockValue && <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-foreground">{product.currentStockValue}</td>}
                      {visibleColumns.productType && (
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium capitalize text-primary">
                            {product.productType}
                          </span>
                        </td>
                      )}
                      {visibleColumns.category && <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">{product.categoryName}</td>}
                      {visibleColumns.brand && <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">{product.brandName}</td>}
                      {visibleColumns.tax && <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">{product.taxType} ({product.taxRate}%)</td>}
                      {visibleColumns.actions && (
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={(event) => {
                              if (showActions === product.id) {
                                closeMenu();
                                return;
                              }
                              openMenu(product, event.currentTarget);
                            }}
                            className="rounded-lg p-1.5 transition-colors hover:bg-surface-alt"
                          >
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No products found matching the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>
              Showing {(currentPage - 1) * rowsPerPage + 1}-{Math.min(currentPage * rowsPerPage, filteredProducts.length)} of {filteredProducts.length} products
            </span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={currentPage === 1} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground disabled:cursor-not-allowed disabled:opacity-50">
                Prev
              </button>
              <span className="text-xs text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <button type="button" onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground disabled:cursor-not-allowed disabled:opacity-50">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {showActions && menuPosition && activeRecord ? (
        <div className="fixed inset-0 z-40 bg-slate-950/10 backdrop-blur-[2px]" onClick={closeMenu}>
          <div
            ref={menuRef}
            className="fixed z-50 w-64 rounded-xl border border-border bg-card shadow-2xl"
            style={{ top: menuPosition.top, left: menuPosition.left }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-border px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Record</p>
              <p className="mt-1 line-clamp-2 text-sm font-semibold text-foreground">{actionTitle}</p>
            </div>
            <div className="p-2">
              <ActionButton icon={Tag} label="Labels" onClick={() => closeMenu()} />
              <ActionButton icon={Eye} label="View" onClick={() => navigate(`/products/${activeRecord.id}/view`)} />
              <ActionButton icon={Edit} label="Edit" onClick={() => navigate(`/products/${activeRecord.id}/edit`)} />
              <ActionButton icon={Package} label="Add Opening Stock" onClick={ ()=> navigate(`/products/${activeRecord.id}/opening-stock`)} />
              <ActionButton icon={Clock} label="Stock History" onClick={() => closeMenu()} />
              <ActionButton icon={Copy} label="Duplicate" onClick={() => closeMenu()} />
              <ActionButton icon={ArrowUpRightFromSquare} label="Open in new tab" onClick={() => window.open(`/products/${activeRecord.id}`, '_blank', 'noopener,noreferrer')} />
              <ActionButton icon={Trash2} label="Delete" onClick={() => closeMenu()} destructive />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
