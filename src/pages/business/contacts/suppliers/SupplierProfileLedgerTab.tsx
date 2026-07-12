import type { ReactNode } from 'react';
import { useState, useMemo } from 'react';
import {
  ArrowDownLeft, 
  ArrowUpRight, 
  BadgeDollarSign, 
  Calendar, 
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
  X
} from 'lucide-react';
import type { SupplierProfileData } from './supplierProfileTypes';
import { useBusinessCurrency } from '@/business/businessStore';
import { useBusinessLocations } from '@/hooks/business/settings/useBusinessLocations';
import DatePickerField from '@/components/forms/DatePickerField';

type Props = {
  supplier: SupplierProfileData;
};

type LedgerEntry = {
  id: string;
  date: string;
  description: string;
  type: 'debit' | 'credit';
  amount: number;
  balance: number;
  reference: string;
  locationId?: string;
  category?: string;
};

type LedgerFormat = 'format1' | 'format2';
type TransactionType = 'all' | 'debit' | 'credit';

// Mock data with more realistic entries
const mockLedgerData: LedgerEntry[] = [
  { id: '1', date: '2026-07-01', description: 'Opening balance', type: 'debit', amount: 12000, balance: 12000, reference: 'OPEN-001', category: 'Opening' },
  { id: '2', date: '2026-07-04', description: 'Purchase order #PO-2401 - Office Supplies', type: 'credit', amount: 8000, balance: 4000, reference: 'PO-2401', category: 'Purchase', locationId: 'loc-1' },
  { id: '3', date: '2026-07-06', description: 'Payment received - Bank Transfer', type: 'debit', amount: 3000, balance: 7000, reference: 'PAY-001', category: 'Payment', locationId: 'loc-2' },
  { id: '4', date: '2026-07-08', description: 'Payment received - Cash', type: 'debit', amount: 2000, balance: 9000, reference: 'PAY-002', category: 'Payment', locationId: 'loc-1' },
  { id: '5', date: '2026-07-10', description: 'Discount applied - Bulk purchase', type: 'credit', amount: 1200, balance: 7800, reference: 'DISC-001', category: 'Discount' },
  { id: '6', date: '2026-07-12', description: 'Purchase order #PO-2405 - Raw Materials', type: 'credit', amount: 15000, balance: -7200, reference: 'PO-2405', category: 'Purchase', locationId: 'loc-3' },
  { id: '7', date: '2026-07-15', description: 'Payment received - Wire Transfer', type: 'debit', amount: 10000, balance: 2800, reference: 'PAY-003', category: 'Payment', locationId: 'loc-2' },
  { id: '8', date: '2026-07-18', description: 'Purchase order #PO-2408 - Equipment', type: 'credit', amount: 5000, balance: -2200, reference: 'PO-2408', category: 'Purchase', locationId: 'loc-1' },
  { id: '9', date: '2026-07-20', description: 'Adjustment - Price correction', type: 'credit', amount: 500, balance: -2700, reference: 'ADJ-001', category: 'Adjustment' },
  { id: '10', date: '2026-07-22', description: 'Payment received - Check', type: 'debit', amount: 3000, balance: 300, reference: 'PAY-004', category: 'Payment', locationId: 'loc-3' },
];

