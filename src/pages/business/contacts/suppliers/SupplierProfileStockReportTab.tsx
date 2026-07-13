import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AlertCircle, BarChart3, CheckCircle, Clock, Download, Filter, Minus, Package, Printer, RefreshCw, Search, TrendingDown, TrendingUp, X } from 'lucide-react';
import type { SupplierProfileData, SupplierProfileStockReportItem } from './supplierProfileTypes';
import { useBusinessCurrency } from '@/business/businessStore';
import { useBusinessLocations } from '@/hooks/business/settings/useBusinessLocations';
import { useSupplierStockReport } from '@/hooks/business/suppliers/useSupplierStockReport';

type Props = {
  supplier: SupplierProfileData;
};

function SummaryCard({
  title,
  value,
  icon,
  color = 'primary',
}: {
  title: string;
  value: string;
  icon: ReactNode;
  color?: 'primary' | 'success' | 'destructive';
}) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    destructive: 'bg-destructive/10 text-destructive',
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="mt-2 text-lg font-bold text-foreground">{value}</p>
        </div>
        <div className={`rounded-lg ${colorClasses[color]} p-2`}>{icon}</div>
      </div>
    </div>
  );
}

function getStatusBadge(status: SupplierProfileStockReportItem['status']) {
  const configs = {
    healthy: { color: 'bg-success/10 text-success', icon: <CheckCircle className="h-3 w-3" />, label: 'Healthy' },
    low: { color: 'bg-amber-500/10 text-amber-600', icon: <Clock className="h-3 w-3" />, label: 'Low Stock' },
    critical: { color: 'bg-destructive/10 text-destructive', icon: <AlertCircle className="h-3 w-3" />, label: 'Critical' },
    'out-of-stock': { color: 'bg-muted text-muted-foreground', icon: <X className="h-3 w-3" />, label: 'Out of Stock' },
  } as const;

  const config = configs[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  );
}

