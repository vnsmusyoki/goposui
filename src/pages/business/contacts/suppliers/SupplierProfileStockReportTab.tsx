import type { ReactNode } from 'react';
import { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Layers3, 
  PackageCheck, 
  Search, 
  Download, 
  Mail, 
  MessageCircle, 
  Printer,
  Filter,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Package,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import type { SupplierProfileData } from './supplierProfileTypes';
import { useBusinessCurrency } from '@/business/businessStore';
import { useBusinessLocations } from '@/hooks/business/settings/useBusinessLocations';

type Props = {
  supplier: SupplierProfileData;
};

type StockItem = {
  id: string;
  productName: string;
  sku: string;
  category: string;
  purchaseQuantity: number;
  totalSold: number;
  totalTransferred: number;
  totalReturned: number;
  currentStock: number;
  costPrice: number;
  sellingPrice: number;
  locationId: string;
  locationName: string;
  status: 'healthy' | 'low' | 'critical' | 'out-of-stock';
  reorderLevel: number;
  lastUpdated: string;
  supplier: string;
};

// Mock data with more realistic entries
const mockStockItems: StockItem[] = [
  {
    id: '1',
    productName: 'Maize Flour 1kg',
    sku: 'MF-001-1KG',
    category: 'Grains',
    purchaseQuantity: 500,
    totalSold: 80,
    totalTransferred: 0,
    totalReturned: 0,
    currentStock: 420,
    costPrice: 2.50,
    sellingPrice: 3.75,
    locationId: 'loc-1',
    locationName: 'Warehouse A',
    status: 'healthy',
    reorderLevel: 50,
    lastUpdated: '2026-07-20T10:30:00',
    supplier: 'TechSupplies Ltd'
  },
  {
    id: '2',
    productName: 'Cooking Oil 1L',
    sku: 'CO-001-1L',
    category: 'Oils & Fats',
    purchaseQuantity: 200,
    totalSold: 75,
    totalTransferred: 5,
    totalReturned: 0,
    currentStock: 120,
    costPrice: 4.20,
    sellingPrice: 5.50,
    locationId: 'loc-2',
    locationName: 'Warehouse B',
    status: 'low',
    reorderLevel: 100,
    lastUpdated: '2026-07-19T14:15:00',
    supplier: 'Industrial Parts Co'
  },
  {
    id: '3',
    productName: 'Rice 5kg',
    sku: 'RC-005-5KG',
    category: 'Grains',
    purchaseQuantity: 100,
    totalSold: 35,
    totalTransferred: 7,
    totalReturned: 0,
    currentStock: 58,
    costPrice: 8.00,
    sellingPrice: 11.99,
    locationId: 'loc-1',
    locationName: 'Warehouse A',
    status: 'critical',
    reorderLevel: 60,
    lastUpdated: '2026-07-18T09:45:00',
    supplier: 'Raw Materials Inc'
  },
  {
    id: '4',
    productName: 'Sugar 2kg',
    sku: 'SG-002-2KG',
    category: 'Pantry',
    purchaseQuantity: 150,
    totalSold: 45,
    totalTransferred: 10,
    totalReturned: 2,
    currentStock: 93,
    costPrice: 3.00,
    sellingPrice: 4.50,
    locationId: 'loc-3',
    locationName: 'Warehouse C',
    status: 'healthy',
    reorderLevel: 40,
    lastUpdated: '2026-07-20T11:20:00',
    supplier: 'Electronics World'
  },
  {
    id: '5',
    productName: 'Salt 500g',
    sku: 'ST-500-500G',
    category: 'Spices',
    purchaseQuantity: 80,
    totalSold: 10,
    totalTransferred: 0,
    totalReturned: 0,
    currentStock: 70,
    costPrice: 0.75,
    sellingPrice: 1.25,
    locationId: 'loc-2',
    locationName: 'Warehouse B',
    status: 'healthy',
    reorderLevel: 20,
    lastUpdated: '2026-07-19T16:30:00',
    supplier: 'Office Solutions'
  },
  {
    id: '6',
    productName: 'Spaghetti 500g',
    sku: 'SP-500-500G',
    category: 'Pasta',
    purchaseQuantity: 60,
    totalSold: 55,
    totalTransferred: 3,
    totalReturned: 2,
    currentStock: 0,
    costPrice: 1.80,
    sellingPrice: 2.99,
    locationId: 'loc-1',
    locationName: 'Warehouse A',
    status: 'out-of-stock',
    reorderLevel: 20,
    lastUpdated: '2026-07-17T08:00:00',
    supplier: 'TechSupplies Ltd'
  },
  {
    id: '7',
    productName: 'Baking Powder 100g',
    sku: 'BP-100-100G',
    category: 'Baking',
    purchaseQuantity: 40,
    totalSold: 25,
    totalTransferred: 0,
    totalReturned: 0,
    currentStock: 15,
    costPrice: 1.20,
    sellingPrice: 1.99,
    locationId: 'loc-3',
    locationName: 'Warehouse C',
    status: 'critical',
    reorderLevel: 15,
    lastUpdated: '2026-07-20T13:00:00',
    supplier: 'Raw Materials Inc'
  }
];

export default function SupplierProfileStockReportTab({ supplier }: Props) {
  const { formatCurrency } = useBusinessCurrency();
  const { locations } = useBusinessLocations();
  
  // State
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof StockItem | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });
  
  // Get unique categories for filter
  const categories = useMemo(() => {
    const unique = new Set(mockStockItems.map(item => item.category));
    return Array.from(unique).sort();
  }, []);
  
  // Filter and search items
  const filteredItems = useMemo(() => {
    let items = [...mockStockItems];
    
    // Location filter
    if (selectedLocation !== 'all') {
      items = items.filter(item => item.locationId === selectedLocation);
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      items = items.filter(item => item.status === statusFilter);
    }
    
    // Category filter
    if (categoryFilter !== 'all') {
      items = items.filter(item => item.category === categoryFilter);
    }
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      items = items.filter(item =>
        item.productName.toLowerCase().includes(searchLower) ||
        item.sku.toLowerCase().includes(searchLower) ||
        item.category.toLowerCase().includes(searchLower) ||
        item.supplier.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort
    if (sortConfig.key) {
      items.sort((a, b) => {
        const aVal = a[sortConfig.key!];
        const bVal = b[sortConfig.key!];
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortConfig.direction === 'asc' 
            ? aVal.localeCompare(bVal) 
            : bVal.localeCompare(aVal);
        }
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' 
            ? aVal - bVal 
            : bVal - aVal;
        }
        return 0;
      });
    }
    
    return items;
  }, [selectedLocation, searchTerm, statusFilter, categoryFilter, sortConfig]);
  
  // Calculate summary
  const summary = useMemo(() => {
    const totalProducts = filteredItems.length;
    const totalStockValue = filteredItems.reduce((sum, item) => sum + (item.currentStock * item.costPrice), 0);
    const totalPurchaseQuantity = filteredItems.reduce((sum, item) => sum + item.purchaseQuantity, 0);
    const totalSold = filteredItems.reduce((sum, item) => sum + item.totalSold, 0);
    
    const stockStatusCount = {
      healthy: filteredItems.filter(item => item.status === 'healthy').length,
      low: filteredItems.filter(item => item.status === 'low').length,
      critical: filteredItems.filter(item => item.status === 'critical').length,
      'out-of-stock': filteredItems.filter(item => item.status === 'out-of-stock').length,
    };
    
    return {
      totalProducts,
      totalStockValue,
      totalPurchaseQuantity,
      totalSold,
      stockStatusCount,
    };
  }, [filteredItems]);
  
  // Get status badge
  const getStatusBadge = (status: StockItem['status']) => {
    const config = {
      healthy: { color: 'bg-success/10 text-success', icon: <CheckCircle className="h-3 w-3" />, label: 'Healthy' },
      low: { color: 'bg-amber-500/10 text-amber-600', icon: <Clock className="h-3 w-3" />, label: 'Low Stock' },
      critical: { color: 'bg-destructive/10 text-destructive', icon: <AlertCircle className="h-3 w-3" />, label: 'Critical' },
      'out-of-stock': { color: 'bg-muted text-muted-foreground', icon: <X className="h-3 w-3" />, label: 'Out of Stock' },
    };
    const configs = config[status];
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${configs.color}`}>
        {configs.icon}
        {configs.label}
      </span>
    );
  };
  
  // Get trend icon for stock movement
  const getTrendIcon = (item: StockItem) => {
    const movement = item.currentStock - (item.currentStock - item.totalSold - item.totalTransferred);
    if (movement > 0) {
      return <TrendingUp className="h-4 w-4 text-success" />;
    } else if (movement < 0) {
      return <TrendingDown className="h-4 w-4 text-destructive" />;
    } else {
      return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };
  
  // Handle sort
  const handleSort = (key: keyof StockItem) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };
  
  // Export handlers
  const handleExportCSV = () => {
    const headers = [
      'Product', 'SKU', 'Category', 'Purchase Quantity', 'Total Sold', 
      'Total Transferred', 'Total Returned', 'Current Stock', 'Stock Value', 
      'Cost Price', 'Selling Price', 'Location', 'Status', 'Supplier'
    ];
    const rows = filteredItems.map(item => [
      item.productName,
      item.sku,
      item.category,
      item.purchaseQuantity.toString(),
      item.totalSold.toString(),
      item.totalTransferred.toString(),
      item.totalReturned.toString(),
      item.currentStock.toString(),
      (item.currentStock * item.costPrice).toFixed(2),
      item.costPrice.toFixed(2),
      item.sellingPrice.toFixed(2),
      item.locationName,
      item.status,
      item.supplier
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock_report_${supplier.name}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleExportEmail = () => {
    window.location.href = `mailto:?subject=Stock Report - ${supplier.name}&body=Please find attached the stock report for ${supplier.name}.`;
  };
  
  const handleExportWhatsApp = () => {
    const message = `📊 Stock Report - ${supplier.name}\n\n` +
      `📦 Total Products: ${summary.totalProducts}\n` +
      `💰 Total Stock Value: ${formatCurrency(summary.totalStockValue)}\n` +
      `✅ Healthy: ${summary.stockStatusCount.healthy}\n` +
      `⚠️ Low Stock: ${summary.stockStatusCount.low}\n` +
      `🔴 Critical: ${summary.stockStatusCount.critical}\n` +
      `❌ Out of Stock: ${summary.stockStatusCount['out-of-stock']}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
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
      {/* Description */}
      <div className="rounded-xl border border-border bg-gradient-to-r from-primary/5 via-transparent to-transparent p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Stock Report Overview</h4>
            <p className="text-sm text-muted-foreground">
              Track inventory levels and stock movement for all products supplied by {supplier.name}. 
              Monitor current stock values, identify items requiring reorder, and analyze product performance 
              across different locations.
            </p>
          </div>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard 
          title="Total Products" 
          value={summary.totalProducts.toString()} 
          icon={<Package className="h-4 w-4" />}
          color="primary"
        />
        <SummaryCard 
          title="Total Stock Value" 
          value={formatCurrency(summary.totalStockValue)} 
          icon={<BarChart3 className="h-4 w-4" />}
          color="primary"
        />
        <SummaryCard 
          title="Total Purchases" 
          value={summary.totalPurchaseQuantity.toString()} 
          icon={<TrendingUp className="h-4 w-4" />}
          color="success"
        />
        <SummaryCard 
          title="Total Sold" 
          value={summary.totalSold.toString()} 
          icon={<TrendingDown className="h-4 w-4" />}
          color="destructive"
        />
      </div>
      
      {/* Stock Status Summary */}
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
      
      {/* Filters Section */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
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
              onClick={handleExportEmail}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-alt"
            >
              <Mail className="h-3.5 w-3.5" />
              Email
            </button>
            <button
              type="button"
              onClick={handleExportWhatsApp}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-alt"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp
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
        
        {showFilters && (
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
        )}
      </div>
      
      {/* Stock Table */}
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
                  className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap cursor-pointer hover:text-foreground"
                  onClick={() => handleSort('productName')}
                >
                  Product {sortConfig.key === 'productName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">SKU</th>
                <th 
                  className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground whitespace-nowrap cursor-pointer hover:text-foreground"
                  onClick={() => handleSort('purchaseQuantity')}
                >
                  Purchase Qty {sortConfig.key === 'purchaseQuantity' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground whitespace-nowrap cursor-pointer hover:text-foreground"
                  onClick={() => handleSort('totalSold')}
                >
                  Total Sold {sortConfig.key === 'totalSold' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground whitespace-nowrap cursor-pointer hover:text-foreground"
                  onClick={() => handleSort('totalTransferred')}
                >
                  Transferred {sortConfig.key === 'totalTransferred' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground whitespace-nowrap cursor-pointer hover:text-foreground"
                  onClick={() => handleSort('totalReturned')}
                >
                  Returned {sortConfig.key === 'totalReturned' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground whitespace-nowrap cursor-pointer hover:text-foreground"
                  onClick={() => handleSort('currentStock')}
                >
                  Current Stock {sortConfig.key === 'currentStock' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground whitespace-nowrap cursor-pointer hover:text-foreground"
                  onClick={() => handleSort('costPrice')}
                >
                  Stock Value {sortConfig.key === 'costPrice' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-muted-foreground whitespace-nowrap">Status</th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-muted-foreground whitespace-nowrap">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-alt/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">{item.category}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-muted-foreground whitespace-nowrap">
                      {item.sku}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-foreground whitespace-nowrap">
                      {item.purchaseQuantity.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-foreground whitespace-nowrap">
                      {item.totalSold.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-foreground whitespace-nowrap">
                      {item.totalTransferred.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-foreground whitespace-nowrap">
                      {item.totalReturned.toLocaleString()}
                    </td>
                    <td className={`px-4 py-3 text-right text-sm font-semibold whitespace-nowrap ${
                      item.currentStock === 0 ? 'text-destructive' :
                      item.currentStock < item.reorderLevel ? 'text-amber-600' :
                      'text-foreground'
                    }`}>
                      {item.currentStock.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-foreground whitespace-nowrap">
                      {formatCurrency(item.currentStock * item.costPrice)}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {getTrendIcon(item)}
                        <span className="text-xs text-muted-foreground">
                          {item.currentStock - (item.purchaseQuantity - item.totalSold - item.totalTransferred) > 0 ? '+' : ''}
                          {item.currentStock - (item.purchaseQuantity - item.totalSold - item.totalTransferred)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-sm text-muted-foreground">
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

function SummaryCard({ 
  title, 
  value, 
  icon, 
  color = 'primary' 
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
        <div className={`rounded-lg ${colorClasses[color]} p-2`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
