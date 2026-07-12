import type { ReactNode } from 'react';
import { useState, useMemo } from 'react';
import { 
  Banknote, 
  CreditCard, 
  Wallet, 
  Search, 
  Download, 
  Mail, 
  MessageCircle, 
  Printer,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Filter,
  RefreshCw,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Plus,
  X,
  Receipt,
  Building,
  User,
  FileText
} from 'lucide-react';
import type { SupplierProfileData } from './supplierProfileTypes';
import { useBusinessCurrency } from '@/business/businessStore';
import { useBusinessLocations } from '@/hooks/business/settings/useBusinessLocations';

type Props = {
  supplier: SupplierProfileData;
};

type Payment = {
  id: string;
  paidOn: string;
  referenceNo: string;
  amount: number;
  paymentMethod: 'Bank Transfer' | 'M-Pesa' | 'Cash' | 'Check' | 'Card' | 'Other';
  paymentFor: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  locationId: string;
  locationName: string;
  addedBy: string;
  notes?: string;
  transactionId?: string;
  paymentDate: string;
  dueDate?: string;
};

// Mock data
const mockPayments: Payment[] = [
  {
    id: '1',
    paidOn: '2026-07-08T10:30:00',
    referenceNo: 'PAY-4812',
    amount: 5000,
    paymentMethod: 'Bank Transfer',
    paymentFor: 'Purchase Order #PO-2401',
    status: 'completed',
    locationId: 'loc-1',
    locationName: 'Warehouse A',
    addedBy: 'John Doe',
    notes: 'Payment for office supplies delivery',
    transactionId: 'TX-2026-07-08-001',
    paymentDate: '2026-07-08',
    dueDate: '2026-07-15'
  },
  {
    id: '2',
    paidOn: '2026-06-21T14:15:00',
    referenceNo: 'PAY-4779',
    amount: 3250,
    paymentMethod: 'M-Pesa',
    paymentFor: 'Purchase Order #PO-2394',
    status: 'completed',
    locationId: 'loc-2',
    locationName: 'Warehouse B',
    addedBy: 'Jane Smith',
    notes: 'Partial payment for industrial parts',
    transactionId: 'TX-2026-06-21-002',
    paymentDate: '2026-06-21',
    dueDate: '2026-06-28'
  },
  {
    id: '3',
    paidOn: '2026-06-03T09:45:00',
    referenceNo: 'PAY-4704',
    amount: 2000,
    paymentMethod: 'Cash',
    paymentFor: 'Purchase Order #PO-2388',
    status: 'pending',
    locationId: 'loc-1',
    locationName: 'Warehouse A',
    addedBy: 'Mike Johnson',
    notes: 'Cash payment awaiting confirmation',
    transactionId: 'TX-2026-06-03-003',
    paymentDate: '2026-06-03',
    dueDate: '2026-06-10'
  },
  {
    id: '4',
    paidOn: '2026-07-15T11:20:00',
    referenceNo: 'PAY-4890',
    amount: 6600,
    paymentMethod: 'Check',
    paymentFor: 'Purchase Order #PO-2410',
    status: 'pending',
    locationId: 'loc-3',
    locationName: 'Warehouse C',
    addedBy: 'Sarah Wilson',
    notes: 'Check payment for priority delivery',
    transactionId: 'TX-2026-07-15-004',
    paymentDate: '2026-07-15',
    dueDate: '2026-07-22'
  },
  {
    id: '5',
    paidOn: '2026-07-01T16:30:00',
    referenceNo: 'PAY-4765',
    amount: 15200,
    paymentMethod: 'Bank Transfer',
    paymentFor: 'Purchase Order #PO-2399',
    status: 'failed',
    locationId: 'loc-3',
    locationName: 'Warehouse C',
    addedBy: 'John Doe',
    notes: 'Payment failed - insufficient funds',
    transactionId: 'TX-2026-07-01-005',
    paymentDate: '2026-07-01',
    dueDate: '2026-07-08'
  },
  {
    id: '6',
    paidOn: '2026-06-28T13:00:00',
    referenceNo: 'PAY-4740',
    amount: 3200,
    paymentMethod: 'Card',
    paymentFor: 'Purchase Order #PO-2397',
    status: 'refunded',
    locationId: 'loc-2',
    locationName: 'Warehouse B',
    addedBy: 'Jane Smith',
    notes: 'Payment refunded due to order cancellation',
    transactionId: 'TX-2026-06-28-006',
    paymentDate: '2026-06-28',
    dueDate: '2026-07-05'
  }
];

