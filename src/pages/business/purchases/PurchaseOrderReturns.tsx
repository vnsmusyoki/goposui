import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Select, { type StylesConfig } from 'react-select';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  ClassicEditor,
  Essentials,
  Paragraph,
  Heading,
  Bold,
  Italic,
  Link,
  List,
  BlockQuote,
  Undo,
} from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';
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
  Loader2,
  Eye,
  Edit,
  Trash2,
  Download,
  Printer,
  MoreVertical,
  Columns3,
  BarChart3,
  Users,
  Building2,
  Receipt,
  CreditCard,
  FileText,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Bell,
  X,
  RotateCcw,
  ShoppingCart,
  ArrowUpDown,
  CalendarDays,
  PieChart,
  LineChart,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useBusinessLocations } from '@/hooks/business/settings/useBusinessLocations';
import { useBusinessSettings } from '@/hooks/business/settings/useBusinessSettings';
import { useBusinessSuppliers } from '@/hooks/business/suppliers/useBusinessSuppliers';
import {
  usePurchaseOrderReturns,
  type PurchaseOrderReturn,
  type PurchaseOrderReturnStatus,
  type PaymentStatus,
} from '@/hooks/business/purchases/usePurchaseOrderReturns';
import { DateRangePicker } from '@/components/forms/DateRangePicker';
import { ApiError, apiDownload } from '@/lib/api';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

type FilterState = {
  locationId: string;
  supplierId: string;
  status: PurchaseOrderReturnStatus | 'all';
  paymentStatus: PaymentStatus | 'all';
  dateRange: { from: Date | null; to: Date | null };
  searchQuery: string;
};

type VisibleColumns = {
  returnDate: boolean;
  referenceNumber: boolean;
  parentPurchase: boolean;
  location: boolean;
  supplier: boolean;
  status: boolean;
  paymentStatus: boolean;
  grandTotal: boolean;
  paymentDue: boolean;
};

type ExportColumnKey = keyof VisibleColumns;

type ActionMenuState = {
  top: number;
  left: number;
  placement: 'top' | 'bottom';
} | null;

type RowAction = 'view' | 'print' | 'download-pdf' | 'edit' | 'delete' | 'edit-delivery' | 'send-notification';

type SelectOption = {
  value: PurchaseOrderReturnStatus;
  label: string;
};

type DeleteModalState = {
  order: PurchaseOrderReturn;
};

const DEFAULT_VISIBLE_COLUMNS: VisibleColumns = {
  returnDate: true,
  referenceNumber: true,
  parentPurchase: true,
  location: true,
  supplier: true,
  status: true,
  paymentStatus: true,
  grandTotal: true,
  paymentDue: true,
};

const COLUMN_OPTIONS = [
  { key: 'returnDate', label: 'Return Date' },
  { key: 'referenceNumber', label: 'Reference No.' },
  { key: 'parentPurchase', label: 'Parent Purchase' },
  { key: 'location', label: 'Location' },
  { key: 'supplier', label: 'Supplier' },
  { key: 'status', label: 'Return Status' },
  { key: 'paymentStatus', label: 'Payment Status' },
  { key: 'grandTotal', label: 'Grand Total' },
  { key: 'paymentDue', label: 'Payment Due' },
] as const;

const EXPORT_COLUMN_ORDER: ExportColumnKey[] = [
  'returnDate',
  'referenceNumber',
  'parentPurchase',
  'location',
  'supplier',
  'status',
  'paymentStatus',
  'grandTotal',
  'paymentDue',
];

