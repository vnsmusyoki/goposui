import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { 
  Package, 
  ReceiptText, 
  Truck, 
  Calendar, 
  Download, 
  Mail, 
  MessageCircle, 
  Printer,
  Eye,
  Edit,
  Trash2,
  Tag,
  CreditCard,
  FileText,
  RotateCcw,
  CheckCircle,
  Bell,
  MoreVertical,
  Filter,
  X,
  Search,
  RefreshCw,
  AlertCircle,
  Clock,
  Check,
  XCircle,
  Hourglass
} from 'lucide-react';
import type { SupplierProfileData } from './supplierProfileTypes';
import { useBusinessCurrency } from '@/business/businessStore';
import { useBusinessLocations } from '@/hooks/business/settings/useBusinessLocations';
import DatePickerField from '@/components/forms/DatePickerField';

type Props = {
  supplier: SupplierProfileData;
};

type PurchaseOrder = {
  id: string;
  date: string;
  refNo: string;
  locationId: string;
  locationName: string;
  supplier: string;
  items: number;
  status: 'draft' | 'pending' | 'partial' | 'received' | 'closed' | 'cancelled';
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'overdue';
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  addedBy: string;
  createdAt: string;
  notes?: string;
};

type DateRangeOption = 
  | 'today' 
  | 'yesterday' 
  | 'last7days' 
  | 'last30days' 
  | 'thisMonth' 
  | 'lastMonth' 
  | 'thisMonthLastYear' 
  | 'thisYear' 
  | 'lastYear' 
  | 'currentFinancialYear' 
  | 'lastFinancialYear' 
  | 'custom';

// Mock data with more realistic entries
const mockPurchases: PurchaseOrder[] = [
  { 
    id: '1', 
    date: '2026-07-04', 
    refNo: 'PO-2401', 
    locationId: 'loc-1', 
    locationName: 'Warehouse A',
    supplier: 'TechSupplies Ltd',
    items: 12, 
    status: 'received', 
    paymentStatus: 'paid',
    grandTotal: 8000, 
    paidAmount: 8000,
    dueAmount: 0,
    addedBy: 'John Doe',
    createdAt: '2026-07-04T10:30:00',
    notes: 'Office supplies delivery'
  },
  { 
    id: '2', 
    date: '2026-06-22', 
    refNo: 'PO-2394', 
    locationId: 'loc-2', 
    locationName: 'Warehouse B',
    supplier: 'Industrial Parts Co',
    items: 8, 
    status: 'partial', 
    paymentStatus: 'partial',
    grandTotal: 4250, 
    paidAmount: 2000,
    dueAmount: 2250,
    addedBy: 'Jane Smith',
    createdAt: '2026-06-22T14:15:00',
    notes: 'Partial shipment received'
  },
  { 
    id: '3', 
    date: '2026-06-11', 
    refNo: 'PO-2388', 
    locationId: 'loc-1', 
    locationName: 'Warehouse A',
    supplier: 'Raw Materials Inc',
    items: 16, 
    status: 'closed', 
    paymentStatus: 'paid',
    grandTotal: 13500, 
    paidAmount: 13500,
    dueAmount: 0,
    addedBy: 'Mike Johnson',
    createdAt: '2026-06-11T09:45:00'
  },
  { 
    id: '4', 
    date: '2026-07-01', 
    refNo: 'PO-2399', 
    locationId: 'loc-3', 
    locationName: 'Warehouse C',
    supplier: 'Electronics World',
    items: 25, 
    status: 'pending', 
    paymentStatus: 'unpaid',
    grandTotal: 15200, 
    paidAmount: 0,
    dueAmount: 15200,
    addedBy: 'Sarah Wilson',
    createdAt: '2026-07-01T11:20:00'
  },
  { 
    id: '5', 
    date: '2026-06-28', 
    refNo: 'PO-2397', 
    locationId: 'loc-2', 
    locationName: 'Warehouse B',
    supplier: 'Office Solutions',
    items: 5, 
    status: 'draft', 
    paymentStatus: 'unpaid',
    grandTotal: 3200, 
    paidAmount: 0,
    dueAmount: 3200,
    addedBy: 'John Doe',
    createdAt: '2026-06-28T16:30:00'
  },
  { 
    id: '6', 
    date: '2026-07-10', 
    refNo: 'PO-2405', 
    locationId: 'loc-1', 
    locationName: 'Warehouse A',
    supplier: 'Raw Materials Inc',
    items: 30, 
    status: 'cancelled', 
    paymentStatus: 'unpaid',
    grandTotal: 22000, 
    paidAmount: 0,
    dueAmount: 22000,
    addedBy: 'Jane Smith',
    createdAt: '2026-07-10T08:00:00',
    notes: 'Order cancelled due to stock availability'
  },
  { 
    id: '7', 
    date: '2026-07-15', 
    refNo: 'PO-2410', 
    locationId: 'loc-3', 
    locationName: 'Warehouse C',
    supplier: 'TechSupplies Ltd',
    items: 18, 
    status: 'received', 
    paymentStatus: 'overdue',
    grandTotal: 9600, 
    paidAmount: 3000,
    dueAmount: 6600,
    addedBy: 'Mike Johnson',
    createdAt: '2026-07-15T13:45:00',
    notes: 'Priority delivery required'
  }
];

