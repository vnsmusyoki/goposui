import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Select, { type StylesConfig } from 'react-select';
import toast from 'react-hot-toast';
import { ApiError } from '@/lib/api';
import { normalizePhoneNumber } from '@/lib/phone';
import PhoneNumberInput from '@/components/forms/PhoneNumberInput';
import { useBusinessSuppliers, type BusinessSupplierRecord, type CreateBusinessSupplierInput } from '@/hooks/business/suppliers/useBusinessSuppliers';
import {
  Truck,
  Plus,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  Grid,
  List,
  Download as DownloadIcon,
  AlertCircle,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  MapPin,
  Building2,
  Package,
  DollarSign,
  Calendar,
  Star,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  Users,
  ShoppingBag,
  Clock,
  Award,
  FileText,
  CreditCard,
  AlertTriangle,
  Copy,
  Filter,
  Layers,
  Hash,
  User,
  Store,
  Globe,
  Link,
  MessageCircle,
  FileSpreadsheet,
  Save,
} from 'lucide-react';
import SettingsTabShell from '../settings/SettingsTabShell';

// ===================== TYPES =====================

type SupplierStatus = 'active' | 'inactive' | 'pending' | 'suspended';
type SupplierTier = 'preferred' | 'standard' | 'vip' | 'new';

type Supplier = {
  id: string;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  alternatePhone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  website: string;
  taxNumber: string;
  registrationNumber: string;
  status: SupplierStatus;
  tier: SupplierTier;
  rating: number; // 1-5
  totalPurchases: number;
  totalAmount: number;
  outstandingBalance: number;
  paymentTerms: string;
  leadTime: number; // days
  notes: string;
  categories: string[];
  paymentMethods: string[];
  bankName: string;
  bankAccount: string;
  bankBranch: string;
  contactPerson: string;
  contactPersonPhone: string;
  contactPersonEmail: string;
  isVerified: boolean;
  isFeatured: boolean;
  createdAt: string;
  lastOrderDate: string;
  lastPaymentDate: string;
};

type SelectOption = {
  value: string;
  label: string;
};

type ViewMode = 'grid' | 'list';
type SupplierType = 'individual' | 'business';
type SupplierPayTermType = 'days' | 'months';

type CreateSupplierForm = {
  supplierType: SupplierType;
  contactId: string;
  prefix: 'mr' | 'mrs' | 'miss' | '';
  firstName: string;
  middleName: string;
  lastName: string;
  businessName: string;
  mobile: string;
  alternateContactNumber: string;
  landline: string;
  email: string;
  taxNumber: string;
  openingBalance: string;
  payTermsType: SupplierPayTermType;
  payTermsValue: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  website: string;
  notes: string;
};

function getInitialSupplierForm(): CreateSupplierForm {
  return {
    supplierType: 'business',
    contactId: '',
    prefix: '',
    firstName: '',
    middleName: '',
    lastName: '',
    businessName: '',
    mobile: '',
    alternateContactNumber: '',
    landline: '',
    email: '',
    taxNumber: '',
    openingBalance: '0.00',
    payTermsType: 'days',
    payTermsValue: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    website: '',
    notes: '',
  };
}

function mapBusinessSupplierRecordToSupplier(record: BusinessSupplierRecord): Supplier {
  const displayName = record.name || record.businessName || 'Supplier';
  const companyName = record.companyName || record.businessName || displayName;
  const address = record.address || [record.addressLine1, record.addressLine2, record.city, record.state, record.country, record.zipCode]
    .filter(Boolean)
    .join(', ');
  const contactPerson = record.contactPerson || displayName;

  return {
    id: record.id,
    name: displayName,
    companyName,
    email: record.email,
    phone: record.phone || record.mobile,
    alternatePhone: record.alternatePhone || record.alternateContactNumber,
    address,
    city: record.city,
    state: record.state,
    country: record.country,
    zipCode: record.zipCode,
    website: record.website,
    taxNumber: record.taxNumber,
    registrationNumber: record.registrationNumber || record.contactId,
    status: record.status,
    tier: record.tier,
    rating: record.rating,
    totalPurchases: record.totalPurchases,
    totalAmount: record.totalAmount,
    outstandingBalance: record.outstandingBalance,
    paymentTerms: record.paymentTerms || `${record.payTermsValue} ${record.payTermsType}`,
    leadTime: record.leadTime,
    notes: record.notes,
    categories: record.categories ?? [],
    paymentMethods: record.paymentMethods ?? [],
    bankName: record.bankName ?? '',
    bankAccount: record.bankAccount ?? '',
    bankBranch: record.bankBranch ?? '',
    contactPerson,
    contactPersonPhone: record.contactPersonPhone || record.mobile,
    contactPersonEmail: record.contactPersonEmail || record.email,
    isVerified: record.isVerified,
    isFeatured: record.isFeatured,
    createdAt: record.createdAt,
    lastOrderDate: '',
    lastPaymentDate: '',
  };
}