export default function SupplierProfilePaymentsTab({ supplier }: Props) {
  const { formatCurrency } = useBusinessCurrency();
  const { locations } = useBusinessLocations();
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showActions, setShowActions] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [viewingPayment, setViewingPayment] = useState<Payment | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Partial<Payment>>({
    paidOn: new Date().toISOString().split('T')[0],
    referenceNo: '',
    amount: 0,
    paymentMethod: 'Bank Transfer',
    paymentFor: '',
    status: 'completed',
    locationId: '',
    notes: '',
    transactionId: ''
  });
  
  // Filter payments
  const filteredPayments = useMemo(() => {
    let payments = [...mockPayments];
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      payments = payments.filter(p =>
        p.referenceNo.toLowerCase().includes(searchLower) ||
        p.paymentFor.toLowerCase().includes(searchLower) ||
        p.addedBy.toLowerCase().includes(searchLower) ||
        p.transactionId?.toLowerCase().includes(searchLower) ||
        p.notes?.toLowerCase().includes(searchLower)
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      payments = payments.filter(p => p.status === statusFilter);
    }
    
    // Method filter
    if (methodFilter !== 'all') {
      payments = payments.filter(p => p.paymentMethod === methodFilter);
    }
    
    // Location filter
    if (locationFilter !== 'all') {
      payments = payments.filter(p => p.locationId === locationFilter);
    }
    
    // Sort by paid date (most recent first)
    payments.sort((a, b) => new Date(b.paidOn).getTime() - new Date(a.paidOn).getTime());
    
    return payments;
  }, [searchTerm, statusFilter, methodFilter, locationFilter]);
  
  // Calculate summary
  const summary = useMemo(() => {
    const totalPayments = filteredPayments.length;
    const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
    const completedAmount = filteredPayments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
    const pendingAmount = filteredPayments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0);
    
    return {
      totalPayments,
      totalAmount,
      completedAmount,
      pendingAmount,
    };
  }, [filteredPayments]);
  
  // Get status badge
  const getStatusBadge = (status: Payment['status']) => {
    const config = {
      completed: { color: 'bg-success/10 text-success', icon: <CheckCircle className="h-3 w-3" />, label: 'Completed' },
      pending: { color: 'bg-amber-500/10 text-amber-600', icon: <Clock className="h-3 w-3" />, label: 'Pending' },
      failed: { color: 'bg-destructive/10 text-destructive', icon: <XCircle className="h-3 w-3" />, label: 'Failed' },
      refunded: { color: 'bg-muted text-muted-foreground', icon: <AlertCircle className="h-3 w-3" />, label: 'Refunded' },
    };
    const configs = config[status];
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${configs.color}`}>
        {configs.icon}
        {configs.label}
      </span>
    );
  };
  
  // Get payment method icon
  const getMethodIcon = (method: Payment['paymentMethod']) => {
    const icons = {
      'Bank Transfer': <Building className="h-4 w-4" />,
      'M-Pesa': <Wallet className="h-4 w-4" />,
      'Cash': <Banknote className="h-4 w-4" />,
      'Check': <FileText className="h-4 w-4" />,
      'Card': <CreditCard className="h-4 w-4" />,
      'Other': <Receipt className="h-4 w-4" />,
    };
    return icons[method] || <Receipt className="h-4 w-4" />;
  };
  
  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };
  
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Handle export
  const handleExportCSV = () => {
    const headers = ['Paid On', 'Reference No', 'Amount', 'Payment Method', 'Payment For', 'Status', 'Location', 'Added By'];
    const rows = filteredPayments.map(p => [
      p.paidOn,
      p.referenceNo,
      p.amount.toString(),
      p.paymentMethod,
      p.paymentFor,
      p.status,
      p.locationName,
      p.addedBy
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments_${supplier.name}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleExportEmail = () => {
    window.location.href = `mailto:?subject=Payment Report - ${supplier.name}&body=Please find attached the payment report for ${supplier.name}.`;
  };
  
  const handleExportWhatsApp = () => {
    const message = `💳 Payment Report - ${supplier.name}\n\n` +
      `💰 Total Payments: ${summary.totalPayments}\n` +
      `💵 Total Amount: ${formatCurrency(summary.totalAmount)}\n` +
      `✅ Completed: ${formatCurrency(summary.completedAmount)}\n` +
      `⏳ Pending: ${formatCurrency(summary.pendingAmount)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };
  
  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setMethodFilter('all');
    setLocationFilter('all');
  };
  
  const handleSubmit = () => {
    console.log('Saving payment:', formData);
    setShowAddModal(false);
    setEditingPayment(null);
    setFormData({
      paidOn: new Date().toISOString().split('T')[0],
      referenceNo: '',
      amount: 0,
      paymentMethod: 'Bank Transfer',
      paymentFor: '',
      status: 'completed',
      locationId: '',
      notes: '',
      transactionId: ''
    });
  };
  
  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setFormData(payment);
    setShowAddModal(true);
    setShowActions(null);
  };
  
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      console.log('Deleting payment:', id);
      setShowActions(null);
    }
  };
  
  const handleView = (payment: Payment) => {
    setViewingPayment(payment);
  };
  
  return (
    <div className="space-y-6">
      {/* Description */}
      <div className="rounded-xl border border-border bg-gradient-to-r from-primary/5 via-transparent to-transparent p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Payment Management</h4>
            <p className="text-sm text-muted-foreground">
              Track all payments made to {supplier.name}. Monitor payment status, view payment history, 
              and manage outstanding balances. Use filters to analyze payment patterns and ensure timely settlements.
            </p>
          </div>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard 
          title="Total Payments" 
          value={summary.totalPayments.toString()} 
          icon={<Receipt className="h-4 w-4" />}
          color="primary"
        />
        <SummaryCard 
          title="Total Amount" 
          value={formatCurrency(summary.totalAmount)} 
          icon={<CreditCard className="h-4 w-4" />}
          color="primary"
        />
        <SummaryCard 
          title="Completed" 
          value={formatCurrency(summary.completedAmount)} 
          icon={<CheckCircle className="h-4 w-4" />}
          color="success"
        />
        <SummaryCard 
          title="Pending" 
          value={formatCurrency(summary.pendingAmount)} 
          icon={<Clock className="h-4 w-4" />}
          color={summary.pendingAmount > 0 ? 'destructive' : 'success'}
        />
      </div>
      
      {/* Header with Add Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingPayment(null);
              setFormData({
                paidOn: new Date().toISOString().split('T')[0],
                referenceNo: '',
                amount: 0,
                paymentMethod: 'Bank Transfer',
                paymentFor: '',
                status: 'completed',
                locationId: '',
                notes: '',
                transactionId: ''
              });
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Record Payment
          </button>
        </div>
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
              <label className="text-xs font-medium text-muted-foreground">Payment Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
            
            <div>
              <label className="text-xs font-medium text-muted-foreground">Payment Method</label>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
              >
                <option value="all">All Methods</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="M-Pesa">M-Pesa</option>
                <option value="Cash">Cash</option>
                <option value="Check">Check</option>
                <option value="Card">Card</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="text-xs font-medium text-muted-foreground">Business Location</label>
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
              <label className="text-xs font-medium text-muted-foreground">Search</label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search payments..."
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
              <span className="ml-4 text-sm text-muted-foreground">
                {filteredPayments.length} payments found
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* Payments Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border bg-gradient-to-r from-primary/5 via-transparent to-transparent px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">
            Payment History
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {filteredPayments.length} payments
            </span>
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-surface-alt">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Paid On</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Reference No</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground whitespace-nowrap">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Payment Method</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Payment For</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-surface-alt/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(payment.paidOn)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground whitespace-nowrap">
                      {payment.referenceNo}
                      {payment.transactionId && (
                        <p className="text-xs text-muted-foreground">TX: {payment.transactionId}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-foreground whitespace-nowrap">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getMethodIcon(payment.paymentMethod)}
                        <span className="text-sm text-foreground">{payment.paymentMethod}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground max-w-[150px] truncate">
                      {payment.paymentFor}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowActions(showActions === payment.id ? null : payment.id)}
                          className="rounded-lg p-1.5 hover:bg-surface-alt transition-colors"
                        >
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </button>
                        {showActions === payment.id && (
                          <div className="absolute right-0 z-10 mt-1 w-36 rounded-lg border border-border bg-card shadow-lg">
                            <div className="divide-y divide-border p-1">
                              <button
                                onClick={() => handleView(payment)}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-surface-alt"
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </button>
                              <button
                                onClick={() => handleEdit(payment)}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-surface-alt"
                              >
                                <Edit className="h-4 w-4" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(payment.id)}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No payments found matching the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Add/Edit Payment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-[70%] max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-border bg-card px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">
                  {editingPayment ? 'Edit' : 'Record'} Payment
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingPayment(null);
                  }}
                  className="rounded-lg p-2 hover:bg-surface-alt transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Paid On */}
                <div>
                  <label className="text-sm font-medium text-foreground">Paid On *</label>
                  <input
                    type="datetime-local"
                    value={formData.paidOn || ''}
                    onChange={(e) => setFormData({ ...formData, paidOn: e.target.value })}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground"
                  />
                </div>
                
                {/* Reference No */}
                <div>
                  <label className="text-sm font-medium text-foreground">Reference No *</label>
                  <input
                    type="text"
                    value={formData.referenceNo || ''}
                    onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value })}
                    placeholder="e.g., PAY-0001"
                    className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                
                {/* Amount */}
                <div>
                  <label className="text-sm font-medium text-foreground">Amount *</label>
                  <input
                    type="number"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                    placeholder="0.00"
                    className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                
                {/* Payment Method */}
                <div>
                  <label className="text-sm font-medium text-foreground">Payment Method *</label>
                  <select
                    value={formData.paymentMethod || 'Bank Transfer'}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as Payment['paymentMethod'] })}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="M-Pesa">M-Pesa</option>
                    <option value="Cash">Cash</option>
                    <option value="Check">Check</option>
                    <option value="Card">Card</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                {/* Payment For */}
                <div className="col-span-2">
                  <label className="text-sm font-medium text-foreground">Payment For *</label>
                  <input
                    type="text"
                    value={formData.paymentFor || ''}
                    onChange={(e) => setFormData({ ...formData, paymentFor: e.target.value })}
                    placeholder="e.g., Purchase Order #PO-2401"
                    className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                
                {/* Status */}
                <div>
                  <label className="text-sm font-medium text-foreground">Status</label>
                  <select
                    value={formData.status || 'completed'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Payment['status'] })}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground"
                  >
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
                
                {/* Location */}
                <div>
                  <label className="text-sm font-medium text-foreground">Location</label>
                  <select
                    value={formData.locationId || ''}
                    onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground"
                  >
                    <option value="">Select Location</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.locationName}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Transaction ID */}
                <div>
                  <label className="text-sm font-medium text-foreground">Transaction ID</label>
                  <input
                    type="text"
                    value={formData.transactionId || ''}
                    onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                    placeholder="e.g., TX-2026-07-08-001"
                    className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                
                {/* Notes */}
                <div className="col-span-2">
                  <label className="text-sm font-medium text-foreground">Notes</label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Add any additional notes..."
                    rows={3}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none"
                  />
                </div>
              </div>
              
              {/* Actions */}
              <div className="mt-6 flex justify-end gap-3 border-t border-border pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingPayment(null);
                  }}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-alt"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  {editingPayment ? 'Update' : 'Record'} Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* View Payment Modal */}
      {viewingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-[50%] max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-border bg-card px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-bold text-foreground">Payment Details</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingPayment(null)}
                  className="rounded-lg p-2 hover:bg-surface-alt transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Reference No</p>
                  <p className="text-sm font-medium text-foreground">{viewingPayment.referenceNo}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(viewingPayment.status)}</div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="text-sm font-bold text-foreground">{formatCurrency(viewingPayment.amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Payment Method</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getMethodIcon(viewingPayment.paymentMethod)}
                    <span className="text-sm text-foreground">{viewingPayment.paymentMethod}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Paid On</p>
                  <p className="text-sm text-foreground">{formatDateTime(viewingPayment.paidOn)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="text-sm text-foreground">{viewingPayment.locationName}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Payment For</p>
                  <p className="text-sm text-foreground">{viewingPayment.paymentFor}</p>
                </div>
                {viewingPayment.transactionId && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Transaction ID</p>
                    <p className="text-sm font-mono text-foreground">{viewingPayment.transactionId}</p>
                  </div>
                )}
                {viewingPayment.notes && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Notes</p>
                    <p className="text-sm text-foreground">{viewingPayment.notes}</p>
                  </div>
                )}
                {viewingPayment.dueDate && (
                  <div>
                    <p className="text-xs text-muted-foreground">Due Date</p>
                    <p className="text-sm text-foreground">{formatDate(viewingPayment.dueDate)}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Added By</p>
                  <p className="text-sm text-foreground">{viewingPayment.addedBy}</p>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setViewingPayment(null)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-alt"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewingPayment(null);
                    handleEdit(viewingPayment);
                  }}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <Edit className="h-4 w-4 inline mr-2" />
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