export default function SupplierProfilePurchasesTab({ supplier }: Props) {
  const { formatCurrency } = useBusinessCurrency();
  const { locations } = useBusinessLocations();
  const actionMenuRef = useRef<HTMLDivElement | null>(null);
  
  // State
  const [dateRangeOption, setDateRangeOption] = useState<DateRangeOption>('last30days');
  const [customDateRange, setCustomDateRange] = useState<{ start: string; end: string }>({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [openActionMenuPosition, setOpenActionMenuPosition] = useState<{
    top: number;
    left: number;
    placement: 'top' | 'bottom';
  } | null>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setOpenActionMenuId(null);
        setOpenActionMenuPosition(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenActionMenuId(null);
        setOpenActionMenuPosition(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const togglePurchaseActionMenu = (purchaseId: string, target: HTMLButtonElement) => {
    if (openActionMenuId === purchaseId) {
      setOpenActionMenuId(null);
      setOpenActionMenuPosition(null);
      return;
    }

    const rect = target.getBoundingClientRect();
    const menuHeight = 392;
    const menuWidth = 192;
    const gap = 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const placement: 'top' | 'bottom' = spaceBelow < menuHeight && spaceAbove > spaceBelow ? 'top' : 'bottom';
    const top = placement === 'bottom' ? rect.bottom + gap : Math.max(rect.top - menuHeight - gap, gap);
    const left = Math.min(Math.max(rect.right - menuWidth, gap), window.innerWidth - menuWidth - gap);

    setOpenActionMenuId(purchaseId);
    setOpenActionMenuPosition({ top, left, placement });
  };
  
  // Date range calculation
  const getDateRange = useMemo(() => {
    const now = new Date();
    const start = new Date();
    const end = new Date();
    
    switch (dateRangeOption) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        start.setDate(now.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(now.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        break;
      case 'last7days':
        start.setDate(now.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'last30days':
        start.setDate(now.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'thisMonth':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'lastMonth':
        start.setMonth(now.getMonth() - 1);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(now.getMonth());
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'thisMonthLastYear':
        start.setFullYear(now.getFullYear() - 1);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setFullYear(now.getFullYear() - 1);
        end.setMonth(now.getMonth());
        end.setDate(now.getDate());
        end.setHours(23, 59, 59, 999);
        break;
      case 'thisYear':
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'lastYear':
        start.setFullYear(now.getFullYear() - 1);
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        end.setFullYear(now.getFullYear() - 1);
        end.setMonth(11, 31);
        end.setHours(23, 59, 59, 999);
        break;
      case 'currentFinancialYear':
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const financialYearStartMonth = 3; // April (0-indexed)
        if (currentMonth >= financialYearStartMonth) {
          start.setFullYear(currentYear, financialYearStartMonth, 1);
        } else {
          start.setFullYear(currentYear - 1, financialYearStartMonth, 1);
        }
        start.setHours(0, 0, 0, 0);
        end.setFullYear(start.getFullYear() + 1, financialYearStartMonth - 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'lastFinancialYear':
        const lastFYStartMonth = 3;
        const lastFYYear = now.getMonth() >= lastFYStartMonth ? now.getFullYear() - 1 : now.getFullYear() - 2;
        start.setFullYear(lastFYYear, lastFYStartMonth, 1);
        start.setHours(0, 0, 0, 0);
        end.setFullYear(lastFYYear + 1, lastFYStartMonth - 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'custom':
        return {
          start: new Date(customDateRange.start),
          end: new Date(customDateRange.end),
        };
      default:
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
    }
    
    return { start, end };
  }, [dateRangeOption, customDateRange]);
  
  // Filter purchases
  const filteredPurchases = useMemo(() => {
    let purchases = [...mockPurchases];
    
    // Date range filter
    purchases = purchases.filter(p => {
      const purchaseDate = new Date(p.date);
      return purchaseDate >= getDateRange.start && purchaseDate <= getDateRange.end;
    });
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      purchases = purchases.filter(p =>
        p.refNo.toLowerCase().includes(searchLower) ||
        p.supplier.toLowerCase().includes(searchLower) ||
        p.locationName.toLowerCase().includes(searchLower) ||
        p.notes?.toLowerCase().includes(searchLower)
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      purchases = purchases.filter(p => p.status === statusFilter);
    }
    
    // Payment status filter
    if (paymentStatusFilter !== 'all') {
      purchases = purchases.filter(p => p.paymentStatus === paymentStatusFilter);
    }
    
    // Location filter
    if (locationFilter !== 'all') {
      purchases = purchases.filter(p => p.locationId === locationFilter);
    }
    
    // Sort by date (most recent first)
    purchases.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return purchases;
  }, [getDateRange, searchTerm, statusFilter, paymentStatusFilter, locationFilter]);
  
  // Calculate summary
  const summary = useMemo(() => {
    const totalOrders = filteredPurchases.length;
    const totalValue = filteredPurchases.reduce((sum, p) => sum + p.grandTotal, 0);
    const totalPaid = filteredPurchases.reduce((sum, p) => sum + p.paidAmount, 0);
    const totalDue = filteredPurchases.reduce((sum, p) => sum + p.dueAmount, 0);
    
    return { totalOrders, totalValue, totalPaid, totalDue };
  }, [filteredPurchases]);
  
  // Get status badge
  const getStatusBadge = (status: PurchaseOrder['status']) => {
    const config = {
      draft: { color: 'bg-muted text-muted-foreground', icon: <FileText className="h-3 w-3" /> },
      pending: { color: 'bg-amber-500/10 text-amber-600', icon: <Clock className="h-3 w-3" /> },
      partial: { color: 'bg-blue-500/10 text-blue-600', icon: <Hourglass className="h-3 w-3" /> },
      received: { color: 'bg-success/10 text-success', icon: <Check className="h-3 w-3" /> },
      closed: { color: 'bg-success/10 text-success', icon: <CheckCircle className="h-3 w-3" /> },
      cancelled: { color: 'bg-destructive/10 text-destructive', icon: <XCircle className="h-3 w-3" /> },
    };
    const configs = config[status];
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${configs.color}`}>
        {configs.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };
  
  const getPaymentStatusBadge = (status: PurchaseOrder['paymentStatus']) => {
    const config = {
      unpaid: { color: 'bg-muted text-muted-foreground', icon: <AlertCircle className="h-3 w-3" /> },
      partial: { color: 'bg-amber-500/10 text-amber-600', icon: <Clock className="h-3 w-3" /> },
      paid: { color: 'bg-success/10 text-success', icon: <CheckCircle className="h-3 w-3" /> },
      overdue: { color: 'bg-destructive/10 text-destructive', icon: <XCircle className="h-3 w-3" /> },
    };
    const configs = config[status];
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${configs.color}`}>
        {configs.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };
  
  // Export handlers
  const handleExportCSV = () => {
    const headers = ['Date', 'Ref No', 'Location', 'Supplier', 'Status', 'Payment Status', 'Grand Total', 'Paid', 'Due', 'Added By'];
    const rows = filteredPurchases.map(p => [
      p.date,
      p.refNo,
      p.locationName,
      p.supplier,
      p.status,
      p.paymentStatus,
      p.grandTotal.toString(),
      p.paidAmount.toString(),
      p.dueAmount.toString(),
      p.addedBy
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `purchases_${supplier.name}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleExportEmail = () => {
    window.location.href = `mailto:?subject=Purchase Orders Report - ${supplier.name}&body=Purchase orders report for ${supplier.name} is attached.`;
  };
  
  const handleExportWhatsApp = () => {
    const message = `📊 Purchase Orders Report - ${supplier.name}\n\n` +
      `📦 Total Orders: ${summary.totalOrders}\n` +
      `💰 Total Value: ${formatCurrency(summary.totalValue)}\n` +
      `✅ Total Paid: ${formatCurrency(summary.totalPaid)}\n` +
      `⚠️ Total Due: ${formatCurrency(summary.totalDue)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };
  
  const handleResetFilters = () => {
    setDateRangeOption('last30days');
    setSearchTerm('');
    setStatusFilter('all');
    setPaymentStatusFilter('all');
    setLocationFilter('all');
  };
  
  const dateRangeOptions: { value: DateRangeOption; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last7days', label: 'Last 7 Days' },
    { value: 'last30days', label: 'Last 30 Days' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'thisMonthLastYear', label: 'This Month Last Year' },
    { value: 'thisYear', label: 'This Year' },
    { value: 'lastYear', label: 'Last Year' },
    { value: 'currentFinancialYear', label: 'Current Financial Year' },
    { value: 'lastFinancialYear', label: 'Last Financial Year' },
    { value: 'custom', label: 'Custom Range' },
  ];
  
  return (
    <div className="space-y-6">
      {/* Description */}
      <div className="rounded-xl border border-border bg-gradient-to-r from-primary/5 via-transparent to-transparent p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <ReceiptText className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Purchase Orders Overview</h4>
            <p className="text-sm text-muted-foreground">
              Complete history of all purchase orders from {supplier.name}. Track order status, payment progress, 
              and manage deliveries. Use filters to view specific time periods or transaction statuses.
            </p>
          </div>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard 
          title="Total Orders" 
          value={summary.totalOrders.toString()} 
          icon={<ReceiptText className="h-4 w-4" />}
          color="primary"
        />
        <SummaryCard 
          title="Total Value" 
          value={formatCurrency(summary.totalValue)} 
          icon={<Package className="h-4 w-4" />}
          color="primary"
        />
        <SummaryCard 
          title="Total Paid" 
          value={formatCurrency(summary.totalPaid)} 
          icon={<CheckCircle className="h-4 w-4" />}
          color="success"
        />
        <SummaryCard 
          title="Total Due" 
          value={formatCurrency(summary.totalDue)} 
          icon={<AlertCircle className="h-4 w-4" />}
          color={summary.totalDue > 0 ? 'destructive' : 'success'}
        />
      </div>
      
      {/* Filters Section */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
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
        
        {showFilters && (
          <div className="grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Date Range</label>
              <select
                value={dateRangeOption}
                onChange={(e) => setDateRangeOption(e.target.value as DateRangeOption)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
              >
                {dateRangeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            {dateRangeOption === 'custom' && (
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Custom Range</label>
                <div className="mt-1 grid gap-2 sm:grid-cols-2">
                  <DatePickerField
                    value={customDateRange.start}
                    onChange={(value) => setCustomDateRange({ ...customDateRange, start: value })}
                    placeholder="From"
                  />
                  <DatePickerField
                    value={customDateRange.end}
                    onChange={(value) => setCustomDateRange({ ...customDateRange, end: value })}
                    placeholder="To"
                  />
                </div>
              </div>
            )}
            
            <div>
              <label className="text-xs font-medium text-muted-foreground">Location</label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
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
              <label className="text-xs font-medium text-muted-foreground">Order Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="received">Received</option>
                <option value="closed">Closed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div>
              <label className="text-xs font-medium text-muted-foreground">Payment Status</label>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
              >
                <option value="all">All Payment Statuses</option>
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
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
                  placeholder="Search orders..."
                  className="w-full rounded-lg border border-border bg-background py-1.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
            
            <div className="flex items-end md:col-span-2 lg:col-span-4">
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
      
      {/* Purchases Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border bg-gradient-to-r from-primary/5 via-transparent to-transparent px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">
            Purchase Orders
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {filteredPurchases.length} orders found
            </span>
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-surface-alt">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Date</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Ref No</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Location</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Supplier</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Status</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Payment</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground whitespace-nowrap">Grand Total</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground whitespace-nowrap">Due</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Added By</th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-muted-foreground whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPurchases.length > 0 ? (
                filteredPurchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-surface-alt/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(purchase.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground whitespace-nowrap">
                      {purchase.refNo}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                      {purchase.locationName}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
                      {purchase.supplier}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getStatusBadge(purchase.status)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getPaymentStatusBadge(purchase.paymentStatus)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-foreground whitespace-nowrap">
                      {formatCurrency(purchase.grandTotal)}
                    </td>
                    <td className={`px-4 py-3 text-right text-sm font-semibold whitespace-nowrap ${
                      purchase.dueAmount > 0 ? 'text-destructive' : 'text-success'
                    }`}>
                      {formatCurrency(purchase.dueAmount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                      {purchase.addedBy}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="relative flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(event) => togglePurchaseActionMenu(purchase.id, event.currentTarget)}
                          className="rounded-lg p-1.5 hover:bg-surface-alt transition-colors"
                          aria-label="Open purchase actions"
                        >
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </button>
                        {openActionMenuId === purchase.id && openActionMenuPosition && (
                          <>
                            <button
                              type="button"
                              aria-label="Close purchase actions"
                              onClick={() => {
                                setOpenActionMenuId(null);
                                setOpenActionMenuPosition(null);
                              }}
                              className="fixed inset-0 z-40 cursor-default bg-background/40 backdrop-blur-sm"
                            />
                            <div
                              ref={actionMenuRef}
                              className="fixed z-50 w-56 overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-black/10"
                              style={{
                                top: openActionMenuPosition.top,
                                left: openActionMenuPosition.left,
                              }}
                            >
                              <div className="border-b border-border bg-gradient-to-r from-primary/10 via-transparent to-transparent px-3 py-3">
                                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                  Purchase record
                                </p>
                                <p className="mt-1 text-sm font-semibold text-foreground">
                                  {purchase.refNo}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {purchase.locationName} · {new Date(purchase.date).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="divide-y divide-border p-1">
                                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-surface-alt">
                                  <Eye className="h-4 w-4" />
                                  View
                                </button>
                                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-surface-alt">
                                  <Printer className="h-4 w-4" />
                                  Print
                                </button>
                                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-surface-alt">
                                  <Edit className="h-4 w-4" />
                                  Edit
                                </button>
                                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10">
                                  <Trash2 className="h-4 w-4" />
                                  Delete
                                </button>
                                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-surface-alt">
                                  <Tag className="h-4 w-4" />
                                  Labels
                                </button>
                                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-surface-alt">
                                  <CreditCard className="h-4 w-4" />
                                  Add Payment
                                </button>
                                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-surface-alt">
                                  <FileText className="h-4 w-4" />
                                  View Payments
                                </button>
                                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-surface-alt">
                                  <RotateCcw className="h-4 w-4" />
                                  Purchase Return
                                </button>
                                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-surface-alt">
                                  <RefreshCw className="h-4 w-4" />
                                  Update Status
                                </button>
                                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-surface-alt">
                                  <Bell className="h-4 w-4" />
                                  Items Received
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No purchase orders found matching the current filters.
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
  color = 'primary' 
}: { 
  title: string; 
  value: string; 
  icon: ReactNode; 
  color?: 'primary' | 'success' | 'destructive';
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
        </div>
        <div className={`rounded-lg ${colorClasses[color]} p-2`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