const ROW_ACTIONS: Array<{ key: RowAction; label: string; destructive?: boolean }> = [
  { key: 'view', label: 'View' },
  { key: 'print', label: 'Print' },
  { key: 'download-pdf', label: 'Download Pdf' },
  { key: 'edit', label: 'Edit' },
  { key: 'delete', label: 'Delete', destructive: true },
];

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
    pending_approval: 'bg-amber-100 text-amber-700 border-amber-300',
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    approved: 'bg-blue-100 text-blue-700 border-blue-300',
    sent: 'bg-cyan-100 text-cyan-700 border-cyan-300',
    ordered: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    received: 'bg-green-100 text-green-700 border-green-300',
    partially_received: 'bg-cyan-100 text-cyan-700 border-cyan-300',
    closed: 'bg-slate-100 text-slate-700 border-slate-300',
    cancelled: 'bg-red-100 text-red-700 border-red-300',
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    in_transit: 'bg-purple-100 text-purple-700 border-purple-300',
    delivered: 'bg-green-100 text-green-700 border-green-300',
    pending_delivery: 'bg-orange-100 text-orange-700 border-orange-300',
    paid: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    unpaid: 'bg-rose-100 text-rose-700 border-rose-300',
    partially_paid: 'bg-amber-100 text-amber-700 border-amber-300',
    // Return specific statuses
    returned: 'bg-purple-100 text-purple-700 border-purple-300',
    partially_returned: 'bg-cyan-100 text-cyan-700 border-cyan-300',
    rejected: 'bg-red-100 text-red-700 border-red-300',
    refunded: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    exchange: 'bg-blue-100 text-blue-700 border-blue-300',
  };
  return colors[status] || 'bg-gray-100 text-gray-700 border-gray-300';
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Draft',
    pending_approval: 'Pending Approval',
    pending: 'Pending',
    approved: 'Approved',
    sent: 'Sent',
    ordered: 'Ordered',
    received: 'Received',
    partially_received: 'Partially Received',
    closed: 'Closed',
    cancelled: 'Cancelled',
    completed: 'Completed',
    in_transit: 'In Transit',
    delivered: 'Delivered',
    pending_delivery: 'Pending Delivery',
    paid: 'Paid',
    unpaid: 'Unpaid',
    partially_paid: 'Partially Paid',
    // Return specific statuses
    returned: 'Returned',
    partially_returned: 'Partially Returned',
    rejected: 'Rejected',
    refunded: 'Refunded',
    exchange: 'Exchange',
  };
  return labels[status] || status;
}

function getPaymentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    paid: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    unpaid: 'bg-rose-100 text-rose-700 border-rose-300',
    partially_paid: 'bg-amber-100 text-amber-700 border-amber-300',
    refunded: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    pending_refund: 'bg-orange-100 text-orange-700 border-orange-300',
    credit_note: 'bg-blue-100 text-blue-700 border-blue-300',
  };
  return colors[status] || 'bg-gray-100 text-gray-700 border-gray-300';
}

