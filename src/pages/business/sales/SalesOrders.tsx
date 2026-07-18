import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { format, isAfter, startOfYear, endOfDay } from 'date-fns';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronDown,
  Filter,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  Truck,
  Users,
  BadgeCheck,
  Clock3,
  Package,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DateRangePicker } from '@/components/forms/DateRangePicker';
import { useBusinessCustomers } from '@/hooks/business/customers/useBusinessCustomers';
import { useBusinessLocations } from '@/hooks/business/settings/useBusinessLocations';
import { useBusinessSettings } from '@/hooks/business/settings/useBusinessSettings';
import {
  useSalesOrders,
  type SaleOrderStatus,
  type SalesOrderListItem,
} from '@/hooks/business/sales/useSalesOrders';

type FilterState = {
  locationId: string;
  customerId: string;
  status: SaleOrderStatus | 'all';
  shippingStatus: string | 'all';
  dateRange: {
    from: Date;
    to: Date;
  };
  searchQuery: string;
};

type StatusModalState = {
  order: SalesOrderListItem;
} | null;

const SALE_STATUS_OPTIONS: Array<{ value: SaleOrderStatus; label: string }> = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'processing', label: 'Processing' },
  { value: 'ready_for_shipment', label: 'Ready for Shipment' },
  { value: 'completed', label: 'Completed' },
];

const SHIPPING_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'ready_for_shipment', label: 'Ready for Shipment' },
  { value: 'completed', label: 'Completed' },
];

function formatMoney(amount: number) {
  return `KSh ${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0)}`;
}

function formatDateTime(value: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, 'dd MMM yyyy, HH:mm');
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: 'Draft',
    pending_approval: 'Pending Approval',
    approved: 'Approved',
    processing: 'Processing',
    ready_for_shipment: 'Ready for Shipment',
    completed: 'Completed',
    pending: 'Pending',
  };
  return labels[status] ?? status;
}

function shippingLabel(status: string) {
  const labels: Record<string, string> = {
    pending: 'Pending',
    processing: 'Processing',
    ready_for_shipment: 'Ready for Shipment',
    completed: 'Completed',
  };
  return labels[status] ?? status;
}

function statusClasses(status: string) {
  const classes: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700 border-slate-300',
    pending_approval: 'bg-amber-100 text-amber-800 border-amber-300',
    approved: 'bg-blue-100 text-blue-800 border-blue-300',
    processing: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    ready_for_shipment: 'bg-purple-100 text-purple-800 border-purple-300',
    completed: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  };
  return classes[status] ?? 'bg-slate-100 text-slate-700 border-slate-300';
}

function shippingClasses(status: string) {
  const classes: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    processing: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    ready_for_shipment: 'bg-purple-100 text-purple-800 border-purple-300',
    completed: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  };
  return classes[status] ?? 'bg-slate-100 text-slate-700 border-slate-300';
}

function StatCard({
  title,
  value,
  icon: Icon,
  accent = 'primary',
}: {
  title: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  accent?: 'primary' | 'emerald' | 'blue' | 'amber' | 'purple';
}) {
  const accentClasses = {
    primary: 'bg-primary/10 text-primary',
    emerald: 'bg-emerald-500/10 text-emerald-600',
    blue: 'bg-blue-500/10 text-blue-600',
    amber: 'bg-amber-500/10 text-amber-600',
    purple: 'bg-purple-500/10 text-purple-600',
  };

  return (
    <div className="rounded-sm border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
        </div>
        <div className={`rounded-xl p-2.5 ${accentClasses[accent]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function Badge({ label, tone }: { label: string; tone: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${tone}`}>
      {label}
    </span>
  );
}

