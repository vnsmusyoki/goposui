import type { ReactNode } from 'react';
import { useState, useMemo } from 'react';
import { 
  Activity, 
  CalendarClock, 
  UserCheck, 
  Search, 
  Download, 
  Mail, 
  MessageCircle, 
  Printer,
  Filter,
  RefreshCw,
  X,
  Clock,
  User,
  FileText,
  Package,
  CreditCard,
  Edit,
  Trash2,
  Plus,
  MoreVertical,
  Eye,
  CheckCircle,
  AlertCircle,
  Bell,
  Calendar,
  MessageSquare,
  Truck,
  DollarSign,
  Tag,
  Users,
  Settings,
  Archive
} from 'lucide-react';
import type { SupplierProfileData } from './supplierProfileTypes';
import { useBusinessCurrency } from '@/business/businessStore';
import DatePickerField from '@/components/forms/DatePickerField';

type Props = {
  supplier: SupplierProfileData;
};

type Activity = {
  id: string;
  date: string;
  action: string;
  type: 'purchase' | 'payment' | 'note' | 'document' | 'status' | 'profile' | 'stock' | 'system';
  by: string;
  userId: string;
  note: string;
  metadata?: {
    entityId?: string;
    entityType?: string;
    oldValue?: string;
    newValue?: string;
  };
  locationId?: string;
  locationName?: string;
  ipAddress?: string;
  userAgent?: string;
};

