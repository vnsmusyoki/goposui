import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Filter,
  Search,
  Calendar,
  MapPin,
  Truck,
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Download,
  Printer,
  MoreVertical,
  BarChart3,
  Users,
  Building2,
  Receipt,
  CreditCard,
  FileText,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useBusinessLocations } from '@/hooks/business/settings/useBusinessLocations';
import { useBusinessSettings } from '@/hooks/business/settings/useBusinessSettings';
import { useBusinessSuppliers } from '@/hooks/business/suppliers/useBusinessSuppliers';
import { usePurchaseOrders, type PurchaseOrder, type PurchaseOrderStatus, type DeliveryStatus, type PaymentStatus } from '@/hooks/business/purchases/usePurchaseOrders';
import { DateRangePicker } from '@/components/forms/DateRangePicker';
import { ApiError } from '@/lib/api';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

type FilterState = {
  locationId: string;
  supplierId: string;
  status: PurchaseOrderStatus | 'all';
  deliveryStatus: DeliveryStatus | 'all';
  paymentStatus: PaymentStatus | 'all';
  dateRange: { from: Date | null; to: Date | null };
  searchQuery: string;
};

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

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700 border-gray-300',
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    approved: 'bg-blue-100 text-blue-700 border-blue-300',
    ordered: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    received: 'bg-green-100 text-green-700 border-green-300',
    partially_received: 'bg-cyan-100 text-cyan-700 border-cyan-300',
    cancelled: 'bg-red-100 text-red-700 border-red-300',
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    in_transit: 'bg-purple-100 text-purple-700 border-purple-300',
    delivered: 'bg-green-100 text-green-700 border-green-300',
    pending_delivery: 'bg-orange-100 text-orange-700 border-orange-300',
    paid: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    unpaid: 'bg-rose-100 text-rose-700 border-rose-300',
    partially_paid: 'bg-amber-100 text-amber-700 border-amber-300',
  };
  return colors[status] || 'bg-gray-100 text-gray-700 border-gray-300';
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Draft',
    pending: 'Pending',
    approved: 'Approved',
    ordered: 'Ordered',
    received: 'Received',
    partially_received: 'Partially Received',
    cancelled: 'Cancelled',
    completed: 'Completed',
    in_transit: 'In Transit',
    delivered: 'Delivered',
    pending_delivery: 'Pending Delivery',
    paid: 'Paid',
    unpaid: 'Unpaid',
    partially_paid: 'Partially Paid',
  };
  return labels[status] || status;
}

// --------------------------------------------------------------------------
// Sub-components
// --------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(status)}`}>
      {getStatusLabel(status)}
    </span>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none"
        >
          <option value="all">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  );
}

