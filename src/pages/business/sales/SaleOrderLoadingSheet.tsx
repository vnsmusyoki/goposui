import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Printer,
  StickyNote,
} from "lucide-react";
import { useSalesOrderDetails } from "@/hooks/business/sales/useSalesOrderDetails";
import {
  useSalesOrderStatuses,
  type SalesOrderStatusDefinition,
} from "@/hooks/business/sales/useSalesOrderStatuses";
import {
  type SaleOrderStatus,
  useSalesOrders,
} from "@/hooks/business/sales/useSalesOrders";
import toast from "react-hot-toast";

function money(value: number) {
  return new Intl.NumberFormat("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function parseDateValue(value: string) {
  if (!value) return null;

  let normalized = value.trim();

  if (normalized.includes(" ")) {
    normalized = normalized.replace(" ", "T");
  }

  normalized = normalized.replace(/(\.\d{3})\d+/, "$1");
  normalized = normalized.replace(/([+-]\d{2})(\d{2})$/, "$1:$2");
  normalized = normalized.replace(/([+-]\d{2})$/, "$1:00");

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value: string) {
  const date = parseDateValue(value);
  return date ? format(date, "dd MMM yyyy") : value || "-";
}

function formatDateTime(value: string) {
  const date = parseDateValue(value);
  return date ? format(date, "dd MMM yyyy, p") : value || "-";
}

function stripHtml(value?: string | null) {
  const input = value?.trim();
  if (!input) return "-";

  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return (
      input
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim() || "-"
    );
  }

  const document = new DOMParser().parseFromString(input, "text/html");
  const text = document.body.textContent?.replace(/\s+/g, " ").trim();
  return text || "-";
}

function joinParts(parts: Array<string | undefined | null>) {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(", ");
}

function firstNonEmpty(...values: Array<string | undefined | null>) {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return "-";
}

function formatPhone(phone?: string, fallback?: string) {
  return firstNonEmpty(phone, fallback ?? "");
}

function humanizeStatusCode(value: string) {
  const normalized = value.trim().replace(/[_-]+/g, " ");
  if (!normalized) return "-";
  return normalized
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "green" | "amber" | "blue" | "red";
}) {
  const toneClasses: Record<typeof tone, string> = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-sky-50 text-sky-700 border-sky-200",
    red: "bg-rose-50 text-rose-700 border-rose-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${toneClasses[tone]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label.toUpperCase()}
    </span>
  );
}

function FieldRow({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="leading-snug">{children}</span>
    </div>
  );
}

