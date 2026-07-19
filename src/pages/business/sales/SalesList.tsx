import { createPortal } from "react-dom";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { format, isAfter, startOfYear, endOfDay } from "date-fns";
import toast from "react-hot-toast";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronDown,
  Filter,
  Loader2,
  MapPin,
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  FileText,
  RefreshCw,
  Search,
  Truck,
  Users,
  BadgeCheck,
  Clock3,
  Package,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  TrendingUp,
  Columns3,
  ChevronUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DateRangePicker } from "@/components/forms/DateRangePicker";
import { ApiError } from "@/lib/api";
import { useBusinessCustomers } from "@/hooks/business/customers/useBusinessCustomers";
import { useBusinessLocations } from "@/hooks/business/settings/useBusinessLocations";
import { useBusinessSettings } from "@/hooks/business/settings/useBusinessSettings";
import {
  useSalesOrderStatuses,
  type SalesOrderStatusDefinition,
} from "@/hooks/business/sales/useSalesOrderStatuses";
import {
  useSales,
  type SaleOrderStatus,
  type SaleListItem,
} from "@/hooks/business/sales/useSales";

type FilterState = {
  locationId: string;
  customerId: string;
  status: SaleOrderStatus | "all";
  shippingStatus: string | "all";
  dateRange: {
    from: Date;
    to: Date;
  };
  searchQuery: string;
};

type StatusModalState = {
  order: SaleListItem;
} | null;

type DeleteModalState = {
  order: SaleListItem;
} | null;

type ActionMenuState = {
  top: number;
  left: number;
  placement: "top" | "bottom";
} | null;

type RowAction =
  | "view"
  | "edit"
  | "delete"
  | "edit-shipping"
  | "print-invoice"
  | "package-slip"
  | "view-payments"
  | "sell-return"
  | "invoice-url"
  | "new-sale-notification";

const SALE_STATUS_OPTIONS: Array<{ value: SaleOrderStatus; label: string }> = [
  { value: "draft", label: "Draft" },
  { value: "pending_approval", label: "Pending Approval" },
  { value: "approved", label: "Approved" },
  { value: "processing", label: "Processing" },
  { value: "ready_for_shipment", label: "Ready for Shipment" },
  { value: "completed", label: "Completed" },
];

const SHIPPING_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "ready_for_shipment", label: "Ready for Shipment" },
  { value: "completed", label: "Completed" },
];

function formatMoney(amount: number) {
  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0)}`;
}

function formatDateTime(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, "dd MMM yyyy, HH:mm");
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: "Draft",
    pending_approval: "Pending Approval",
    approved: "Approved",
    processing: "Processing",
    ready_for_shipment: "Ready for Shipment",
    completed: "Completed",
    pending: "Pending",
  };
  return labels[status] ?? status;
}

function humanizeStatusCode(value: string) {
  const normalized = value.trim().replace(/[_-]+/g, " ");
  if (!normalized) return "-";
  return normalized
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function shippingLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Pending",
    processing: "Processing",
    ready_for_shipment: "Ready for Shipment",
    completed: "Completed",
  };
  return labels[status] ?? status;
}

function statusClasses(status: string) {
  const classes: Record<string, string> = {
    draft: "bg-slate-100 text-slate-700 border-slate-300",
    pending_approval: "bg-amber-100 text-amber-800 border-amber-300",
    approved: "bg-blue-100 text-blue-800 border-blue-300",
    processing: "bg-indigo-100 text-indigo-800 border-indigo-300",
    ready_for_shipment: "bg-purple-100 text-purple-800 border-purple-300",
    completed: "bg-emerald-100 text-emerald-800 border-emerald-300",
    pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  };
  return classes[status] ?? "bg-slate-100 text-slate-700 border-slate-300";
}

function shippingClasses(status: string) {
  const classes: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    processing: "bg-indigo-100 text-indigo-800 border-indigo-300",
    ready_for_shipment: "bg-purple-100 text-purple-800 border-purple-300",
    completed: "bg-emerald-100 text-emerald-800 border-emerald-300",
  };
  return classes[status] ?? "bg-slate-100 text-slate-700 border-slate-300";
}

const ANALYTICS_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
  "#ec4899",
];

type AnalyticsSummary = {
  totalOrders: number;
  grandTotal: number;
  paid: number;
  balance: number;
  averageOrderValue: number;
  monthlyOrders: Array<{ month: string; count: number }>;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  statusDistribution: Array<{ name: string; value: number }>;
  shippingDistribution: Array<{ name: string; value: number }>;
  locationPerformance: Array<{ name: string; value: number }>;
  topCustomers: Array<{ name: string; value: number }>;
};

function emptyAnalytics(): AnalyticsSummary {
  return {
    totalOrders: 0,
    grandTotal: 0,
    paid: 0,
    balance: 0,
    averageOrderValue: 0,
    monthlyOrders: [],
    monthlyRevenue: [],
    statusDistribution: [],
    shippingDistribution: [],
    locationPerformance: [],
    topCustomers: [],
  };
}

function chartTooltipFormatter(value: number) {
  return formatMoney(Number(value) || 0);
}

function StatCard({
  title,
  value,
  icon: Icon,
  accent = "primary",
}: {
  title: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  accent?: "primary" | "emerald" | "blue" | "amber" | "purple";
}) {
  const accentClasses = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-500/10 text-emerald-600",
    blue: "bg-blue-500/10 text-blue-600",
    amber: "bg-amber-500/10 text-amber-600",
    purple: "bg-purple-500/10 text-purple-600",
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
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${tone}`}
    >
      {label}
    </span>
  );
}