function getTrendIcon(item: SupplierProfileStockReportItem) {
  const movement = item.quantityAvailable - item.soldAlreadyForSupplier;
  if (movement > 0) return <TrendingUp className="h-4 w-4 text-success" />;
  if (movement < 0) return <TrendingDown className="h-4 w-4 text-destructive" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function getStatusFromQuantity(item: SupplierProfileStockReportItem): SupplierProfileStockReportItem['status'] {
  if (item.quantityAvailable === 0) return 'out-of-stock';
  if (item.quantityAvailable <= 10) return 'critical';
  if (item.quantityAvailable <= 25) return 'low';
  return 'healthy';
}

export default function SupplierProfileStockReportTab({ supplier }: Props) {
  const { formatCurrency } = useBusinessCurrency();
  const { locations } = useBusinessLocations();
  const { items: reportItems, isLoading, error, fetchSupplierStockReport } = useSupplierStockReport();

  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof SupplierProfileStockReportItem | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });

  useEffect(() => {
    void fetchSupplierStockReport(supplier.id).catch(() => undefined);
  }, [fetchSupplierStockReport, supplier.id]);

  const stockItems = useMemo(() => {
    return reportItems.map((item) => ({
      ...item,
      status: getStatusFromQuantity(item),
    }));
  }, [reportItems]);

  const categories = useMemo(() => {
    const unique = new Set(stockItems.map((item) => item.categoryName));
    return Array.from(unique).sort();
  }, [stockItems]);

  const filteredItems = useMemo(() => {
    let items = [...stockItems];

    if (selectedLocation !== 'all') {
      items = items.filter((item) => item.locationId === selectedLocation);
    }

    if (statusFilter !== 'all') {
      items = items.filter((item) => item.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      items = items.filter((item) => item.categoryName === categoryFilter);
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      items = items.filter(
        (item) =>
          item.productName.toLowerCase().includes(searchLower) ||
          item.sku.toLowerCase().includes(searchLower) ||
          item.categoryName.toLowerCase().includes(searchLower) ||
          item.locationName.toLowerCase().includes(searchLower),
      );
    }

    if (sortConfig.key) {
      items.sort((a, b) => {
        const aVal = a[sortConfig.key!];
        const bVal = b[sortConfig.key!];
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        return 0;
      });
    }

    return items;
  }, [categoryFilter, selectedLocation, searchTerm, sortConfig, statusFilter, stockItems]);

  const summary = useMemo(() => {
    const totalProducts = filteredItems.length;
    const totalStockValue = filteredItems.reduce((sum, item) => sum + item.quantityAvailable * item.costPrice, 0);
    const totalQuantityAvailable = filteredItems.reduce((sum, item) => sum + item.quantityAvailable, 0);
    const totalSupplied = filteredItems.reduce((sum, item) => sum + item.suppliedBySupplier, 0);
    const totalSold = filteredItems.reduce((sum, item) => sum + item.soldAlreadyForSupplier, 0);

    const stockStatusCount = {
      healthy: filteredItems.filter((item) => item.status === 'healthy').length,
      low: filteredItems.filter((item) => item.status === 'low').length,
      critical: filteredItems.filter((item) => item.status === 'critical').length,
      'out-of-stock': filteredItems.filter((item) => item.status === 'out-of-stock').length,
    };

    return {
      totalProducts,
      totalStockValue,
      totalQuantityAvailable,
      totalSupplied,
      totalSold,
      stockStatusCount,
    };
  }, [filteredItems]);

  const handleSort = (key: keyof SupplierProfileStockReportItem) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleExportCSV = () => {
    const headers = [
      'Product',
      'SKU',
      'Category',
      'Supplied by Supplier',
      'Sold Already for Supplier',
      'Quantity Available',
      'Stock Value',
      'Cost Price',
      'Selling Price',
      'Location',
      'Status',
    ];

    const rows = filteredItems.map((item) => [
      item.productName,
      item.sku,
      item.categoryName,
      item.suppliedBySupplier.toString(),
      item.soldAlreadyForSupplier.toString(),
      item.quantityAvailable.toString(),
      (item.quantityAvailable * item.costPrice).toFixed(2),
      item.costPrice.toFixed(2),
      item.sellingPrice.toFixed(2),
      item.locationName,
      item.status,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock_report_${supplier.name}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetFilters = () => {
    setSelectedLocation('all');
    setSearchTerm('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setSortConfig({ key: null, direction: 'asc' });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-gradient-to-r from-primary/5 via-transparent to-transparent p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Stock Report Overview</h4>
            <p className="text-sm text-muted-foreground">
              Track inventory levels and sales movement for all products supplied by {supplier.name}.
              Quantity available, supplied by supplier, and sold already for this supplier are calculated from live inventory data.
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard title="Total Products" value={summary.totalProducts.toString()} icon={<Package className="h-4 w-4" />} color="primary" />
        <SummaryCard title="Quantity Available" value={summary.totalQuantityAvailable.toString()} icon={<BarChart3 className="h-4 w-4" />} color="primary" />
        <SummaryCard title="Supplied by Supplier" value={summary.totalSupplied.toString()} icon={<TrendingUp className="h-4 w-4" />} color="success" />
        <SummaryCard title="Sold for Supplier" value={summary.totalSold.toString()} icon={<TrendingDown className="h-4 w-4" />} color="destructive" />
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Healthy Stock</p>
          <p className="text-lg font-bold text-success">{summary.stockStatusCount.healthy}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Low Stock</p>
          <p className="text-lg font-bold text-amber-600">{summary.stockStatusCount.low}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Critical</p>
          <p className="text-lg font-bold text-destructive">{summary.stockStatusCount.critical}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Out of Stock</p>
          <p className="text-lg font-bold text-muted-foreground">{summary.stockStatusCount['out-of-stock']}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          <button
            type="button"
            onClick={() => setShowFilters((prev) => !prev)}
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary"
          >
            <Filter className="h-4 w-4" />
            Filters & Options
            {showFilters ? <X className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-alt"
            >
              <Download className="h-3.5 w-3.5" />
              CSV
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-alt"
            >
              <Printer className="h-3.5 w-3.5" />
              Print
            </button>
          </div>
        </div>

        {showFilters ? (
          <div className="grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Business Location</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
              >
                <option value="all">All Locations</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.locationName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Stock Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
              >
                <option value="all">All Statuses</option>
                <option value="healthy">Healthy</option>
                <option value="low">Low Stock</option>
                <option value="critical">Critical</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Search</label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search products..."
                  className="w-full rounded-lg border border-border bg-background py-1.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="flex items-end md:col-span-2 lg:col-span-4">
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reset Filters
              </button>
              <span className="ml-4 text-sm text-muted-foreground">
                {filteredItems.length} products found
              </span>
            </div>
          </div>
        ) : (
          <div className="px-4 py-3 text-sm text-muted-foreground">
            Filters are collapsed. Current query is still applied to the supplier stock report below.
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border bg-gradient-to-r from-primary/5 via-transparent to-transparent px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">
            Stock Items
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {filteredItems.length} items
            </span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-surface-alt">
              <tr>
                <th
                  className="cursor-pointer whitespace-nowrap px-4 py-2 text-left text-xs font-semibold text-muted-foreground hover:text-foreground"
                  onClick={() => handleSort('productName')}
                >
                  Product {sortConfig.key === 'productName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="whitespace-nowrap px-4 py-2 text-left text-xs font-semibold text-muted-foreground">SKU</th>
                <th className="whitespace-nowrap px-4 py-2 text-left text-xs font-semibold text-muted-foreground">Category</th>
                <th
                  className="cursor-pointer whitespace-nowrap px-4 py-2 text-right text-xs font-semibold text-muted-foreground hover:text-foreground"
                  onClick={() => handleSort('suppliedBySupplier')}
                >
                  Supplied by Supplier {sortConfig.key === 'suppliedBySupplier' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="cursor-pointer whitespace-nowrap px-4 py-2 text-right text-xs font-semibold text-muted-foreground hover:text-foreground"
                  onClick={() => handleSort('soldAlreadyForSupplier')}
                >
                  Sold Already for Supplier {sortConfig.key === 'soldAlreadyForSupplier' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="cursor-pointer whitespace-nowrap px-4 py-2 text-right text-xs font-semibold text-muted-foreground hover:text-foreground"
                  onClick={() => handleSort('quantityAvailable')}
                >
                  Quantity Available {sortConfig.key === 'quantityAvailable' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="cursor-pointer whitespace-nowrap px-4 py-2 text-right text-xs font-semibold text-muted-foreground hover:text-foreground"
                  onClick={() => handleSort('costPrice')}
                >
                  Stock Value {sortConfig.key === 'costPrice' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="whitespace-nowrap px-4 py-2 text-right text-xs font-semibold text-muted-foreground">Location</th>
                <th className="whitespace-nowrap px-4 py-2 text-center text-xs font-semibold text-muted-foreground">Status</th>
                <th className="whitespace-nowrap px-4 py-2 text-center text-xs font-semibold text-muted-foreground">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Loading stock report...
                  </td>
                </tr>
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-surface-alt/30">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">{item.locationName}</p>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-muted-foreground">{item.sku || '-'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">{item.categoryName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-foreground">
                      {item.suppliedBySupplier.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-foreground">
                      {item.soldAlreadyForSupplier.toLocaleString()}
                    </td>
                    <td
                      className={`whitespace-nowrap px-4 py-3 text-right text-sm font-semibold ${
                        item.quantityAvailable === 0
                          ? 'text-destructive'
                          : item.quantityAvailable <= 10
                            ? 'text-amber-600'
                            : 'text-foreground'
                      }`}
                    >
                      {item.quantityAvailable.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-foreground">
                      {formatCurrency(item.quantityAvailable * item.costPrice)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-muted-foreground">
                      {item.locationName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center">{getStatusBadge(item.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {getTrendIcon(item)}
                        <span className="text-xs text-muted-foreground">
                          {item.quantityAvailable - item.soldAlreadyForSupplier > 0 ? '+' : ''}
                          {item.quantityAvailable - item.soldAlreadyForSupplier}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No stock items found matching the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