function purchaseOrderReturnSelectStyles(): StylesConfig<SelectOption, false> {
  return {
    control: (base, state) => ({
      ...base,
      minHeight: '42px',
      borderRadius: '0.5rem',
      borderColor: state.isFocused ? 'hsl(var(--primary))' : 'hsl(var(--border))',
      backgroundColor: 'hsl(var(--background))',
      boxShadow: state.isFocused ? '0 0 0 1px hsl(var(--primary))' : 'none',
      '&:hover': {
        borderColor: state.isFocused ? 'hsl(var(--primary))' : 'hsl(var(--border))',
      },
    }),
    menu: (base) => ({
      ...base,
      zIndex: 60,
      borderRadius: '0.5rem',
      overflow: 'hidden',
      backgroundColor: 'hsl(var(--background))',
      border: '1px solid hsl(var(--border))',
      boxShadow: '0 16px 40px rgba(0, 0, 0, 0.14)',
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? 'hsl(var(--primary))'
        : state.isFocused
          ? 'hsl(var(--muted))'
          : 'hsl(var(--background))',
      color: state.isSelected ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
    }),
    singleValue: (base) => ({
      ...base,
      color: 'hsl(var(--foreground))',
    }),
    placeholder: (base) => ({
      ...base,
      color: 'hsl(var(--muted-foreground))',
    }),
    indicatorSeparator: (base) => ({
      ...base,
      backgroundColor: 'hsl(var(--border))',
    }),
  };
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

function PaymentStatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getPaymentStatusColor(status)}`}>
      {getStatusLabel(status)}
    </span>
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

function ActionMenuItem({
  icon: Icon,
  label,
  onClick,
  destructive = false,
}: {
  icon?: React.ComponentType<{ className?: string }>;
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
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {label}
    </button>
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

function ReturnStatusChart({ data }: { data: Record<string, number> }) {
  const total = Object.values(data).reduce((sum, count) => sum + count, 0);
  const colors = ['bg-primary', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-purple-500', 'bg-blue-500', 'bg-indigo-500'];

  return (
    <div className="space-y-3">
      {Object.entries(data).map(([status, count], index) => {
        const percentage = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={status} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{getStatusLabel(status)}</span>
              <span className="font-medium text-foreground">{count} ({percentage.toFixed(1)}%)</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted/30 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${colors[index % colors.length]}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --------------------------------------------------------------------------
// Main Component
// --------------------------------------------------------------------------

export default function PurchaseOrderReturns() {
  const navigate = useNavigate();
  const { settings: businessSettings } = useBusinessSettings();
  const { locations } = useBusinessLocations();
  const { suppliers } = useBusinessSuppliers();
  const {
    purchaseOrderReturns,
    loading,
    error,
    fetchPurchaseOrderReturns,
    deletePurchaseOrderReturn,
  } = usePurchaseOrderReturns();

  const [activeTab, setActiveTab] = useState<'analytics' | 'list'>('list');
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    locationId: 'all',
    supplierId: 'all',
    status: 'all',
    paymentStatus: 'all',
    dateRange: { from: null, to: null },
    searchQuery: '',
  });
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>(DEFAULT_VISIBLE_COLUMNS);
  const [actionMenuOpenFor, setActionMenuOpenFor] = useState<string | null>(null);
  const [actionMenuPosition, setActionMenuPosition] = useState<ActionMenuState>(null);
  const [activeReturn, setActiveReturn] = useState<PurchaseOrderReturn | null>(null);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);
  const [deleteModalReturn, setDeleteModalReturn] = useState<PurchaseOrderReturn | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [deleteModalError, setDeleteModalError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const currencyCode = businessSettings?.currency || 'USD';
  const currencyPrecision = typeof businessSettings?.currencyPrecision === 'number' ? businessSettings.currencyPrecision : 2;
  const currencyPlacement = businessSettings?.currencySymbolPlacement === 'after' ? 'after' : 'before';

  useEffect(() => {
    fetchPurchaseOrderReturns();
  }, [fetchPurchaseOrderReturns]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, rowsPerPage]);

  useEffect(() => {
    if (!actionMenuOpenFor) {
      return undefined;
    }

    const handleGlobalClose = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (actionMenuRef.current && target && actionMenuRef.current.contains(target)) {
        return;
      }
      setActionMenuOpenFor(null);
      setActionMenuPosition(null);
      setActiveReturn(null);
    };

    const handleResizeOrScroll = () => {
      setActionMenuOpenFor(null);
      setActionMenuPosition(null);
      setActiveReturn(null);
    };

    document.addEventListener('mousedown', handleGlobalClose);
    window.addEventListener('resize', handleResizeOrScroll);
    window.addEventListener('scroll', handleResizeOrScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleGlobalClose);
      window.removeEventListener('resize', handleResizeOrScroll);
      window.removeEventListener('scroll', handleResizeOrScroll, true);
    };
  }, [actionMenuOpenFor]);

  // Filtered returns
  const filteredReturns = useMemo(() => {
    let returns = purchaseOrderReturns;

    if (filters.locationId !== 'all') {
      returns = returns.filter((returnOrder) => returnOrder.locationId === filters.locationId);
    }

    if (filters.supplierId !== 'all') {
      returns = returns.filter((returnOrder) => returnOrder.supplierId === filters.supplierId);
    }

    if (filters.status !== 'all') {
      returns = returns.filter((returnOrder) => returnOrder.status === filters.status);
    }

    if (filters.paymentStatus !== 'all') {
      returns = returns.filter((returnOrder) => returnOrder.paymentStatus === filters.paymentStatus);
    }

    if (filters.dateRange.from) {
      returns = returns.filter((returnOrder) => new Date(returnOrder.returnDate) >= filters.dateRange.from!);
    }
    if (filters.dateRange.to) {
      returns = returns.filter((returnOrder) => new Date(returnOrder.returnDate) <= filters.dateRange.to!);
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      returns = returns.filter(
        (returnOrder) =>
          returnOrder.referenceNumber.toLowerCase().includes(query) ||
          returnOrder.supplierName.toLowerCase().includes(query) ||
          returnOrder.locationName.toLowerCase().includes(query) ||
          returnOrder.parentPurchaseReference.toLowerCase().includes(query)
      );
    }

    return returns;
  }, [purchaseOrderReturns, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredReturns.length / rowsPerPage));
  const displayedReturns = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredReturns.slice(start, start + rowsPerPage);
  }, [currentPage, filteredReturns, rowsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Analytics data
  const analytics = useMemo(() => {
    const totalReturns = purchaseOrderReturns.length;
    const totalValue = purchaseOrderReturns.reduce((sum, returnOrder) => sum + returnOrder.grandTotal, 0);
    const totalPaymentDue = purchaseOrderReturns.reduce((sum, returnOrder) => sum + returnOrder.paymentDue, 0);
    const completedReturns = purchaseOrderReturns.filter((o) => o.status === 'completed' || o.status === 'refunded');
    const pendingReturns = purchaseOrderReturns.filter((o) => o.status === 'pending' || o.status === 'pending_approval');
    const cancelledReturns = purchaseOrderReturns.filter((o) => o.status === 'cancelled' || o.status === 'rejected');
    const averageReturnValue = totalReturns > 0 ? totalValue / totalReturns : 0;

    // Monthly trend
    const monthlyData = purchaseOrderReturns.reduce((acc, returnOrder) => {
      const month = format(new Date(returnOrder.returnDate), 'MMM yyyy');
      if (!acc[month]) acc[month] = { count: 0, value: 0, paymentDue: 0 };
      acc[month].count++;
      acc[month].value += returnOrder.grandTotal;
      acc[month].paymentDue += returnOrder.paymentDue;
      return acc;
    }, {} as Record<string, { count: number; value: number; paymentDue: number }>);

    // Status distribution
    const statusDistribution = purchaseOrderReturns.reduce((acc, returnOrder) => {
      acc[returnOrder.status] = (acc[returnOrder.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Payment status breakdown
    const paymentBreakdown = purchaseOrderReturns.reduce((acc, returnOrder) => {
      acc[returnOrder.paymentStatus] = (acc[returnOrder.paymentStatus] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Supplier return performance
    const supplierPerformance = purchaseOrderReturns.reduce((acc, returnOrder) => {
      if (!acc[returnOrder.supplierName]) {
        acc[returnOrder.supplierName] = { count: 0, value: 0, refunded: 0 };
      }
      acc[returnOrder.supplierName].count++;
      acc[returnOrder.supplierName].value += returnOrder.grandTotal;
      if (returnOrder.status === 'refunded' || returnOrder.status === 'completed') {
        acc[returnOrder.supplierName].refunded++;
      }
      return acc;
    }, {} as Record<string, { count: number; value: number; refunded: number }>);

    // Reason distribution (if available)
    const reasonDistribution = purchaseOrderReturns.reduce((acc, returnOrder) => {
      const reason = returnOrder.returnReason || 'Other';
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalReturns,
      totalValue,
      totalPaymentDue,
      completedReturns: completedReturns.length,
      pendingReturns: pendingReturns.length,
      cancelledReturns: cancelledReturns.length,
      averageReturnValue,
      monthlyData,
      statusDistribution,
      paymentBreakdown,
      supplierPerformance,
      reasonDistribution,
    };
  }, [purchaseOrderReturns]);

  const handleDelete = async () => {
    if (!deleteModalReturn) {
      return;
    }

    setDeleteSaving(true);
    setDeleteModalError(null);

    try {
      const response = await deletePurchaseOrderReturn(deleteModalReturn.id);
      toast.success(response.message || 'Purchase return deleted successfully');
      setDeleteModalReturn(null);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete purchase return';
      setDeleteModalError(message);
      toast.error(message);
    } finally {
      setDeleteSaving(false);
    }
  };

  const openDeleteModal = (returnOrder: PurchaseOrderReturn) => {
    setDeleteModalError(null);
    setDeleteModalReturn(returnOrder);
  };

  const closeDeleteModal = () => {
    setDeleteModalReturn(null);
    setDeleteModalError(null);
  };

  const handleResetColumns = () => {
    setVisibleColumns(DEFAULT_VISIBLE_COLUMNS);
  };

  const getVisibleExportColumns = () => EXPORT_COLUMN_ORDER.filter((key) => visibleColumns[key]);

  const buildExportQuery = () => {
    const params = new URLSearchParams();

    if (filters.locationId !== 'all') params.set('locationId', filters.locationId);
    if (filters.supplierId !== 'all') params.set('supplierId', filters.supplierId);
    if (filters.status !== 'all') params.set('status', filters.status);
    if (filters.paymentStatus !== 'all') params.set('paymentStatus', filters.paymentStatus);
    if (filters.searchQuery.trim()) params.set('searchQuery', filters.searchQuery.trim());
    if (filters.dateRange.from) params.set('from', format(filters.dateRange.from, 'yyyy-MM-dd'));
    if (filters.dateRange.to) params.set('to', format(filters.dateRange.to, 'yyyy-MM-dd'));

    const columns = getVisibleExportColumns();
    if (columns.length > 0) {
      params.set('columns', columns.join(','));
    }

    return params.toString();
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const downloadPurchaseReturnsExport = async (formatType: 'csv' | 'pdf') => {
    try {
      const query = buildExportQuery();
      const { blob, filename } = await apiDownload(`/purchases/returns/export/${formatType}${query ? `?${query}` : ''}`);
      downloadBlob(blob, filename ?? `purchase-returns.${formatType}`);
      toast.success(`${formatType.toUpperCase()} export downloaded successfully`);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message || `Failed to export purchase returns`);
      } else {
        toast.error(`Failed to export purchase returns`);
      }
    }
  };

  const downloadPurchaseReturnPdf = async (returnOrder: PurchaseOrderReturn, shouldPrint = false) => {
    try {
      const { blob } = await apiDownload(`/purchases/returns/${returnOrder.id}/export/pdf`);
      if (!shouldPrint) {
        downloadBlob(blob, `${returnOrder.referenceNumber || returnOrder.id}.pdf`);
        toast.success('PDF downloaded successfully');
        return;
      }

      const url = URL.createObjectURL(blob);
      const viewer = window.open(url, '_blank', 'noopener,noreferrer');
      if (!viewer) {
        downloadBlob(blob, `${returnOrder.referenceNumber || returnOrder.id}.pdf`);
        return;
      }
      if (shouldPrint) {
        window.setTimeout(() => {
          try {
            viewer.focus();
            viewer.print();
          } catch {
            // The built-in PDF viewer may need an extra moment to load.
          }
        }, 700);
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message || 'Failed to export purchase return');
      } else {
        toast.error('Failed to export purchase return');
      }
    }
  };

  const locationOptions = locations.map((loc) => ({
    value: loc.id,
    label: loc.locationName,
  }));

  const supplierOptions = suppliers.map((sup) => ({
    value: sup.id,
    label: sup.name,
  }));

  const statusOptions: Array<{ value: PurchaseOrderReturnStatus | 'all'; label: string }> = [
    { value: 'all', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'pending_approval', label: 'Pending Approval' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'sent', label: 'Sent' },
    { value: 'ordered', label: 'Ordered' },
    { value: 'received', label: 'Received' },
    { value: 'partially_received', label: 'Partially Received' },
    { value: 'closed', label: 'Closed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'completed', label: 'Completed' },
    { value: 'returned', label: 'Returned' },
    { value: 'partially_returned', label: 'Partially Returned' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'refunded', label: 'Refunded' },
    { value: 'exchange', label: 'Exchange' },
  ];

  const paymentStatusOptions: Array<{ value: PaymentStatus | 'all'; label: string }> = [
    { value: 'all', label: 'All Payment Statuses' },
    { value: 'unpaid', label: 'Unpaid' },
    { value: 'partially_paid', label: 'Partially Paid' },
    { value: 'paid', label: 'Paid' },
    { value: 'refunded', label: 'Refunded' },
    { value: 'pending_refund', label: 'Pending Refund' },
    { value: 'credit_note', label: 'Credit Note' },
  ];

  const openActionMenu = (returnOrder: PurchaseOrderReturn, button: HTMLButtonElement) => {
    const rect = button.getBoundingClientRect();
    const menuHeight = 280;
    const menuWidth = 256;
    const gap = 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const placement: 'top' | 'bottom' = spaceBelow < menuHeight && spaceAbove > spaceBelow ? 'top' : 'bottom';
    const top = placement === 'bottom' ? rect.bottom + gap : Math.max(rect.top - menuHeight - gap, gap);
    const left = Math.min(Math.max(rect.right - menuWidth, gap), window.innerWidth - menuWidth - gap);

    setActiveReturn(returnOrder);
    setActionMenuPosition({ top, left, placement });
    setActionMenuOpenFor(returnOrder.id);
  };

  const closeActionMenu = () => {
    setActionMenuOpenFor(null);
    setActionMenuPosition(null);
    setActiveReturn(null);
  };

  const handleReturnAction = async (action: RowAction, returnOrder: PurchaseOrderReturn) => {
    closeActionMenu();

    switch (action) {
      case 'view':
        navigate(`/purchases/returns/${returnOrder.id}/view`);
        return;
      case 'print':
        await downloadPurchaseReturnPdf(returnOrder, true);
        return;
      case 'download-pdf':
        await downloadPurchaseReturnPdf(returnOrder, false);
        return;
      case 'edit':
        navigate(`/purchases/returns/${returnOrder.id}/edit`);
        return;
      case 'delete':
        openDeleteModal(returnOrder);
        return;
      default:
        return;
    }
  };

  const pageErrorMessage = error || actionError;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/95 py-4 backdrop-blur">
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
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">Purchase Returns</h1>
              <p className="mt-0.5 text-sm text-muted-foreground hidden sm:block">
                Manage all purchase returns in one place
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate('/purchases/returns/create')}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              New Return
            </button>
          </div>
        </div>
      </div>

      {pageErrorMessage ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Something needs attention</p>
              <p className="mt-1 text-destructive/90">{pageErrorMessage}</p>
            </div>
            {error ? (
              <button
                type="button"
                onClick={() => fetchPurchaseOrderReturns()}
                className="rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
              >
                Retry
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Filters Card */}
      <div className="">
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
                onClick={() => fetchPurchaseOrderReturns()}
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
                  placeholder="Search by reference, supplier, location, or parent purchase..."
                  className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                  label="Return Status"
                  value={filters.status}
                  onChange={(value) => setFilters({ ...filters, status: value as PurchaseOrderReturnStatus | 'all' })}
                  options={statusOptions}
                  placeholder="All Statuses"
                  icon={RotateCcw}
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
                  Showing <span className="font-medium text-foreground">{filteredReturns.length}</span> of{' '}
                  <span className="font-medium text-foreground">{purchaseOrderReturns.length}</span> returns
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
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
            All Returns
            <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">{filteredReturns.length}</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="">
        {activeTab === 'analytics' ? (
          <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <StatsCard
                title="Total Returns"
                value={analytics.totalReturns}
                icon={RotateCcw}
                color="primary"
              />
              <StatsCard
                title="Total Return Value"
                value={formatMoney(analytics.totalValue, currencyCode, currencyPrecision, currencyPlacement)}
                icon={DollarSign}
                color="emerald"
              />
              <StatsCard
                title="Total Payment Due"
                value={formatMoney(analytics.totalPaymentDue, currencyCode, currencyPrecision, currencyPlacement)}
                icon={CreditCard}
                color="amber"
              />
              <StatsCard
                title="Completed"
                value={analytics.completedReturns}
                icon={CheckCircle}
                color="emerald"
              />
              <StatsCard
                title="Pending"
                value={analytics.pendingReturns}
                icon={Clock}
                color="amber"
              />
              <StatsCard
                title="Avg Return Value"
                value={formatMoney(analytics.averageReturnValue, currencyCode, currencyPrecision, currencyPlacement)}
                icon={TrendingUp}
                color="purple"
              />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Monthly Trend Chart */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Monthly Return Trend</h3>
                <div className="space-y-3">
                  {Object.entries(analytics.monthlyData).map(([month, data]) => (
                    <div key={month} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{month}</span>
                        <span className="font-medium text-foreground">{data.count} returns</span>
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
                      {data.paymentDue > 0 && (
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Payment Due:</span>
                          <span>{formatMoney(data.paymentDue, currencyCode, currencyPrecision, currencyPlacement)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Distribution */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Return Status Distribution</h3>
                <ReturnStatusChart data={analytics.statusDistribution} />
              </div>

              {/* Payment Status Breakdown */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Payment Status Breakdown</h3>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(analytics.paymentBreakdown).map(([status, count]) => {
                    const percentage = analytics.totalReturns > 0 ? (count / analytics.totalReturns) * 100 : 0;
                    const colors = {
                      paid: 'bg-emerald-500',
                      unpaid: 'bg-rose-500',
                      partially_paid: 'bg-amber-500',
                      refunded: 'bg-emerald-500',
                      pending_refund: 'bg-orange-500',
                      credit_note: 'bg-blue-500',
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
                <h3 className="mb-4 text-sm font-semibold text-foreground">Top Suppliers by Returns</h3>
                <div className="space-y-4">
                  {Object.entries(analytics.supplierPerformance)
                    .sort((a, b) => b[1].value - a[1].value)
                    .slice(0, 5)
                    .map(([name, data]) => {
                      const refundRate = data.count > 0 ? (data.refunded / data.count) * 100 : 0;
                      return (
                        <div key={name} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">{name}</p>
                            <p className="text-xs text-muted-foreground">
                              {data.count} returns • Refund rate: {refundRate.toFixed(1)}%
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
                    <p className="text-sm text-muted-foreground text-center py-8">No supplier return data available</p>
                  )}
                </div>
              </div>

              {/* Return Reasons (if available) */}
              {Object.keys(analytics.reasonDistribution).length > 0 && (
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="mb-4 text-sm font-semibold text-foreground">Return Reasons</h3>
                  <div className="space-y-3">
                    {Object.entries(analytics.reasonDistribution)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5)
                      .map(([reason, count]) => {
                        const percentage = analytics.totalReturns > 0 ? (count / analytics.totalReturns) * 100 : 0;
                        return (
                          <div key={reason} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{reason}</span>
                              <span className="font-medium text-foreground">{count} ({percentage.toFixed(1)}%)</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-muted/30 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary/60 transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">All Returns</p>
                <p className="text-xs text-muted-foreground">Choose which columns are visible, then export from the backend.</p>
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
                          {COLUMN_OPTIONS.map((column) => (
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

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <div className="flex items-center gap-2">
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
                <button
                  type="button"
                  onClick={() => downloadPurchaseReturnsExport('csv')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-alt"
                >
                  <Download className="h-3.5 w-3.5" />
                  CSV
                </button>
                <button
                  type="button"
                  onClick={() => downloadPurchaseReturnsExport('pdf')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-alt"
                >
                  <FileText className="h-3.5 w-3.5" />
                  PDF
                </button>
              </div>
            </div>

            <div className="rounded-sm border border-border bg-card overflow-hidden">
              {loading ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">Loading purchase returns...</p>
                  </div>
                </div>
              ) : filteredReturns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <RotateCcw className="h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-sm font-medium text-foreground">No purchase returns found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {purchaseOrderReturns.length === 0
                      ? 'Get started by creating your first purchase return'
                      : 'Try adjusting your filters'}
                  </p>
                  {purchaseOrderReturns.length === 0 && (
                    <button
                      onClick={() => navigate('/purchases/returns/create')}
                      className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      <Plus className="mr-2 inline h-4 w-4" />
                      Create Purchase Return
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-muted/30">
                        <tr>
                          {visibleColumns.returnDate && (
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Return Date
                            </th>
                          )}
                          {visibleColumns.referenceNumber && (
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Reference No.
                            </th>
                          )}
                          {visibleColumns.parentPurchase && (
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Parent Purchase
                            </th>
                          )}
                          {visibleColumns.location && (
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Location
                            </th>
                          )}
                          {visibleColumns.supplier && (
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Supplier
                            </th>
                          )}
                          {visibleColumns.status && (
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Return Status
                            </th>
                          )}
                          {visibleColumns.paymentStatus && (
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Payment Status
                            </th>
                          )}
                          {visibleColumns.grandTotal && (
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Grand Total
                            </th>
                          )}
                          {visibleColumns.paymentDue && (
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Payment Due
                            </th>
                          )}
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-background">
                        {displayedReturns.map((returnOrder) => (
                          <tr key={returnOrder.id} className="hover:bg-muted/10 transition-colors">
                            {visibleColumns.returnDate && (
                              <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                                {format(new Date(returnOrder.returnDate), 'PPP')}
                              </td>
                            )}
                            {visibleColumns.referenceNumber && (
                              <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-foreground">
                                {returnOrder.referenceNumber}
                              </td>
                            )}
                            {visibleColumns.parentPurchase && (
                              <td className="whitespace-nowrap px-4 py-3 text-sm text-foreground hover:text-primary">
                                <button
                                  onClick={() => navigate(`/purchases/orders/${returnOrder.parentPurchaseId}/view`)}
                                  className="hover:underline"
                                >
                                  {returnOrder.parentPurchaseReference}
                                </button>
                              </td>
                            )}
                            {visibleColumns.location && (
                              <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                                {returnOrder.locationName}
                              </td>
                            )}
                            {visibleColumns.supplier && (
                              <td className="whitespace-nowrap px-4 py-3 text-sm text-foreground">
                                {returnOrder.supplierName}
                              </td>
                            )}
                            {visibleColumns.status && (
                              <td className="whitespace-nowrap px-4 py-3">
                                <StatusBadge status={returnOrder.status} />
                              </td>
                            )}
                            {visibleColumns.paymentStatus && (
                              <td className="whitespace-nowrap px-4 py-3">
                                <PaymentStatusBadge status={returnOrder.paymentStatus} />
                              </td>
                            )}
                            {visibleColumns.grandTotal && (
                              <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-foreground">
                                {formatMoney(returnOrder.grandTotal, currencyCode, currencyPrecision, currencyPlacement)}
                              </td>
                            )}
                            {visibleColumns.paymentDue && (
                              <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-amber-600">
                                {formatMoney(returnOrder.paymentDue, currencyCode, currencyPrecision, currencyPlacement)}
                              </td>
                            )}
                            <td className="whitespace-nowrap px-4 py-3 text-right">
                              <div className="relative flex items-center justify-end">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openActionMenu(returnOrder, event.currentTarget);
                                  }}
                                  className="rounded p-1.5 text-muted-foreground hover:bg-surface-alt hover:text-foreground"
                                  aria-label="Open return actions"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                                {actionMenuOpenFor === returnOrder.id && actionMenuPosition && activeReturn?.id === returnOrder.id && (
                                  <div
                                    ref={actionMenuRef}
                                    className="fixed z-50 w-64 rounded-xl border border-border bg-background p-2 shadow-2xl shadow-black/10"
                                    style={{
                                      top: actionMenuPosition.top,
                                      left: actionMenuPosition.left,
                                    }}
                                  >
                                    <div className="px-3 py-2">
                                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions for</p>
                                      <p className="truncate text-sm font-medium text-foreground">
                                        {activeReturn?.referenceNumber ?? 'this return'}
                                      </p>
                                    </div>
                                    <div className="divide-y divide-border p-1">
                                      <ActionMenuItem
                                        icon={Eye}
                                        label="View"
                                        onClick={() => handleReturnAction('view', returnOrder)}
                                      />
                                      <ActionMenuItem
                                        icon={Printer}
                                        label="Print"
                                        onClick={() => handleReturnAction('print', returnOrder)}
                                      />
                                      <ActionMenuItem
                                        icon={Download}
                                        label="Download Pdf"
                                        onClick={() => handleReturnAction('download-pdf', returnOrder)}
                                      />
                                      <ActionMenuItem
                                        icon={Edit}
                                        label="Edit"
                                        onClick={() => handleReturnAction('edit', returnOrder)}
                                      />
                                      <ActionMenuItem
                                        icon={Trash2}
                                        label="Delete"
                                        destructive
                                        onClick={() => handleReturnAction('delete', returnOrder)}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
                    <p className="text-sm text-muted-foreground">
                      Showing <span className="font-medium text-foreground">{Math.min((currentPage - 1) * rowsPerPage + 1, filteredReturns.length)}</span> to{' '}
                      <span className="font-medium text-foreground">
                        {Math.min(currentPage * rowsPerPage, filteredReturns.length)}
                      </span>{' '}
                      of <span className="font-medium text-foreground">{filteredReturns.length}</span> returns
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                        disabled={currentPage <= 1}
                        className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="text-xs text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                        disabled={currentPage >= totalPages}
                        className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteModalReturn ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm" onClick={closeDeleteModal}>
          <div
            className="w-full max-w-xl rounded-xl border border-border bg-card shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-destructive">Delete purchase return</p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">{deleteModalReturn.referenceNumber}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  This will soft delete the return and hide it from the active list.
                </p>
              </div>
              <button
                type="button"
                onClick={closeDeleteModal}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-surface-alt hover:text-foreground"
                aria-label="Close delete modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div className="rounded-xl border border-border bg-background p-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Supplier</span>
                  <span className="font-medium text-foreground">{deleteModalReturn.supplierName}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Parent Purchase</span>
                  <span className="font-medium text-foreground">{deleteModalReturn.parentPurchaseReference}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge status={deleteModalReturn.status} />
                </div>
                <div className="mt-2 flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Grand Total</span>
                  <span className="font-medium text-foreground">
                    {formatMoney(deleteModalReturn.grandTotal, currencyCode, currencyPrecision, currencyPlacement)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Payment Due</span>
                  <span className="font-medium text-amber-600">
                    {formatMoney(deleteModalReturn.paymentDue, currencyCode, currencyPrecision, currencyPlacement)}
                  </span>
                </div>
              </div>

              {deleteModalError ? (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                  {deleteModalError}
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 border-t border-border px-5 py-4 pb-6 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-alt"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleteSaving}
                className="inline-flex items-center justify-center rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleteSaving ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </span>
                ) : (
                  'Delete Return'
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}