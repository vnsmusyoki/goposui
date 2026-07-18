import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import {
  BadgeDollarSign,
  Download,
  FileSpreadsheet,
  Filter,
  Mail,
  MessageCircle,
  Printer,
  RefreshCw,
  Search,
  ShoppingCart,
  Wallet,
  X,
} from 'lucide-react';
import type { CustomerProfileData } from './customerProfileTypes';
import { useBusinessCurrency } from '@/business/businessStore';
import DatePickerField from '@/components/forms/DatePickerField';

type Props = {
  customer: CustomerProfileData;
};

type LedgerEntryType = 'opening' | 'sale' | 'payment' | 'return' | 'discount' | 'adjustment';
type LedgerDirection = 'debit' | 'credit';

type LedgerEntry = {
  id: string;
  date: string;
  reference: string;
  description: string;
  type: LedgerEntryType;
  direction: LedgerDirection;
  amount: number;
  note?: string;
};

type FilterMode = 'all' | LedgerEntryType;

const mockLedgerData: LedgerEntry[] = [
  {
    id: 'opening',
    date: '2026-06-01',
    reference: 'OPEN-001',
    description: 'Opening balance carried forward',
    type: 'opening',
    direction: 'debit',
    amount: 12000,
    note: 'Starting balance for the new statement period.',
  },
  {
    id: 'sale-001',
    date: '2026-06-05',
    reference: 'INV-2401',
    description: 'Sale invoice - Office supplies',
    type: 'sale',
    direction: 'debit',
    amount: 8450,
    note: 'Bulk office supply order.',
  },
  {
    id: 'pay-001',
    date: '2026-06-08',
    reference: 'RCPT-1102',
    description: 'Payment received via bank transfer',
    type: 'payment',
    direction: 'credit',
    amount: 5000,
    note: 'Partial settlement for INV-2401.',
  },
  {
    id: 'sale-002',
    date: '2026-06-13',
    reference: 'INV-2410',
    description: 'Sale invoice - Consumables',
    type: 'sale',
    direction: 'debit',
    amount: 6200,
    note: 'Weekly consumables replenishment.',
  },
  {
    id: 'return-001',
    date: '2026-06-15',
    reference: 'CRN-004',
    description: 'Sale return / credit note issued',
    type: 'return',
    direction: 'credit',
    amount: 1250,
    note: 'Returned damaged items.',
  },
  {
    id: 'discount-001',
    date: '2026-06-18',
    reference: 'DISC-008',
    description: 'Discount applied',
    type: 'discount',
    direction: 'credit',
    amount: 700,
    note: 'Loyalty discount granted.',
  },
  {
    id: 'adj-001',
    date: '2026-06-22',
    reference: 'ADJ-002',
    description: 'Manual balance adjustment',
    type: 'adjustment',
    direction: 'credit',
    amount: 300,
    note: 'Rounded off by accounting review.',
  },
  {
    id: 'pay-002',
    date: '2026-06-27',
    reference: 'RCPT-1119',
    description: 'Payment received via mobile money',
    type: 'payment',
    direction: 'credit',
    amount: 9000,
    note: 'Customer cleared multiple invoices.',
  },
  {
    id: 'sale-003',
    date: '2026-07-03',
    reference: 'INV-2422',
    description: 'Sale invoice - New stock delivery',
    type: 'sale',
    direction: 'debit',
    amount: 10200,
    note: 'Fresh stock delivered to outlet.',
  },
  {
    id: 'pay-003',
    date: '2026-07-10',
    reference: 'RCPT-1134',
    description: 'Payment received via cash',
    type: 'payment',
    direction: 'credit',
    amount: 2500,
    note: 'Cash deposit recorded at counter.',
  },
];

const typeLabels: Record<LedgerEntryType, string> = {
  opening: 'Opening',
  sale: 'Sale',
  payment: 'Payment',
  return: 'Return',
  discount: 'Discount',
  adjustment: 'Adjustment',
};

