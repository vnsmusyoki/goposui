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
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useBusinessLocations } from '@/hooks/business/settings/useBusinessLocations';
import { useBusinessSettings } from '@/hooks/business/settings/useBusinessSettings';
import { useBusinessSuppliers } from '@/hooks/business/suppliers/useBusinessSuppliers';
import {
  usePurchaseOrders,
  type PurchaseOrder,
  type PurchaseOrderStatus,
  type DeliveryStatus,
  type PaymentStatus,
  type PurchaseOrderNotificationMode,
  type SendPurchaseOrderNotificationInput,
} from '@/hooks/business/purchases/usePurchaseOrders';
import { usePurchaseOrderStatuses } from '@/hooks/business/purchases/usePurchaseOrderStatuses';
import { DateRangePicker } from '@/components/forms/DateRangePicker';
import { ApiError, apiDownload } from '@/lib/api';

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

type VisibleColumns = {
  orderDate: boolean;
  referenceNumber: boolean;
  location: boolean;
  supplier: boolean;
  status: boolean;
  items: boolean;
  deliveryStatus: boolean;
  paymentStatus: boolean;
  addedBy: boolean;
  totalAmount: boolean;
};

type ExportColumnKey = keyof VisibleColumns;

type ActionMenuState = {
  top: number;
  left: number;
  placement: 'top' | 'bottom';
} | null;

type RowAction = 'view' | 'print' | 'download-pdf' | 'edit' | 'delete' | 'edit-delivery' | 'send-notification';

type SelectOption = {
  value: PurchaseOrderStatus;
  label: string;
};

type StatusEffect = {
  status: PurchaseOrderStatus;
  meaning: string;
  stockUpdated: string;
  supplierBilled: string;
};

type ApprovalChannel = 'notification' | 'sms' | 'whatsapp';

type ApprovalChannelState = Record<ApprovalChannel, boolean>;

type DeleteModalState = {
  order: PurchaseOrder;
};

type NotificationRecipientMode = PurchaseOrderNotificationMode;

type NotificationFormState = {
  mode: NotificationRecipientMode;
  emailTo: string;
  emailCc: string;
  emailBcc: string;
  emailSubject: string;
  emailMessage: string;
  smsWhatsappReceivers: string;
  smsWhatsappMessage: string;
};

const ORDER_STATUS_EFFECTS: StatusEffect[] = [
  { status: 'draft', meaning: 'Being prepared and can still be edited.', stockUpdated: 'No', supplierBilled: 'No' },
  { status: 'pending', meaning: 'Waiting in the purchase order queue.', stockUpdated: 'No', supplierBilled: 'No' },
  { status: 'pending_approval', meaning: 'Waiting for manager approval.', stockUpdated: 'No', supplierBilled: 'No' },
  { status: 'approved', meaning: 'Approved internally and ready to send.', stockUpdated: 'No', supplierBilled: 'No' },
  { status: 'sent', meaning: 'Sent to the supplier.', stockUpdated: 'No', supplierBilled: 'No' },
  { status: 'ordered', meaning: 'Ordered from the supplier and awaiting fulfillment.', stockUpdated: 'No', supplierBilled: 'No' },
  { status: 'partially_received', meaning: 'Some items have been received.', stockUpdated: 'Yes (partial)', supplierBilled: 'Usually No' },
  { status: 'received', meaning: 'All ordered items have been received.', stockUpdated: 'Yes', supplierBilled: 'Usually No' },
  { status: 'completed', meaning: 'Receipt, invoicing, and payment process finished.', stockUpdated: 'Yes', supplierBilled: 'Yes' },
  { status: 'cancelled', meaning: 'Order cancelled before completion.', stockUpdated: 'No', supplierBilled: 'No' },
  { status: 'closed', meaning: 'Locked for editing after everything is finalized.', stockUpdated: 'Yes', supplierBilled: 'Yes' },
];

const ORDER_STATUS_OPTIONS: SelectOption[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'sent', label: 'Sent' },
  { value: 'ordered', label: 'Ordered' },
  { value: 'partially_received', label: 'Partially Received' },
  { value: 'received', label: 'Received' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'closed', label: 'Closed' },
];

