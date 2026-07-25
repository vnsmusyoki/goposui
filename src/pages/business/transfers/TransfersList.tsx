import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeftRight,
  Download,
  Plus,
  RefreshCw,
  Search,
  Warehouse,
  CalendarDays,
  Package,
  ArrowUpDown,
} from 'lucide-react';
import { useBusinessTransfers, type TransferRecord } from '@/hooks/business/transfers/useBusinessTransfers';

function formatDate(value?: string) {
  if (!value) return 'N/A';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatMoney(amount: number, currency = 'USD') {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function StatusPill({ status }: { status: TransferRecord['status'] }) {
  const tone = {
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    approved: 'bg-blue-100 text-blue-800 border-blue-200',
    processing: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
    failed: 'bg-red-100 text-red-800 border-red-200',
  }[status] ?? 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>
      {status}
    </span>
  );
}

export default function TransfersList() {
  const navigate = useNavigate();
  const { transfers, isLoading, error, loadTransfers } = useBusinessTransfers();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TransferRecord['status']>('all');

  useEffect(() => {
    if (error) {
      toast.error(error, { position: 'top-right' });
    }
  }, [error]);

  const filteredTransfers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return transfers.filter((transfer) => {
      const matchesSearch =
        !query ||
        transfer.referenceNumber.toLowerCase().includes(query) ||
        transfer.locationFromName?.toLowerCase().includes(query) ||
        transfer.locationToName?.toLowerCase().includes(query) ||
        transfer.notes.toLowerCase().includes(query);

      const matchesStatus = statusFilter === 'all' || transfer.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter, transfers]);

  const stats = useMemo(() => {
    return {
      total: transfers.length,
      completed: transfers.filter((item) => item.status === 'completed').length,
      pending: transfers.filter((item) => item.status === 'pending').length,
      value: transfers.reduce((sum, item) => sum + Number(item.totalAmount ?? 0), 0),
    };
  }, [transfers]);

  const exportTransfers = () => {
    const data = JSON.stringify(filteredTransfers, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stock_transfers_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 rounded-sm border border-border bg-card p-5 shadow-sm lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => navigate('/home')}
              className="inline-flex items-center gap-2 rounded-sm border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-alt"
            >
              <ArrowUpDown className="h-4 w-4" />
              Back
            </button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Stock Transfers</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Track inventory moved between branches and review the saved transfer records.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void loadTransfers()}
              className="inline-flex items-center gap-2 rounded-sm border border-border bg-background px-4 py-2.5 text-sm font-semibold transition hover:bg-surface-alt"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={exportTransfers}
              className="inline-flex items-center gap-2 rounded-sm border border-border bg-background px-4 py-2.5 text-sm font-semibold transition hover:bg-surface-alt"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            <button
              type="button"
              onClick={() => navigate('/transfers/list/create')}
              className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              New Transfer
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-sm border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <ArrowLeftRight className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="rounded-sm border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </div>
          <div className="rounded-sm border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </div>
          <div className="rounded-sm border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                <Warehouse className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Value</p>
                <p className="text-2xl font-bold">{formatMoney(stats.value)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-sm border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-lg">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search transfers..."
                className="w-full rounded-sm border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
              className="w-full rounded-sm border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 lg:w-56"
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-sm border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-surface-alt/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reference</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">From</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">To</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Items</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-14 text-center text-sm text-muted-foreground">
                      <div className="inline-flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Loading transfers...
                      </div>
                    </td>
                  </tr>
                ) : filteredTransfers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-14 text-center text-sm text-muted-foreground">
                      No stock transfers found.
                    </td>
                  </tr>
                ) : (
                  filteredTransfers.map((transfer) => (
                    <tr key={transfer.id} className="transition hover:bg-surface-alt/60">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-foreground">{transfer.referenceNumber}</div>
                        <div className="text-xs text-muted-foreground">{transfer.type}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">{transfer.locationFromName || 'N/A'}</td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">{transfer.locationToName || 'N/A'}</td>
                      <td className="px-4 py-4">
                        <StatusPill status={transfer.status} />
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">{formatDate(transfer.transferDate)}</td>
                      <td className="px-4 py-4 text-right text-sm font-medium">{transfer.itemsCount ?? transfer.items.length}</td>
                      <td className="px-4 py-4 text-right text-sm font-semibold">
                        {formatMoney(Number(transfer.totalAmount ?? 0), transfer.currency)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