// Mock data
const mockActivities: Activity[] = [
  {
    id: '1',
    date: '2026-07-10T10:30:00',
    action: 'Purchase order received',
    type: 'purchase',
    by: 'John Doe',
    userId: 'user-1',
    note: 'PO-2401 updated to received status. All items delivered and verified.',
    metadata: {
      entityId: 'PO-2401',
      entityType: 'purchase_order',
      oldValue: 'pending',
      newValue: 'received'
    },
    locationId: 'loc-1',
    locationName: 'Warehouse A',
    ipAddress: '192.168.1.1',
    userAgent: 'Chrome/Windows'
  },
  {
    id: '2',
    date: '2026-07-08T14:15:00',
    action: 'Payment logged',
    type: 'payment',
    by: 'Jane Smith',
    userId: 'user-2',
    note: 'Bank transfer of $5,000 confirmed for PO-2401. Transaction ID: TX-2026-07-08-001',
    metadata: {
      entityId: 'PAY-4812',
      entityType: 'payment',
      newValue: 'completed'
    },
    locationId: 'loc-2',
    locationName: 'Warehouse B',
    ipAddress: '192.168.1.2',
    userAgent: 'Firefox/Windows'
  },
  {
    id: '3',
    date: '2026-07-06T09:45:00',
    action: 'Supplier note added',
    type: 'note',
    by: 'Mike Johnson',
    userId: 'user-3',
    note: 'Follow up on delivery schedule for next month. Supplier confirmed availability.',
    metadata: {
      entityType: 'note'
    },
    locationId: 'loc-1',
    locationName: 'Warehouse A',
    ipAddress: '192.168.1.3',
    userAgent: 'Safari/Mac'
  },
  {
    id: '4',
    date: '2026-07-05T11:20:00',
    action: 'Supplier profile updated',
    type: 'profile',
    by: 'Sarah Wilson',
    userId: 'user-4',
    note: 'Updated supplier tier from "Gold" to "Platinum" based on performance metrics.',
    metadata: {
      entityType: 'profile',
      oldValue: 'Gold',
      newValue: 'Platinum'
    },
    locationId: 'loc-3',
    locationName: 'Warehouse C',
    ipAddress: '192.168.1.4',
    userAgent: 'Chrome/Mac'
  },
  {
    id: '5',
    date: '2026-07-03T16:30:00',
    action: 'Stock level updated',
    type: 'stock',
    by: 'John Doe',
    userId: 'user-1',
    note: 'Received 500 units of Maize Flour 1kg. Stock level updated from 0 to 420.',
    metadata: {
      entityId: 'MF-001-1KG',
      entityType: 'stock_item',
      oldValue: '0',
      newValue: '420'
    },
    locationId: 'loc-1',
    locationName: 'Warehouse A',
    ipAddress: '192.168.1.1',
    userAgent: 'Chrome/Windows'
  },
  {
    id: '6',
    date: '2026-07-02T13:00:00',
    action: 'Payment status changed',
    type: 'payment',
    by: 'Jane Smith',
    userId: 'user-2',
    note: 'Payment for PO-2394 status updated from "Pending" to "Completed" after funds cleared.',
    metadata: {
      entityId: 'PAY-4779',
      entityType: 'payment',
      oldValue: 'pending',
      newValue: 'completed'
    },
    locationId: 'loc-2',
    locationName: 'Warehouse B',
    ipAddress: '192.168.1.2',
    userAgent: 'Firefox/Windows'
  },
  {
    id: '7',
    date: '2026-07-01T08:30:00',
    action: 'Document uploaded',
    type: 'document',
    by: 'Mike Johnson',
    userId: 'user-3',
    note: 'Uploaded new supplier agreement for 2026 fiscal year. Contract #AG-2026-001',
    metadata: {
      entityId: 'AG-2026-001',
      entityType: 'document'
    },
    locationId: 'loc-1',
    locationName: 'Warehouse A',
    ipAddress: '192.168.1.3',
    userAgent: 'Safari/Mac'
  },
  {
    id: '8',
    date: '2026-06-28T15:20:00',
    action: 'Supplier status changed',
    type: 'status',
    by: 'Sarah Wilson',
    userId: 'user-4',
    note: 'Supplier status updated from "Active" to "Suspended" pending compliance review.',
    metadata: {
      entityType: 'profile',
      oldValue: 'Active',
      newValue: 'Suspended'
    },
    locationId: 'loc-3',
    locationName: 'Warehouse C',
    ipAddress: '192.168.1.4',
    userAgent: 'Chrome/Mac'
  },
  {
    id: '9',
    date: '2026-06-25T11:45:00',
    action: 'Purchase order created',
    type: 'purchase',
    by: 'John Doe',
    userId: 'user-1',
    note: 'Created purchase order PO-2410 for priority delivery. Total: $9,600',
    metadata: {
      entityId: 'PO-2410',
      entityType: 'purchase_order',
      newValue: 'created'
    },
    locationId: 'loc-1',
    locationName: 'Warehouse A',
    ipAddress: '192.168.1.1',
    userAgent: 'Chrome/Windows'
  },
  {
    id: '10',
    date: '2026-06-22T09:00:00',
    action: 'System notification',
    type: 'system',
    by: 'System',
    userId: 'system',
    note: 'System alert: Supplier performance score dropped below threshold. Review required.',
    locationId: 'loc-2',
    locationName: 'Warehouse B',
    ipAddress: '127.0.0.1',
    userAgent: 'System'
  }
];