const DEFAULT_VISIBLE_COLUMNS: VisibleColumns = {
  orderDate: true,
  referenceNumber: true,
  location: true,
  supplier: true,
  status: true,
  items: true,
  deliveryStatus: true,
  paymentStatus: true,
  addedBy: true,
  totalAmount: true,
};

const COLUMN_OPTIONS = [
  { key: 'orderDate', label: 'Date' },
  { key: 'referenceNumber', label: 'Reference No.' },
  { key: 'location', label: 'Location' },
  { key: 'supplier', label: 'Supplier' },
  { key: 'status', label: 'Order Status' },
  { key: 'items', label: 'Items' },
  { key: 'deliveryStatus', label: 'Delivery Status' },
  { key: 'paymentStatus', label: 'Payment Status' },
  { key: 'addedBy', label: 'Added By' },
  { key: 'totalAmount', label: 'Total Amount' },
] as const;

const EXPORT_COLUMN_ORDER: ExportColumnKey[] = [
  'orderDate',
  'referenceNumber',
  'location',
  'supplier',
  'status',
  'items',
  'deliveryStatus',
  'paymentStatus',
  'addedBy',
  'totalAmount',
];

const ROW_ACTIONS: Array<{ key: RowAction; label: string; destructive?: boolean }> = [
  { key: 'view', label: 'View' },
  { key: 'print', label: 'Print' },
  { key: 'download-pdf', label: 'Download Pdf' },
  { key: 'edit', label: 'Edit' },
  { key: 'delete', label: 'Delete', destructive: true },
  { key: 'edit-delivery', label: 'Edit Delivery' },
  { key: 'send-notification', label: 'Send Notification' },
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
  };
  return labels[status] || status;
}

function buildStatusEffectMap() {
  return ORDER_STATUS_EFFECTS.reduce((acc, effect) => {
    acc[effect.status] = effect;
    return acc;
  }, {} as Partial<Record<PurchaseOrderStatus, StatusEffect>>);
}

