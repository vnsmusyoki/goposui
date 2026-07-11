import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Select, { type StylesConfig } from 'react-select';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  Grid,
  List,
  Building2,
  Users,
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  RefreshCw,
  Download as DownloadIcon,
  Home,
  Sparkles,
  Store,
  Calendar,
  DollarSign,
  Activity,
  TrendingUp,
  TrendingDown,
  Shield,
  Clock,
  UserCheck,
  UserX,
  Package,
  LayoutDashboard,
  BarChart3,
  PieChart,
  Zap,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileText,
  Settings,
  Copy as CopyIcon,
  Filter,
} from 'lucide-react';

// ===================== TYPES =====================

type BusinessStatus = 'active' | 'suspended' | 'pending' | 'onboarding';

type BusinessTier = 'free' | 'pro' | 'enterprise' | 'premium';

type Business = {
  id: string;
  name: string;
  legalName: string;
  ein: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  industry: string;
  status: BusinessStatus;
  tier: BusinessTier;
  subscriptionStatus: 'paid' | 'overdue' | 'trialing' | 'canceled';
  totalUsers: number;
  totalLocations: number;
  totalProducts: number;
  totalOrders: number;
  monthlyRevenue: number;
  createdAt: string;
  lastActive: string;
  isVerified: boolean;
  isFeatured: boolean;
  flags: string[];
  supportTickets: number;
  apiCalls: number;
};

type StatusBadgeProps = {
  status: BusinessStatus;
};

type SubscriptionStatusBadgeProps = {
  status: Business['subscriptionStatus'];
};

type TierBadgeProps = {
  tier: BusinessTier;
};

type SelectOption<T extends string> = {
  value: T;
  label: string;
};

// ===================== STYLES =====================

const selectStyles: StylesConfig<any, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: 40,
    borderRadius: 8,
    borderColor: 'hsl(var(--border))',
    backgroundColor: 'hsl(var(--background))',
    boxShadow: state.isFocused ? '0 0 0 2px hsl(var(--primary) / 0.2)' : 'none',
    ':hover': {
      borderColor: 'hsl(var(--primary))',
    },
  }),
  valueContainer: (base) => ({
    ...base,
    paddingTop: 0,
    paddingBottom: 0,
  }),
  input: (base) => ({
    ...base,
    color: 'hsl(var(--foreground))',
  }),
  singleValue: (base) => ({
    ...base,
    color: 'hsl(var(--foreground))',
  }),
  placeholder: (base) => ({
    ...base,
    color: 'hsl(var(--muted-foreground))',
  }),
  menu: (base) => ({
    ...base,
    zIndex: 50,
    backgroundColor: 'hsl(var(--background))',
    border: '1px solid hsl(var(--border))',
    boxShadow: '0 18px 45px rgba(15, 23, 42, 0.12)',
  }),
  menuList: (base) => ({
    ...base,
    padding: 4,
  }),
  option: (base, state) => ({
    ...base,
    borderRadius: 6,
    backgroundColor: state.isSelected
      ? 'hsl(var(--primary))'
      : state.isFocused
        ? 'hsl(var(--muted))'
        : 'transparent',
    color: state.isSelected ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
    ':active': {
      backgroundColor: 'hsl(var(--primary) / 0.9)',
      color: 'hsl(var(--primary-foreground))',
    },
  }),
  indicatorsContainer: (base) => ({
    ...base,
    color: 'hsl(var(--muted-foreground))',
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: 'hsl(var(--muted-foreground))',
    ':hover': {
      color: 'hsl(var(--foreground))',
    },
  }),
  indicatorSeparator: (base) => ({
    ...base,
    backgroundColor: 'hsl(var(--border))',
  }),
};

// ===================== OPTIONS =====================

const statusOptions: SelectOption<'all' | 'active' | 'suspended' | 'pending' | 'onboarding'>[] = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'pending', label: 'Pending' },
  { value: 'onboarding', label: 'Onboarding' },
];

const tierOptions: SelectOption<'all' | 'free' | 'pro' | 'enterprise' | 'premium'>[] = [
  { value: 'all', label: 'All Tiers' },
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Pro' },
  { value: 'premium', label: 'Premium' },
  { value: 'enterprise', label: 'Enterprise' },
];