export default function SupplierProfileLedgerTab({ supplier }: Props) {
  const { formatCurrency } = useBusinessCurrency();
  const { locations } = useBusinessLocations();
  
  // Filter states
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '2026-07-01',
    end: '2026-07-31',
  });
  const [transactionType, setTransactionType] = useState<TransactionType>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [ledgerFormat, setLedgerFormat] = useState<LedgerFormat>('format1');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter and search entries
  const filteredEntries = useMemo(() => {
    let entries = [...mockLedgerData];
    
    // Date range filter
    entries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      return entryDate >= startDate && entryDate <= endDate;
    });
    
    // Transaction type filter
    if (transactionType !== 'all') {
      entries = entries.filter(entry => entry.type === transactionType);
    }
    
    // Location filter
    if (selectedLocation !== 'all') {
      entries = entries.filter(entry => entry.locationId === selectedLocation);
    }
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      entries = entries.filter(entry =>
        entry.description.toLowerCase().includes(searchLower) ||
        entry.reference.toLowerCase().includes(searchLower) ||
        entry.category?.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort by date (most recent first)
    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return entries;
  }, [dateRange, transactionType, selectedLocation, searchTerm]);
  
  // Calculate summaries
  const summary = useMemo(() => {
    let totalDebit = 0;
    let totalCredit = 0;
    let runningBalance = 0;
    
    // Sort by date for running balance
    const sortedEntries = [...mockLedgerData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    sortedEntries.forEach(entry => {
      if (entry.type === 'debit') {
        runningBalance += entry.amount;
        totalDebit += entry.amount;
      } else {
        runningBalance -= entry.amount;
        totalCredit += entry.amount;
      }
    });
    
    return {
      totalDebit,
      totalCredit,
      currentBalance: runningBalance,
    };
  }, []);
  
  // Calculate running balance for filtered entries
  const entriesWithBalance = useMemo(() => {
    const sortedEntries = [...filteredEntries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    let runningBalance = 0;
    return sortedEntries.map(entry => {
      if (entry.type === 'debit') {
        runningBalance += entry.amount;
      } else {
        runningBalance -= entry.amount;
      }
      return { ...entry, balance: runningBalance };
    });
  }, [filteredEntries]);
  
  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Export handlers
  const handleExportCSV = () => {
    const headers = ['Date', 'Description', 'Type', 'Amount', 'Balance', 'Reference', 'Category'];
    const rows = entriesWithBalance.map(entry => [
      entry.date,
      entry.description,
      entry.type,
      entry.amount.toString(),
      entry.balance.toString(),
      entry.reference,
      entry.category || ''
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledger_${supplier.name}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleExportEmail = () => {
    window.location.href = `mailto:?subject=Ledger Report - ${supplier.name}&body=Please find attached the ledger report for ${supplier.name}.`;
  };
  
  const handleExportWhatsApp = () => {
    const message = `Ledger Report - ${supplier.name}\nCurrent Balance: ${formatCurrency(summary.currentBalance)}\nTotal Debits: ${formatCurrency(summary.totalDebit)}\nTotal Credits: ${formatCurrency(summary.totalCredit)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };
  
  const handleResetFilters = () => {
    setDateRange({ start: '2026-07-01', end: '2026-07-31' });
    setTransactionType('all');
    setSelectedLocation('all');
    setSearchTerm('');
  };
  
  return (
    <div className="space-y-6">
      {/* Ledger Description */}
      <div className="rounded-xl border border-border bg-gradient-to-r from-primary/5 via-transparent to-transparent p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Supplier Ledger</h4>
            <p className="text-sm text-muted-foreground">
              Track all financial transactions with {supplier.name}. The ledger shows complete history of purchases, 
              payments, discounts, and adjustments. Maintains running balance to help you monitor outstanding amounts 
              and payment status at a glance.
            </p>
          </div>
        </div>
      </div>
 
      
      {/* Summary Cards */}
       <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          title="Total Purchases"
          value={formatCurrency(summary.totalDebit)}
          icon={<ShoppingCart className="h-4 w-4" />}
          color="primary"
          description="Total value of goods and services purchased"
        />

        <SummaryCard
          title="Total Payments"
          value={formatCurrency(summary.totalCredit)}
          icon={<Wallet className="h-4 w-4" />}
          color="success"
          description="Amount paid to this supplier"
        />

        <SummaryCard
          title="Outstanding Balance"
          value={formatCurrency(summary.currentBalance)}
          icon={<BadgeDollarSign className="h-4 w-4" />}
          color={summary.currentBalance > 0 ? "destructive" : "success"}
          description={
            summary.currentBalance > 0
              ? "Amount still payable"
              : summary.currentBalance < 0
              ? "Overpaid balance"
              : "Account fully settled"
          }
        />
      </div>
      
      {/* Filter Section */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary"
          >
            <Filter className="h-4 w-4" />
            Filters & Options
            {showFilters ? <X className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
          </button>
          <div className="flex items-center gap-2">
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
        
        {showFilters && (
          <div className="grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Date Range</label>
              <div className="mt-1 grid gap-2 sm:grid-cols-2">
                <DatePickerField
                  value={dateRange.start}
                  onChange={(value) => setDateRange({ ...dateRange, start: value })}
                  placeholder="From"
                />
                <DatePickerField
                  value={dateRange.end}
                  onChange={(value) => setDateRange({ ...dateRange, end: value })}
                  placeholder="To"
                />
              </div>
            </div>
            
            <div>
              <label className="text-xs font-medium text-muted-foreground">Transaction Type</label>
              <select
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value as TransactionType)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
              >
                <option value="all">All Transactions</option>
                <option value="debit">Debits Only</option>
                <option value="credit">Credits Only</option>
              </select>
            </div>
            
            <div>
              <label className="text-xs font-medium text-muted-foreground">Business Location</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
              >
                <option value="all">All Locations</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.locationName}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-xs font-medium text-muted-foreground">Search</label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search transactions..."
                  className="w-full rounded-lg border border-border bg-background py-1.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
            
            <div className="md:col-span-2 lg:col-span-4">
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reset Filters
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Ledger Format Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Ledger Format:</span>
          <div className="inline-flex rounded-lg border border-border bg-background p-0.5">
            <button
              type="button"
              onClick={() => setLedgerFormat('format1')}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                ledgerFormat === 'format1' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Format 1
            </button>
            <button
              type="button"
              onClick={() => setLedgerFormat('format2')}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                ledgerFormat === 'format2' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Format 2
            </button>
          </div>
        </div>
        <span className="text-sm text-muted-foreground">
          {entriesWithBalance.length} transactions found
        </span>
      </div>
      
      {/* Transaction Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border bg-gradient-to-r from-primary/5 via-transparent to-transparent px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">
            {supplier.name} - Ledger Entries
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {dateRange.start} to {dateRange.end}
            </span>
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-surface-alt">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">Date</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">Description</th>
                {ledgerFormat === 'format1' && (
                  <>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">Reference</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">Category</th>
                  </>
                )}
                <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">Debit/Supplied</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">Credit/Paid</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entriesWithBalance.length > 0 ? (
                entriesWithBalance.map((entry) => (
                  <tr key={entry.id} className="hover:bg-surface-alt/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                      {ledgerFormat === 'format2' ? formatDate(entry.date) : entry.date}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      {entry.description}
                    </td>
                    {ledgerFormat === 'format1' && (
                      <>
                        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                          {entry.reference}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                          {entry.category || '-'}
                        </td>
                      </>
                    )}
                    <td className="px-4 py-3 text-right text-sm font-semibold text-success whitespace-nowrap">
                      {entry.type === 'debit' ? formatCurrency(entry.amount) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-destructive whitespace-nowrap">
                      {entry.type === 'credit' ? formatCurrency(entry.amount) : '-'}
                    </td>
                    <td className={`px-4 py-3 text-right text-sm font-bold whitespace-nowrap ${
                      entry.balance >= 0 ? 'text-success' : 'text-destructive'
                    }`}>
                      {formatCurrency(entry.balance)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={ledgerFormat === 'format1' ? 7 : 5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No transactions found matching the current filters.
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
  color = 'primary',
  description,
}: { 
  title: string; 
  value: string; 
  icon: ReactNode; 
  color?: 'primary' | 'success' | 'destructive';
  description: string;
}) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    destructive: 'bg-destructive/10 text-destructive',
  };
  
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="mt-2 text-lg font-bold text-foreground">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <div className={`rounded-lg ${colorClasses[color]} p-2`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function MeaningCard({
  title,
  subtitle,
  detail,
}: {
  title: string;
  subtitle: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      <p className="mt-2 text-xs text-muted-foreground/90">{detail}</p>
    </div>
  );
}
