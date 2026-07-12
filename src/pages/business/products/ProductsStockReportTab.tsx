import { useEffect, useMemo, useState } from 'react';
import { Columns3, Download, FileText, Printer, X } from 'lucide-react';
import { useBusinessSettings } from '@/hooks/business/settings/useBusinessSettings';
import { useProductSettings } from '@/hooks/business/settings/useProductSettings';
import { formatProductSkuDisplay } from '@/lib/productSku';

function getProductImageSrc(product: any, businessLogoUrl?: string | null) {
  if (product?.imageUrl) return product.imageUrl;
  if (businessLogoUrl) return businessLogoUrl;
  const name = encodeURIComponent(product?.name ?? 'Product');
  return `https://ui-avatars.com/api/?name=${name}`;
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

export function ProductsStockReportTab({
  filteredProducts,
  products,
  formatCurrency,
}: {
  filteredProducts: any[];
  products: any[];
  formatCurrency: (value: number) => string;
}) {
  const { settings: businessSettings } = useBusinessSettings();
  const { settings: productSettings } = useProductSettings();
  const skuPrefix = productSettings?.skuPrefix ?? '';
  const businessLogoUrl = businessSettings?.logoUrl ?? '';
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState({
    image: true,
    sku: true,
    product: true,
    variation: true,
    category: true,
    location: true,
    unit: true,
    sellingPrice: true,
    currentStock: true,
    stockValueCost: true,
    stockValueSale: true,
    potentialProfit: true,
    unitsSold: true,
    unitsTransferred: true,
    unitsAdjusted: true,
  });

  const columnOptions = [
    { key: 'image', label: 'Image' },
    { key: 'sku', label: 'SKU' },
    { key: 'product', label: 'Product' },
    { key: 'variation', label: 'Variation' },
    { key: 'category', label: 'Category' },
    { key: 'location', label: 'Location' },
    { key: 'unit', label: 'Unit' },
    { key: 'sellingPrice', label: 'Selling Price' },
    { key: 'currentStock', label: 'Current Stock' },
    { key: 'stockValueCost', label: 'Stock Value (Cost)' },
    { key: 'stockValueSale', label: 'Stock Value (Sale)' },
    { key: 'potentialProfit', label: 'Potential Profit' },
    { key: 'unitsSold', label: 'Units Sold' },
    { key: 'unitsTransferred', label: 'Units Transferred' },
    { key: 'unitsAdjusted', label: 'Units Adjusted' },
  ] as const;

  const handleResetColumns = () => {
    setVisibleColumns({
      image: true,
      sku: true,
      product: true,
      variation: true,
      category: true,
      location: true,
      unit: true,
      sellingPrice: true,
      currentStock: true,
      stockValueCost: true,
      stockValueSale: true,
      potentialProfit: true,
      unitsSold: true,
      unitsTransferred: true,
      unitsAdjusted: true,
    });
  };

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

  const downloadCsv = () => {
    const headers = ['SKU', 'Product', 'Variation', 'Category', 'Location', 'Unit', 'Selling Price', 'Current Stock', 'Stock Value (Cost)', 'Stock Value (Sale)', 'Potential Profit', 'Units Sold', 'Units Transferred', 'Units Adjusted'];
    const rows = filteredProducts.map((product) => {
      const stockValueCost = product.currentStockValue;
      const stockValueSale = product.currentStock * product.defaultSellingPrice;
      const potentialProfit = stockValueSale - stockValueCost;
      return [
        formatProductSkuDisplay(product.sku, skuPrefix),
        product.name,
        '-',
        product.categoryName,
        (product.locationNames ?? []).join(', '),
        product.unitName,
        String(product.defaultSellingPrice ?? 0),
        String(product.currentStock ?? 0),
        String(stockValueCost ?? 0),
        String(stockValueSale ?? 0),
        String(potentialProfit ?? 0),
        String(product.totalUnitsSold ?? 0),
        String(product.totalUnitsTransferred ?? 0),
        String(product.totalUnitsAdjusted ?? 0),
      ];
    });
    const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'stock-report.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const openPrintableWindow = (title: string) => {
    const popup = window.open('', '_blank', 'noopener,noreferrer,width=1200,height=800');
    if (!popup) return;
    const rows = filteredProducts
      .map((product) => {
        const stockValueCost = product.currentStockValue;
        const stockValueSale = product.currentStock * product.defaultSellingPrice;
        const potentialProfit = stockValueSale - stockValueCost;
        return `
          <tr>
            <td>${formatProductSkuDisplay(product.sku, skuPrefix)}</td>
            <td>${product.name ?? ''}</td>
            <td>-</td>
            <td>${product.categoryName ?? ''}</td>
            <td>${(product.locationNames ?? []).join(', ')}</td>
            <td>${product.unitName ?? ''}</td>
            <td>${product.defaultSellingPrice ?? 0}</td>
            <td>${product.currentStock ?? 0}</td>
            <td>${stockValueCost ?? 0}</td>
            <td>${stockValueSale ?? 0}</td>
            <td>${potentialProfit ?? 0}</td>
            <td>${product.totalUnitsSold ?? 0}</td>
            <td>${product.totalUnitsTransferred ?? 0}</td>
            <td>${product.totalUnitsAdjusted ?? 0}</td>
          </tr>`;
      })
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
                <th>SKU</th><th>Product</th><th>Variation</th><th>Category</th><th>Location</th><th>Unit</th><th>Selling Price</th><th>Current Stock</th><th>Stock Value (Cost)</th><th>Stock Value (Sale)</th><th>Potential Profit</th><th>Units Sold</th><th>Units Transferred</th><th>Units Adjusted</th>
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
          <p className="text-sm font-semibold text-foreground">Stock Report</p>
          <p className="text-xs text-muted-foreground">Configure the columns shown in this tab only.</p>
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
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={downloadCsv} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-alt">
            <Download className="h-3.5 w-3.5" />
            CSV
          </button>
          <button type="button" onClick={() => openPrintableWindow('Stock Report - PDF Export')} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-alt">
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
                {visibleColumns.sku && <th className="w-[140px] px-4 py-3 text-left text-xs font-semibold text-muted-foreground">SKU</th>}
                {visibleColumns.product && <th className="w-[300px] px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Product</th>}
                {visibleColumns.variation && <th className="w-[160px] px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Variation</th>}
                {visibleColumns.category && <th className="w-[170px] px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Category</th>}
                {visibleColumns.location && <th className="w-[190px] px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Location</th>}
                {visibleColumns.unit && <th className="w-[110px] px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Unit</th>}
                {visibleColumns.sellingPrice && <th className="w-[150px] px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Selling Price</th>}
                {visibleColumns.currentStock && <th className="w-[120px] px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Current Stock</th>}
                {visibleColumns.stockValueCost && <th className="w-[160px] px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Stock Value (Cost)</th>}
                {visibleColumns.stockValueSale && <th className="w-[160px] px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Stock Value (Sale)</th>}
                {visibleColumns.potentialProfit && <th className="w-[160px] px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Potential Profit</th>}
                {visibleColumns.unitsSold && <th className="w-[120px] px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Units Sold</th>}
                {visibleColumns.unitsTransferred && <th className="w-[140px] px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Units Transferred</th>}
                {visibleColumns.unitsAdjusted && <th className="w-[130px] px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Units Adjusted</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayedProducts.length > 0 ? (
                displayedProducts.map((product) => {
                  const stockValueCost = product.currentStockValue;
                  const stockValueSale = product.currentStock * product.defaultSellingPrice;
                  const potentialProfit = stockValueSale - stockValueCost;
                  return (
                    <tr key={product.id} className="transition-colors hover:bg-surface-alt/30">
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
                      {visibleColumns.sku && (
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-muted-foreground">
                          {formatProductSkuDisplay(product.sku, skuPrefix)}
                        </td>
                      )}
                      {visibleColumns.product && (
                        <td className="w-[300px] px-4 py-3 text-sm font-medium text-foreground">
                          <p className="truncate" title={product.name}>
                            {product.name}
                          </p>
                        </td>
                      )}
                      {visibleColumns.variation && <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">-</td>}
                      {visibleColumns.category && <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">{product.categoryName}</td>}
                      {visibleColumns.location && (
                        <td className="max-w-[190px] px-4 py-3 text-sm text-muted-foreground">
                          <p className="truncate" title={product.locationNames.join(', ')}>
                            {product.locationNames.length > 0 ? product.locationNames.join(', ') : '-'}
                          </p>
                        </td>
                      )}
                      {visibleColumns.unit && <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">{product.unitName}</td>}
                      {visibleColumns.sellingPrice && <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-foreground">{formatCurrency(product.defaultSellingPrice)}</td>}
                      {visibleColumns.currentStock && (
                        <td
                          className={`whitespace-nowrap px-4 py-3 text-right text-sm font-semibold ${
                            product.currentStock === 0
                              ? 'text-destructive'
                              : product.currentStock <= product.alertQuantity
                                ? 'text-amber-600'
                                : 'text-foreground'
                          }`}
                        >
                          {product.currentStock}
                        </td>
                      )}
                      {visibleColumns.stockValueCost && <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-foreground">{formatCurrency(stockValueCost)}</td>}
                      {visibleColumns.stockValueSale && <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-foreground">{formatCurrency(stockValueSale)}</td>}
                      {visibleColumns.potentialProfit && (
                        <td
                          className={`whitespace-nowrap px-4 py-3 text-right text-sm font-semibold ${
                            potentialProfit > 0 ? 'text-success' : potentialProfit < 0 ? 'text-destructive' : 'text-muted-foreground'
                          }`}
                        >
                          {formatCurrency(potentialProfit)}
                        </td>
                      )}
                      {visibleColumns.unitsSold && <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-foreground">{product.totalUnitsSold}</td>}
                      {visibleColumns.unitsTransferred && <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-foreground">{product.totalUnitsTransferred}</td>}
                      {visibleColumns.unitsAdjusted && <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-foreground">{product.totalUnitsAdjusted}</td>}
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
    </div>
  );
}