const typePillClass: Record<LedgerEntryType, string> = {
  opening: 'bg-slate-100 text-slate-700',
  sale: 'bg-primary/10 text-primary',
  payment: 'bg-emerald-100 text-emerald-700',
  return: 'bg-amber-100 text-amber-700',
  discount: 'bg-blue-100 text-blue-700',
  adjustment: 'bg-muted text-muted-foreground',
};

export default function CustomerProfileLedgerTab({ customer }: Props) {
  const { formatCurrency } = useBusinessCurrency();
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '2026-06-01',
    end: '2026-07-31',
  });
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(true);

  const filteredEntries = useMemo(() => {
    let entries = [...mockLedgerData];

    entries = entries.filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate >= new Date(dateRange.start) && entryDate <= new Date(dateRange.end);
    });

    if (filterMode !== 'all') {
      entries = entries.filter((entry) => entry.type === filterMode);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      entries = entries.filter((entry) =>
        [entry.reference, entry.description, entry.note, typeLabels[entry.type]].filter(Boolean).some((value) =>
          String(value).toLowerCase().includes(term),
        ),
      );
    }

    return entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [dateRange, filterMode, searchTerm]);

  const rowsWithBalance = useMemo(() => {
    let runningBalance = 0;
    return filteredEntries.map((entry) => {
      runningBalance += entry.direction === 'debit' ? entry.amount : -entry.amount;
      return { ...entry, balance: runningBalance };
    });
  }, [filteredEntries]);

  const summary = useMemo(() => {
    const totals = mockLedgerData.reduce(
      (acc, entry) => {
        if (entry.direction === 'debit') {
          acc.totalSales += entry.type === 'sale' ? entry.amount : 0;
          acc.openingBalance += entry.type === 'opening' ? entry.amount : 0;
          acc.netBalance += entry.amount;
        } else {
          acc.totalPayments += entry.type === 'payment' ? entry.amount : 0;
          acc.totalReturns += entry.type === 'return' ? entry.amount : 0;
          acc.totalDiscounts += entry.type === 'discount' ? entry.amount : 0;
          acc.totalAdjustments += entry.type === 'adjustment' ? entry.amount : 0;
          acc.netBalance -= entry.amount;
        }
        return acc;
      },
      {
        openingBalance: 0,
        totalSales: 0,
        totalPayments: 0,
        totalReturns: 0,
        totalDiscounts: 0,
        totalAdjustments: 0,
        netBalance: 0,
      },
    );

    return totals;
  }, []);

  const handleResetFilters = () => {
    setDateRange({ start: '2026-06-01', end: '2026-07-31' });
    setFilterMode('all');
    setSearchTerm('');
    setShowFilters(true);
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Reference', 'Description', 'Type', 'Debit', 'Credit', 'Balance', 'Note'];
    const rows = rowsWithBalance.map((entry) => [
      entry.date,
      entry.reference,
      entry.description,
      typeLabels[entry.type],
      entry.direction === 'debit' ? entry.amount.toString() : '',
      entry.direction === 'credit' ? entry.amount.toString() : '',
      entry.balance.toString(),
      entry.note ?? '',
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customer_ledger_${customer.customerCode || customer.contactId || customer.name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportEmail = () => {
    window.location.href = `mailto:?subject=Customer Ledger - ${customer.name}&body=Please find attached the ledger summary for ${customer.name}.`;
  };

  const handleExportWhatsApp = () => {
    const message =
      `Customer Ledger - ${customer.name}\n` +
      `Current Balance: ${formatCurrency(summary.netBalance)}\n` +
      `Total Sales: ${formatCurrency(summary.totalSales)}\n` +
      `Total Payments: ${formatCurrency(summary.totalPayments)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary/10 via-transparent to-transparent p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Customer Ledger</h4>
            <p className="text-sm text-muted-foreground">
              Track every sale, payment, return, discount, and adjustment for {customer.name}. The running balance shows
              exactly how much the customer owes at each step.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Opening Balance"
          value={formatCurrency(summary.openingBalance)}
          icon={<BadgeDollarSign className="h-4 w-4" />}
          tone="primary"
          description="Amount carried into this ledger period."
        />
        <SummaryCard
          title="Total Sales"
          value={formatCurrency(summary.totalSales)}
          icon={<ShoppingCart className="h-4 w-4" />}
          tone="warning"
          description="Invoices added to the customer account."
        />
        <SummaryCard
          title="Total Payments"
          value={formatCurrency(summary.totalPayments)}
          icon={<Wallet className="h-4 w-4" />}
          tone="success"
          description="Receipts and settlements received."
        />
        <SummaryCard
          title="Current Balance"
          value={formatCurrency(summary.netBalance)}
          icon={<BadgeDollarSign className="h-4 w-4" />}
          tone={summary.netBalance >= 0 ? 'danger' : 'success'}
          description={summary.netBalance >= 0 ? 'Amount still owed by the customer.' : 'Customer has a credit balance.'}
        />
      </div>

     

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <button
            type="button"
            onClick={() => setShowFilters((current) => !current)}
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

        {showFilters ? (
          <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-[1.2fr_0.8fr_1fr_auto]">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Date Range</label>
              <div className="mt-1 grid gap-2 sm:grid-cols-2">
                <DatePickerField value={dateRange.start} onChange={(value) => setDateRange((current) => ({ ...current, start: value }))} placeholder="From" />
                <DatePickerField value={dateRange.end} onChange={(value) => setDateRange((current) => ({ ...current, end: value }))} placeholder="To" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Transaction Type</label>
              <select
                value={filterMode}
                onChange={(event) => setFilterMode(event.target.value as FilterMode)}
                className="mt-1 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              >
                <option value="all">All Transactions</option>
                <option value="opening">Opening Balance</option>
                <option value="sale">Sales</option>
                <option value="payment">Payments</option>
                <option value="return">Returns</option>
                <option value="discount">Discounts</option>
                <option value="adjustment">Adjustments</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Search</label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search reference or description..."
                  className="h-11 w-full rounded-lg border border-border bg-background py-1.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted/60"
              >
                <RefreshCw className="h-4 w-4" />
                Reset
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
          <BadgeDollarSign className="h-3.5 w-3.5" />
          Customer: {customer.name}
        </div>
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{rowsWithBalance.length}</span> transaction
          {rowsWithBalance.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className="overflow-hidden  bg-card">
        <div className="border-b border-border bg-gradient-to-r from-primary/5 via-transparent to-transparent px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">
            {customer.name} - Ledger Statement
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {dateRange.start} to {dateRange.end}
            </span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-alt/60">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reference</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Debit</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Credit</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rowsWithBalance.length > 0 ? (
                rowsWithBalance.map((entry) => (
                  <tr key={entry.id} className="transition-colors hover:bg-surface-alt/40">
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">{formatDate(entry.date)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-foreground">{entry.reference}</td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium leading-4 text-foreground">{entry.description}</p>
                        {entry.note ? <p className="text-[11px] leading-4 text-muted-foreground">{entry.note}</p> : null}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${typePillClass[entry.type]}`}>
                        {typeLabels[entry.type]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-success">
                      {entry.direction === 'debit' ? formatCurrency(entry.amount) : '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-destructive">
                      {entry.direction === 'credit' ? formatCurrency(entry.amount) : '—'}
                    </td>
                    <td className={`whitespace-nowrap px-4 py-3 text-right text-sm font-bold ${entry.balance >= 0 ? 'text-destructive' : 'text-success'}`}>
                      {formatCurrency(entry.balance)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    No ledger entries match the current filters.
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
  tone,
  description,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  tone: 'primary' | 'success' | 'warning' | 'danger';
  description: string;
}) {
  const toneClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-destructive/10 text-destructive',
  };

  return (
    <div className="rounded-sm border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="mt-2 text-lg font-bold text-foreground">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <div className={`rounded-xl p-2 ${toneClasses[tone]}`}>{icon}</div>
      </div>
    </div>
  );
}

 

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
}