function StatusModal({
  order,
  status,
  reserveOrderItems,
  onClose,
  onStatusChange,
  onReserveChange,
  onSave,
  saving,
  defaultReserveOrderItems,
}: {
  order: SalesOrderListItem;
  status: SaleOrderStatus;
  reserveOrderItems: boolean;
  onClose: () => void;
  onStatusChange: (value: SaleOrderStatus) => void;
  onReserveChange: (value: boolean) => void;
  onSave: () => void;
  saving: boolean;
  defaultReserveOrderItems: boolean;
}) {
  const showReserveToggle = status === 'approved' || status === 'processing';
  const helperText =
    status === 'approved'
      ? 'Approving this order can reserve the stock so it is no longer available for other sales.'
      : status === 'processing'
        ? 'Processing keeps the reservation active while the order is being prepared.'
        : status === 'ready_for_shipment' || status === 'completed'
          ? 'This finalizes the order into a sale and reduces inventory from the allocated batches.'
          : 'This status updates the order only and does not move inventory yet.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
      <div className="w-full max-w-xl rounded-3xl border border-border bg-background p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Update sale order status</p>
            <h3 className="mt-1 text-xl font-semibold text-foreground">{order.referenceNumber || order.id}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{order.customerName || 'Customer'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface-alt hover:text-foreground"
          >
            <span className="sr-only">Close</span>
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">New status</span>
            <div className="relative">
              <select
                value={status}
                onChange={(event) => onStatusChange(event.target.value as SaleOrderStatus)}
                className="w-full appearance-none rounded-xl border border-border bg-background px-4 py-3 pr-10 text-sm outline-none focus:border-primary"
              >
                {SALE_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </label>

          {showReserveToggle ? (
            <button
              type="button"
              onClick={() => onReserveChange(!reserveOrderItems)}
              className="flex w-full items-center justify-between gap-4 rounded-2xl border border-border bg-card px-4 py-3 text-left transition-colors hover:border-primary/60"
            >
              <div>
                <p className="text-sm font-medium text-foreground">Reserve order items</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {defaultReserveOrderItems ? 'Business default: on' : 'Business default: off'}
                </p>
              </div>
              <span
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  reserveOrderItems ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-background shadow transition-transform ${
                    reserveOrderItems ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </span>
            </button>
          ) : null}

          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {helperText}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-alt"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SalesOrders() {
  const navigate = useNavigate();
  const { locations } = useBusinessLocations();
  const { customers } = useBusinessCustomers();
  const { settings } = useBusinessSettings();
  const { salesOrders, isLoading, isSaving, error, loadSalesOrders, updateSaleOrderStatus, clearError } = useSalesOrders();

  const today = useMemo(() => endOfDay(new Date()), []);
  const yearStart = useMemo(() => startOfYear(new Date()), []);

  const [filters, setFilters] = useState<FilterState>(() => ({
    locationId: 'all',
    customerId: 'all',
    status: 'all',
    shippingStatus: 'all',
    dateRange: {
      from: startOfYear(new Date()),
      to: new Date(),
    },
    searchQuery: '',
  }));
  const [searchInput, setSearchInput] = useState('');
  const [formError, setFormError] = useState('');
  const [statusModal, setStatusModal] = useState<StatusModalState>(null);
  const [nextStatus, setNextStatus] = useState<SaleOrderStatus>('ready_for_shipment');
  const [reserveOrderItems, setReserveOrderItems] = useState(Boolean(settings?.preserveSaleOrderRequests ?? true));

  useEffect(() => {
    setReserveOrderItems(Boolean(settings?.preserveSaleOrderRequests ?? true));
  }, [settings?.preserveSaleOrderRequests]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (isAfter(filters.dateRange.from, filters.dateRange.to)) {
        setFormError('The start date cannot be greater than the end date.');
        return;
      }

      if (isAfter(filters.dateRange.to, today)) {
        setFormError('The end date cannot be in the future.');
        return;
      }

      setFormError('');
      void loadSalesOrders({
        location_id: filters.locationId === 'all' ? undefined : filters.locationId,
        customer_id: filters.customerId === 'all' ? undefined : filters.customerId,
        status: filters.status === 'all' ? undefined : filters.status,
        shipping_status: filters.shippingStatus === 'all' ? undefined : filters.shippingStatus,
        date_from: format(filters.dateRange.from, 'yyyy-MM-dd'),
        date_to: format(filters.dateRange.to, 'yyyy-MM-dd'),
        search_query: searchInput.trim() || undefined,
      });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [
    filters.locationId,
    filters.customerId,
    filters.status,
    filters.shippingStatus,
    filters.dateRange.from,
    filters.dateRange.to,
    searchInput,
    today,
    loadSalesOrders,
  ]);

  useEffect(() => {
    if (!statusModal) {
      setNextStatus('ready_for_shipment');
      return;
    }

    setNextStatus((current) => current ?? 'ready_for_shipment');
  }, [statusModal]);

  const stats = useMemo(() => {
    const totalOrders = salesOrders.length;
    const grandTotal = salesOrders.reduce((sum, order) => sum + Number(order.grandTotal || 0), 0);
    const paid = salesOrders.reduce((sum, order) => sum + Number(order.paidAmount || 0), 0);
    const balance = salesOrders.reduce((sum, order) => sum + Number(order.balanceDue || 0), 0);
    return { totalOrders, grandTotal, paid, balance };
  }, [salesOrders]);

  const openStatusModal = (order: SalesOrderListItem) => {
    setStatusModal({ order });
    setReserveOrderItems(Boolean(settings?.preserveSaleOrderRequests ?? true));
    setNextStatus(order.status === 'draft' || order.status === 'pending_approval' ? 'approved' : 'ready_for_shipment');
  };

  const saveStatus = async () => {
    if (!statusModal) return;
    try {
      await updateSaleOrderStatus(statusModal.order.id, {
        status: nextStatus,
        reserve_order_items: reserveOrderItems,
      });
      toast.success('Sales order status updated.');
      setStatusModal(null);
      await loadSalesOrders({
        location_id: filters.locationId === 'all' ? undefined : filters.locationId,
        customer_id: filters.customerId === 'all' ? undefined : filters.customerId,
        status: filters.status === 'all' ? undefined : filters.status,
        shipping_status: filters.shippingStatus === 'all' ? undefined : filters.shippingStatus,
        date_from: format(filters.dateRange.from, 'yyyy-MM-dd'),
        date_to: format(filters.dateRange.to, 'yyyy-MM-dd'),
        search_query: searchInput.trim() || undefined,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update sales order status.';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen  py-6">
      <div className="mx-auto w-full space-y-6">
        <div className="flex flex-col gap-4  bg-card/95 p-5  backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="bg-background p-2.5 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">Sales Orders</h1>
                <Badge label={`${stats.totalOrders} orders`} tone="bg-slate-100 text-slate-700 border-slate-300" />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Track customer orders, reserve stock, and finalize sales when the order reaches shipment or completion.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadSalesOrders({
                location_id: filters.locationId === 'all' ? undefined : filters.locationId,
                customer_id: filters.customerId === 'all' ? undefined : filters.customerId,
                status: filters.status === 'all' ? undefined : filters.status,
                shipping_status: filters.shippingStatus === 'all' ? undefined : filters.shippingStatus,
                date_from: format(filters.dateRange.from, 'yyyy-MM-dd'),
                date_to: format(filters.dateRange.to, 'yyyy-MM-dd'),
                search_query: searchInput.trim() || undefined,
              })
            }
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {(formError || error) && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">We could not complete the request</p>
                <p className="mt-1">{formError || error}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFormError('');
                  clearError();
                }}
                className="ml-auto rounded-lg px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Grand Total" value={formatMoney(stats.grandTotal)} icon={Building2} accent="blue" />
          <StatCard title="Paid" value={formatMoney(stats.paid)} icon={CheckCircle2} accent="emerald" />
          <StatCard title="Balance Due" value={formatMoney(stats.balance)} icon={Package} accent="amber" />
          <StatCard title="Loaded Orders" value={String(stats.totalOrders)} icon={Users} accent="purple" />
        </div>

        <div className="rounded-sm border border-border bg-card p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-6">
            <label className="space-y-1.5 xl:col-span-2">
              <span className="text-xs font-medium text-muted-foreground">Search</span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search by order no, customer, phone or location"
                  className="w-full rounded-xl border border-border bg-background py-3 pl-9 pr-4 text-sm outline-none focus:border-primary"
                />
              </div>
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Location</span>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={filters.locationId}
                  onChange={(event) => setFilters((current) => ({ ...current, locationId: event.target.value }))}
                  className="w-full appearance-none rounded-xl border border-border bg-background py-3 pl-9 pr-10 text-sm outline-none focus:border-primary"
                >
                  <option value="all">All locations</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.locationName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Customer</span>
              <div className="relative">
                <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={filters.customerId}
                  onChange={(event) => setFilters((current) => ({ ...current, customerId: event.target.value }))}
                  className="w-full appearance-none rounded-xl border border-border bg-background py-3 pl-9 pr-10 text-sm outline-none focus:border-primary"
                >
                  <option value="all">All customers</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Order Status</span>
              <div className="relative">
                <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={filters.status}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, status: event.target.value as FilterState['status'] }))
                  }
                  className="w-full appearance-none rounded-xl border border-border bg-background py-3 pl-9 pr-10 text-sm outline-none focus:border-primary"
                >
                  <option value="all">All statuses</option>
                  {SALE_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Shipping Status</span>
              <div className="relative">
                <Truck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={filters.shippingStatus}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      shippingStatus: event.target.value as FilterState['shippingStatus'],
                    }))
                  }
                  className="w-full appearance-none rounded-xl border border-border bg-background py-3 pl-9 pr-10 text-sm outline-none focus:border-primary"
                >
                  <option value="all">All shipping statuses</option>
                  {SHIPPING_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </label>
          </div>

          <div className="mt-4">
            <DateRangePicker
              value={filters.dateRange}
              onChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  dateRange: {
                    from: value.from ?? yearStart,
                    to: value.to ?? today,
                  },
                }))
              }
              fromLabel="From"
              toLabel="To"
              fromMinDate={yearStart}
              fromMaxDate={filters.dateRange.to ?? today}
              toMinDate={filters.dateRange.from ?? yearStart}
              toMaxDate={today}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-sm border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Sales Orders</h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Ready for shipment and completed orders will convert into finalized sales and affect inventory batches.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-surface-alt/60">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Customer Name</th>
                  <th className="px-5 py-4">Contact Number</th>
                  <th className="px-5 py-4">Order No</th>
                  <th className="px-5 py-4">Location</th>
                  <th className="px-5 py-4">Order Status</th>
                  <th className="px-5 py-4">Shipping Status</th>
                  <th className="px-5 py-4 text-right">Total Items</th>
                  <th className="px-5 py-4 text-right">Grand Total</th>
                  <th className="px-5 py-4 text-right">Paid</th>
                  <th className="px-5 py-4 text-right">Balance Due</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={12} className="px-5 py-16 text-center text-sm text-muted-foreground">
                      <div className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading sales orders...
                      </div>
                    </td>
                  </tr>
                ) : salesOrders.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-5 py-16 text-center text-sm text-muted-foreground">
                      No sales orders match the current filters.
                    </td>
                  </tr>
                ) : (
                  salesOrders.map((order) => (
                    <tr key={order.id} className="align-top hover:bg-surface-alt/40">
                      <td className="px-5 py-4 text-sm text-foreground">{formatDateTime(order.saleDate)}</td>
                      <td className="px-5 py-4 text-sm font-medium text-foreground">{order.customerName || '—'}</td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">{order.customerPhone || '—'}</td>
                      <td className="px-5 py-4 text-sm text-foreground">{order.referenceNumber || '—'}</td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">{order.locationName || '—'}</td>
                      <td className="px-5 py-4">
                        <Badge
                          label={statusLabel(order.status)}
                          tone={statusClasses(order.status)}
                        />
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          label={shippingLabel(order.shippingStatus)}
                          tone={shippingClasses(order.shippingStatus)}
                        />
                      </td>
                      <td className="px-5 py-4 text-right text-sm text-foreground">{order.itemsCount}</td>
                      <td className="px-5 py-4 text-right text-sm font-medium text-foreground">
                        {formatMoney(order.grandTotal)}
                      </td>
                      <td className="px-5 py-4 text-right text-sm text-foreground">{formatMoney(order.paidAmount)}</td>
                      <td className="px-5 py-4 text-right text-sm font-medium text-foreground">
                        {formatMoney(order.balanceDue)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openStatusModal(order)}
                            className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                          >
                            <BadgeCheck className="h-4 w-4" />
                            Update Status
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {statusModal ? (
        <StatusModal
          order={statusModal.order}
          status={nextStatus}
          reserveOrderItems={reserveOrderItems}
          onClose={() => setStatusModal(null)}
          onStatusChange={setNextStatus}
          onReserveChange={setReserveOrderItems}
          onSave={() => void saveStatus()}
          saving={isSaving}
          defaultReserveOrderItems={Boolean(settings?.preserveSaleOrderRequests ?? true)}
        />
      ) : null}
    </div>
  );
}
