import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Select, { type StylesConfig } from 'react-select';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  Building2,
  Users,
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  ArrowUp,
  ArrowDown,
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
import { useAdminBusinesses } from '@/hooks/admin/businesses/useAdminBusinesses';

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
  status: string;
  tier: string;
  subscriptionStatus: string;
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
  status: string;
};

type SubscriptionStatusBadgeProps = {
  status: string;
};

type TierBadgeProps = {
  tier: string;
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

  const { icon: Icon, className } = config[status as keyof typeof config] ?? config.pending;
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

  const { icon: Icon, className } = config[status as keyof typeof config] ?? config.trialing;
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
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config[tier as keyof typeof config] ?? config.free}`}>
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
  const { businesses, isLoading, isSyncing, error, fetchBusinesses, syncBusinessModules } = useAdminBusinesses();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'totalUsers' | 'monthlyRevenue' | 'lastActive'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended' | 'pending' | 'onboarding'>('all');
  const [filterTier, setFilterTier] = useState<'all' | 'free' | 'pro' | 'enterprise' | 'premium'>('all');
  const [selectedTab, setSelectedTab] = useState<'businesses' | 'insights'>('insights');
  const [expandedBusinessId, setExpandedBusinessId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [businessToDelete, setBusinessToDelete] = useState<Business | null>(null);
  useEffect(() => {
    void fetchBusinesses();
  }, [fetchBusinesses]);

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

  const analytics = useMemo(() => {
    const total = businesses.length || 1;
    const activeCount = businesses.filter((business) => business.status === 'active').length;
    const onboardingCount = businesses.filter((business) => business.status === 'onboarding').length;
    const verifiedCount = businesses.filter((business) => business.isVerified).length;
    const riskCount = businesses.filter((business) => business.flags && business.flags.length > 0).length;
    const avgSupportTickets = businesses.reduce((sum, business) => sum + business.supportTickets, 0) / total;
    const avgApiCalls = businesses.reduce((sum, business) => sum + business.apiCalls, 0) / total;
    const avgUsers = businesses.reduce((sum, business) => sum + business.totalUsers, 0) / total;
    const avgLocations = businesses.reduce((sum, business) => sum + business.totalLocations, 0) / total;
    const healthScore = Math.round(
      (activeCount / total) * 45 +
      (verifiedCount / total) * 35 +
      (1 - Math.min(riskCount / total, 1)) * 20,
    );

    const monthLabels = new Map<string, number>();
    businesses.forEach((business) => {
      const key = new Date(business.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthLabels.set(key, (monthLabels.get(key) ?? 0) + 1);
    });

    const monthlyBusinessGrowth = Array.from(monthLabels.entries()).map(([label, value]) => ({ label, value }));
    const tierDistribution = ['free', 'pro', 'premium', 'enterprise'].map((tier) => ({
      tier,
      count: businesses.filter((business) => business.tier === tier).length,
    }));
    const industryDistribution = Object.values(
      businesses.reduce<Record<string, { label: string; count: number }>>((acc, business) => {
        const key = (business.industry || 'Unknown').trim() || 'Unknown';
        if (!acc[key]) {
          acc[key] = { label: key, count: 0 };
        }
        acc[key].count += 1;
        return acc;
      }, {}),
    )
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      healthScore: Math.min(Math.max(healthScore, 0), 100),
      activeRate: Math.round((activeCount / total) * 100),
      onboardingRate: Math.round((onboardingCount / total) * 100),
      avgSupportTickets,
      avgApiCalls,
      avgUsers,
      avgLocations,
      riskCount,
      monthlyBusinessGrowth,
      tierDistribution,
      industryDistribution,
    };
  }, [businesses]);

  const healthMetrics = analytics;

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
    void fetchBusinesses();
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

  const toggleBusinessSummary = (businessId: string) => {
    setExpandedBusinessId((currentId) => (currentId === businessId ? null : businessId));
  };

  // Render List View
  const renderListView = () => {
    return (
      <div className={`${shellCard} overflow-x-auto`}>
        <table className="min-w-[980px] w-full divide-y divide-border">
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
              <React.Fragment key={business.id}>
                <tr
                  className={`cursor-pointer transition-colors hover:bg-surface-alt/70 ${
                    expandedBusinessId === business.id ? 'bg-surface-alt/40' : ''
                  }`}
                  onClick={() => toggleBusinessSummary(business.id)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        className="mt-0.5 rounded p-1 text-muted-foreground transition-colors hover:bg-surface-alt hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBusinessSummary(business.id);
                        }}
                      >
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${
                            expandedBusinessId === business.id ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      <div>
                        <p className="text-sm font-medium text-foreground">{business.name}</p>
                        <p className="text-xs text-muted-foreground">{business.email}</p>
                      </div>
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
                      <button
                        type="button"
                        className={`p-1.5 ${mutedIconButton} hover:text-primary`}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/business-management/details/${business.id}`);
                        }}
                      >
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
                {expandedBusinessId === business.id && (
                  <tr className="bg-surface-alt/25">
                    <td colSpan={8} className="px-4 py-4">
                      <div className="grid gap-4 rounded-xl border border-border bg-background/80 p-4 md:grid-cols-2 xl:grid-cols-4">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Legal name</p>
                          <p className="mt-1 text-sm font-medium text-foreground">{business.legalName}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Business ID / EIN</p>
                          <p className="mt-1 text-sm font-medium text-foreground">{business.ein}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Primary contact</p>
                          <p className="mt-1 text-sm font-medium text-foreground">{business.phone}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Last active</p>
                          <p className="mt-1 text-sm font-medium text-foreground">{new Date(business.lastActive).toLocaleString()}</p>
                        </div>
                        <div className="md:col-span-2 xl:col-span-4">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Quick summary</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {business.name} is a {business.status} business in the {business.industry} category with {business.totalUsers} users,
                            {` ${business.totalLocations} locations, and ${business.totalProducts} products.`}
                          </p>
                        </div>
                        <div className="md:col-span-2 xl:col-span-4 flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-alt"
                            onClick={async (e) => {
                              e.stopPropagation();
                              const response = await syncBusinessModules(business.id);
                              if (response) {
                                toast.success(
                                  `${response.message} ${response.inserted_modules} modules and ${response.inserted_submodules} submodules added.`,
                                );
                              }
                            }}
                            disabled={isSyncing}
                          >
                            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                            {isSyncing ? 'Syncing...' : 'Sync Modules'}
                          </button>
                          <button
                            type="button"
                            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-alt"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/business-management/details/${business.id}`);
                            }}
                          >
                            View details
                          </button>
                          <button
                            type="button"
                            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedBusinessId(null);
                            }}
                          >
                            Collapse
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
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
                <p className="text-sm text-muted-foreground">Active Rate</p>
                <p className="text-2xl font-bold text-foreground">{healthMetrics.activeRate}%</p>
              </div>
              <div className="rounded-lg bg-success/10 p-3">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{stats.active} of {stats.total || 1} businesses are active</p>
          </div>

          <div className={`${shellCard} p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Users</p>
                <p className="text-2xl font-bold text-foreground">{healthMetrics.avgUsers.toFixed(1)}</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-3">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Per business across the live dataset</p>
          </div>

          <div className={`${shellCard} p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Risk Alerts</p>
                <p className="text-2xl font-bold text-destructive">{healthMetrics.riskCount}</p>
              </div>
              <div className="rounded-lg bg-destructive/10 p-3">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{stats.flaggedBusinesses} businesses need attention</p>
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
                  <div className="h-2 bg-success rounded-full" style={{ width: `${stats.total ? (stats.active / stats.total) * 100 : 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Suspended</span>
                  <span className="font-medium text-foreground">{stats.suspended}</span>
                </div>
                <div className="mt-1 h-2 bg-muted rounded-full">
                  <div className="h-2 bg-destructive rounded-full" style={{ width: `${stats.total ? (stats.suspended / stats.total) * 100 : 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pending</span>
                  <span className="font-medium text-foreground">{stats.pending}</span>
                </div>
                <div className="mt-1 h-2 bg-muted rounded-full">
                  <div className="h-2 bg-warning rounded-full" style={{ width: `${stats.total ? (stats.pending / stats.total) * 100 : 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Onboarding</span>
                  <span className="font-medium text-foreground">{stats.onboarding}</span>
                </div>
                <div className="mt-1 h-2 bg-muted rounded-full">
                  <div className="h-2 bg-info rounded-full" style={{ width: `${stats.total ? (stats.onboarding / stats.total) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className={`${shellCard} p-4`}>
            <h3 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Subscription & Tier Mix
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Monthly Recurring Revenue</span>
                <span className="text-sm font-bold text-foreground">${stats.totalRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Average Revenue per Business</span>
                <span className="text-sm font-medium text-foreground">${(stats.total ? stats.totalRevenue / stats.total : 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Average Stores per Business</span>
                <span className="text-sm font-medium text-success">{healthMetrics.avgLocations.toFixed(1)}</span>
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
                  {analytics.tierDistribution.map((tierItem) => {
                    const percentage = stats.total ? (tierItem.count / stats.total) * 100 : 0;
                    return (
                      <div key={tierItem.tier} className="flex items-center gap-2">
                        <TierBadge tier={tierItem.tier as BusinessTier} />
                        <div className="flex-1 h-1.5 bg-muted rounded-full">
                          <div 
                            className="h-1.5 bg-primary rounded-full" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{tierItem.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className={`${shellCard} p-4`}>
            <h3 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4 text-primary" />
              Business Growth by Month
            </h3>
            <div className="space-y-3">
              {analytics.monthlyBusinessGrowth.length === 0 ? (
                <p className="text-sm text-muted-foreground">No business records yet.</p>
              ) : (
                analytics.monthlyBusinessGrowth.map((point) => (
                  <div key={point.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{point.label}</span>
                      <span className="font-medium text-foreground">{point.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-primary to-primary/70"
                        style={{ width: `${Math.max(8, point.value * 20)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={`${shellCard} p-4`}>
            <h3 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-2">
              <PieChart className="w-4 h-4 text-primary" />
              Top Industries
            </h3>
            <div className="space-y-3">
              {analytics.industryDistribution.length === 0 ? (
                <p className="text-sm text-muted-foreground">No industries to display yet.</p>
              ) : (
                analytics.industryDistribution.map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="min-w-32 text-sm text-muted-foreground">{item.label}</div>
                    <div className="flex-1 h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-info"
                        style={{ width: `${(item.count / (analytics.industryDistribution[0]?.count || 1)) * 100}%` }}
                      />
                    </div>
                    <div className="w-8 text-right text-xs font-medium text-foreground">{item.count}</div>
                  </div>
                ))
              )}
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
            {businesses.filter((business) => business.flags && business.flags.length > 0).length === 0 ? (
              <p className="text-sm text-muted-foreground">All businesses are healthy</p>
            ) : (
              businesses.filter((business) => business.flags && business.flags.length > 0).map((business) => (
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
        <div className="flex w-fit items-end gap-6 border-b border-border">
        
          <button
            onClick={() => setSelectedTab('insights')}
            className={`relative flex items-center gap-2 px-1 py-3 text-sm font-medium transition-colors ${
              selectedTab === 'insights'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Health & Insights
            <span
              className={`absolute inset-x-0 -bottom-[1px] h-[3px] rounded-full transition-colors ${
                selectedTab === 'insights' ? 'bg-primary' : 'bg-transparent'
              }`}
            />
          </button>
            <button
            onClick={() => setSelectedTab('businesses')}
            className={`relative flex items-center gap-2 px-1 py-3 text-sm font-medium transition-colors ${
              selectedTab === 'businesses'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            All Businesses
            <span
              className={`absolute inset-x-0 -bottom-[1px] h-[3px] rounded-full transition-colors ${
                selectedTab === 'businesses' ? 'bg-primary' : 'bg-transparent'
              }`}
            />
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
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              {/* Search */}
              <div className="w-full lg:flex-1">
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
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap lg:w-auto lg:flex-nowrap lg:items-center">
                <div className="w-full sm:w-52 lg:w-52">
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
                    className="w-full"
                  />
                </div>

                <div className="w-full sm:w-52 lg:w-52">
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
                    className="w-full"
                  />
                </div>

                <div className="w-full sm:w-40 lg:w-40">
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
                    className="w-full"
                  />
                </div>

                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="self-start rounded-lg border border-border bg-background p-2 transition-colors hover:bg-surface-alt lg:self-auto"
                >
                  {sortOrder === 'asc' ?
                    <ArrowUp className="w-4 h-4 text-foreground" /> :
                    <ArrowDown className="w-4 h-4 text-foreground" />
                  }
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
            renderListView()
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
                    setShowDeleteModal(false);
                    setBusinessToDelete(null);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                Close
                </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