function CheckBox({ checked = false }: { checked?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex h-4 w-4 items-center justify-center rounded-[3px] border text-[10px] font-bold ${
        checked
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-transparent"
      }`}
    >
      ✓
    </span>
  );
}

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "green" | "amber" | "blue" | "red";
}) {
  const toneClasses: Record<typeof tone, string> = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-sky-50 text-sky-700 border-sky-200",
    red: "bg-rose-50 text-rose-700 border-rose-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${toneClasses[tone]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label.toUpperCase()}
    </span>
  );
}

function StatusModal({
  orderNumber,
  currentStatus,
  currentStatusDefinition,
  nextStatus,
  statuses,
  saving,
  onClose,
  onChange,
  onSave,
}: {
  orderNumber: string;
  currentStatus: string;
  currentStatusDefinition?: SalesOrderStatusDefinition | null;
  nextStatus: SaleOrderStatus;
  statuses: SalesOrderStatusDefinition[];
  saving: boolean;
  onClose: () => void;
  onChange: (status: SaleOrderStatus) => void;
  onSave: () => void;
}) {
  const isCompleted = currentStatus === "completed";
  const currentSortOrder = currentStatusDefinition?.sortOrder ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
      <div className="w-full max-w-xl rounded-sm border border-border bg-background p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Update order status
            </p>
            <h3 className="mt-1 text-xl font-semibold text-foreground">
              {orderNumber}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {isCompleted
                ? "This order is already completed and cannot be changed."
                : "Choose the next status for this sales order."}
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
                value={nextStatus}
                onChange={(event) =>
                  onChange(event.target.value as SaleOrderStatus)
                }
                disabled={isCompleted}
                className="w-full appearance-none rounded-xl border border-border bg-background px-4 py-3 pr-10 text-sm outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {statuses.map((status) => (
                  <option
                    key={status.code}
                    value={status.code}
                    disabled={status.sortOrder < currentSortOrder}
                  >
                    {status.name}
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
                  humanizeStatusCode(currentStatus)}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-surface-alt/40 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Requires further action
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {currentStatusDefinition?.requiresFurtherAction ? "Yes" : "No"}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface-alt/40 px-4 py-3 text-sm text-muted-foreground">
            {statuses.find((status) => status.code === nextStatus)
              ?.whatHappens ||
              "Completed is the final status. Once an order reaches completed, its status can no longer be changed here."}
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
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SaleOrderLoadingSheet() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateSaleOrderStatus, isSaving } = useSalesOrders();
  const { statuses: saleOrderStatuses, loading: saleOrderStatusesLoading } =
    useSalesOrderStatuses();
  const { salesOrder, loading, error, fetchSalesOrder, clearError } =
    useSalesOrderDetails();
  const [printing, setPrinting] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [nextStatus, setNextStatus] =
    useState<SaleOrderStatus>("ready_for_shipment");

  useEffect(() => {
    if (!id) return;
    void fetchSalesOrder(id).catch(() => undefined);
  }, [fetchSalesOrder, id]);

  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const detail = salesOrder?.saleOrder;
  const customer = salesOrder?.customer;
  const business = salesOrder?.business;
  const location = salesOrder?.location;
  const items = salesOrder?.items ?? [];

  const lineItems = useMemo(() => {
    return items.map((item) => ({
      ...item,
      quantity: Number(item.quantity ?? 0),
      unitPrice: Number(item.unitPrice ?? 0),
      lineTotal: Number(item.lineTotal ?? 0),
    }));
  }, [items]);

  const totalQuantity = useMemo(() => {
    return lineItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [lineItems]);

  const currentStatusDefinition = useMemo(
    () =>
      saleOrderStatuses.find((status) => status.code === detail?.status) ??
      null,
    [detail?.status, saleOrderStatuses],
  );
  const canUpdateStatus =
    Boolean(currentStatusDefinition) &&
    currentStatusDefinition?.code !== "completed";
  const statusLabel =
    currentStatusDefinition?.name ??
    humanizeStatusCode(detail?.status ?? "draft");
  const statusTone: "green" | "amber" | "blue" | "red" =
    detail?.status === "completed"
      ? "green"
      : detail?.status === "approved"
        ? "blue"
        : "amber";
  const isCompleted = detail?.status === "completed";

  const handlePrint = () => {
    setPrinting(true);
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 50);
  };

  const openStatusModal = () => {
    if (!detail || !canUpdateStatus) return;
    const currentSortOrder = currentStatusDefinition?.sortOrder ?? 0;
    const nextOption =
      saleOrderStatuses.find((status) => status.sortOrder > currentSortOrder) ??
      currentStatusDefinition ??
      null;
    setNextStatus(
      (nextOption?.code as SaleOrderStatus) ||
        (detail.status as SaleOrderStatus),
    );
    setStatusModalOpen(true);
  };

  const closeStatusModal = () => {
    if (isSaving) return;
    setStatusModalOpen(false);
  };

  const handleStatusSave = async () => {
    if (!id || !detail || isCompleted) return;

    try {
      await updateSaleOrderStatus(id, {
        status: nextStatus,
        reserve_order_items: Boolean(detail.reserveOrderItems),
      });
      await fetchSalesOrder(id);
      setStatusModalOpen(false);
      toast.success("Sales order status updated.");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to update sales order status.";
      toast.error(message);
    }
  };

  if (loading && !salesOrder) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span>Loading loading sheet...</span>
        </div>
      </div>
    );
  }

  if (error && !salesOrder) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <div className="max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-foreground">
            Failed to load loading sheet
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface-alt"
          >
            <ArrowLeft className="h-4 w-4" />
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground print:bg-white print:py-0">
      <div className="mx-auto w-full max-w-[1180px] print:max-w-none print:px-0">
        <div className="overflow-hidden bg-card shadow-sm print:shadow-none">
          <div className="border-b border-border px-6 py-6 sm:px-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="mt-0.5 inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-3.5 text-sm font-medium text-foreground transition hover:bg-surface-alt"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                    Sales Loading Sheet
                  </p>
                  <h1 className="mt-1.5 text-2xl font-semibold tracking-tight sm:text-3xl">
                    {detail?.referenceNumber ?? "-"}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                    Use this sheet to pick, check, and load the customer order
                    before dispatch.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <StatusBadge label={statusLabel} tone={statusTone} />
                    {!canUpdateStatus ? (
                      <span className="text-xs font-medium text-muted-foreground">
                        This order is finalized, so status changes are disabled.
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={openStatusModal}
                        className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-3.5 py-2 text-sm font-medium text-primary transition hover:bg-primary/15"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Update order status
                      </button>
                    )}
                  </div>
                  {saleOrderStatusesLoading ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Loading status definitions...
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-2.5 text-right">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                  Generated
                </p>
                <p className="mt-0.5 text-sm font-medium text-muted-foreground">
                  {formatDateTime(new Date().toISOString())}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 divide-y divide-border border-b border-border md:grid-cols-3 md:divide-x md:divide-y-0">
            <div className="px-6 py-6 sm:px-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Customer
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">
                {customer?.name ?? "-"}
              </p>
              <div className="mt-3 space-y-2">
                <FieldRow icon={Mail}>{customer?.email || "-"}</FieldRow>
                <FieldRow icon={Phone}>{formatPhone(customer?.phone)}</FieldRow>
                <FieldRow icon={MapPin}>{customer?.address || "-"}</FieldRow>
              </div>
            </div>

            <div className="px-6 py-6 sm:px-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Business
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">
                {business?.name ?? "-"}
              </p>
              <p className="text-sm text-muted-foreground">
                {business?.branchName || location?.name || "-"}
              </p>
              <div className="mt-3 space-y-2">
                <FieldRow icon={Mail}>{business?.email || "-"}</FieldRow>
                <FieldRow icon={Phone}>{formatPhone(business?.phone)}</FieldRow>
                <FieldRow icon={MapPin}>
                  {business?.branchAddress || location?.address || "-"}
                </FieldRow>
              </div>
            </div>

            <div className="px-6 py-6 sm:px-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Order Summary
              </p>
              <dl className="mt-3 space-y-2.5 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Reference No.</dt>
                  <dd className="font-medium text-foreground">
                    {detail?.referenceNumber ?? "-"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Sale Date</dt>
                  <dd className="font-medium text-foreground">
                    {formatDate(detail?.saleDate ?? "")}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Order Status</dt>
                  <dd>
                    <StatusPill label={statusLabel} tone={statusTone} />
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Shipping Status</dt>
                  <dd>
                    <StatusPill
                      label={detail?.shippingStatus || "pending"}
                      tone={
                        detail?.shippingStatus === "completed"
                          ? "green"
                          : detail?.shippingStatus === "processing"
                            ? "blue"
                            : "amber"
                      }
                    />
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Reserve Items</dt>
                  <dd className="font-medium text-foreground">
                    {detail?.reserveOrderItems ? "Yes" : "No"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">
                    Requires Further Action
                  </dt>
                  <dd className="font-medium text-foreground">
                    {currentStatusDefinition?.requiresFurtherAction
                      ? "Yes"
                      : "No"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Total Quantity</dt>
                  <dd className="font-medium text-foreground">
                    {money(totalQuantity)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="px-6 py-7 sm:px-8">
            <div className="mb-3 flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-primary" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Loading Checklist
              </p>
            </div>
            <div className="overflow-x-auto rounded-xs">
              <table className="min-w-[1080px] w-full border-collapse text-sm">
                <thead className="border-b border-border bg-surface-alt/60 text-left text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="w-10 px-3 py-2.5">#</th>
                    <th className="min-w-[180px] px-3 py-2.5">Product Name</th>
                    <th className="px-3 py-2.5">SKU</th>
                    <th className="px-3 py-2.5">Unit</th>
                    <th className="px-3 py-2.5 text-right">Ordered</th>
                    <th className="px-3 py-2.5 text-center">Picked</th>
                    <th className="px-3 py-2.5 text-center">Checked</th>
                    <th className="px-3 py-2.5 text-center">Loaded</th>
                    <th className="px-3 py-2.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {lineItems.length === 0 ? (
                    <tr>
                      <td
                        className="px-4 py-6 text-sm text-muted-foreground"
                        colSpan={9}
                      >
                        No items available for this sales order.
                      </td>
                    </tr>
                  ) : (
                    lineItems.map((item, index) => (
                      <tr key={item.id} className="align-top text-foreground">
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {index + 1}
                        </td>
                        <td className="px-3 py-2.5 font-medium">
                          {item.productName}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-muted-foreground">
                          {item.sku || "-"}
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {item.unit || "-"}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono">
                          {money(item.quantity)}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <CheckBox />
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <CheckBox />
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <CheckBox />
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {item.batchTrackingEnabled
                            ? "Batch tracking enabled"
                            : "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex justify-end">
              <div className="w-full max-w-[360px] rounded-lg border border-border bg-background p-5">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Items</span>
                    <span className="font-mono text-foreground">
                      {lineItems.length}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">
                      Total Quantity
                    </span>
                    <span className="font-mono text-foreground">
                      {money(totalQuantity)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Grand Total</span>
                    <span className="font-mono text-foreground">
                      KES {money(Number(detail?.grandTotal ?? 0))}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex justify-between border-t border-border pt-3">
                  <span className="text-sm font-semibold text-foreground">
                    Dispatch Ready
                  </span>
                  <span className="font-mono text-base font-semibold text-primary">
                    {detail?.status === "completed" ? "Yes" : "Pending"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0">
            <div className="px-6 py-6 sm:px-8">
              <div className="mb-3 flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-primary" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Notes
                </p>
              </div>
              <p className="text-sm leading-relaxed text-foreground">
                {stripHtml(detail?.notes) ||
                  "No notes added for this sales order."}
              </p>
            </div>
            <div className="px-6 py-6 sm:px-8">
              <div className="mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Contact Details
                </p>
              </div>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Customer Phone</dt>
                  <dd className="text-right text-foreground">
                    {customer?.phone || "-"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Location Contact</dt>
                  <dd className="text-right text-foreground">
                    {joinParts([location?.phone, location?.email]) || "-"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Location Address</dt>
                  <dd className="text-right text-foreground">
                    {location?.address || "-"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface-alt/30 px-6 py-5 sm:px-8 print:hidden">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface-alt"
            >
              <ArrowLeft className="h-4 w-4" />
              Return
            </button>
            <div className="flex items-center gap-3">
              {canUpdateStatus ? (
                <button
                  type="button"
                  onClick={openStatusModal}
                  className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/15"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Update status
                </button>
              ) : null}
              <button
                type="button"
                onClick={handlePrint}
                disabled={printing}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Printer className="h-4 w-4" />
                {printing ? "Preparing..." : "Print"}
              </button>
            </div>
          </div>
        </div>

        {error && salesOrder ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        ) : null}

        {statusModalOpen && detail ? (
          <StatusModal
            orderNumber={detail.referenceNumber}
            currentStatus={detail.status}
            currentStatusDefinition={currentStatusDefinition}
            nextStatus={nextStatus}
            statuses={saleOrderStatuses}
            saving={isSaving}
            onClose={closeStatusModal}
            onChange={setNextStatus}
            onSave={handleStatusSave}
          />
        ) : null}
      </div>
    </div>
  );
}
