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
} from 'lucide-react';
import { useSalesOrderDetails } from '@/hooks/business/sales/useSalesOrderDetails';

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

function stripHtml(value?: string | null) {
  const input = value?.trim();
  if (!input) return '-';

  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return input.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || '-';
  }

  const document = new DOMParser().parseFromString(input, 'text/html');
  const text = document.body.textContent?.replace(/\s+/g, ' ').trim();
  return text || '-';
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

export default function SaleOrderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { salesOrder, loading, error, fetchSalesOrder, clearError } = useSalesOrderDetails();
  const [printing, setPrinting] = useState(false);

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
  const activities = salesOrder?.activities ?? [];

  const lineItems = useMemo(() => {
    return items.map((item) => {
      const quantity = Number(item.quantity ?? 0);
      const unitPrice = Number(item.unitPrice ?? 0);
      const discountAmount = Number(item.discountAmount ?? 0);
      const taxAmount = Number(item.taxAmount ?? 0);
      const lineTotal = Number(item.lineTotal ?? unitPrice * quantity);
      return {
        ...item,
        quantity,
        unitPrice,
        discountAmount,
        taxAmount,
        lineTotal,
      };
    });
  }, [items]);

  const totals = useMemo(() => {
    return lineItems.reduce(
      (acc, item) => {
        acc.subtotal += item.unitPrice * item.quantity;
        acc.totalDiscount += item.discountAmount;
        acc.totalTax += item.taxAmount;
        return acc;
      },
      { subtotal: 0, totalDiscount: 0, totalTax: 0 },
    );
  }, [lineItems]);

  const saleSubtotal = Number(detail?.subtotal ?? totals.subtotal);
  const saleDiscount = Number(detail?.totalDiscount ?? totals.totalDiscount);
  const saleTax = Number(detail?.totalTax ?? totals.totalTax);
  const saleGrandTotal = Number(detail?.grandTotal ?? saleSubtotal - saleDiscount + saleTax);
  const paidAmount = Number(detail?.paidAmount ?? 0);
  const balanceDue = Number(detail?.balanceDue ?? saleGrandTotal - paidAmount);

  const handlePrint = () => {
    setPrinting(true);
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 50);
  };

  if (loading && !salesOrder) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span>Loading sales order...</span>
        </div>
      </div>
    );
  }

  if (error && !salesOrder) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <div className="max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-foreground">Failed to load sales order</h1>
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
                  Sales Order Details
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
                  {formatDateTime(detail?.createdAt ?? detail?.saleDate ?? '')}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 divide-y divide-border border-b border-border md:grid-cols-3 md:divide-x md:divide-y-0">
            <div className="px-6 py-6 sm:px-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Customer
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">{customer?.name ?? '-'}</p>
              <div className="mt-3 space-y-2">
                <FieldRow icon={Mail}>{customer?.email || '-'}</FieldRow>
                <FieldRow icon={Phone}>{formatPhone(customer?.phone)}</FieldRow>
                <FieldRow icon={MapPin}>{customer?.address || '-'}</FieldRow>
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
                  <dt className="text-muted-foreground">Sale Date</dt>
                  <dd className="font-medium text-foreground">{formatDate(detail?.saleDate ?? '')}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Stock Method</dt>
                  <dd className="font-medium text-foreground">
                    {detail?.stockAccountingMethod ? detail.stockAccountingMethod.toUpperCase() : '-'}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Reserve Items</dt>
                  <dd className="font-medium text-foreground">{detail?.reserveOrderItems ? 'Yes' : 'No'}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 pt-1.5">
                  <dt className="text-muted-foreground">Order Status</dt>
                  <dd>
                    <StatusBadge
                      label={detail?.status || 'draft'}
                      tone={detail?.status === 'approved' || detail?.status === 'completed' ? 'green' : detail?.status === 'cancelled' ? 'red' : 'amber'}
                    />
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Shipping Status</dt>
                  <dd>
                    <StatusBadge
                      label={detail?.shippingStatus || 'pending'}
                      tone={detail?.shippingStatus === 'completed' ? 'green' : detail?.shippingStatus === 'processing' ? 'blue' : 'amber'}
                    />
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Paid</dt>
                  <dd className="font-medium text-foreground">KES {money(paidAmount)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Balance Due</dt>
                  <dd className="font-medium text-foreground">KES {money(balanceDue)}</dd>
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
                    <th className="px-3 py-2.5 text-right">Quantity</th>
                    <th className="px-3 py-2.5 text-right">Unit Price</th>
                    <th className="px-3 py-2.5 text-right">Discount</th>
                    <th className="px-3 py-2.5 text-right">Tax</th>
                    <th className="px-3 py-2.5 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {lineItems.map((item, index) => (
                    <tr key={item.id} className="text-foreground">
                      <td className="px-3 py-2.5 text-muted-foreground">{index + 1}</td>
                      <td className="px-3 py-2.5 font-medium">{item.productName}</td>
                      <td className="px-3 py-2.5 font-mono text-muted-foreground">{item.sku || '-'}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{money(item.quantity)}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{money(item.unitPrice)}</td>
                      <td className="px-3 py-2.5 text-right font-mono">KES {money(item.discountAmount)}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{money(item.taxAmount)}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-semibold text-foreground">
                        KES {money(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex justify-end">
              <div className="w-full max-w-[340px] rounded-lg border border-border bg-background p-5">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-mono text-foreground">KES {money(saleSubtotal)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-mono text-rose-600">- KES {money(saleDiscount)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-mono text-foreground">+ KES {money(saleTax)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Grand Total</span>
                    <span className="font-mono text-foreground">KES {money(saleGrandTotal)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Paid</span>
                    <span className="font-mono text-foreground">- KES {money(paidAmount)}</span>
                  </div>
                </div>
                <div className="mt-3 flex justify-between border-t border-border pt-3">
                  <span className="text-sm font-semibold text-foreground">Balance Due</span>
                  <span className="font-mono text-base font-semibold text-primary">KES {money(balanceDue)}</span>
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
                {stripHtml(detail?.notes) || 'No notes added for this sales order.'}
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
                  <dd className="text-right text-foreground">{customer?.phone || '-'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Location Contact</dt>
                  <dd className="text-right text-foreground">{joinParts([location?.phone, location?.email]) || '-'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Location Address</dt>
                  <dd className="text-right text-foreground">{location?.address || '-'}</dd>
                </div>
              </dl>
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

        {error && salesOrder ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}