function ActionMenuItem({
  icon: Icon,
  label,
  onClick,
  destructive = false,
}: {
  icon?: ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
        destructive
          ? "text-destructive hover:bg-destructive/10"
          : "text-foreground hover:bg-surface-alt"
      }`}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {label}
    </button>
  );
}

function ChartCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="rounded-xl bg-primary/10 p-2 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="h-72">{children}</div>
    </div>
  );
}

function StatusModal({
  order,
  status,
  reserveOrderItems,
  currentStatusDefinition,
  statuses,
  onClose,
  onStatusChange,
  onSave,
  saving,
}: {
  order: SaleListItem;
  status: SaleOrderStatus;
  reserveOrderItems: boolean;
  currentStatusDefinition?: SalesOrderStatusDefinition | null;
  statuses: SalesOrderStatusDefinition[];
  onClose: () => void;
  onStatusChange: (value: SaleOrderStatus) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const currentSortOrder = currentStatusDefinition?.sortOrder ?? 0;
  const selectedDefinition = statuses.find((entry) => entry.code === status);
  const isCompleted = currentStatusDefinition?.code === "completed";
  const helperText =
    selectedDefinition?.whatHappens ||
    "Choose a later status to continue the sale workflow.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
      <div className="w-full max-w-xl rounded-3xl border border-border bg-background p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Update sale status
            </p>
            <h3 className="mt-1 text-xl font-semibold text-foreground">
              {order.referenceNumber || order.id}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {order.customerName || "Customer"}
            </p>
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
            <span className="text-sm font-medium text-foreground">
              New status
            </span>
            <div className="relative">
              <select
                value={status}
                onChange={(event) =>
                  onStatusChange(event.target.value as SaleOrderStatus)
                }
                disabled={isCompleted}
                className="w-full appearance-none rounded-xl border border-border bg-background px-4 py-3 pr-10 text-sm outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {statuses.map((option) => (
                  <option
                    key={option.code}
                    value={option.code}
                    disabled={option.sortOrder < currentSortOrder}
                  >
                    {option.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface-alt/40 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Current status
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {currentStatusDefinition?.name ??
                  humanizeStatusCode(order.status)}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-surface-alt/40 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Requires further action
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {selectedDefinition?.requiresFurtherAction ? "Yes" : "No"}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface-alt/40 px-4 py-3 text-sm text-muted-foreground">
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
            disabled={saving || isCompleted}
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

export default function SalesList() {
  const navigate = useNavigate();
  const { locations } = useBusinessLocations();
  const { customers } = useBusinessCustomers();
  const { settings } = useBusinessSettings();
  const { statuses: saleOrderStatuses, loading: saleOrderStatusesLoading } =
    useSalesOrderStatuses();
  const {
    salesOrders,
    isLoading,
    isSaving,
    error,
    loadSalesOrders,
    updateSaleOrderStatus,
    deleteSaleOrder,
    clearError,
  } = useSales();
  const [activeTab, setActiveTab] = useState<"analytics" | "list">("analytics");
  const [actionMenuOpenFor, setActionMenuOpenFor] = useState<string | null>(
    null,
  );
  const [actionMenuPosition, setActionMenuPosition] =
    useState<ActionMenuState>(null);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);

  const today = useMemo(() => endOfDay(new Date()), []);
  const yearStart = useMemo(() => startOfYear(new Date()), []);

  const [filters, setFilters] = useState<FilterState>(() => ({
    locationId: "all",
    customerId: "all",
    status: "all",
    shippingStatus: "all",
    dateRange: {
      from: startOfYear(new Date()),
      to: new Date(),
    },
    searchQuery: "",
  }));
  const [searchInput, setSearchInput] = useState("");
  const [formError, setFormError] = useState("");
  const [statusModal, setStatusModal] = useState<StatusModalState>(null);
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>(null);
  const [deleteModalError, setDeleteModalError] = useState("");
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [nextStatus, setNextStatus] =
    useState<SaleOrderStatus>("ready_for_shipment");
  const [reserveOrderItems, setReserveOrderItems] = useState(
    Boolean(settings?.preserveSaleOrderRequests ?? true),
  );
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  useEffect(() => {
    setReserveOrderItems(Boolean(settings?.preserveSaleOrderRequests ?? true));
  }, [settings?.preserveSaleOrderRequests]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (isAfter(filters.dateRange.from, filters.dateRange.to)) {
        setFormError("The start date cannot be greater than the end date.");
        return;
      }

      if (isAfter(filters.dateRange.to, today)) {
        setFormError("The end date cannot be in the future.");
        return;
      }

      setFormError("");
      void loadSalesOrders({
        location_id:
          filters.locationId === "all" ? undefined : filters.locationId,
        customer_id:
          filters.customerId === "all" ? undefined : filters.customerId,
        status: filters.status === "all" ? undefined : filters.status,
        shipping_status:
          filters.shippingStatus === "all" ? undefined : filters.shippingStatus,
        date_from: format(filters.dateRange.from, "yyyy-MM-dd"),
        date_to: format(filters.dateRange.to, "yyyy-MM-dd"),
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
      setNextStatus("ready_for_shipment");
      return;
    }

    setNextStatus(
      statusModal.order.status === "completed"
        ? "completed"
        : "ready_for_shipment",
    );
  }, [statusModal]);

  useEffect(() => {
    if (!actionMenuOpenFor) {
      return undefined;
    }

    const handleGlobalClose = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (
        actionMenuRef.current &&
        target &&
        actionMenuRef.current.contains(target)
      ) {
        return;
      }
      setActionMenuOpenFor(null);
      setActionMenuPosition(null);
    };

    const handleResizeOrScroll = () => {
      setActionMenuOpenFor(null);
      setActionMenuPosition(null);
    };

    document.addEventListener("mousedown", handleGlobalClose);
    window.addEventListener("resize", handleResizeOrScroll);
    window.addEventListener("scroll", handleResizeOrScroll, true);

    return () => {
      document.removeEventListener("mousedown", handleGlobalClose);
      window.removeEventListener("resize", handleResizeOrScroll);
      window.removeEventListener("scroll", handleResizeOrScroll, true);
    };
  }, [actionMenuOpenFor]);

  const stats = useMemo(() => {
    const totalOrders = salesOrders.length;
    const grandTotal = salesOrders.reduce(
      (sum, order) => sum + Number(order.grandTotal || 0),
      0,
    );
    const paid = salesOrders.reduce(
      (sum, order) => sum + Number(order.paidAmount || 0),
      0,
    );
    const balance = salesOrders.reduce(
      (sum, order) => sum + Number(order.balanceDue || 0),
      0,
    );
    return { totalOrders, grandTotal, paid, balance };
  }, [salesOrders]);

  const currentStatusDefinitionByCode = useMemo(() => {
    return new Map(
      saleOrderStatuses.map((status) => [status.code, status] as const),
    );
  }, [saleOrderStatuses]);

  const analytics = useMemo<AnalyticsSummary>(() => {
    if (salesOrders.length === 0) {
      return emptyAnalytics();
    }

    const monthlyMap = new Map<
      string,
      { count: number; revenue: number; sortKey: number }
    >();
    const statusMap = new Map<string, number>();
    const shippingMap = new Map<string, number>();
    const locationMap = new Map<string, number>();
    const customerMap = new Map<string, number>();

    let grandTotal = 0;
    let paid = 0;
    let balance = 0;

    for (const order of salesOrders) {
      const orderDate = new Date(order.saleDate);
      const monthKey = format(orderDate, "MMM yyyy");
      const monthSortKey = orderDate.getFullYear() * 100 + orderDate.getMonth();
      const currentMonth = monthlyMap.get(monthKey) ?? {
        count: 0,
        revenue: 0,
        sortKey: monthSortKey,
      };
      currentMonth.count += 1;
      currentMonth.revenue += Number(order.grandTotal || 0);
      monthlyMap.set(monthKey, currentMonth);

      statusMap.set(order.status, (statusMap.get(order.status) ?? 0) + 1);
      shippingMap.set(
        order.shippingStatus,
        (shippingMap.get(order.shippingStatus) ?? 0) + 1,
      );
      locationMap.set(
        order.locationName || "Unassigned",
        (locationMap.get(order.locationName || "Unassigned") ?? 0) +
          Number(order.grandTotal || 0),
      );
      customerMap.set(
        order.customerName || "Walk-in Customer",
        (customerMap.get(order.customerName || "Walk-in Customer") ?? 0) +
          Number(order.grandTotal || 0),
      );

      grandTotal += Number(order.grandTotal || 0);
      paid += Number(order.paidAmount || 0);
      balance += Number(order.balanceDue || 0);
    }

    const monthlyEntries = Array.from(monthlyMap.entries())
      .sort((a, b) => a[1].sortKey - b[1].sortKey)
      .map(([month, data]) => ({
        month,
        count: data.count,
        revenue: data.revenue,
      }));

    return {
      totalOrders: salesOrders.length,
      grandTotal,
      paid,
      balance,
      averageOrderValue:
        salesOrders.length > 0 ? grandTotal / salesOrders.length : 0,
      monthlyOrders: monthlyEntries.map((entry) => ({
        month: entry.month,
        count: entry.count,
      })),
      monthlyRevenue: monthlyEntries.map((entry) => ({
        month: entry.month,
        revenue: entry.revenue,
      })),
      statusDistribution: Array.from(statusMap.entries()).map(
        ([name, value]) => ({ name: statusLabel(name), value }),
      ),
      shippingDistribution: Array.from(shippingMap.entries()).map(
        ([name, value]) => ({
          name: shippingLabel(name),
          value,
        }),
      ),
      locationPerformance: Array.from(locationMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, value]) => ({ name, value })),
      topCustomers: Array.from(customerMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, value]) => ({ name, value })),
    };
  }, [salesOrders]);

  const filteredOrders = salesOrders;

  const openStatusModal = (order: SaleListItem) => {
    if (order.status === "completed") {
      toast("Completed sales cannot be changed.");
      return;
    }
    setStatusModal({ order });
    setReserveOrderItems(Boolean(settings?.preserveSaleOrderRequests ?? true));
    const currentDefinition = currentStatusDefinitionByCode.get(order.status);
    const nextDefinition =
      saleOrderStatuses.find(
        (status) => status.sortOrder > (currentDefinition?.sortOrder ?? 0),
      ) ??
      currentDefinition ??
      null;
    setNextStatus(
      (nextDefinition?.code as SaleOrderStatus) || "ready_for_shipment",
    );
  };

  const openActionMenu = (order: SaleListItem, button: HTMLButtonElement) => {
    const rect = button.getBoundingClientRect();
    const menuHeight = 320;
    const menuWidth = 240;
    const gap = 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const placement: "top" | "bottom" =
      spaceBelow < menuHeight && spaceAbove > spaceBelow ? "top" : "bottom";
    const top =
      placement === "bottom"
        ? rect.bottom + gap
        : Math.max(rect.top - menuHeight - gap, gap);
    const left = Math.min(
      Math.max(rect.right - menuWidth, gap),
      window.innerWidth - menuWidth - gap,
    );

    setActionMenuPosition({ top, left, placement });
    setActionMenuOpenFor(order.id);
  };

  const closeActionMenu = () => {
    setActionMenuOpenFor(null);
    setActionMenuPosition(null);
  };

  const handleOrderAction = async (action: RowAction, order: SaleListItem) => {
    closeActionMenu();

    switch (action) {
      case "view":
        navigate(`/sales/list/${order.id}/view`);
        return;
      case "edit":
        navigate(`/sales/order/${order.id}/edit`);
        return;
      case "delete":
        setDeleteModalError("");
        setDeleteModal({ order });
        return;
      case "edit-shipping":
        navigate(`/sales/order/${order.id}/loading-sheet`);
        return;
      case "print-invoice":
        window.open(
          `/sales/order/${order.id}/view`,
          "_blank",
          "noopener,noreferrer",
        );
        return;
      case "package-slip":
        navigate(`/sales/order/${order.id}/loading-sheet`);
        return;
      case "view-payments":
        toast("View payments is not available yet.");
        return;
      case "sell-return":
        toast("Sell return is not available yet.");
        return;
      case "invoice-url":
        try {
          const invoiceUrl = `${window.location.origin}/sales/order/${order.id}/view`;
          await navigator.clipboard.writeText(invoiceUrl);
          toast.success("Invoice URL copied to clipboard.");
        } catch {
          toast.error("Unable to copy the invoice URL.");
        }
        return;
      case "new-sale-notification":
        toast("New sale notification is not available yet.");
        return;
      default:
        return;
    }
  };

  const saveStatus = async () => {
    if (!statusModal) return;
    try {
      await updateSaleOrderStatus(statusModal.order.id, {
        status: nextStatus,
        reserve_order_items: reserveOrderItems,
      });
      toast.success("Sale status updated.");
      setStatusModal(null);
      await loadSalesOrders({
        location_id:
          filters.locationId === "all" ? undefined : filters.locationId,
        customer_id:
          filters.customerId === "all" ? undefined : filters.customerId,
        status: filters.status === "all" ? undefined : filters.status,
        shipping_status:
          filters.shippingStatus === "all" ? undefined : filters.shippingStatus,
        date_from: format(filters.dateRange.from, "yyyy-MM-dd"),
        date_to: format(filters.dateRange.to, "yyyy-MM-dd"),
        search_query: searchInput.trim() || undefined,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to update sale status.";
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;

    const canDelete =
      !deleteModal.order.saleId &&
      deleteModal.order.status !== "ready_for_shipment" &&
      deleteModal.order.status !== "completed";
    if (!canDelete) {
      const message = "This sale is already finalized and cannot be deleted.";
      setDeleteModalError(message);
      toast.error(message);
      return;
    }

    setDeleteSaving(true);
    setDeleteModalError("");

    try {
      const response = await deleteSaleOrder(deleteModal.order.id);
      toast.success(response.message || "Sale deleted successfully.");
      setDeleteModal(null);
      await loadSalesOrders({
        location_id:
          filters.locationId === "all" ? undefined : filters.locationId,
        customer_id:
          filters.customerId === "all" ? undefined : filters.customerId,
        status: filters.status === "all" ? undefined : filters.status,
        shipping_status:
          filters.shippingStatus === "all" ? undefined : filters.shippingStatus,
        date_from: format(filters.dateRange.from, "yyyy-MM-dd"),
        date_to: format(filters.dateRange.to, "yyyy-MM-dd"),
        search_query: searchInput.trim() || undefined,
      });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Unable to delete sale.";
      setDeleteModalError(message);
      toast.error(message);
    } finally {
      setDeleteSaving(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      locationId: "all",
      customerId: "all",
      status: "all",
      shippingStatus: "all",
      dateRange: {
        from: startOfYear(new Date()),
        to: new Date(),
      },
      searchQuery: "",
    });
    setSearchInput("");
    setIsFilterExpanded(true);
  };

  const closeDeleteModal = () => {
    setDeleteModal(null);
    setDeleteModalError("");
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card/95 p-5 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-sm border border-border bg-background p-2.5 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">Sales</h1>
                <Badge
                  label={`${stats.totalOrders} sales`}
                  tone="bg-slate-100 text-slate-700 border-slate-300"
                />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Track customer sales, reserve stock, and finalize records when
                the sale reaches shipment or completion.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/sales/order/create")}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              New Sale
            </button>
            <button
              type="button"
              onClick={() =>
                void loadSalesOrders({
                  location_id:
                    filters.locationId === "all"
                      ? undefined
                      : filters.locationId,
                  customer_id:
                    filters.customerId === "all"
                      ? undefined
                      : filters.customerId,
                  status: filters.status === "all" ? undefined : filters.status,
                  shipping_status:
                    filters.shippingStatus === "all"
                      ? undefined
                      : filters.shippingStatus,
                  date_from: format(filters.dateRange.from, "yyyy-MM-dd"),
                  date_to: format(filters.dateRange.to, "yyyy-MM-dd"),
                  search_query: searchInput.trim() || undefined,
                })
              }
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
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
                  setFormError("");
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
          <StatCard
            title="Grand Total"
            value={formatMoney(stats.grandTotal)}
            icon={Building2}
            accent="blue"
          />
          <StatCard
            title="Paid"
            value={formatMoney(stats.paid)}
            icon={CheckCircle2}
            accent="emerald"
          />
          <StatCard
            title="Balance Due"
            value={formatMoney(stats.balance)}
            icon={Package}
            accent="amber"
          />
          <StatCard
            title="Loaded Sales"
            value={String(stats.totalOrders)}
            icon={Users}
            accent="purple"
          />
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setIsFilterExpanded((prev) => !prev)}
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground"
            >
              <Filter className="h-4 w-4" />
              Filters
              {isFilterExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          </div>

          {isFilterExpanded ? (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-6">
                <label className="space-y-1.5 xl:col-span-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Search
                  </span>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                      placeholder="Search by sale no, customer, phone or location"
                      className="w-full rounded-xl border border-border bg-background py-3 pl-9 pr-4 text-sm outline-none focus:border-primary"
                    />
                  </div>
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    Location
                  </span>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <select
                      value={filters.locationId}
                      onChange={(event) =>
                        setFilters((current) => ({
                          ...current,
                          locationId: event.target.value,
                        }))
                      }
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
                  <span className="text-xs font-medium text-muted-foreground">
                    Customer
                  </span>
                  <div className="relative">
                    <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <select
                      value={filters.customerId}
                      onChange={(event) =>
                        setFilters((current) => ({
                          ...current,
                          customerId: event.target.value,
                        }))
                      }
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
                  <span className="text-xs font-medium text-muted-foreground">
                    Sale Status
                  </span>
                  <div className="relative">
                    <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <select
                      value={filters.status}
                      onChange={(event) =>
                        setFilters((current) => ({
                          ...current,
                          status: event.target.value as FilterState["status"],
                        }))
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
                  <span className="text-xs font-medium text-muted-foreground">
                    Shipping Status
                  </span>
                  <div className="relative">
                    <Truck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <select
                      value={filters.shippingStatus}
                      onChange={(event) =>
                        setFilters((current) => ({
                          ...current,
                          shippingStatus: event.target
                            .value as FilterState["shippingStatus"],
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

              <div>
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

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
                <p className="text-sm text-muted-foreground">
                  Showing{" "}
                  <span className="font-medium text-foreground">
                    {filteredOrders.length}
                  </span>{" "}
                  sales in the current filter set
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-border">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("analytics")}
              className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === "analytics"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("list")}
              className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === "list"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
              }`}
            >
              <Activity className="h-4 w-4" />
              All Sales
              <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                {stats.totalOrders}
              </span>
            </button>
          </div>
          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <span className="inline-flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              {stats.totalOrders} filtered sales
            </span>
          </div>
        </div>

        {activeTab === "analytics" ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Average Sale Value"
                value={formatMoney(analytics.averageOrderValue)}
                icon={TrendingUp}
                accent="primary"
              />
              <StatCard
                title="Sale Count"
                value={String(analytics.totalOrders)}
                icon={BarChart3}
                accent="blue"
              />
              <StatCard
                title="Total Revenue"
                value={formatMoney(analytics.grandTotal)}
                icon={PieChartIcon}
                accent="emerald"
              />
              <StatCard
                title="Outstanding Balance"
                value={formatMoney(analytics.balance)}
                icon={Clock3}
                accent="amber"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <ChartCard
                title="Sales by Month"
                description="Monthly sales volume across the current filters."
                icon={BarChart3}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={analytics.monthlyOrders}
                    margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(148,163,184,0.25)"
                    />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                    />
                    <Tooltip formatter={(value) => [value, "Sales"]} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard
                title="Revenue by Month"
                description="Sales value trend within the selected date range."
                icon={TrendingUp}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={analytics.monthlyRevenue}
                    margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="salesRevenueGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#22c55e"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor="#22c55e"
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(148,163,184,0.25)"
                    />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      tickFormatter={(value) => `KSh ${Number(value) / 1000}k`}
                    />
                    <Tooltip
                      formatter={(value) => [
                        formatMoney(Number(value) || 0),
                        "Revenue",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#22c55e"
                      strokeWidth={3}
                      fill="url(#salesRevenueGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard
                title="Sale Status Mix"
                description="Breakdown of sale statuses in the current result set."
                icon={PieChartIcon}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.statusDistribution}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {analytics.statusDistribution.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={
                            ANALYTICS_COLORS[index % ANALYTICS_COLORS.length]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard
                title="Shipping Status Mix"
                description="How far each sale has progressed through shipping."
                icon={Truck}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.shippingDistribution}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {analytics.shippingDistribution.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={
                            ANALYTICS_COLORS[
                              (index + 2) % ANALYTICS_COLORS.length
                            ]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard
                title="Revenue by Location"
                description="Top locations ranked by sale value."
                icon={Building2}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics.locationPerformance}
                    layout="vertical"
                    margin={{ top: 10, right: 20, left: 30, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(148,163,184,0.25)"
                    />
                    <XAxis
                      type="number"
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      width={110}
                    />
                    <Tooltip
                      formatter={(value) => [
                        formatMoney(Number(value) || 0),
                        "Revenue",
                      ]}
                    />
                    <Bar
                      dataKey="value"
                      radius={[0, 10, 10, 0]}
                      fill="#8b5cf6"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard
                title="Top Customers"
                description="Customers with the highest sales value."
                icon={Users}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics.topCustomers}
                    layout="vertical"
                    margin={{ top: 10, right: 20, left: 30, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(148,163,184,0.25)"
                    />
                    <XAxis
                      type="number"
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      width={120}
                    />
                    <Tooltip
                      formatter={(value) => [
                        formatMoney(Number(value) || 0),
                        "Revenue",
                      ]}
                    />
                    <Bar
                      dataKey="value"
                      radius={[0, 10, 10, 0]}
                      fill="#14b8a6"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-sm border border-border bg-card shadow-sm">
            <div className="border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Sales</h2>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Ready for shipment and completed sales will convert into
                finalized records and affect inventory batches.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-surface-alt/60">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="min-w-[170px] px-5 py-4">Date</th>
                    <th className="min-w-[280px] px-5 py-4">Customer Name</th>
                    <th className="px-5 py-4">Contact Number</th>
                    <th className="px-5 py-4">Sale No</th>
                    <th className="px-5 py-4">Location</th>
                    <th className="min-w-[170px] px-5 py-4">Sale Status</th>
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
                      <td
                        colSpan={12}
                        className="px-5 py-16 text-center text-sm text-muted-foreground"
                      >
                        <div className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading sales...
                        </div>
                      </td>
                    </tr>
                  ) : salesOrders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={12}
                        className="px-5 py-16 text-center text-sm text-muted-foreground"
                      >
                        No sales records match the current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="align-top hover:bg-surface-alt/40"
                      >
                        <td className="min-w-[170px] px-5 py-4 text-sm text-foreground">
                          {formatDateTime(order.saleDate)}
                        </td>
                        <td className="min-w-[280px] px-5 py-4 text-sm font-medium text-foreground">
                          <div className="max-w-[320px] truncate">
                            {order.customerName || "—"}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-muted-foreground">
                          {order.customerPhone || "—"}
                        </td>
                        <td className="px-5 py-4 text-sm text-foreground">
                          {order.referenceNumber || "—"}
                        </td>
                        <td className="px-5 py-4 text-sm text-muted-foreground">
                          {order.locationName || "—"}
                        </td>
                        <td className="min-w-[170px] px-5 py-4">
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
                        <td className="px-5 py-4 text-right text-sm text-foreground">
                          {order.itemsCount}
                        </td>
                        <td className="px-5 py-4 text-right text-sm font-medium text-foreground">
                          {formatMoney(order.grandTotal)}
                        </td>
                        <td className="px-5 py-4 text-right text-sm text-foreground">
                          {formatMoney(order.paidAmount)}
                        </td>
                        <td className="px-5 py-4 text-right text-sm font-medium text-foreground">
                          {formatMoney(order.balanceDue)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="relative flex items-center justify-start">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                openActionMenu(order, event.currentTarget);
                              }}
                              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface-alt hover:text-foreground"
                              aria-label="Open sale actions"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            {actionMenuOpenFor === order.id &&
                            actionMenuPosition
                              ? createPortal(
                                  <div
                                    ref={actionMenuRef}
                                    className="fixed z-50 w-60 rounded-2xl border border-border bg-background p-2 shadow-2xl shadow-black/10"
                                    style={{
                                      top: actionMenuPosition.top,
                                      left: actionMenuPosition.left,
                                      maxHeight: "calc(100vh - 16px)",
                                      overflowY: "auto",
                                    }}
                                  >
                                    <div className="px-3 py-2">
                                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        Actions for
                                      </p>
                                      <p className="truncate text-sm font-medium text-foreground">
                                        {order.referenceNumber || "this sale"}
                                      </p>
                                    </div>
                                    <div className="divide-y divide-border p-1">
                                      <ActionMenuItem
                                        icon={Eye}
                                        label="View"
                                        onClick={() =>
                                          void handleOrderAction("view", order)
                                        }
                                      />
                                      <ActionMenuItem
                                        icon={Edit}
                                        label="Edit"
                                        onClick={() =>
                                          void handleOrderAction("edit", order)
                                        }
                                      />
                                      <ActionMenuItem
                                        icon={Trash2}
                                        label="Delete"
                                        destructive
                                        onClick={() =>
                                          void handleOrderAction(
                                            "delete",
                                            order,
                                          )
                                        }
                                      />
                                      <ActionMenuItem
                                        icon={FileText}
                                        label="Edit Shipping"
                                        onClick={() =>
                                          void handleOrderAction(
                                            "edit-shipping",
                                            order,
                                          )
                                        }
                                      />
                                      <ActionMenuItem
                                        icon={FileText}
                                        label="Print Invoice"
                                        onClick={() =>
                                          void handleOrderAction(
                                            "print-invoice",
                                            order,
                                          )
                                        }
                                      />
                                      <ActionMenuItem
                                        icon={FileText}
                                        label="Package Slip"
                                        onClick={() =>
                                          void handleOrderAction(
                                            "package-slip",
                                            order,
                                          )
                                        }
                                      />
                                      <ActionMenuItem
                                        icon={Eye}
                                        label="View Payments"
                                        onClick={() =>
                                          void handleOrderAction(
                                            "view-payments",
                                            order,
                                          )
                                        }
                                      />
                                      <ActionMenuItem
                                        icon={BadgeCheck}
                                        label="Sell Return"
                                        onClick={() =>
                                          void handleOrderAction(
                                            "sell-return",
                                            order,
                                          )
                                        }
                                      />
                                      <ActionMenuItem
                                        icon={Columns3}
                                        label="Invoice URL"
                                        onClick={() =>
                                          void handleOrderAction(
                                            "invoice-url",
                                            order,
                                          )
                                        }
                                      />
                                      <ActionMenuItem
                                        icon={RefreshCw}
                                        label="New Sale Notification"
                                        onClick={() =>
                                          void handleOrderAction(
                                            "new-sale-notification",
                                            order,
                                          )
                                        }
                                      />
                                    </div>
                                  </div>,
                                  document.body,
                                )
                              : null}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {saleOrderStatusesLoading ? (
        <div className="mx-auto w-full max-w-7xl px-5 pt-2 text-sm text-muted-foreground">
          Loading sale statuses...
        </div>
      ) : null}

      {statusModal ? (
        <StatusModal
          order={statusModal.order}
          status={nextStatus}
          reserveOrderItems={reserveOrderItems}
          onClose={() => setStatusModal(null)}
          onStatusChange={setNextStatus}
          onSave={() => void saveStatus()}
          saving={isSaving}
          currentStatusDefinition={
            currentStatusDefinitionByCode.get(statusModal.order.status) ?? null
          }
          statuses={saleOrderStatuses}
        />
      ) : null}

      {deleteModal ? (
        <DeleteModal
          order={deleteModal.order}
          onClose={closeDeleteModal}
          onDelete={() => void handleDelete()}
          deleting={deleteSaving || isSaving}
        />
      ) : null}
    </div>
  );
}

function DeleteModal({
  order,
  onClose,
  onDelete,
  deleting,
}: {
  order: SaleListItem;
  onClose: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const canDelete =
    !order.saleId &&
    order.status !== "ready_for_shipment" &&
    order.status !== "completed";
  const warningText = canDelete
    ? "This will remove the sale, its line items, and any reserved stock allocations."
    : "This sale is already finalized, so it cannot be deleted.";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl border border-border bg-background p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-destructive">
              Delete sale
            </p>
            <h3 className="mt-1 text-lg font-semibold text-foreground">
              {order.referenceNumber || order.id}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {order.customerName || "Customer"}
            </p>
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

        <div className="mt-5 space-y-3">
          <div className="rounded-2xl border border-border bg-surface-alt/40 px-4 py-3 text-sm text-foreground">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">Status:</span>
              <Badge
                label={statusLabel(order.status)}
                tone={statusClasses(order.status)}
              />
              <span className="font-medium">Total:</span>
              <span>{formatMoney(order.grandTotal)}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{warningText}</p>
          </div>

          {!canDelete ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Finalized sales cannot be deleted because they are already part of
              the inventory and accounting history.
            </div>
          ) : null}
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
            onClick={onDelete}
            disabled={deleting || !canDelete}
            className="inline-flex items-center gap-2 rounded-xl bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Delete Sale
          </button>
        </div>
      </div>
    </div>
  );
}