const sortOptions: SelectOption<'name' | 'createdAt' | 'totalUsers' | 'monthlyRevenue' | 'lastActive'>[] = [
  { value: 'name', label: 'Sort by Name' },
  { value: 'createdAt', label: 'Sort by Created' },
  { value: 'totalUsers', label: 'Sort by Users' },
  { value: 'monthlyRevenue', label: 'Sort by Revenue' },
  { value: 'lastActive', label: 'Sort by Activity' },
];

// ===================== BADGE COMPONENTS =====================

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const config = {
    active: { icon: CheckCircle, className: 'bg-success/10 text-success' },
    suspended: { icon: XCircle, className: 'bg-destructive/10 text-destructive' },
    pending: { icon: Clock, className: 'bg-warning/10 text-warning' },
    onboarding: { icon: Sparkles, className: 'bg-info/10 text-info' },
  };

  const { icon: Icon, className } = config[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      <Icon className="w-3 h-3 mr-1" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const SubscriptionStatusBadge = ({ status }: SubscriptionStatusBadgeProps) => {
  const config = {
    paid: { icon: CheckCircle, className: 'bg-success/10 text-success' },
    overdue: { icon: AlertCircle, className: 'bg-destructive/10 text-destructive' },
    trialing: { icon: Clock, className: 'bg-info/10 text-info' },
    canceled: { icon: XCircle, className: 'bg-muted text-muted-foreground' },
  };

  const { icon: Icon, className } = config[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      <Icon className="w-3 h-3 mr-1" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const TierBadge = ({ tier }: TierBadgeProps) => {
  const config = {
    free: 'bg-muted text-muted-foreground',
    pro: 'bg-primary/10 text-primary',
    premium: 'bg-warning/10 text-warning',
    enterprise: 'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config[tier]}`}>
      {tier.charAt(0).toUpperCase() + tier.slice(1)}
    </span>
  );
};

// ===================== MAIN COMPONENT =====================

export default function AdminBusinessesList() {
  const navigate = useNavigate();
  const shellCard = 'rounded-xl border border-border bg-card text-card-foreground shadow-sm';
  const primaryButton = 'rounded-lg bg-primary text-primary-foreground hover:bg-primary/90';
  const mutedIconButton = 'rounded hover:bg-surface-alt transition-colors text-muted-foreground';

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'totalUsers' | 'monthlyRevenue' | 'lastActive'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended' | 'pending' | 'onboarding'>('all');
  const [filterTier, setFilterTier] = useState<'all' | 'free' | 'pro' | 'enterprise' | 'premium'>('all');
  const [selectedTab, setSelectedTab] = useState<'businesses' | 'insights'>('businesses');
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [businessToDelete, setBusinessToDelete] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock data
  const [businesses, setBusinesses] = useState<Business[]>([
    {
      id: '1',
      name: 'TechCorp Solutions',
      legalName: 'TechCorp Solutions Inc.',
      ein: '12-3456789',
      email: 'admin@techcorp.com',
      phone: '+1 (555) 123-4567',
      website: 'techcorp.com',
      address: '123 Tech Blvd, Silicon Valley, CA 94025',
      industry: 'Technology',
      status: 'active',
      tier: 'enterprise',
      subscriptionStatus: 'paid',
      totalUsers: 245,
      totalLocations: 12,
      totalProducts: 1560,
      totalOrders: 23450,
      monthlyRevenue: 45000,
      createdAt: '2024-01-15T10:00:00Z',
      lastActive: '2026-07-11T08:30:00Z',
      isVerified: true,
      isFeatured: true,
      flags: ['high-growth', 'strategic'],
      supportTickets: 3,
      apiCalls: 1250000,
    },
    {
      id: '2',
      name: 'HealthPlus Medical',
      legalName: 'HealthPlus Medical Group',
      ein: '98-7654321',
      email: 'info@healthplus.com',
      phone: '+1 (555) 987-6543',
      website: 'healthplus.com',
      address: '456 Medical Center Dr, Boston, MA 02115',
      industry: 'Healthcare',
      status: 'active',
      tier: 'premium',
      subscriptionStatus: 'paid',
      totalUsers: 87,
      totalLocations: 5,
      totalProducts: 320,
      totalOrders: 8900,
      monthlyRevenue: 28000,
      createdAt: '2024-03-20T14:30:00Z',
      lastActive: '2026-07-10T15:45:00Z',
      isVerified: true,
      isFeatured: false,
      flags: [],
      supportTickets: 1,
      apiCalls: 450000,
    },
    {
      id: '3',
      name: 'RetailHub',
      legalName: 'RetailHub International',
      ein: '34-5678901',
      email: 'contact@retailhub.com',
      phone: '+1 (555) 456-7890',
      website: 'retailhub.com',
      address: '789 Commerce St, Chicago, IL 60607',
      industry: 'Retail',
      status: 'suspended',
      tier: 'pro',
      subscriptionStatus: 'overdue',
      totalUsers: 34,
      totalLocations: 3,
      totalProducts: 450,
      totalOrders: 5600,
      monthlyRevenue: 12000,
      createdAt: '2024-06-01T09:00:00Z',
      lastActive: '2026-06-28T11:20:00Z',
      isVerified: false,
      isFeatured: false,
      flags: ['payment-failed'],
      supportTickets: 12,
      apiCalls: 89000,
    },
    {
      id: '4',
      name: 'EduLearn Academy',
      legalName: 'EduLearn Academy LLC',
      ein: '56-7890123',
      email: 'support@edulearn.com',
      phone: '+1 (555) 234-5678',
      website: 'edulearn.com',
      address: '101 Education Way, Austin, TX 78701',
      industry: 'Education',
      status: 'pending',
      tier: 'free',
      subscriptionStatus: 'trialing',
      totalUsers: 12,
      totalLocations: 1,
      totalProducts: 45,
      totalOrders: 230,
      monthlyRevenue: 0,
      createdAt: '2026-07-01T16:00:00Z',
      lastActive: '2026-07-09T09:15:00Z',
      isVerified: false,
      isFeatured: false,
      flags: ['new-business'],
      supportTickets: 0,
      apiCalls: 12000,
    },
    {
      id: '5',
      name: 'FinSecure Banking',
      legalName: 'FinSecure Financial Services',
      ein: '78-9012345',
      email: 'admin@finsecure.com',
      phone: '+1 (555) 345-6789',
      website: 'finsecure.com',
      address: '202 Finance Plaza, New York, NY 10005',
      industry: 'Finance',
      status: 'active',
      tier: 'enterprise',
      subscriptionStatus: 'paid',
      totalUsers: 412,
      totalLocations: 18,
      totalProducts: 2340,
      totalOrders: 45600,
      monthlyRevenue: 89000,
      createdAt: '2023-11-01T08:00:00Z',
      lastActive: '2026-07-11T07:00:00Z',
      isVerified: true,
      isFeatured: true,
      flags: ['enterprise', 'high-value'],
      supportTickets: 5,
      apiCalls: 3200000,
    },
    {
      id: '6',
      name: 'GreenEco Energy',
      legalName: 'GreenEco Energy Solutions',
      ein: '90-1234567',
      email: 'info@greeneco.com',
      phone: '+1 (555) 567-8901',
      website: 'greeneco.com',
      address: '303 Renewable Way, Portland, OR 97201',
      industry: 'Energy',
      status: 'onboarding',
      tier: 'premium',
      subscriptionStatus: 'trialing',
      totalUsers: 8,
      totalLocations: 2,
      totalProducts: 120,
      totalOrders: 340,
      monthlyRevenue: 5000,
      createdAt: '2026-06-15T11:00:00Z',
      lastActive: '2026-07-08T13:30:00Z',
      isVerified: false,
      isFeatured: false,
      flags: ['onboarding'],
      supportTickets: 8,
      apiCalls: 25000,
    },
  ]);

  // Compute stats
  const stats = useMemo(() => ({
    total: businesses.length,
    active: businesses.filter(b => b.status === 'active').length,
    suspended: businesses.filter(b => b.status === 'suspended').length,
    pending: businesses.filter(b => b.status === 'pending').length,
    onboarding: businesses.filter(b => b.status === 'onboarding').length,
    totalRevenue: businesses.reduce((sum, b) => sum + b.monthlyRevenue, 0),
    totalUsers: businesses.reduce((sum, b) => sum + b.totalUsers, 0),
    overdueSubscriptions: businesses.filter(b => b.subscriptionStatus === 'overdue').length,
    flaggedBusinesses: businesses.filter(b => b.flags && b.flags.length > 0).length,
  }), [businesses]);

  // Health metrics
  const healthMetrics = useMemo(() => ({
    healthScore: 78, // Mock score out of 100
    growthRate: 12.5, // % growth
    churnRate: 3.2, // % churn
    avgSupportTickets: businesses.reduce((sum, b) => sum + b.supportTickets, 0) / businesses.length,
    avgApiCalls: businesses.reduce((sum, b) => sum + b.apiCalls, 0) / businesses.length,
    activeBusinesses: businesses.filter(b => b.status === 'active').length,
    inactiveBusinesses: businesses.filter(b => b.status !== 'active').length,
    revenueGrowth: 8.7,
    riskAlerts: businesses.filter(b => b.flags && b.flags.length > 0).length,
  }), [businesses]);

  // Filtered and sorted businesses
  const filteredBusinesses = useMemo(() => {
    let result = [...businesses];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(b =>
        b.name.toLowerCase().includes(searchLower) ||
        b.legalName.toLowerCase().includes(searchLower) ||
        b.email.toLowerCase().includes(searchLower) ||
        b.industry.toLowerCase().includes(searchLower) ||
        b.ein.includes(searchTerm)
      );
    }

    if (filterStatus !== 'all') {
      result = result.filter(b => b.status === filterStatus);
    }

    if (filterTier !== 'all') {
      result = result.filter(b => b.tier === filterTier);
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'totalUsers':
          comparison = a.totalUsers - b.totalUsers;
          break;
        case 'monthlyRevenue':
          comparison = a.monthlyRevenue - b.monthlyRevenue;
          break;
        case 'lastActive':
          comparison = new Date(a.lastActive).getTime() - new Date(b.lastActive).getTime();
          break;
        default:
          comparison = a.name.localeCompare(b.name);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [businesses, searchTerm, filterStatus, filterTier, sortBy, sortOrder]);

  // Handlers
  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const selectedStatusOption = useMemo(
    () => statusOptions.find((option) => option.value === filterStatus) ?? statusOptions[0],
    [filterStatus],
  );

  const selectedTierOption = useMemo(
    () => tierOptions.find((option) => option.value === filterTier) ?? tierOptions[0],
    [filterTier],
  );

  const selectedSortOption = useMemo(
    () => sortOptions.find((option) => option.value === sortBy) ?? sortOptions[0],
    [sortBy],
  );

  // Render Grid View
  const renderGridView = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredBusinesses.map(business => (
          <div
            key={business.id}
            className={`${shellCard} p-4 hover:shadow-md transition-shadow cursor-pointer group`}
            onClick={() => setSelectedBusiness(business)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="rounded-lg bg-primary/10 p-3 transition-colors group-hover:bg-primary/15">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <button className="rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-surface-alt">
                <MoreVertical className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <h3 className="mb-1 font-medium text-foreground truncate">
              {business.name}
            </h3>
            <p className="mb-2 text-sm text-muted-foreground truncate">
              {business.industry}
            </p>

            <div className="flex flex-wrap gap-2 mb-3">
              <StatusBadge status={business.status} />
              <TierBadge tier={business.tier} />
              {business.isFeatured && (
                <span className="inline-flex items-center rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Featured
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground border-t border-border pt-3">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{business.totalUsers} users</span>
              </div>
              <div className="flex items-center gap-1">
                <Store className="w-3 h-3" />
                <span>{business.totalLocations} locations</span>
              </div>
              <div className="flex items-center gap-1">
                <Package className="w-3 h-3" />
                <span>{business.totalProducts} products</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                <span>${business.monthlyRevenue.toLocaleString()}/mo</span>
              </div>
            </div>

            {business.flags && business.flags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1 border-t border-border pt-2">
                {business.flags.map((flag, idx) => (
                  <span key={idx} className="inline-flex items-center rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {flag.replace('-', ' ')}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render List View
  const renderListView = () => {
    return (
      <div className={`${shellCard} overflow-hidden`}>
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-surface-alt/60">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Business
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Industry
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Tier
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Users
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Revenue
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Subscription
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredBusinesses.map(business => (
              <tr
                key={business.id}
                className="cursor-pointer transition-colors hover:bg-surface-alt/70"
                onClick={() => setSelectedBusiness(business)}
              >
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{business.name}</p>
                    <p className="text-xs text-muted-foreground">{business.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {business.industry}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={business.status} />
                </td>
                <td className="px-4 py-3">
                  <TierBadge tier={business.tier} />
                </td>
                <td className="px-4 py-3 text-sm text-foreground">
                  {business.totalUsers}
                </td>
                <td className="px-4 py-3 text-sm text-foreground">
                  ${business.monthlyRevenue.toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <SubscriptionStatusBadge status={business.subscriptionStatus} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <button className={`p-1.5 ${mutedIconButton} hover:text-primary`}>
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className={`p-1.5 ${mutedIconButton} hover:text-primary`}>
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      className={`p-1.5 ${mutedIconButton} hover:text-destructive`}
                      onClick={() => {
                        setBusinessToDelete(business);
                        setShowDeleteModal(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Render Insights Tab
  const renderInsights = () => {
    return (
      <div className="space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`${shellCard} p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Health Score</p>
                <p className="text-2xl font-bold text-foreground">{healthMetrics.healthScore}/100</p>
              </div>
              <div className="rounded-lg bg-success/10 p-3">
                <Activity className="w-6 h-6 text-success" />
              </div>
            </div>
            <div className="mt-2 h-2 bg-muted rounded-full">
              <div className="h-2 bg-success rounded-full" style={{ width: `${healthMetrics.healthScore}%` }} />
            </div>
          </div>

          <div className={`${shellCard} p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Growth Rate</p>
                <p className="text-2xl font-bold text-foreground">{healthMetrics.growthRate}%</p>
              </div>
              <div className="rounded-lg bg-success/10 p-3">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">+2.3% from last month</p>
          </div>

          <div className={`${shellCard} p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Risk Alerts</p>
                <p className="text-2xl font-bold text-destructive">{healthMetrics.riskAlerts}</p>
              </div>
              <div className="rounded-lg bg-destructive/10 p-3">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="text-destructive">⚠ {businesses.filter(b => b.subscriptionStatus === 'overdue').length} overdue payments</span>
            </div>
          </div>

          <div className={`${shellCard} p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Support Tickets</p>
                <p className="text-2xl font-bold text-foreground">{healthMetrics.avgSupportTickets.toFixed(1)}</p>
              </div>
              <div className="rounded-lg bg-info/10 p-3">
                <FileText className="w-6 h-6 text-info" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {healthMetrics.avgSupportTickets > 3 ? '⚠ Above average' : '✓ Below average'}
            </p>
          </div>
        </div>

        {/* Business Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className={`${shellCard} p-4`}>
            <h3 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-2">
              <PieChart className="w-4 h-4 text-primary" />
              Status Distribution
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Active</span>
                  <span className="font-medium text-foreground">{stats.active}</span>
                </div>
                <div className="mt-1 h-2 bg-muted rounded-full">
                  <div className="h-2 bg-success rounded-full" style={{ width: `${(stats.active / stats.total) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Suspended</span>
                  <span className="font-medium text-foreground">{stats.suspended}</span>
                </div>
                <div className="mt-1 h-2 bg-muted rounded-full">
                  <div className="h-2 bg-destructive rounded-full" style={{ width: `${(stats.suspended / stats.total) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pending</span>
                  <span className="font-medium text-foreground">{stats.pending}</span>
                </div>
                <div className="mt-1 h-2 bg-muted rounded-full">
                  <div className="h-2 bg-warning rounded-full" style={{ width: `${(stats.pending / stats.total) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Onboarding</span>
                  <span className="font-medium text-foreground">{stats.onboarding}</span>
                </div>
                <div className="mt-1 h-2 bg-muted rounded-full">
                  <div className="h-2 bg-info rounded-full" style={{ width: `${(stats.onboarding / stats.total) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className={`${shellCard} p-4`}>
            <h3 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Revenue Overview
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Monthly Recurring Revenue</span>
                <span className="text-sm font-bold text-foreground">${stats.totalRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Average Revenue per Business</span>
                <span className="text-sm font-medium text-foreground">${(stats.totalRevenue / stats.total).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Revenue Growth</span>
                <span className="text-sm font-medium text-success">{healthMetrics.revenueGrowth}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Overdue Payments</span>
                <span className="text-sm font-medium text-destructive">{stats.overdueSubscriptions}</span>
              </div>
              <div className="pt-3 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tier Distribution</span>
                </div>
                <div className="mt-2 space-y-1">
                  {['free', 'pro', 'premium', 'enterprise'].map(tier => {
                    const count = businesses.filter(b => b.tier === tier).length;
                    const percentage = (count / stats.total) * 100;
                    return (
                      <div key={tier} className="flex items-center gap-2">
                        <TierBadge tier={tier as BusinessTier} />
                        <div className="flex-1 h-1.5 bg-muted rounded-full">
                          <div 
                            className="h-1.5 bg-primary rounded-full" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Risk & Flags */}
        <div className={`${shellCard} p-4`}>
          <h3 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            Businesses Needing Attention
          </h3>
          <div className="space-y-3">
            {businesses.filter(b => b.flags && b.flags.length > 0).length === 0 ? (
              <p className="text-sm text-muted-foreground">✅ All businesses are healthy</p>
            ) : (
              businesses.filter(b => b.flags && b.flags.length > 0).map(business => (
                <div key={business.id} className="flex items-center justify-between p-3 bg-warning/5 rounded-lg border border-warning/20">
                  <div>
                    <p className="text-sm font-medium text-foreground">{business.name}</p>
                    <div className="flex gap-2 mt-1">
                      {business.flags.map((flag, idx) => (
                        <span key={idx} className="inline-flex items-center rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {flag.replace('-', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button className={`${primaryButton} px-3 py-1 text-xs`}>
                    Review
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ===== HEADER ===== */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Building2 className="w-6 h-6 text-primary" />
            Businesses
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage all businesses on the platform • {stats.total} total businesses
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-sm ${primaryButton}`}
          >
            <Plus className="w-4 h-4" />
            New Business
          </button>
          <button className={`${shellCard} p-2 transition-colors hover:bg-surface-alt`}>
            <DownloadIcon className="w-5 h-5 text-primary" />
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            className={`${shellCard} p-2 transition-colors hover:bg-surface-alt`}
          >
            <RefreshCw className={`w-5 h-5 text-primary ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ===== TABS ===== */}
      <div className="mb-6">
        <div className="flex items-center gap-1 rounded-lg bg-surface-alt p-1 w-fit">
          <button
            onClick={() => setSelectedTab('businesses')}
            className={`flex items-center gap-2 px-4 py-2 rounded transition-all ${
              selectedTab === 'businesses'
                ? 'bg-background shadow text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            All Businesses
          </button>
          <button
            onClick={() => setSelectedTab('insights')}
            className={`flex items-center gap-2 px-4 py-2 rounded transition-all ${
              selectedTab === 'insights'
                ? 'bg-background shadow text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Health & Insights
          </button>
        </div>
      </div>

      {/* ===== TAB 1: BUSINESSES ===== */}
      {selectedTab === 'businesses' && (
        <>
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
            <div className={`${shellCard} p-3 text-center`}>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold text-foreground">{stats.total}</p>
            </div>
            <div className={`${shellCard} p-3 text-center border-success/20`}>
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="text-lg font-bold text-success">{stats.active}</p>
            </div>
            <div className={`${shellCard} p-3 text-center border-destructive/20`}>
              <p className="text-xs text-muted-foreground">Suspended</p>
              <p className="text-lg font-bold text-destructive">{stats.suspended}</p>
            </div>
            <div className={`${shellCard} p-3 text-center border-warning/20`}>
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-lg font-bold text-warning">{stats.pending}</p>
            </div>
            <div className={`${shellCard} p-3 text-center`}>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
              <p className="text-lg font-bold text-foreground">${stats.totalRevenue.toLocaleString()}</p>
            </div>
            <div className={`${shellCard} p-3 text-center border-destructive/20`}>
              <p className="text-xs text-muted-foreground">Overdue</p>
              <p className="text-lg font-bold text-destructive">{stats.overdueSubscriptions}</p>
            </div>
          </div>

          {/* ===== TOOLBAR ===== */}
          <div className={`${shellCard} p-4 mb-6`}>
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="flex-1 min-w-50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search businesses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex min-w-85 items-center gap-2">
                <div className="min-w-37.5">
                  <Select<SelectOption<'all' | 'active' | 'suspended' | 'pending' | 'onboarding'>, false>
                    instanceId="business-status-select"
                    isSearchable
                    isClearable={false}
                    options={statusOptions}
                    value={selectedStatusOption}
                    onChange={(option) => {
                      if (option) setFilterStatus(option.value);
                    }}
                    styles={selectStyles}
                    placeholder="All Status"
                  />
                </div>

                <div className="min-w-37.5">
                  <Select<SelectOption<'all' | 'free' | 'pro' | 'enterprise' | 'premium'>, false>
                    instanceId="business-tier-select"
                    isSearchable
                    isClearable={false}
                    options={tierOptions}
                    value={selectedTierOption}
                    onChange={(option) => {
                      if (option) setFilterTier(option.value);
                    }}
                    styles={selectStyles}
                    placeholder="All Tiers"
                  />
                </div>

                <div className="min-w-[160px]">
                  <Select<SelectOption<'name' | 'createdAt' | 'totalUsers' | 'monthlyRevenue' | 'lastActive'>, false>
                    instanceId="business-sort-select"
                    isSearchable
                    isClearable={false}
                    options={sortOptions}
                    value={selectedSortOption}
                    onChange={(option) => {
                      if (option) setSortBy(option.value);
                    }}
                    styles={selectStyles}
                    placeholder="Sort by"
                  />
                </div>

                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="rounded-lg border border-border bg-background p-2 transition-colors hover:bg-surface-alt"
                >
                  {sortOrder === 'asc' ?
                    <ArrowUp className="w-4 h-4 text-foreground" /> :
                    <ArrowDown className="w-4 h-4 text-foreground" />
                  }
                </button>
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-1 rounded-lg bg-surface-alt p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded transition-colors ${
                    viewMode === 'grid' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded transition-colors ${
                    viewMode === 'list' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}

          {/* ===== BUSINESSES LIST ===== */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredBusinesses.length === 0 ? (
            <div className={`${shellCard} flex h-64 flex-col items-center justify-center text-muted-foreground`}>
              <Building2 className="mb-3 h-12 w-12 text-muted-foreground/40" />
              <p className="text-lg font-medium">No businesses found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div>
              {viewMode === 'grid' && renderGridView()}
              {viewMode === 'list' && renderListView()}
            </div>
          )}

          {/* ===== FOOTER ===== */}
          <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
            <span>Showing {filteredBusinesses.length} of {businesses.length} businesses</span>
            <span>Last updated: {new Date().toLocaleString()}</span>
          </div>
        </>
      )}

      {/* ===== TAB 2: INSIGHTS ===== */}
      {selectedTab === 'insights' && renderInsights()}

      {/* ===== DELETE MODAL ===== */}
      {showDeleteModal && businessToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${shellCard} max-w-md w-full mx-4 p-6`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                Delete Business
              </h3>
            </div>
            <p className="mb-6 text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-semibold">{businessToDelete.name}</span>?
              This action cannot be undone and will affect {businessToDelete.totalUsers} users and {businessToDelete.totalProducts} products.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setBusinessToDelete(null);
                }}
                className="rounded-lg px-4 py-2 text-foreground transition-colors hover:bg-surface-alt"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle delete
                  setBusinesses(businesses.filter(b => b.id !== businessToDelete.id));
                  setShowDeleteModal(false);
                  setBusinessToDelete(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Business
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}