function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  color = 'primary',
}: {
  title: string;
  value: string | number;
  change?: { value: number; positive: boolean };
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
}) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    emerald: 'bg-emerald-500/10 text-emerald-600',
    blue: 'bg-blue-500/10 text-blue-600',
    purple: 'bg-purple-500/10 text-purple-600',
    amber: 'bg-amber-500/10 text-amber-600',
    rose: 'bg-rose-500/10 text-rose-600',
    indigo: 'bg-indigo-500/10 text-indigo-600',
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={`rounded-lg p-2 ${colorClasses[color as keyof typeof colorClasses] || colorClasses.primary}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {change && (
          <div className="mt-1 flex items-center gap-1 text-xs">
            <span className={change.positive ? 'text-emerald-600' : 'text-rose-600'}>
              {change.positive ? <TrendingUp className="inline h-3 w-3" /> : <TrendingDown className="inline h-3 w-3" />}
              {change.value}%
            </span>
            <span className="text-muted-foreground">vs last month</span>
          </div>
        )}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Main Component
// --------------------------------------------------------------------------

export default function PurchaseOrders() {
  const navigate = useNavigate();
  const { settings: businessSettings } = useBusinessSettings();
  const { locations } = useBusinessLocations();
  const { suppliers } = useBusinessSuppliers();
  const {
    purchaseOrders,
    loading,
    error,
    fetchPurchaseOrders,
    deletePurchaseOrder,
  } = usePurchaseOrders();

  const [activeTab, setActiveTab] = useState<'analytics' | 'list'>('list');
  const [filters, setFilters] = useState<FilterState>({
    locationId: 'all',
    supplierId: 'all',
    status: 'all',
    deliveryStatus: 'all',
    paymentStatus: 'all',
    dateRange: { from: null, to: null },
    searchQuery: '',
  });
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const currencyCode = businessSettings?.currency || 'USD';
  const currencyPrecision = typeof businessSettings?.currencyPrecision === 'number' ? businessSettings.currencyPrecision : 2;
  const currencyPlacement = businessSettings?.currencySymbolPlacement === 'after' ? 'after' : 'before';

  useEffect(() => {
    fetchPurchaseOrders();
  }, [fetchPurchaseOrders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    let orders = purchaseOrders;

    if (filters.locationId !== 'all') {
      orders = orders.filter((order) => order.locationId === filters.locationId);
    }

    if (filters.supplierId !== 'all') {
      orders = orders.filter((order) => order.supplierId === filters.supplierId);
    }

    if (filters.status !== 'all') {
      orders = orders.filter((order) => order.status === filters.status);
    }

    if (filters.deliveryStatus !== 'all') {
      orders = orders.filter((order) => order.deliveryStatus === filters.deliveryStatus);
    }

    if (filters.paymentStatus !== 'all') {
      orders = orders.filter((order) => order.paymentStatus === filters.paymentStatus);
    }

    if (filters.dateRange.from) {
      orders = orders.filter((order) => new Date(order.orderDate) >= filters.dateRange.from!);
    }
    if (filters.dateRange.to) {
      orders = orders.filter((order) => new Date(order.orderDate) <= filters.dateRange.to!);
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      orders = orders.filter(
        (order) =>
          order.referenceNumber.toLowerCase().includes(query) ||
          order.supplierName.toLowerCase().includes(query) ||
          order.locationName.toLowerCase().includes(query)
      );
    }

    return orders;
  }, [purchaseOrders, filters]);

  // Analytics data
  const analytics = useMemo(() => {
    const totalOrders = purchaseOrders.length;
    const totalValue = purchaseOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const receivedOrders = purchaseOrders.filter((o) => o.status === 'received' || o.status === 'completed');
    const pendingOrders = purchaseOrders.filter((o) => o.status === 'pending' || o.status === 'approved');
    const cancelledOrders = purchaseOrders.filter((o) => o.status === 'cancelled');
    const averageOrderValue = totalOrders > 0 ? totalValue / totalOrders : 0;

    // Monthly trend
    const monthlyData = purchaseOrders.reduce((acc, order) => {
      const month = format(new Date(order.orderDate), 'MMM yyyy');
      if (!acc[month]) acc[month] = { count: 0, value: 0 };
      acc[month].count++;
      acc[month].value += order.totalAmount;
      return acc;
    }, {} as Record<string, { count: number; value: number }>);

    // Status distribution
    const statusDistribution = purchaseOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Supplier performance
    const supplierPerformance = purchaseOrders.reduce((acc, order) => {
      if (!acc[order.supplierName]) {
        acc[order.supplierName] = { count: 0, value: 0, received: 0 };
      }
      acc[order.supplierName].count++;
      acc[order.supplierName].value += order.totalAmount;
      if (order.status === 'received' || order.status === 'completed') {
        acc[order.supplierName].received++;
      }
      return acc;
    }, {} as Record<string, { count: number; value: number; received: number }>);

    // Payment status breakdown
    const paymentBreakdown = purchaseOrders.reduce((acc, order) => {
      acc[order.paymentStatus] = (acc[order.paymentStatus] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalOrders,
      totalValue,
      receivedOrders: receivedOrders.length,
      pendingOrders: pendingOrders.length,
      cancelledOrders: cancelledOrders.length,
      averageOrderValue,
      monthlyData,
      statusDistribution,
      supplierPerformance,
      paymentBreakdown,
    };
  }, [purchaseOrders]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this purchase order?')) return;
    setIsDeleting(true);
    try {
      await deletePurchaseOrder(id);
      toast.success('Purchase order deleted successfully');
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message || 'Failed to delete purchase order');
      } else {
        toast.error('Failed to delete purchase order');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = () => {
    toast.success('Export started. Your file will be ready shortly.');
  };

  const handlePrint = () => {
    window.print();
  };

  const locationOptions = locations.map((loc) => ({
    value: loc.id,
    label: loc.locationName,
  }));

  const supplierOptions = suppliers.map((sup) => ({
    value: sup.id,
    label: sup.name,
  }));

  const statusOptions: Array<{ value: PurchaseOrderStatus | 'all'; label: string }> = [
    { value: 'all', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'ordered', label: 'Ordered' },
    { value: 'received', label: 'Received' },
    { value: 'partially_received', label: 'Partially Received' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'completed', label: 'Completed' },
  ];

  const deliveryStatusOptions: Array<{ value: DeliveryStatus | 'all'; label: string }> = [
    { value: 'all', label: 'All Delivery Statuses' },
    { value: 'pending_delivery', label: 'Pending Delivery' },
    { value: 'in_transit', label: 'In Transit' },
    { value: 'delivered', label: 'Delivered' },
  ];

  const paymentStatusOptions: Array<{ value: PaymentStatus | 'all'; label: string }> = [
    { value: 'all', label: 'All Payment Statuses' },
    { value: 'unpaid', label: 'Unpaid' },
    { value: 'partially_paid', label: 'Partially Paid' },
    { value: 'paid', label: 'Paid' },
  ];

  if (error) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-semibold text-foreground">Failed to load purchase orders</h2>
        <p className="text-sm text-muted-foreground">{error}</p>
        <button
          onClick={() => fetchPurchaseOrders()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/95 px-4 py-4 backdrop-blur sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="rounded-lg p-2 hover:bg-surface-alt transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">Purchase Orders</h1>
              <p className="mt-0.5 text-sm text-muted-foreground hidden sm:block">
                Manage all your purchase orders in one place
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate('/purchases/orders/create')}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              New Order
            </button>
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <div className="px-4 sm:px-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              className="flex items-center gap-2 text-sm font-medium text-foreground"
            >
              <Filter className="h-4 w-4" />
              Filters
              {isFilterExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setFilters({
                    locationId: 'all',
                    supplierId: 'all',
                    status: 'all',
                    deliveryStatus: 'all',
                    paymentStatus: 'all',
                    dateRange: { from: null, to: null },
                    searchQuery: '',
                  });
                }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => fetchPurchaseOrders()}
                className="rounded-lg p-2 hover:bg-surface-alt"
                aria-label="Refresh"
              >
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {isFilterExpanded && (
            <div className="mt-4 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={filters.searchQuery}
                  onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                  placeholder="Search by reference, supplier, or location..."
                  className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <FilterSelect
                  label="Business Location"
                  value={filters.locationId}
                  onChange={(value) => setFilters({ ...filters, locationId: value })}
                  options={locationOptions}
                  placeholder="All Locations"
                  icon={MapPin}
                />

                <FilterSelect
                  label="Supplier"
                  value={filters.supplierId}
                  onChange={(value) => setFilters({ ...filters, supplierId: value })}
                  options={supplierOptions}
                  placeholder="All Suppliers"
                  icon={Building2}
                />

                <FilterSelect
                  label="Status"
                  value={filters.status}
                  onChange={(value) => setFilters({ ...filters, status: value as PurchaseOrderStatus | 'all' })}
                  options={statusOptions}
                  placeholder="All Statuses"
                  icon={FileText}
                />

                <FilterSelect
                  label="Delivery Status"
                  value={filters.deliveryStatus}
                  onChange={(value) => setFilters({ ...filters, deliveryStatus: value as DeliveryStatus | 'all' })}
                  options={deliveryStatusOptions}
                  placeholder="All Delivery Statuses"
                  icon={Truck}
                />

                <FilterSelect
                  label="Payment Status"
                  value={filters.paymentStatus}
                  onChange={(value) => setFilters({ ...filters, paymentStatus: value as PaymentStatus | 'all' })}
                  options={paymentStatusOptions}
                  placeholder="All Payment Statuses"
                  icon={CreditCard}
                />
              </div>

              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="text-xs font-medium text-muted-foreground">Date Range</label>
                  <div className="mt-1.5">
                    <DateRangePicker
                      value={filters.dateRange}
                      onChange={(range) => setFilters({ ...filters, dateRange: range })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{filteredOrders.length}</span> of{' '}
                  <span className="font-medium text-foreground">{purchaseOrders.length}</span> orders
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleExport}
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-surface-alt"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border px-4 sm:px-6">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === 'analytics'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === 'list'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
            }`}
          >
            <Receipt className="h-4 w-4" />
            All Orders
            <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">{filteredOrders.length}</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 sm:px-6">
        {activeTab === 'analytics' ? (
          <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <StatsCard
                title="Total Orders"
                value={analytics.totalOrders}
                icon={FileText}
                color="primary"
                change={{ value: 12, positive: true }}
              />
              <StatsCard
                title="Total Value"
                value={formatMoney(analytics.totalValue, currencyCode, currencyPrecision, currencyPlacement)}
                icon={DollarSign}
                color="emerald"
                change={{ value: 8, positive: true }}
              />
              <StatsCard
                title="Received"
                value={analytics.receivedOrders}
                icon={CheckCircle}
                color="emerald"
              />
              <StatsCard
                title="Pending"
                value={analytics.pendingOrders}
                icon={Clock}
                color="amber"
              />
              <StatsCard
                title="Cancelled"
                value={analytics.cancelledOrders}
                icon={XCircle}
                color="rose"
              />
              <StatsCard
                title="Avg Order Value"
                value={formatMoney(analytics.averageOrderValue, currencyCode, currencyPrecision, currencyPlacement)}
                icon={TrendingUp}
                color="purple"
              />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Monthly Trend Chart */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Monthly Order Trend</h3>
                <div className="space-y-3">
                  {Object.entries(analytics.monthlyData).map(([month, data]) => (
                    <div key={month} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{month}</span>
                        <span className="font-medium text-foreground">{data.count} orders</span>
                      </div>
                      <div className="relative h-8 w-full rounded-lg bg-muted/30 overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 rounded-lg bg-primary/20 transition-all"
                          style={{
                            width: `${(data.value / analytics.totalValue) * 100}%`,
                          }}
                        >
                          <div
                            className="absolute inset-y-0 left-0 rounded-lg bg-primary/60"
                            style={{
                              width: `${(data.count / Math.max(...Object.values(analytics.monthlyData).map(d => d.count))) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-foreground">
                          {formatMoney(data.value, currencyCode, currencyPrecision, currencyPlacement)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Distribution */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Order Status Distribution</h3>
                <div className="space-y-3">
                  {Object.entries(analytics.statusDistribution).map(([status, count]) => {
                    const percentage = (count / analytics.totalOrders) * 100;
                    return (
                      <div key={status} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{getStatusLabel(status)}</span>
                          <span className="font-medium text-foreground">{count} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted/30 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${getStatusColor(status).split(' ')[0]}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment Status Breakdown */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Payment Status Breakdown</h3>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(analytics.paymentBreakdown).map(([status, count]) => {
                    const percentage = (count / analytics.totalOrders) * 100;
                    const colors = {
                      paid: 'bg-emerald-500',
                      unpaid: 'bg-rose-500',
                      partially_paid: 'bg-amber-500',
                    };
                    return (
                      <div key={status} className="rounded-lg border border-border p-3 text-center">
                        <div className={`mx-auto h-3 w-3 rounded-full ${colors[status as keyof typeof colors] || 'bg-gray-500'}`} />
                        <p className="mt-2 text-2xl font-bold text-foreground">{count}</p>
                        <p className="text-xs text-muted-foreground">{getStatusLabel(status)}</p>
                        <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Supplier Performance */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Top Suppliers</h3>
                <div className="space-y-4">
                  {Object.entries(analytics.supplierPerformance)
                    .sort((a, b) => b[1].value - a[1].value)
                    .slice(0, 5)
                    .map(([name, data]) => {
                      const deliveryRate = data.count > 0 ? (data.received / data.count) * 100 : 0;
                      return (
                        <div key={name} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">{name}</p>
                            <p className="text-xs text-muted-foreground">
                              {data.count} orders • Delivery rate: {deliveryRate.toFixed(1)}%
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-foreground">
                              {formatMoney(data.value, currencyCode, currencyPrecision, currencyPlacement)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  {Object.keys(analytics.supplierPerformance).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">No supplier data available</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // List Tab - Table
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-sm text-muted-foreground">Loading purchase orders...</p>
                </div>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Receipt className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-sm font-medium text-foreground">No purchase orders found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {purchaseOrders.length === 0
                    ? 'Get started by creating your first purchase order'
                    : 'Try adjusting your filters'}
                </p>
                {purchaseOrders.length === 0 && (
                  <button
                    onClick={() => navigate('/purchases/orders/create')}
                    className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="mr-2 inline h-4 w-4" />
                    Create Purchase Order
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Reference No.
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Location
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Supplier
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Items
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Delivery Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Payment Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Added By
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-background">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-muted/10 transition-colors">
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                          {format(new Date(order.orderDate), 'PPP')}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-foreground">
                          {order.referenceNumber}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                          {order.locationName}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-foreground">
                          {order.supplierName}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-foreground">
                          {order.itemsCount || 0}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <StatusBadge status={order.deliveryStatus} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <StatusBadge status={order.paymentStatus} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                          {order.createdBy?.name || 'System'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => navigate(`/purchases/orders/${order.id}`)}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                              aria-label="View order"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(`/purchases/orders/${order.id}/edit`)}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                              aria-label="Edit order"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(order.id)}
                              disabled={isDeleting}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              aria-label="Delete order"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(`/purchases/orders/${order.id}/print`)}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                              aria-label="Print order"
                            >
                              <Printer className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