export default function SupplierProfileActivitiesTab({ supplier }: Props) {
  const { formatCurrency } = useBusinessCurrency();
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showActions, setShowActions] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form state for adding activity
  const [formData, setFormData] = useState<Partial<Activity>>({
    action: '',
    type: 'note',
    by: '',
    note: '',
    date: new Date().toISOString(),
    locationId: ''
  });
  
  // Filter activities
  const filteredActivities = useMemo(() => {
    let activities = [...mockActivities];
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      activities = activities.filter(a =>
        a.action.toLowerCase().includes(searchLower) ||
        a.note.toLowerCase().includes(searchLower) ||
        a.by.toLowerCase().includes(searchLower) ||
        a.locationName?.toLowerCase().includes(searchLower)
      );
    }
    
    // Type filter
    if (typeFilter !== 'all') {
      activities = activities.filter(a => a.type === typeFilter);
    }
    
    // Location filter
    if (locationFilter !== 'all') {
      activities = activities.filter(a => a.locationId === locationFilter);
    }
    
    // Date range filter
    if (dateRange.start && dateRange.end) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      activities = activities.filter(a => {
        const activityDate = new Date(a.date);
        return activityDate >= startDate && activityDate <= endDate;
      });
    }
    
    // Sort by date (most recent first)
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return activities;
  }, [searchTerm, typeFilter, locationFilter, dateRange]);
  
  // Calculate summary
  const summary = useMemo(() => {
    const totalActivities = filteredActivities.length;
    const typeCount = filteredActivities.reduce((acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalActivities,
      typeCount,
    };
  }, [filteredActivities]);
  
  // Get activity icon
  const getActivityIcon = (type: Activity['type']) => {
    const icons = {
      purchase: <Package className="h-4 w-4" />,
      payment: <CreditCard className="h-4 w-4" />,
      note: <MessageSquare className="h-4 w-4" />,
      document: <FileText className="h-4 w-4" />,
      status: <CheckCircle className="h-4 w-4" />,
      profile: <User className="h-4 w-4" />,
      stock: <Tag className="h-4 w-4" />,
      system: <Settings className="h-4 w-4" />,
    };
    return icons[type] || <Activity className="h-4 w-4" />;
  };
  
  // Get activity color
  const getActivityColor = (type: Activity['type']) => {
    const colors = {
      purchase: 'text-blue-500 bg-blue-500/10',
      payment: 'text-green-500 bg-green-500/10',
      note: 'text-amber-500 bg-amber-500/10',
      document: 'text-purple-500 bg-purple-500/10',
      status: 'text-orange-500 bg-orange-500/10',
      profile: 'text-indigo-500 bg-indigo-500/10',
      stock: 'text-cyan-500 bg-cyan-500/10',
      system: 'text-gray-500 bg-gray-500/10',
    };
    return colors[type] || 'text-primary bg-primary/10';
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
  
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(dateStr);
  };
  
  // Handle export
  const handleExportCSV = () => {
    const headers = ['Date', 'Action', 'Type', 'By', 'Note', 'Location'];
    const rows = filteredActivities.map(a => [
      a.date,
      a.action,
      a.type,
      a.by,
      a.note,
      a.locationName || ''
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activities_${supplier.name}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleExportEmail = () => {
    window.location.href = `mailto:?subject=Activity Report - ${supplier.name}&body=Please find attached the activity report for ${supplier.name}.`;
  };
  
  const handleExportWhatsApp = () => {
    const message = `📋 Activity Report - ${supplier.name}\n\n` +
      `📊 Total Activities: ${summary.totalActivities}\n` +
      `📦 Purchases: ${summary.typeCount.purchase || 0}\n` +
      `💳 Payments: ${summary.typeCount.payment || 0}\n` +
      `📝 Notes: ${summary.typeCount.note || 0}\n` +
      `📄 Documents: ${summary.typeCount.document || 0}\n` +
      `🔄 Status Updates: ${summary.typeCount.status || 0}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };
  
  const handleResetFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setLocationFilter('all');
    setDateRange({ start: '', end: '' });
  };
  
  const handleViewActivity = (activity: Activity) => {
    setSelectedActivity(activity);
    setShowActions(null);
  };
  
  const handleDeleteActivity = (id: string) => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      console.log('Deleting activity:', id);
      setShowActions(null);
    }
  };
  
  const handleAddActivity = () => {
    console.log('Adding activity:', formData);
    setShowAddModal(false);
    setFormData({
      action: '',
      type: 'note',
      by: '',
      note: '',
      date: new Date().toISOString(),
      locationId: ''
    });
  };
  
  return (
    <div className="space-y-6">
      {/* Description */}
      <div className="rounded-xl border border-border bg-gradient-to-r from-primary/5 via-transparent to-transparent p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Activity Log</h4>
            <p className="text-sm text-muted-foreground">
              Track all activities related to {supplier.name}. Monitor changes in purchases, payments, 
              documents, and profile updates. Maintain a complete audit trail for compliance and review purposes.
            </p>
          </div>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard 
          title="Total Activities" 
          value={summary.totalActivities.toString()} 
          icon={<Activity className="h-4 w-4" />}
          color="primary"
        />
        <SummaryCard 
          title="Purchases" 
          value={(summary.typeCount.purchase || 0).toString()} 
          icon={<Package className="h-4 w-4" />}
          color="blue"
        />
        <SummaryCard 
          title="Payments" 
          value={(summary.typeCount.payment || 0).toString()} 
          icon={<CreditCard className="h-4 w-4" />}
          color="success"
        />
        <SummaryCard 
          title="Notes & Documents" 
          value={((summary.typeCount.note || 0) + (summary.typeCount.document || 0)).toString()} 
          icon={<FileText className="h-4 w-4" />}
          color="amber"
        />
      </div>
      
      {/* Header with Add Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setFormData({
                action: '',
                type: 'note',
                by: '',
                note: '',
                date: new Date().toISOString(),
                locationId: ''
              });
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Log Activity
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
              <label className="text-xs font-medium text-muted-foreground">Activity Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
              >
                <option value="all">All Types</option>
                <option value="purchase">Purchases</option>
                <option value="payment">Payments</option>
                <option value="note">Notes</option>
                <option value="document">Documents</option>
                <option value="status">Status Updates</option>
                <option value="profile">Profile Changes</option>
                <option value="stock">Stock Updates</option>
                <option value="system">System Notifications</option>
              </select>
            </div>
            
            <div>
              <label className="text-xs font-medium text-muted-foreground">Location</label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
              >
                <option value="all">All Locations</option>
              </select>
            </div>
            
            <div>
              <label className="text-xs font-medium text-muted-foreground">Date Range - From</label>
              <div className="mt-1">
                <DatePickerField
                  value={dateRange.start}
                  onChange={(value) => setDateRange({ ...dateRange, start: value })}
                  placeholder="From"
                />
              </div>
            </div>
            
            <div>
              <label className="text-xs font-medium text-muted-foreground">Date Range - To</label>
              <div className="mt-1">
                <DatePickerField
                  value={dateRange.end}
                  onChange={(value) => setDateRange({ ...dateRange, end: value })}
                  placeholder="To"
                />
              </div>
            </div>
            
            <div>
              <label className="text-xs font-medium text-muted-foreground">Search</label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search activities..."
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
                {filteredActivities.length} activities found
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* Activities Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border bg-gradient-to-r from-primary/5 via-transparent to-transparent px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">
            Activity Timeline
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {filteredActivities.length} activities
            </span>
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-surface-alt">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Action</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">By</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Note</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredActivities.length > 0 ? (
                filteredActivities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-surface-alt/30 transition-colors group">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">{formatDate(activity.date)}</span>
                        <span className="text-xs text-muted-foreground/70">{formatRelativeTime(activity.date)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`rounded-lg p-1.5 ${getActivityColor(activity.type)}`}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <span className="text-sm font-medium text-foreground">{activity.action}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">
                        {activity.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm text-foreground">{activity.by}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-muted-foreground line-clamp-2 max-w-xs">
                        {activity.note}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowActions(showActions === activity.id ? null : activity.id)}
                          className="rounded-lg p-1.5 hover:bg-surface-alt transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </button>
                        {showActions === activity.id && (
                          <div className="absolute right-0 z-10 mt-1 w-36 rounded-lg border border-border bg-card shadow-lg">
                            <div className="divide-y divide-border p-1">
                              <button
                                onClick={() => handleViewActivity(activity)}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-surface-alt"
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </button>
                              <button
                                onClick={() => handleDeleteActivity(activity.id)}
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
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No activities found matching the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Add Activity Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-[60%] max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-border bg-card px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Log Activity</h2>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg p-2 hover:bg-surface-alt transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                {/* Action */}
                <div>
                  <label className="text-sm font-medium text-foreground">Action *</label>
                  <input
                    type="text"
                    value={formData.action || ''}
                    onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                    placeholder="e.g., Supplier note added"
                    className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                
                {/* Type */}
                <div>
                  <label className="text-sm font-medium text-foreground">Activity Type *</label>
                  <select
                    value={formData.type || 'note'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Activity['type'] })}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground"
                  >
                    <option value="purchase">Purchase</option>
                    <option value="payment">Payment</option>
                    <option value="note">Note</option>
                    <option value="document">Document</option>
                    <option value="status">Status Update</option>
                    <option value="profile">Profile Change</option>
                    <option value="stock">Stock Update</option>
                    <option value="system">System Notification</option>
                  </select>
                </div>
                
                {/* By */}
                <div>
                  <label className="text-sm font-medium text-foreground">Added By *</label>
                  <input
                    type="text"
                    value={formData.by || ''}
                    onChange={(e) => setFormData({ ...formData, by: e.target.value })}
                    placeholder="Enter name"
                    className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                
                {/* Note */}
                <div>
                  <label className="text-sm font-medium text-foreground">Note *</label>
                  <textarea
                    value={formData.note || ''}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    placeholder="Detailed description of the activity..."
                    rows={4}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none"
                  />
                </div>
                
                {/* Date */}
                <div>
                  <label className="text-sm font-medium text-foreground">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground"
                  />
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
                  </select>
                </div>
              </div>
              
              {/* Actions */}
              <div className="mt-6 flex justify-end gap-3 border-t border-border pt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-alt"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddActivity}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Log Activity
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* View Activity Modal */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-[50%] max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-border bg-card px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${getActivityColor(selectedActivity.type)}`}>
                    {getActivityIcon(selectedActivity.type)}
                  </div>
                  <h2 className="text-xl font-bold text-foreground">Activity Details</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedActivity(null)}
                  className="rounded-lg p-2 hover:bg-surface-alt transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Action</p>
                  <p className="text-sm font-medium text-foreground">{selectedActivity.action}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">
                    {selectedActivity.type}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date & Time</p>
                  <p className="text-sm text-foreground">{formatDateTime(selectedActivity.date)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Added By</p>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{selectedActivity.by}</span>
                  </div>
                </div>
                {selectedActivity.locationName && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-sm text-foreground">{selectedActivity.locationName}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Note</p>
                  <p className="text-sm text-foreground bg-surface-alt rounded-lg p-3 mt-1">
                    {selectedActivity.note}
                  </p>
                </div>
                {selectedActivity.metadata && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Metadata</p>
                    <div className="mt-1 rounded-lg border border-border bg-background p-3">
                      {selectedActivity.metadata.entityId && (
                        <div className="flex justify-between py-1">
                          <span className="text-xs text-muted-foreground">Entity ID:</span>
                          <span className="text-xs text-foreground font-mono">{selectedActivity.metadata.entityId}</span>
                        </div>
                      )}
                      {selectedActivity.metadata.entityType && (
                        <div className="flex justify-between py-1">
                          <span className="text-xs text-muted-foreground">Entity Type:</span>
                          <span className="text-xs text-foreground capitalize">{selectedActivity.metadata.entityType}</span>
                        </div>
                      )}
                      {selectedActivity.metadata.oldValue && (
                        <div className="flex justify-between py-1">
                          <span className="text-xs text-muted-foreground">Old Value:</span>
                          <span className="text-xs text-destructive">{selectedActivity.metadata.oldValue}</span>
                        </div>
                      )}
                      {selectedActivity.metadata.newValue && (
                        <div className="flex justify-between py-1">
                          <span className="text-xs text-muted-foreground">New Value:</span>
                          <span className="text-xs text-success">{selectedActivity.metadata.newValue}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {selectedActivity.ipAddress && (
                  <div>
                    <p className="text-xs text-muted-foreground">IP Address</p>
                    <p className="text-sm font-mono text-foreground">{selectedActivity.ipAddress}</p>
                  </div>
                )}
                {selectedActivity.userAgent && (
                  <div>
                    <p className="text-xs text-muted-foreground">User Agent</p>
                    <p className="text-xs text-muted-foreground">{selectedActivity.userAgent}</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedActivity(null)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-alt"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const activity = selectedActivity;
                    setSelectedActivity(null);
                    // Open edit modal with activity data
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
  color?: 'primary' | 'blue' | 'success' | 'amber' | 'destructive';
}) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    blue: 'bg-blue-500/10 text-blue-500',
    success: 'bg-success/10 text-success',
    amber: 'bg-amber-500/10 text-amber-600',
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