function mapLegacyFormToCreateInput(form: CreateSupplierForm): CreateBusinessSupplierInput {
  return {
    supplierType: form.supplierType,
    contactId: form.contactId.trim(),
    prefix: form.prefix,
    firstName: form.firstName.trim(),
    middleName: form.middleName.trim(),
    lastName: form.lastName.trim(),
    businessName: form.businessName.trim(),
    mobile: form.mobile.trim(),
    alternateContactNumber: form.alternateContactNumber.trim(),
    landline: form.landline.trim(),
    email: form.email.trim(),
    taxNumber: form.taxNumber.trim(),
    openingBalance: Number(form.openingBalance || 0),
    payTermsType: form.payTermsType,
    payTermsValue: Number(form.payTermsValue || 0),
    addressLine1: form.addressLine1.trim(),
    addressLine2: form.addressLine2.trim(),
    city: form.city.trim(),
    state: form.state.trim(),
    country: form.country.trim(),
    zipCode: form.zipCode.trim(),
    website: form.website.trim(),
    notes: form.notes.trim(),
  };
}

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

const statusOptions: SelectOption[] = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' },
  { value: 'suspended', label: 'Suspended' },
];

const tierOptions: SelectOption[] = [
  { value: 'all', label: 'All Tiers' },
  { value: 'preferred', label: '⭐ Preferred' },
  { value: 'vip', label: '👑 VIP' },
  { value: 'standard', label: 'Standard' },
  { value: 'new', label: 'New' },
];

const sortOptions: SelectOption[] = [
  { value: 'name', label: 'Sort by Name' },
  { value: 'rating', label: 'Sort by Rating' },
  { value: 'totalAmount', label: 'Sort by Total Purchases' },
  { value: 'leadTime', label: 'Sort by Lead Time' },
  { value: 'createdAt', label: 'Sort by Created' },
];

// ===================== MAIN COMPONENT =====================