function purchaseOrderStatusSelectStyles(): StylesConfig<SelectOption, false> {
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

function approvalChannelLabel(channel: ApprovalChannel) {
  switch (channel) {
    case 'sms':
      return 'SMS';
    case 'whatsapp':
      return 'WhatsApp';
    default:
      return 'Notification';
  }
}

function splitCommaSeparatedValues(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function isValidPhoneNumber(value: string) {
  return /^0\d{9}$/.test(value.trim());
}

function isValidEmailAddress(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function normalizeTextList(value: string) {
  return Array.from(new Set(splitCommaSeparatedValues(value)));
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

// --------------------------------------------------------------------------
// Main Component
// --------------------------------------------------------------------------

export default function PurchaseOrders() {
  const navigate = useNavigate();
  const { settings: businessSettings } = useBusinessSettings();
  const { locations } = useBusinessLocations();
  const { suppliers } = useBusinessSuppliers();
  const { statuses: purchaseOrderStatuses } = usePurchaseOrderStatuses();
  const {
    purchaseOrders,
    loading,
    error,
    fetchPurchaseOrders,
    deletePurchaseOrder,
    updatePurchaseOrder,
    sendPurchaseOrderNotification,
  } = usePurchaseOrders();

  const [activeTab, setActiveTab] = useState<'analytics' | 'list'>('list');
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    locationId: 'all',
    supplierId: 'all',
    status: 'all',
    deliveryStatus: 'all',
    paymentStatus: 'all',
    dateRange: { from: null, to: null },
    searchQuery: '',
  });
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>(DEFAULT_VISIBLE_COLUMNS);
  const [actionMenuOpenFor, setActionMenuOpenFor] = useState<string | null>(null);
  const [actionMenuPosition, setActionMenuPosition] = useState<ActionMenuState>(null);
  const [activeOrder, setActiveOrder] = useState<PurchaseOrder | null>(null);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);
  const [deleteModalOrder, setDeleteModalOrder] = useState<PurchaseOrder | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [deleteModalError, setDeleteModalError] = useState<string | null>(null);
  const [notificationModalOrder, setNotificationModalOrder] = useState<PurchaseOrder | null>(null);
  const [notificationSaving, setNotificationSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notificationForm, setNotificationForm] = useState<NotificationFormState>({
    mode: 'email',
    emailTo: '',
    emailCc: '',
    emailBcc: '',
    emailSubject: '',
    emailMessage: '',
    smsWhatsappReceivers: '',
    smsWhatsappMessage: '',
  });
  const statusDefinitionMap = useMemo(() => {
    return new Map(purchaseOrderStatuses.map((status) => [status.code, status]));
  }, [purchaseOrderStatuses]);

  const currencyCode = businessSettings?.currency || 'USD';
  const currencyPrecision = typeof businessSettings?.currencyPrecision === 'number' ? businessSettings.currencyPrecision : 2;
  const currencyPlacement = businessSettings?.currencySymbolPlacement === 'after' ? 'after' : 'before';

  useEffect(() => {
    fetchPurchaseOrders();
  }, [fetchPurchaseOrders]);

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
      setActiveOrder(null);
    };

    const handleResizeOrScroll = () => {
      setActionMenuOpenFor(null);
      setActionMenuPosition(null);
      setActiveOrder(null);
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

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / rowsPerPage));
  const displayedOrders = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredOrders.slice(start, start + rowsPerPage);
  }, [currentPage, filteredOrders, rowsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Analytics data
  const analytics = useMemo(() => {
    const totalOrders = purchaseOrders.length;
    const totalValue = purchaseOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const receivedOrders = purchaseOrders.filter((o) => o.status === 'received' || o.status === 'completed' || o.status === 'closed');
    const pendingOrders = purchaseOrders.filter((o) => o.status === 'pending' || o.status === 'pending_approval' || o.status === 'approved');
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
      if (order.status === 'received' || order.status === 'completed' || order.status === 'closed') {
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

  const handleDelete = async () => {
    if (!deleteModalOrder) {
      return;
    }

    const statusDefinition = statusDefinitionMap.get(deleteModalOrder.status);
    if (statusDefinition && !statusDefinition.canBeDeleted) {
      const message = `Orders in "${statusDefinition.name}" cannot be deleted.`;
      setDeleteModalError(message);
      toast.error(message);
      return;
    }

    setDeleteSaving(true);
    setDeleteModalError(null);

    try {
      const response = await deletePurchaseOrder(deleteModalOrder.id);
      toast.success(response.message || 'Purchase order deleted successfully');
      setDeleteModalOrder(null);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete purchase order';
      setDeleteModalError(message);
      toast.error(message);
    } finally {
      setDeleteSaving(false);
    }
  };

  const openDeleteModal = (order: PurchaseOrder) => {
    const statusDefinition = statusDefinitionMap.get(order.status);
    if (statusDefinition && !statusDefinition.canBeDeleted) {
      const message = `Orders in "${statusDefinition.name}" cannot be deleted.`;
      setDeleteModalError(message);
      toast.error(message);
      return;
    }

    setDeleteModalError(null);
    setDeleteModalOrder(order);
  };

  const openNotificationModal = (order: PurchaseOrder) => {
    setActionError(null);
    setNotificationModalOrder(order);
    setNotificationForm({
      mode: 'email',
      emailTo: '',
      emailCc: '',
      emailBcc: '',
      emailSubject: `Purchase Order ${order.referenceNumber}`,
      emailMessage: '',
      smsWhatsappReceivers: '',
      smsWhatsappMessage: '',
    });
  };

  const closeDeleteModal = () => {
    setDeleteModalOrder(null);
    setDeleteModalError(null);
  };
  const closeNotificationModal = () => {
    setNotificationModalOrder(null);
    setActionError(null);
  };

  const handleSendNotification = async () => {
    if (!notificationModalOrder) {
      return;
    }

    const nextMode = notificationForm.mode;
    const emailTo = normalizeTextList(notificationForm.emailTo);
    const emailCc = normalizeTextList(notificationForm.emailCc);
    const emailBcc = normalizeTextList(notificationForm.emailBcc);
    const smsWhatsappReceivers = normalizeTextList(notificationForm.smsWhatsappReceivers);
    const emailMessage = notificationForm.emailMessage.trim();
    const smsWhatsappMessage = notificationForm.smsWhatsappMessage.trim();
    const payload: SendPurchaseOrderNotificationInput = {
      mode: nextMode,
      emailTo,
      emailCc,
      emailBcc,
      emailSubject: notificationForm.emailSubject,
      emailMessage,
      smsWhatsappReceivers,
      smsWhatsappMessage,
      note: `Purchase order notification for ${notificationModalOrder.referenceNumber}`,
    };

    if (nextMode === 'email') {
      const invalidEmails = emailTo.filter((item) => !isValidEmailAddress(item));
      if (emailTo.length === 0 || invalidEmails.length > 0) {
        const message = 'Enter at least one valid email address for To.';
        setActionError(message);
        toast.error(message);
        return;
      }
      if (emailCc.some((item) => !isValidEmailAddress(item))) {
        const message = 'CC contains an invalid email address.';
        setActionError(message);
        toast.error(message);
        return;
      }
      if (emailBcc.some((item) => !isValidEmailAddress(item))) {
        const message = 'BCC contains an invalid email address.';
        setActionError(message);
        toast.error(message);
        return;
      }
      if (!emailMessage) {
        const message = 'Please type the email message.';
        setActionError(message);
        toast.error(message);
        return;
      }
    } else {
      const invalidPhones = smsWhatsappReceivers.filter((item) => !isValidPhoneNumber(item));
      if (smsWhatsappReceivers.length === 0 || invalidPhones.length > 0) {
        const message = 'Enter at least one valid phone number starting with 0 and 10 digits long.';
        setActionError(message);
        toast.error(message);
        return;
      }
      if (!smsWhatsappMessage) {
        const message = 'Please type the SMS/WhatsApp message.';
        setActionError(message);
        toast.error(message);
        return;
      }
    }

    setNotificationSaving(true);
    setActionError(null);

    try {
      const response = await sendPurchaseOrderNotification(notificationModalOrder.id, payload);
      toast.success(response.message || 'Notification queued successfully');
      setNotificationModalOrder(null);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to send notification';
      setActionError(message);
      toast.error(message);
    } finally {
      setNotificationSaving(false);
    }
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
    if (filters.deliveryStatus !== 'all') params.set('deliveryStatus', filters.deliveryStatus);
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

  const downloadPurchaseOrdersExport = async (formatType: 'csv' | 'pdf') => {
    try {
      const query = buildExportQuery();
      const { blob, filename } = await apiDownload(`/purchases/orders/export/${formatType}${query ? `?${query}` : ''}`);
      downloadBlob(blob, filename ?? `purchase-orders.${formatType}`);
      toast.success(`${formatType.toUpperCase()} export downloaded successfully`);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message || `Failed to export purchase orders`);
      } else {
        toast.error(`Failed to export purchase orders`);
      }
    }
  };

  const downloadPurchaseOrderPdf = async (order: PurchaseOrder, shouldPrint = false) => {
    try {
      const { blob } = await apiDownload(`/purchases/orders/${order.id}/export/pdf`);
      if (!shouldPrint) {
        downloadBlob(blob, `${order.referenceNumber || order.id}.pdf`);
        toast.success('PDF downloaded successfully');
        return;
      }

      const url = URL.createObjectURL(blob);
      const viewer = window.open(url, '_blank', 'noopener,noreferrer');
      if (!viewer) {
        downloadBlob(blob, `${order.referenceNumber || order.id}.pdf`);
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
        toast.error(err.message || 'Failed to export purchase order');
      } else {
        toast.error('Failed to export purchase order');
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

  const statusOptions: Array<{ value: PurchaseOrderStatus | 'all'; label: string }> = [
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

  const openActionMenu = (order: PurchaseOrder, button: HTMLButtonElement) => {
    const rect = button.getBoundingClientRect();
    const menuHeight = 336;
    const menuWidth = 256;
    const gap = 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const placement: 'top' | 'bottom' = spaceBelow < menuHeight && spaceAbove > spaceBelow ? 'top' : 'bottom';
    const top = placement === 'bottom' ? rect.bottom + gap : Math.max(rect.top - menuHeight - gap, gap);
    const left = Math.min(Math.max(rect.right - menuWidth, gap), window.innerWidth - menuWidth - gap);

    setActiveOrder(order);
    setActionMenuPosition({ top, left, placement });
    setActionMenuOpenFor(order.id);
  };

  const closeActionMenu = () => {
    setActionMenuOpenFor(null);
    setActionMenuPosition(null);
    setActiveOrder(null);
  };

  const handleOrderAction = async (action: RowAction, order: PurchaseOrder) => {
    closeActionMenu();

    switch (action) {
      case 'view':
        navigate(`/purchases/orders/${order.id}/view`);
        return;
      case 'print':
        await downloadPurchaseOrderPdf(order, true);
        return;
      case 'download-pdf':
        await downloadPurchaseOrderPdf(order, false);
        return;
      case 'edit':
        navigate(`/purchases/orders/${order.id}/edit`);
        return;
      case 'delete':
        openDeleteModal(order);
        return;
      case 'edit-delivery':
        navigate(`/purchases/orders/${order.id}/update-status`);
        return;
      case 'send-notification':
        openNotificationModal(order);
        return;
      default:
        return;
    }
  };

  const pageErrorMessage = error || actionError;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/95  py-4 backdrop-blur ">
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
              onClick={() => navigate('/purchases/list/create')}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              New Order
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
                onClick={() => fetchPurchaseOrders()}
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
                  label="Order Status"
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
            All Orders
            <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">{filteredOrders.length}</span>
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
              <div className="rounded-sm border border-border bg-card p-5">
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
              <div className="rounded-sm border border-border bg-card p-5">
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
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">All Orders</p>
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
                  onClick={() => downloadPurchaseOrdersExport('csv')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-alt"
                >
                  <Download className="h-3.5 w-3.5" />
                  CSV
                </button>
                <button
                  type="button"
                  onClick={() => downloadPurchaseOrdersExport('pdf')}
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
                      onClick={() => navigate('/purchases/list/create')}
                      className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      <Plus className="mr-2 inline h-4 w-4" />
                      Create Purchase Order
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-muted/30">
                        <tr>
                          {visibleColumns.orderDate && (
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Date
                            </th>
                          )}
                          {visibleColumns.referenceNumber && (
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Reference No.
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
                              Order Status
                            </th>
                          )}
                          {visibleColumns.items && (
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Items
                            </th>
                          )}
                          {visibleColumns.deliveryStatus && (
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Delivery Status
                            </th>
                          )}
                          {visibleColumns.paymentStatus && (
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Payment Status
                            </th>
                          )}
                          {visibleColumns.addedBy && (
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Added By
                            </th>
                          )}
                          {visibleColumns.totalAmount && (
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Total Amount
                            </th>
                          )}
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-background">
                        {displayedOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-muted/10 transition-colors">
                            {visibleColumns.orderDate && (
                              <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                                {format(new Date(order.orderDate), 'PPP')}
                              </td>
                            )}
                            {visibleColumns.referenceNumber && (
                              <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-foreground">
                                {order.referenceNumber}
                              </td>
                            )}
                            {visibleColumns.location && (
                              <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                                {order.locationName}
                              </td>
                            )}
                            {visibleColumns.supplier && (
                              <td className="whitespace-nowrap px-4 py-3 text-sm text-foreground">
                                {order.supplierName}
                              </td>
                            )}
                            {visibleColumns.status && (
                              <td className="whitespace-nowrap px-4 py-3">
                                <StatusBadge status={order.status} />
                              </td>
                            )}
                            {visibleColumns.items && (
                              <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-foreground">
                                {order.itemsCount || 0}
                              </td>
                            )}
                            {visibleColumns.deliveryStatus && (
                              <td className="whitespace-nowrap px-4 py-3">
                                <StatusBadge status={order.deliveryStatus} />
                              </td>
                            )}
                            {visibleColumns.paymentStatus && (
                              <td className="whitespace-nowrap px-4 py-3">
                                <StatusBadge status={order.paymentStatus} />
                              </td>
                            )}
                            {visibleColumns.addedBy && (
                              <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                                {order.createdBy?.name || 'System'}
                              </td>
                            )}
                            {visibleColumns.totalAmount && (
                              <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-foreground">
                                {formatMoney(order.totalAmount, currencyCode, currencyPrecision, currencyPlacement)}
                              </td>
                            )}
                            <td className="whitespace-nowrap px-4 py-3 text-right">
                              <div className="relative flex items-center justify-end">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openActionMenu(order, event.currentTarget);
                                  }}
                                  className="rounded p-1.5 text-muted-foreground hover:bg-surface-alt hover:text-foreground"
                                  aria-label="Open order actions"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                                {actionMenuOpenFor === order.id && actionMenuPosition && activeOrder?.id === order.id && (
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
                                        {activeOrder?.referenceNumber ?? 'this order'}
                                      </p>
                                    </div>
                                    <div className="divide-y divide-border p-1">
                                      <ActionMenuItem
                                        icon={Eye}
                                        label="View"
                                        onClick={() => handleOrderAction('view', order)}
                                      />
                                      <ActionMenuItem
                                        icon={Printer}
                                        label="Print"
                                        onClick={() => handleOrderAction('print', order)}
                                      />
                                      <ActionMenuItem
                                        icon={Download}
                                        label="Download Pdf"
                                        onClick={() => handleOrderAction('download-pdf', order)}
                                      />
                                      <ActionMenuItem
                                        icon={Edit}
                                        label="Edit"
                                        onClick={() => handleOrderAction('edit', order)}
                                      />
                                      <ActionMenuItem
                                        icon={Trash2}
                                        label="Delete"
                                        destructive
                                        onClick={() => handleOrderAction('delete', order)}
                                      />
                                      <ActionMenuItem
                                        icon={Truck}
                                        label="Update Order Status"
                                        onClick={() => handleOrderAction('edit-delivery', order)}
                                      />
                                      <ActionMenuItem
                                        icon={Bell}
                                        label="Send Notification"
                                        onClick={() => handleOrderAction('send-notification', order)}
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
                      Showing <span className="font-medium text-foreground">{Math.min((currentPage - 1) * rowsPerPage + 1, filteredOrders.length)}</span> to{' '}
                      <span className="font-medium text-foreground">
                        {Math.min(currentPage * rowsPerPage, filteredOrders.length)}
                      </span>{' '}
                      of <span className="font-medium text-foreground">{filteredOrders.length}</span> orders
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

      {deleteModalOrder ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm" onClick={closeDeleteModal}>
          <div
            className="w-full max-w-xl rounded-xl border border-border bg-card shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-destructive">Delete purchase order</p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">{deleteModalOrder.referenceNumber}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  This will soft delete the order and hide it from the active list.
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
                  <span className="font-medium text-foreground">{deleteModalOrder.supplierName}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge status={deleteModalOrder.status} />
                </div>
                <div className="mt-2 flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-medium text-foreground">
                    {formatMoney(deleteModalOrder.totalAmount, currencyCode, currencyPrecision, currencyPlacement)}
                  </span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                If the status is not marked as deletable in the database, the server will block this action.
              </p>
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
                  'Delete Order'
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {notificationModalOrder ? (
        <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/50 px-0 py-0 backdrop-blur-sm md:items-center md:px-4 md:py-6" onClick={closeNotificationModal}>
          <div
            className="flex h-full min-h-0 w-full max-w-none flex-col overflow-hidden rounded-none border border-border bg-card shadow-2xl md:h-[90vh] md:w-4/5 md:max-w-[80vw] md:rounded-sm"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Send notification
                </p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">{notificationModalOrder.referenceNumber}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Compose the message and choose the channel for this purchase order.
                </p>
              </div>
              <button
                type="button"
                onClick={closeNotificationModal}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-surface-alt hover:text-foreground"
                aria-label="Close notification modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              {actionError ? (
                <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>{actionError}</p>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
                <div className="space-y-4">
                  <div className="rounded-xl border border-border bg-background p-4">
                    <p className="text-sm font-semibold text-foreground">Current Order Snapshot</p>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Reference</span>
                        <span className="font-medium text-foreground">{notificationModalOrder.referenceNumber}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Supplier</span>
                        <span className="font-medium text-foreground">{notificationModalOrder.supplierName}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Status</span>
                        <StatusBadge status={notificationModalOrder.status} />
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">Total</span>
                        <span className="font-medium text-foreground">
                          {`${notificationModalOrder.itemsCount} item${notificationModalOrder.itemsCount === 1 ? '' : 's'} · ${formatMoney(
                            notificationModalOrder.totalAmount,
                            currencyCode,
                            currencyPrecision,
                            currencyPlacement,
                          )}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-background p-4">
                    <p className="text-sm font-semibold text-foreground">Delivery Channels</p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setNotificationForm((current) => ({ ...current, mode: 'email' }))}
                        className={`inline-flex flex-1 items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                          notificationForm.mode === 'email'
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-foreground hover:bg-surface-alt'
                        }`}
                      >
                        Email
                      </button>
                      <button
                        type="button"
                        onClick={() => setNotificationForm((current) => ({ ...current, mode: 'sms_whatsapp' }))}
                        className={`inline-flex flex-1 items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                          notificationForm.mode === 'sms_whatsapp'
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-foreground hover:bg-surface-alt'
                        }`}
                      >
                        Sms/Whatsapp
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {notificationForm.mode === 'email' ? (
                    <div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-sm font-medium text-foreground">To</label>
                          <input
                            value={notificationForm.emailTo}
                            onChange={(event) => setNotificationForm((current) => ({ ...current, emailTo: event.target.value }))}
                            placeholder="person@example.com, second@example.com"
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          />
                          <p className="mt-1 text-xs text-muted-foreground">Separate multiple emails with commas.</p>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-sm font-medium text-foreground">Subject</label>
                          <input
                            value={notificationForm.emailSubject}
                            onChange={(event) => setNotificationForm((current) => ({ ...current, emailSubject: event.target.value }))}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-foreground">CC</label>
                          <input
                            value={notificationForm.emailCc}
                            onChange={(event) => setNotificationForm((current) => ({ ...current, emailCc: event.target.value }))}
                            placeholder="cc@example.com"
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-foreground">BCC</label>
                          <input
                            value={notificationForm.emailBcc}
                            onChange={(event) => setNotificationForm((current) => ({ ...current, emailBcc: event.target.value }))}
                            placeholder="bcc@example.com"
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-foreground">Message</label>
                        <div className="overflow-hidden rounded-lg border border-border bg-background outline-none focus-within:ring-1 focus-within:ring-primary">
                          <CKEditor
                            editor={ClassicEditor}
                            data={notificationForm.emailMessage}
                            config={{
                              licenseKey: 'GPL',
                              plugins: [Essentials, Paragraph, Heading, Bold, Italic, Link, List, BlockQuote, Undo],
                              toolbar: ['undo', 'redo', '|', 'heading', '|', 'bold', 'italic', 'link', '|', 'bulletedList', 'numberedList', 'blockQuote'],
                              placeholder: 'Write the email message...',
                            }}
                            onChange={(_, editor) => {
                              setNotificationForm((current) => ({ ...current, emailMessage: editor.getData() }));
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-foreground">Receiver Phone Numbers</label>
                        <input
                          value={notificationForm.smsWhatsappReceivers}
                          onChange={(event) => setNotificationForm((current) => ({ ...current, smsWhatsappReceivers: event.target.value }))}
                          placeholder="0712345678, 0723456789"
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">Use commas to separate multiple numbers. Each number must start with 0 and have 10 digits.</p>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-foreground">Message</label>
                        <textarea
                          value={notificationForm.smsWhatsappMessage}
                          onChange={(event) => setNotificationForm((current) => ({ ...current, smsWhatsappMessage: event.target.value }))}
                          rows={9}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          placeholder="Type the message..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="shrink-0 flex flex-col gap-3 border-t border-border px-5 py-4 pb-6 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={closeNotificationModal}
                className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-alt"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSendNotification()}
                disabled={notificationSaving}
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {notificationSaving ? 'Sending...' : 'Send Notification'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
