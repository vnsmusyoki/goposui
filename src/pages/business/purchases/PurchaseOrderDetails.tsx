import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Clock,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Printer,
  StickyNote,
  Truck,
} from 'lucide-react';
import { usePurchaseOrderDetails } from '@/hooks/business/purchases/usePurchaseOrderDetails';

const STATUS_TONE: Record<string, string> = {
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  blue: 'bg-sky-50 text-sky-700 border-sky-200',
  red: 'bg-rose-50 text-rose-700 border-rose-200',
};

function money(value: number) {
  return new Intl.NumberFormat('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function parseDateValue(value: string) {
  if (!value) return null;

  let normalized = value.trim();

  if (normalized.includes(' ')) {
    normalized = normalized.replace(' ', 'T');
  }

  normalized = normalized.replace(/(\.\d{3})\d+/, '$1');
  normalized = normalized.replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
  normalized = normalized.replace(/([+-]\d{2})$/, '$1:00');

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value: string) {
  const date = parseDateValue(value);
  return date ? format(date, 'dd MMM yyyy') : value || '-';
}

function formatDateTime(value: string) {
  const date = parseDateValue(value);
  return date ? format(date, 'dd MMM yyyy, p') : value || '-';
}

function formatActivityAction(value: string) {
  const normalized = value.trim().replace(/[_-]+/g, ' ');
  if (!normalized) return '-';
  return normalized
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function joinParts(parts: Array<string | undefined | null>) {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(', ');
}

function firstNonEmpty(...values: Array<string | undefined | null>) {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return '-';
}

function formatPhone(phone?: string, fallback?: string) {
  return firstNonEmpty(phone, fallback ?? '');
}

function StatusBadge({ label, tone }: { label: string; tone: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${
        STATUS_TONE[tone] ?? STATUS_TONE.blue
      }`}
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

export default function PurchaseOrderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { purchaseOrder, loading, error, fetchPurchaseOrder, clearError } = usePurchaseOrderDetails();
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    if (!id) return;
    void fetchPurchaseOrder(id).catch(() => undefined);
  }, [fetchPurchaseOrder, id]);

  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const detail = purchaseOrder?.purchaseOrder;
  const supplier = purchaseOrder?.supplier;
  const business = purchaseOrder?.business;
  const location = purchaseOrder?.location;
  const items = purchaseOrder?.items ?? [];
  const activities = purchaseOrder?.activities ?? [];
  const additionalExpenses = detail?.additionalExpenses ?? [];

  const lineItems = useMemo(() => {
    return items.map((item) => {
      const discountFactor = 1 - Number(item.discountPercentage ?? 0) / 100;
      const unitCostAfterDiscount = Number(item.unitCostBeforeDiscount ?? 0) * discountFactor;
      const subtotalBeforeTax = unitCostAfterDiscount * Number(item.orderQuantity ?? 0);
      const unitCostBeforeTax = Number(item.unitCostBeforeTax ?? unitCostAfterDiscount);
      const subtotal = Number(item.lineCost ?? unitCostBeforeTax * Number(item.orderQuantity ?? 0));
      return {
        ...item,
        unitCostAfterDiscount,
        subtotalBeforeTax,
        unitCostBeforeTax,
        subtotal,
      };
    });
  }, [items]);

  const totals = useMemo(() => {
    return lineItems.reduce(
      (acc, item) => {
        acc.netTotal += item.unitCostBeforeDiscount * item.orderQuantity;
        acc.totalDiscount += item.unitCostBeforeDiscount * item.orderQuantity * (item.discountPercentage / 100);
        acc.totalTax += item.taxAmount;
        acc.subtotal += item.subtotal;
        return acc;
      },
      { netTotal: 0, totalDiscount: 0, totalTax: 0, subtotal: 0 },
    );
  }, [lineItems]);

  const deliveryCharges = Number(detail?.deliveryCharges ?? 0);
  const totalExpenses = additionalExpenses.reduce((sum, expense) => sum + Number(expense.amount ?? 0), 0);
  const purchaseTotal = Number(detail?.totalAmount ?? totals.subtotal + deliveryCharges + totalExpenses - Number(detail?.orderDiscountAmount ?? 0));

  const handlePrint = () => {
    setPrinting(true);
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 50);
  };

  if (loading && !purchaseOrder) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span>Loading purchase order...</span>
        </div>
      </div>
    );
  }

  if (error && !purchaseOrder) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <div className="max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-foreground">Failed to load purchase order</h1>
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
    <div className="min-h-screen bg-background  text-foreground print:bg-white print:py-0">
      <div className="mx-auto w-full max-w-[1180px]  print:max-w-none print:px-0">
        <div className="overflow-hidden  bg-card shadow-sm print:shadow-none">
          <div className="px-6 py-6 text-muted-foreground sm:px-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                  Purchase Order Details
                </p>
                <h1 className="mt-1.5 text-2xl font-semibold tracking-tight sm:text-3xl">
                  {detail?.referenceNumber ?? '-'}
                </h1>
              </div>
              <div className="rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-2.5 text-right">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                  Created On
                </p>
                <p className="mt-0.5 text-sm font-medium text-muted-foreground">
                  {formatDateTime(detail?.createdAt ?? detail?.orderDate ?? '')}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 divide-y divide-border border-b border-border md:grid-cols-3 md:divide-x md:divide-y-0">
            <div className="px-6 py-6 sm:px-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Supplier
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">{supplier?.name ?? '-'}</p>
              <div className="mt-3 space-y-2">
                <FieldRow icon={Mail}>{supplier?.email || '-'}</FieldRow>
                <FieldRow icon={Phone}>{formatPhone(supplier?.phone)}</FieldRow>
                <FieldRow icon={MapPin}>{supplier?.address || '-'}</FieldRow>
              </div>
            </div>

            <div className="px-6 py-6 sm:px-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Business
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">{business?.name ?? '-'}</p>
              <p className="text-sm text-muted-foreground">{business?.branchName || location?.name || '-'}</p>
              <div className="mt-3 space-y-2">
                <FieldRow icon={Mail}>{business?.email || '-'}</FieldRow>
                <FieldRow icon={Phone}>{formatPhone(business?.phone)}</FieldRow>
                <FieldRow icon={MapPin}>{business?.branchAddress || location?.address || '-'}</FieldRow>
              </div>
            </div>

            <div className="px-6 py-6 sm:px-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Order Summary
              </p>
              <dl className="mt-3 space-y-2.5 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Reference No.</dt>
                  <dd className="font-medium text-foreground">{detail?.referenceNumber ?? '-'}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Date</dt>
                  <dd className="font-medium text-foreground">{formatDate(detail?.orderDate ?? '')}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 pt-1.5">
                  <dt className="text-muted-foreground">Purchase Status</dt>
                  <dd>
                    <StatusBadge
                      label={detail?.status || 'draft'}
                      tone={detail?.status === 'approved' || detail?.status === 'completed' ? 'green' : detail?.status === 'cancelled' ? 'red' : 'amber'}
                    />
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Order Status</dt>
                  <dd>
                    <StatusBadge
                      label={detail?.deliveryStatus || 'pending_delivery'}
                      tone={detail?.deliveryStatus === 'delivered' ? 'green' : detail?.deliveryStatus === 'in_transit' ? 'blue' : 'amber'}
                    />
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Payment Status</dt>
                  <dd>
                    <StatusBadge
                      label={detail?.paymentStatus || 'unpaid'}
                      tone={detail?.paymentStatus === 'paid' ? 'green' : detail?.paymentStatus === 'partially_paid' ? 'amber' : 'red'}
                    />
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="px-6 py-7 sm:px-8">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Order Items
            </p>
            <div className="overflow-x-auto rounded-xs">
              <table className="min-w-[1180px] w-full border-collapse text-sm">
                <thead className="bg-surface-alt/60 text-left text-[10.5px] border-b border-border font-semibold uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="w-10 px-3 py-2.5">#</th>
                    <th className="min-w-[180px] px-3 py-2.5">Product Name</th>
                    <th className="px-3 py-2.5">SKU</th>
                    <th className="px-3 py-2.5 text-right">Qty Ordered</th>
                    <th className="px-3 py-2.5 text-right">Qty Received</th>
                    <th className="px-3 py-2.5 text-right">Unit Cost (bef. disc.)</th>
                    <th className="px-3 py-2.5 text-right">Discount %</th>
                    <th className="px-3 py-2.5 text-right">Unit Cost (bef. tax)</th>
                    <th className="px-3 py-2.5 text-right">Subtotal (bef. tax)</th>
                    <th className="px-3 py-2.5 text-right">Tax</th>
                    <th className="px-3 py-2.5 text-right">Unit Cost (aft. tax)</th>
                    <th className="px-3 py-2.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {lineItems.map((item, index) => (
                    <tr key={item.id} className="text-foreground">
                      <td className="px-3 py-2.5 text-muted-foreground">{index + 1}</td>
                      <td className="px-3 py-2.5 font-medium">{item.productName}</td>
                      <td className="px-3 py-2.5 font-mono text-muted-foreground">{item.sku || '-'}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{money(item.orderQuantity)}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">
                        {money(item.itemsReceived ?? item.receivedQuantity ?? 0)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono">{money(item.unitCostBeforeDiscount)}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{money(item.discountPercentage)}%</td>
                      <td className="px-3 py-2.5 text-right font-mono">{money(item.unitCostBeforeTax)}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{money(item.subtotalBeforeTax)}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{money(item.taxAmount)}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{money(item.unitCostBeforeTax)}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-semibold text-foreground">
                        {money(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Expenses
              </p>
              <div className="overflow-hidden rounded-sm">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-surface-alt/60 text-left text-[10.5px] font-semibold border-b border-border uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5">Expense</th>
                      <th className="px-4 py-2.5 text-right">Amount</th>
                      <th className="px-4 py-2.5 text-right">Sort Order</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {additionalExpenses.length === 0 ? (
                      <tr>
                        <td className="px-4 py-6 text-sm text-muted-foreground" colSpan={3}>
                          No additional expenses were added to this purchase order.
                        </td>
                      </tr>
                    ) : (
                      additionalExpenses.map((expense) => (
                        <tr key={`${expense.sortOrder}-${expense.name}`} className="align-top">
                          <td className="px-4 py-2.5 font-medium text-foreground">{expense.name}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-foreground">KES {money(expense.amount)}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">{expense.sortOrder}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <div className="w-full max-w-[340px] rounded-lg border border-border bg-background p-5">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Net Total Amount</span>
                    <span className="font-mono text-foreground">KES {money(totals.netTotal)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-mono text-rose-600">- KES {money(totals.totalDiscount)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Purchase Tax</span>
                    <span className="font-mono text-foreground">+ KES {money(totals.totalTax)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Delivery Charges</span>
                    <span className="font-mono text-foreground">+ KES {money(deliveryCharges)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Total Expenses</span>
                    <span className="font-mono text-foreground">+ KES {money(totalExpenses)}</span>
                  </div>
                  {detail?.orderDiscountAmount ? (
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Order Discount</span>
                      <span className="font-mono text-rose-600">- KES {money(detail.orderDiscountAmount)}</span>
                    </div>
                  ) : null}
                </div>
                <div className="mt-3 flex justify-between border-t border-border pt-3">
                  <span className="text-sm font-semibold text-foreground">Purchase Total</span>
                  <span className="font-mono text-base font-semibold text-primary">KES {money(purchaseTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 divide-y divide-border  md:grid-cols-2 md:divide-x md:divide-y-0">
            <div className="px-6 py-6 sm:px-8">
              <div className="mb-3 flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Delivery Details
                </p>
              </div>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Delivery Address</dt>
                  <dd className="text-right text-foreground">
                    {detail?.deliveryAddress || location?.address || '-'}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Expected By</dt>
                  <dd className="font-mono text-right text-foreground">{formatDate(detail?.deliveryDate ?? '')}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Delivery Document</dt>
                  <dd className="text-right text-foreground">
                    {detail?.deliveryDocumentName || 'Not provided'}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Contact</dt>
                  <dd className="text-right text-foreground">
                    {joinParts([location?.phone, supplier?.phone]) || '-'}
                  </dd>
                </div>
              </dl>
            </div>
            <div className="px-6 py-6 sm:px-8">
              <div className="mb-3 flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-primary" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Additional Notes
                </p>
              </div>
              <p className="text-sm leading-relaxed text-foreground">
                {detail?.notes || 'No notes added for this purchase order.'}
              </p>
            </div>
          </div>

          <div className="border-t border-border px-6 py-7 sm:px-8">
            <div className="mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Activities
              </p>
            </div>
            <div className="overflow-hidden ">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-surface-alt/60 text-left text-[10.5px]  border-b border-border font-semibold uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="w-[170px] px-4 py-2.5">Date</th>
                    <th className="w-[220px] px-4 py-2.5">Action</th>
                    <th className="w-[160px] px-4 py-2.5">Actioned By</th>
                    <th className="px-4 py-2.5">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {activities.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-sm text-muted-foreground" colSpan={4}>
                        No activity history available yet.
                      </td>
                    </tr>
                  ) : (
                    activities.map((activity) => (
                      <tr key={activity.id} className="align-top">
                        <td className="px-4 py-2.5 font-mono text-muted-foreground">
                          {formatDateTime(activity.actionDate)}
                        </td>
                        <td className="px-4 py-2.5 font-medium text-foreground">
                          {formatActivityAction(activity.action)}
                        </td>
                        <td className="px-4 py-2.5 text-foreground">
                          {activity.actionedBy?.name || 'System'}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {activity.note || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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
            <button
              type="button"
              onClick={handlePrint}
              disabled={printing}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Printer className="h-4 w-4" />
              {printing ? 'Preparing...' : 'Print'}
            </button>
          </div>
        </div>

        {error && purchaseOrder ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}