export default function Suppliers() {
  const navigate = useNavigate();
  const shellCard = 'rounded-xl border border-border bg-card text-card-foreground shadow-sm';
  const primaryButton = 'rounded-lg bg-primary text-primary-foreground hover:bg-primary/90';
  const mutedIconButton = 'rounded hover:bg-surface-alt transition-colors text-muted-foreground';
  const {
    suppliers: supplierRecords,
    isLoading,
    isSaving,
    error: supplierError,
    loadSuppliers,
    createSupplier,
    removeSupplierLocally,
    clearError,
  } = useBusinessSuppliers();

  const [activeTab, setActiveTab] = useState<'analytics' | 'list'>('analytics');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'totalAmount' | 'leadTime' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'pending' | 'suspended'>('all');
  const [filterTier, setFilterTier] = useState<'all' | 'preferred' | 'vip' | 'standard' | 'new'>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateSupplierForm>(() => getInitialSupplierForm());
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [openActionMenuPosition, setOpenActionMenuPosition] = useState<{
    top: number;
    left: number;
    placement: 'top' | 'bottom';
  } | null>(null);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);

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
  useEffect(() => {
    if (!supplierError) {
      return;
    }
    toast.error(supplierError);
  }, [supplierError]);

  const suppliers = useMemo(() => supplierRecords.map(mapBusinessSupplierRecordToSupplier), [supplierRecords]);

  // Compute stats
  const stats = useMemo(() => ({
    total: suppliers.length,
    active: suppliers.filter(s => s.status === 'active').length,
    pending: suppliers.filter(s => s.status === 'pending').length,
    suspended: suppliers.filter(s => s.status === 'suspended').length,
    preferred: suppliers.filter(s => s.tier === 'preferred').length,
    vip: suppliers.filter(s => s.tier === 'vip').length,
    totalPurchases: suppliers.reduce((sum, s) => sum + s.totalPurchases, 0),
    totalAmount: suppliers.reduce((sum, s) => sum + s.totalAmount, 0),
    outstandingBalance: suppliers.reduce((sum, s) => sum + s.outstandingBalance, 0),
    avgRating: suppliers.length > 0 ? suppliers.reduce((sum, s) => sum + s.rating, 0) / suppliers.length : 0,
    avgLeadTime: suppliers.length > 0 ? suppliers.reduce((sum, s) => sum + s.leadTime, 0) / suppliers.length : 0,
  }), [suppliers]);

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    let result = [...suppliers];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(searchLower) ||
        s.companyName.toLowerCase().includes(searchLower) ||
        s.email.toLowerCase().includes(searchLower) ||
        s.phone.includes(searchTerm) ||
        s.city.toLowerCase().includes(searchLower) ||
        s.contactPerson.toLowerCase().includes(searchLower)
      );
    }

    if (filterStatus !== 'all') {
      result = result.filter(s => s.status === filterStatus);
    }

    if (filterTier !== 'all') {
      result = result.filter(s => s.tier === filterTier);
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'rating':
          comparison = a.rating - b.rating;
          break;
        case 'totalAmount':
          comparison = a.totalAmount - b.totalAmount;
          break;
        case 'leadTime':
          comparison = a.leadTime - b.leadTime;
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        default:
          comparison = a.name.localeCompare(b.name);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [suppliers, searchTerm, filterStatus, filterTier, sortBy, sortOrder]);

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

  const validateCreateSupplierForm = () => {
    const errors: string[] = [];

    if (createForm.supplierType === 'individual') {
      if (!createForm.prefix.trim()) errors.push('Prefix is required for an individual supplier.');
      if (!createForm.firstName.trim()) errors.push('First name is required for an individual supplier.');
      if (!createForm.lastName.trim()) errors.push('Last name is required for an individual supplier.');
    }

    if (createForm.supplierType === 'business' && !createForm.businessName.trim()) {
      errors.push('Business name is required for a business supplier.');
    }

    const normalizedMobile = normalizePhoneNumber(createForm.mobile);
    if (!normalizedMobile) {
      errors.push('Mobile number is required.');
    } else if (normalizedMobile.length !== 10) {
      errors.push('Mobile number must start with 0 and contain 10 digits.');
    }
    if (!createForm.addressLine1.trim()) errors.push('Address line 1 is required.');
    if (!createForm.city.trim()) errors.push('City is required.');
    if (!createForm.country.trim()) errors.push('Country is required.');
    if (!createForm.payTermsType.trim()) errors.push('Pay terms type is required.');
    if (createForm.payTermsValue === '' || Number(createForm.payTermsValue) < 0) {
      errors.push('Pay terms value must be 0 or greater.');
    }
    if (Number(createForm.openingBalance || 0) < 0) {
      errors.push('Opening balance cannot be negative.');
    }
    if (createForm.email.trim() && !createForm.email.includes('@')) {
      errors.push('Email must be a valid email address.');
    }

    return errors;
  };

  const closeCreateSupplierModal = () => {
    setShowCreateModal(false);
    setCreateForm(getInitialSupplierForm());
    setFormErrors([]);
    clearError();
  };

  const handleCreateSupplierSubmit = async () => {
    const validationErrors = validateCreateSupplierForm();
    if (validationErrors.length > 0) {
      setFormErrors(validationErrors);
      toast.error('Please fix the validation errors before saving.');
      return;
    }

    try {
      await createSupplier(mapLegacyFormToCreateInput(createForm));
      toast.success('Supplier created successfully.');
      closeCreateSupplierModal();
    } catch (error) {
      if (error instanceof ApiError && error.data && typeof error.data === 'object' && 'errors' in error.data) {
        const apiErrors = ((error.data as Record<string, unknown>).errors ?? {}) as Record<string, string>;
        const nextErrors = Object.values(apiErrors).filter(Boolean);
        setFormErrors(nextErrors);
        return;
      }

      const message = error instanceof ApiError ? error.message : 'Unable to save supplier.';
      setFormErrors([message]);
    }
  };

  // Helper functions
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusBadge = (status: SupplierStatus) => {
    const config = {
      active: { icon: CheckCircle, className: 'bg-success/10 text-success' },
      inactive: { icon: XCircle, className: 'bg-muted text-muted-foreground' },
      pending: { icon: Clock, className: 'bg-warning/10 text-warning' },
      suspended: { icon: AlertCircle, className: 'bg-destructive/10 text-destructive' },
    };
    const { icon: Icon, className } = config[status];
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTierBadge = (tier: SupplierTier) => {
    const config = {
      preferred: 'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300',
      vip: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300',
      standard: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300',
      new: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-300',
    };
    const labels = {
      preferred: '⭐ Preferred',
      vip: '👑 VIP',
      standard: 'Standard',
      new: '🆕 New',
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config[tier]}`}>
        {labels[tier]}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleSupplierAction = (action: string, supplier: Supplier) => {
    setOpenActionMenuId(null);
    setOpenActionMenuPosition(null);

    switch (action) {
      case 'view':
        setSelectedSupplier(supplier);
        break;
      case 'delete':
        setSupplierToDelete(supplier);
        setShowDeleteModal(true);
        break;
      default:
        setSelectedSupplier(supplier);
        break;
    }
  };

  const toggleSupplierActionMenu = (supplierId: string, target: HTMLButtonElement) => {
    if (openActionMenuId === supplierId) {
      setOpenActionMenuId(null);
      setOpenActionMenuPosition(null);
      return;
    }

    const rect = target.getBoundingClientRect();
    const menuHeight = 344;
    const menuWidth = 240;
    const gap = 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const placement: 'top' | 'bottom' = spaceBelow < menuHeight && spaceAbove > spaceBelow ? 'top' : 'bottom';
    const top = placement === 'bottom' ? rect.bottom + gap : Math.max(rect.top - menuHeight - gap, gap);
    const left = Math.min(Math.max(rect.right - menuWidth, gap), window.innerWidth - menuWidth - gap);

    setOpenActionMenuId(supplierId);
    setOpenActionMenuPosition({ top, left, placement });
  };

  const openCreateSupplierModal = () => {
    setCreateForm(getInitialSupplierForm());
    setFormErrors([]);
    clearError();
    setShowCreateModal(true);
  };

  // Render Analytics Tab
  const renderAnalytics = () => {
    return (
      <div className="space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`${shellCard} p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Suppliers</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs text-success mt-1">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  +{Math.round(stats.total * 0.15)}% this month
                </p>
              </div>
              <div className="rounded-lg bg-primary/10 p-3">
                <Truck className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>

          <div className={`${shellCard} p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Purchases</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalPurchases}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(stats.totalAmount)} total value
                </p>
              </div>
              <div className="rounded-lg bg-success/10 p-3">
                <ShoppingBag className="w-6 h-6 text-success" />
              </div>
            </div>
          </div>

          <div className={`${shellCard} p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                <p className="text-2xl font-bold text-destructive">
                  {formatCurrency(stats.outstandingBalance)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Across {suppliers.filter(s => s.outstandingBalance > 0).length} suppliers
                </p>
              </div>
              <div className="rounded-lg bg-destructive/10 p-3">
                <CreditCard className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </div>

          <div className={`${shellCard} p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Rating</p>
                <p className="text-2xl font-bold text-foreground">{stats.avgRating.toFixed(1)} ⭐</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.avgLeadTime.toFixed(0)} days avg lead time
                </p>
              </div>
              <div className="rounded-lg bg-warning/10 p-3">
                <Star className="w-6 h-6 text-warning fill-current" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Status Distribution */}
          <div className={`${shellCard} p-4`}>
            <h3 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-2">
              <PieChart className="w-4 h-4 text-primary" />
              Status Distribution
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Active', value: stats.active, color: 'bg-success' },
                { label: 'Pending', value: stats.pending, color: 'bg-warning' },
                { label: 'Suspended', value: stats.suspended, color: 'bg-destructive' },
                { label: 'Inactive', value: suppliers.filter(s => s.status === 'inactive').length, color: 'bg-muted' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium text-foreground">{item.value}</span>
                  </div>
                  <div className="mt-1 h-2 bg-muted rounded-full">
                    <div
                      className={`h-2 ${item.color} rounded-full`}
                      style={{ width: `${stats.total > 0 ? (item.value / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tier Distribution */}
          <div className={`${shellCard} p-4`}>
            <h3 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Supplier Tiers
            </h3>
            <div className="space-y-3">
              {[
                { label: '⭐ Preferred', value: stats.preferred, color: 'bg-purple-500' },
                { label: '👑 VIP', value: stats.vip, color: 'bg-amber-500' },
                { label: 'Standard', value: suppliers.filter(s => s.tier === 'standard').length, color: 'bg-blue-500' },
                { label: '🆕 New', value: suppliers.filter(s => s.tier === 'new').length, color: 'bg-green-500' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium text-foreground">{item.value}</span>
                  </div>
                  <div className="mt-1 h-2 bg-muted rounded-full">
                    <div
                      className={`h-2 ${item.color} rounded-full`}
                      style={{ width: `${stats.total > 0 ? (item.value / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Suppliers */}
          <div className={`${shellCard} p-4 lg:col-span-2`}>
            <h3 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              Top Performing Suppliers
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="pb-2 font-medium">Supplier</th>
                    <th className="pb-2 font-medium text-center">Rating</th>
                    <th className="pb-2 font-medium text-right">Purchases</th>
                    <th className="pb-2 font-medium text-right">Total Value</th>
                    <th className="pb-2 font-medium text-center">Lead Time</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers
                    .sort((a, b) => b.rating - a.rating)
                    .slice(0, 5)
                    .map((supplier) => (
                      <tr key={supplier.id} className="border-b border-border last:border-0">
                        <td className="py-2">
                          <div>
                            <p className="font-medium text-foreground">{supplier.name}</p>
                            <p className="text-xs text-muted-foreground">{supplier.companyName}</p>
                          </div>
                        </td>
                        <td className="py-2 text-center">
                          <span className="font-semibold text-warning">{supplier.rating}</span>
                          <span className="text-muted-foreground">⭐</span>
                        </td>
                        <td className="py-2 text-right">{supplier.totalPurchases}</td>
                        <td className="py-2 text-right">{formatCurrency(supplier.totalAmount)}</td>
                        <td className="py-2 text-center">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            supplier.leadTime <= 3
                              ? 'bg-success/10 text-success'
                              : supplier.leadTime <= 5
                              ? 'bg-warning/10 text-warning'
                              : 'bg-destructive/10 text-destructive'
                          }`}>
                            {supplier.leadTime} days
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={`${shellCard} p-4`}>
          <h3 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Quick Actions
          </h3>
          <div className="flex flex-wrap gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-success/10 text-success rounded-lg hover:bg-success/20 transition-colors">
              <Plus className="w-4 h-4" />
              Add Supplier
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors">
              <FileText className="w-4 h-4" />
              Generate Report
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-warning/10 text-warning rounded-lg hover:bg-warning/20 transition-colors">
              <AlertTriangle className="w-4 h-4" />
              Review Pending ({stats.pending})
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500/20 transition-colors">
              <FileSpreadsheet className="w-4 h-4" />
              Export Data
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render Grid View
  const renderGridView = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredSuppliers.map((supplier) => (
          <div
            key={supplier.id}
            className={`${shellCard} p-4 hover:shadow-md transition-shadow cursor-pointer group`}
            onClick={() => setSelectedSupplier(supplier)}
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
              {supplier.name}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {supplier.companyName}
            </p>

            <div className="flex flex-wrap gap-2 my-3">
              {getStatusBadge(supplier.status)}
              {getTierBadge(supplier.tier)}
              {supplier.isVerified && (
                <span className="inline-flex items-center rounded-full bg-info/10 px-2.5 py-0.5 text-xs font-medium text-info">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </span>
              )}
            </div>

            <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border pt-3">
              <div className="flex items-center gap-2">
                <Star className="w-3 h-3 shrink-0 text-warning fill-current" />
                <span>{supplier.rating} ⭐</span>
                <span className="text-muted-foreground/60">•</span>
                <span>{supplier.totalPurchases} orders</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-3 h-3 shrink-0" />
                <span>{formatCurrency(supplier.totalAmount)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3 shrink-0" />
                <span>{supplier.leadTime} days lead time</span>
              </div>
              {supplier.categories.length > 0 && (
                <div className="flex items-center gap-2">
                  <Package className="w-3 h-3 shrink-0" />
                  <span className="truncate">{supplier.categories.slice(0, 2).join(', ')}</span>
                  {supplier.categories.length > 2 && (
                    <span className="text-muted-foreground/60">+{supplier.categories.length - 2}</span>
                  )}
                </div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-border flex items-center justify-end gap-1">
              <button
                className={`p-1.5 ${mutedIconButton} hover:text-primary`}
                onClick={(e) => e.stopPropagation()}
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                className={`p-1.5 ${mutedIconButton} hover:text-primary`}
                onClick={(e) => e.stopPropagation()}
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                className={`p-1.5 ${mutedIconButton} hover:text-destructive`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSupplierToDelete(supplier);
                  setShowDeleteModal(true);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render List View
  const renderListView = () => {
    return (
      <div ref={actionMenuRef} className={`${shellCard} max-h-[70vh] overflow-auto`}>
        <table className="min-w-[1280px] divide-y divide-border">
          <thead className="bg-surface-alt/60">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Supplier
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Contact
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Tier
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Rating
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Purchases
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total Value
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Lead Time
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredSuppliers.map((supplier) => (
              <tr
                key={supplier.id}
                className="cursor-pointer transition-colors hover:bg-surface-alt/70"
                onClick={() => setSelectedSupplier(supplier)}
              >
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{supplier.name}</p>
                    <p className="text-xs text-muted-foreground">{supplier.companyName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {supplier.categories.slice(0, 2).map((cat, idx) => (
                        <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-surface-alt rounded">
                          {cat}
                        </span>
                      ))}
                      {supplier.categories.length > 2 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{supplier.categories.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm text-foreground">
                      <Phone className="w-3 h-3 text-muted-foreground" />
                      {supplier.phone}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Mail className="w-3 h-3 text-muted-foreground" />
                      {supplier.email}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <User className="w-3 h-3 text-muted-foreground" />
                      {supplier.contactPerson}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {getStatusBadge(supplier.status)}
                </td>
                <td className="px-4 py-3">
                  {getTierBadge(supplier.tier)}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-semibold text-warning">{supplier.rating}</span>
                  <span className="text-muted-foreground">⭐</span>
                </td>
                <td className="px-4 py-3 text-right text-sm text-foreground">
                  {supplier.totalPurchases}
                </td>
                <td className="px-4 py-3 text-right text-sm font-medium text-foreground">
                  {formatCurrency(supplier.totalAmount)}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    supplier.leadTime <= 3
                      ? 'bg-success/10 text-success'
                      : supplier.leadTime <= 5
                      ? 'bg-warning/10 text-warning'
                      : 'bg-destructive/10 text-destructive'
                  }`}>
                    {supplier.leadTime} days
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="relative flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(event) => toggleSupplierActionMenu(supplier.id, event.currentTarget)}
                      className={`rounded p-1.5 ${mutedIconButton} hover:text-primary`}
                      aria-label="Open supplier actions"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {openActionMenuId === supplier.id && openActionMenuPosition && (
                      <div
                        ref={actionMenuRef}
                        className="fixed z-50 w-60 rounded-xl border border-border bg-background p-2 shadow-2xl shadow-black/10"
                        style={{
                          top: openActionMenuPosition.top,
                          left: openActionMenuPosition.left,
                        }}
                      >
                        <ActionMenuItem label="Pay" onClick={() => handleSupplierAction('pay', supplier)} />
                        <ActionMenuItem label="View" onClick={() => handleSupplierAction('view', supplier)} />
                        <ActionMenuItem label="Edit" onClick={() => handleSupplierAction('edit', supplier)} />
                        <ActionMenuItem label="Delete" destructive onClick={() => handleSupplierAction('delete', supplier)} />
                        <ActionMenuItem label="Deactivate" onClick={() => handleSupplierAction('deactivate', supplier)} />
                        <ActionMenuItem label="Ledger" onClick={() => handleSupplierAction('ledger', supplier)} />
                        <ActionMenuItem label="Purchases" onClick={() => handleSupplierAction('purchases', supplier)} />
                        <ActionMenuItem label="Stock Report" onClick={() => handleSupplierAction('stock-report', supplier)} />
                        <ActionMenuItem label="Document and Notes" onClick={() => handleSupplierAction('documents-notes', supplier)} />
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <SettingsTabShell
      title="Suppliers"
      description="Manage your suppliers and track their performance"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
            <Truck className="w-6 h-6 text-primary" />
            Supplier Management
          </h2>
          <p className="text-sm text-muted-foreground">
            {stats.total} suppliers • {stats.active} active • {stats.preferred} preferred
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openCreateSupplierModal}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-sm ${primaryButton}`}
          >
            <Plus className="w-4 h-4" />
            New Supplier
          </button>
          <button className={`${shellCard} p-2 transition-colors hover:bg-surface-alt`}>
            <DownloadIcon className="w-5 h-5 text-primary" />
          </button>
          <button
            type="button"
            onClick={() => {
              clearError();
              void loadSuppliers();
            }}
            className={`${shellCard} p-2 transition-colors hover:bg-surface-alt`}
          >
            <RefreshCw className={`w-5 h-5 text-primary ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

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
        <div className={`${shellCard} p-3 text-center border-warning/20`}>
          <p className="text-xs text-muted-foreground">Pending</p>
          <p className="text-lg font-bold text-warning">{stats.pending}</p>
        </div>
        <div className={`${shellCard} p-3 text-center border-destructive/20`}>
          <p className="text-xs text-muted-foreground">Suspended</p>
          <p className="text-lg font-bold text-destructive">{stats.suspended}</p>
        </div>
        <div className={`${shellCard} p-3 text-center border-purple-500/20`}>
          <p className="text-xs text-muted-foreground">⭐ Preferred</p>
          <p className="text-lg font-bold text-purple-500">{stats.preferred}</p>
        </div>
        <div className={`${shellCard} p-3 text-center border-amber-500/20`}>
          <p className="text-xs text-muted-foreground">👑 VIP</p>
          <p className="text-lg font-bold text-amber-500">{stats.vip}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-lg bg-surface-alt p-1 mb-6 w-fit">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded transition-all ${
            activeTab === 'analytics'
              ? 'bg-background shadow text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Analytics
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`flex items-center gap-2 px-4 py-2 rounded transition-all ${
            activeTab === 'list'
              ? 'bg-background shadow text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Truck className="w-4 h-4" />
          Suppliers List
        </button>
      </div>

      {/* Analytics Tab */}
      {activeTab === 'analytics' && renderAnalytics()}

      {/* Suppliers List Tab */}
      {activeTab === 'list' && (
        <>
          {/* Toolbar */}
          <div className={`${shellCard} p-4 mb-6`}>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search suppliers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="flex min-w-85 items-center gap-2">
                <div className="min-w-37.5">
                  <Select
                    instanceId="supplier-status-select"
                    isSearchable
                    isClearable={false}
                    options={statusOptions}
                    value={selectedStatusOption}
                    onChange={(option) => {
                      if (option) setFilterStatus(option.value as any);
                    }}
                    styles={selectStyles}
                    placeholder="All Status"
                  />
                </div>

                <div className="min-w-37.5">
                  <Select
                    instanceId="supplier-tier-select"
                    isSearchable
                    isClearable={false}
                    options={tierOptions}
                    value={selectedTierOption}
                    onChange={(option) => {
                      if (option) setFilterTier(option.value as any);
                    }}
                    styles={selectStyles}
                    placeholder="All Tiers"
                  />
                </div>

                <div className="min-w-[160px]">
                  <Select
                    instanceId="supplier-sort-select"
                    isSearchable
                    isClearable={false}
                    options={sortOptions}
                    value={selectedSortOption}
                    onChange={(option) => {
                      if (option) setSortBy(option.value as any);
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

          {/* Suppliers Content */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className={`${shellCard} flex h-64 flex-col items-center justify-center text-muted-foreground`}>
              <Truck className="mb-3 h-12 w-12 text-muted-foreground/40" />
              <p className="text-lg font-medium">No suppliers found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
              <button
                onClick={openCreateSupplierModal}
                className={`mt-4 flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${primaryButton}`}
              >
                <Plus className="w-4 h-4" />
                Add Your First Supplier
              </button>
            </div>
          ) : (
            <div>
              {viewMode === 'grid' ? renderGridView() : renderListView()}
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
            <span>Showing {filteredSuppliers.length} of {suppliers.length} suppliers</span>
            <span>Last updated: {new Date().toLocaleString()}</span>
          </div>
        </>
      )}

      {/* Delete Modal */}
      {showDeleteModal && supplierToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${shellCard} max-w-md w-full mx-4 p-6`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                Delete Supplier
              </h3>
            </div>
            <p className="mb-6 text-sm text-muted-foreground">
              Are you sure you want to delete{' '}
              <span className="font-semibold">{supplierToDelete.name}</span>?
              This action cannot be undone and will affect all purchase records.
            </p>
            {supplierToDelete.totalPurchases > 0 && (
              <div className="mb-4 rounded-lg border border-warning/20 bg-warning/10 p-3">
                <p className="flex items-start gap-2 text-xs text-warning">
                  <AlertTriangle className="w-4 h-4 mt-0.5" />
                  <span>
                    This supplier has {supplierToDelete.totalPurchases} purchase records.
                    Consider archiving instead of deleting.
                  </span>
                </p>
              </div>
            )}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSupplierToDelete(null);
                }}
                className="rounded-lg px-4 py-2 text-foreground transition-colors hover:bg-surface-alt"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  removeSupplierLocally(supplierToDelete.id);
                  setShowDeleteModal(false);
                  setSupplierToDelete(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Supplier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Supplier Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${shellCard} mx-4 w-[80vw] max-w-[80vw] p-6 max-h-[90vh] overflow-y-auto max-md:w-full max-md:max-w-[calc(100vw-2rem)]`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" />
                Add New Supplier
              </h3>
            <button
              onClick={() => {
                closeCreateSupplierModal();
              }}
              className="p-1 rounded hover:bg-surface-alt transition-colors"
            >
                <XCircle className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {formErrors.length > 0 && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <p className="mb-2 font-semibold">Please fix the following errors:</p>
                <ul className="space-y-1">
                  {formErrors.map((error) => (
                    <li key={error}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Basic Info */}
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field label="Supplier Type" required>
                  <select
                    value={createForm.supplierType}
                    onChange={(event) =>
                      setCreateForm((current) => ({
                        ...current,
                        supplierType: event.target.value as SupplierType,
                      }))
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="business">Business</option>
                    <option value="individual">Individual</option>
                  </select>
                </Field>
                <Field label="Contact ID">
                  <input
                    value={createForm.contactId}
                    onChange={(event) => setCreateForm((current) => ({ ...current, contactId: event.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Leave empty to auto-generate"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Optional. If left empty, the system will generate one automatically.</p>
                </Field>
                <Field label="Email">
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(event) => setCreateForm((current) => ({ ...current, email: event.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="supplier@example.com"
                  />
                </Field>
              </div>

              {createForm.supplierType === 'individual' ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <Field label="Prefix">
                    <select
                      value={createForm.prefix}
                      onChange={(event) =>
                        setCreateForm((current) => ({
                          ...current,
                          prefix: event.target.value as CreateSupplierForm['prefix'],
                        }))
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select prefix</option>
                      <option value="mr">Mr</option>
                      <option value="mrs">Mrs</option>
                      <option value="miss">Miss</option>
                    </select>
                  </Field>
                  <Field label="First Name" required>
                    <input
                      value={createForm.firstName}
                      onChange={(event) => setCreateForm((current) => ({ ...current, firstName: event.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="First name"
                    />
                  </Field>
                  <Field label="Middle Name">
                    <input
                      value={createForm.middleName}
                      onChange={(event) => setCreateForm((current) => ({ ...current, middleName: event.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Middle name"
                    />
                  </Field>
                  <Field label="Last Name" required>
                    <input
                      value={createForm.lastName}
                      onChange={(event) => setCreateForm((current) => ({ ...current, lastName: event.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Last name"
                    />
                  </Field>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Business Name" required>
                    <input
                      value={createForm.businessName}
                      onChange={(event) => setCreateForm((current) => ({ ...current, businessName: event.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Business name"
                    />
                  </Field>
                  <Field label="Website">
                    <input
                      value={createForm.website}
                      onChange={(event) => setCreateForm((current) => ({ ...current, website: event.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="https://example.com"
                    />
                  </Field>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <PhoneNumberInput
                  label="Mobile"
                  required
                  value={createForm.mobile}
                  onChange={(value) => setCreateForm((current) => ({ ...current, mobile: value }))}
                />
                <PhoneNumberInput
                  label="Alternate Contact Number"
                  value={createForm.alternateContactNumber}
                  onChange={(value) => setCreateForm((current) => ({ ...current, alternateContactNumber: value }))}
                  helperText="Optional second number."
                />
                <PhoneNumberInput
                  label="Landline"
                  value={createForm.landline}
                  onChange={(value) => setCreateForm((current) => ({ ...current, landline: value }))}
                  helperText="Optional landline number."
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field label="Tax Number">
                  <input
                    value={createForm.taxNumber}
                    onChange={(event) => setCreateForm((current) => ({ ...current, taxNumber: event.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Tax number"
                  />
                </Field>
                <Field label="Opening Balance">
                  <input
                    type="number"
                    step="0.01"
                    value={createForm.openingBalance}
                    onChange={(event) => setCreateForm((current) => ({ ...current, openingBalance: event.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="0.00"
                  />
                </Field>
                <Field label="Pay Terms" required>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={createForm.payTermsType}
                      onChange={(event) =>
                        setCreateForm((current) => ({
                          ...current,
                          payTermsType: event.target.value as SupplierPayTermType,
                        }))
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="days">Days</option>
                      <option value="months">Months</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      value={createForm.payTermsValue}
                      onChange={(event) => setCreateForm((current) => ({ ...current, payTermsValue: event.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="0"
                    />
                  </div>
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Address Line 1" required>
                  <input
                    value={createForm.addressLine1}
                    onChange={(event) => setCreateForm((current) => ({ ...current, addressLine1: event.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Street, building, plot"
                  />
                </Field>
                <Field label="Address Line 2">
                  <input
                    value={createForm.addressLine2}
                    onChange={(event) => setCreateForm((current) => ({ ...current, addressLine2: event.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Apartment, suite, floor"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <Field label="City" required>
                  <input
                    value={createForm.city}
                    onChange={(event) => setCreateForm((current) => ({ ...current, city: event.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="City"
                  />
                </Field>
                <Field label="State / Region">
                  <input
                    value={createForm.state}
                    onChange={(event) => setCreateForm((current) => ({ ...current, state: event.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="State"
                  />
                </Field>
                <Field label="Country" required>
                  <input
                    value={createForm.country}
                    onChange={(event) => setCreateForm((current) => ({ ...current, country: event.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Country"
                  />
                </Field>
                <Field label="Zip Code">
                  <input
                    value={createForm.zipCode}
                    onChange={(event) => setCreateForm((current) => ({ ...current, zipCode: event.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Zip code"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Notes">
                  <textarea
                    rows={3}
                    value={createForm.notes}
                    onChange={(event) => setCreateForm((current) => ({ ...current, notes: event.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Additional notes about the supplier..."
                  />
                </Field>
                <Field label="Supplier Profile Hint">
                  <div className="rounded-lg border border-dashed border-border bg-surface-alt/40 p-3 text-sm text-muted-foreground">
                    {createForm.supplierType === 'individual'
                      ? 'An individual supplier will use prefix, first name, middle name, and last name.'
                      : 'A business supplier will use the business name as the supplier identity.'}
                  </div>
                </Field>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
              <button
                onClick={closeCreateSupplierModal}
                className="rounded-lg px-4 py-2 text-foreground transition-colors hover:bg-surface-alt"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateSupplierSubmit}
                disabled={isSaving}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${primaryButton} ${isSaving ? 'opacity-70' : ''}`}
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Create Supplier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </SettingsTabShell>
  );
}

function ActionMenuItem({
  label,
  onClick,
  destructive = false,
}: {
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  const iconMap: Record<string, React.ReactNode> = {
    Pay: <CreditCard className="h-4 w-4" />,
    View: <Eye className="h-4 w-4" />,
    Edit: <Edit className="h-4 w-4" />,
    Delete: <Trash2 className="h-4 w-4" />,
    Deactivate: <XCircle className="h-4 w-4" />,
    Ledger: <FileText className="h-4 w-4" />,
    Purchases: <ShoppingBag className="h-4 w-4" />,
    'Stock Report': <BarChart3 className="h-4 w-4" />,
    'Document and Notes': <MessageCircle className="h-4 w-4" />,
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
        destructive
          ? 'text-destructive hover:bg-destructive/10'
          : 'text-foreground hover:bg-surface-alt hover:text-primary'
      }`}
    >
      {iconMap[label] ?? <MoreVertical className="h-4 w-4" />}
      <span>{label}</span>
    </button>
  );
}

function Field({
  label,
  required = false,
  helperText,
  children,
}: {
  label: string;
  required?: boolean;
  helperText?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
      {helperText && <p className="mt-1 text-xs text-muted-foreground">{helperText}</p>}
    </div>
  );
}
