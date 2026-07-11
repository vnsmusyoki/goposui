import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Edit,
  Trash2,
  Eye,
  Plus,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  Grid,
  List,
  Download as DownloadIcon,
  Navigation,
  ShieldCheck,
  FileText,
  Wallet,
  Layers,
  Calendar,
  Users,
  Store,
} from 'lucide-react';
import { useBusinessLocations, type BusinessLocationRecord } from '@/hooks/business/settings/useBusinessLocations';
import { ApiError } from '@/lib/api';
import SettingsTabShell from '../SettingsTabShell';
import Select, { type StylesConfig } from 'react-select';

type SelectOption = {
  value: string;
  label: string;
};

type ViewMode = 'grid' | 'list';

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
];

const sortOptions: SelectOption[] = [
  { value: 'name', label: 'Sort by Name' },
  { value: 'createdAt', label: 'Sort by Created' },
  { value: 'locationId', label: 'Sort by ID' },
];

export default function BusinessLocations() {
  const navigate = useNavigate();
  const { locations, isLoading, error, fetchLocations, deleteLocation } = useBusinessLocations();
  
  const shellCard = 'rounded-xl border border-border bg-card text-card-foreground shadow-sm';
  const primaryButton = 'rounded-lg bg-primary text-primary-foreground hover:bg-primary/90';
  const mutedIconButton = 'rounded hover:bg-surface-alt transition-colors text-muted-foreground';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'locationId'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedLocation, setSelectedLocation] = useState<BusinessLocationRecord | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<BusinessLocationRecord | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    void fetchLocations();
  }, [fetchLocations]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchLocations();
    setIsRefreshing(false);
  };

  const selectedStatusOption = useMemo(
    () => statusOptions.find((option) => option.value === filterStatus) ?? statusOptions[0],
    [filterStatus],
  );
  const selectedSortOption = useMemo(
    () => sortOptions.find((option) => option.value === sortBy) ?? sortOptions[0],
    [sortBy],
  );

  // Filter and sort locations
  const filteredLocations = useMemo(() => {
    let result = [...locations];

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(loc =>
        loc.locationName.toLowerCase().includes(searchLower) ||
        loc.locationId.toLowerCase().includes(searchLower) ||
        loc.city.toLowerCase().includes(searchLower) ||
        loc.exactAddress.toLowerCase().includes(searchLower) ||
        loc.mobile.includes(searchTerm)
      );
    }

    // Filter by status (active/inactive based on has coordinates or other logic)
    // For now, we'll consider locations with latitude/longitude as "active"
    if (filterStatus === 'active') {
      result = result.filter(loc => loc.latitude && loc.longitude);
    } else if (filterStatus === 'inactive') {
      result = result.filter(loc => !loc.latitude || !loc.longitude);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.locationName.localeCompare(b.locationName);
          break;
        case 'locationId':
          comparison = a.locationId.localeCompare(b.locationId);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        default:
          comparison = a.locationName.localeCompare(b.locationName);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [locations, searchTerm, filterStatus, sortBy, sortOrder]);

  // Stats
  const stats = useMemo(() => ({
    total: locations.length,
    active: locations.filter(loc => loc.latitude && loc.longitude).length,
    withEtims: locations.filter(loc => loc.etimsEnabled).length,
    vatRegistered: locations.filter(loc => loc.isVatRegistered).length,
  }), [locations]);

  // Format address
  const formatAddress = (location: BusinessLocationRecord): string => {
    const parts = [
      location.exactAddress,
      location.city,
      location.state,
      location.country,
    ].filter(Boolean);
    return parts.join(', ');
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Render Grid View
  const renderGridView = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredLocations.map((location) => (
          <div
            key={location.id}
            className={`${shellCard} p-4 hover:shadow-md transition-shadow cursor-pointer group`}
            onClick={() => setSelectedLocation(location)}
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
              {location.locationName}
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              {location.locationId}
            </p>

            <div className="flex flex-wrap gap-2 mb-3">
              {location.latitude && location.longitude ? (
                <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  <XCircle className="w-3 h-3 mr-1" />
                  Inactive
                </span>
              )}
              {location.etimsEnabled && (
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  eTIMS
                </span>
              )}
              {location.isVatRegistered && (
                <span className="inline-flex items-center rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">
                  <FileText className="w-3 h-3 mr-1" />
                  VAT
                </span>
              )}
            </div>

            <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border pt-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{formatAddress(location)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3 h-3 shrink-0" />
                <span>{location.mobile}</span>
              </div>
              {location.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3 h-3 shrink-0" />
                  <span className="truncate">{location.email}</span>
                </div>
              )}
              {location.paymentMethods.length > 0 && (
                <div className="flex items-center gap-2">
                  <Wallet className="w-3 h-3 shrink-0" />
                  <span>{location.paymentMethods.length} payment methods</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-end gap-1">
              <button 
                className={`p-1.5 ${mutedIconButton} hover:text-primary`}
                onClick={(e) => {
                  e.stopPropagation();
                  // Navigate to view details
                }}
              >
                <Eye className="w-4 h-4" />
              </button>
              <button 
                className={`p-1.5 ${mutedIconButton} hover:text-primary`}
                onClick={(e) => {
                  e.stopPropagation();
                  // Navigate to edit
                  navigate(`/settings/locations/${location.id}/edit`);
                }}
              >
                <Edit className="w-4 h-4" />
              </button>
              <button 
                className={`p-1.5 ${mutedIconButton} hover:text-destructive`}
                onClick={(e) => {
                  e.stopPropagation();
                  setLocationToDelete(location);
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
      <div className={`${shellCard} overflow-hidden`}>
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-surface-alt/60">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Location
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Address
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Contact
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                eTIMS
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Payments
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredLocations.map((location) => (
              <tr 
                key={location.id} 
                className="cursor-pointer transition-colors hover:bg-surface-alt/70"
                onClick={() => setSelectedLocation(location)}
              >
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{location.locationName}</p>
                    <p className="text-xs text-muted-foreground">{location.locationId}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-muted-foreground max-w-xs truncate">
                    {formatAddress(location)}
                  </p>
                  {location.latitude && location.longitude && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground/70">
                      <Navigation className="w-3 h-3" />
                      <span>
                        {Number(location.latitude).toFixed(4)}, {Number(location.longitude).toFixed(4)}
                      </span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-foreground">{location.mobile}</div>
                  {location.email && (
                    <div className="text-xs text-muted-foreground">{location.email}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {location.latitude && location.longitude ? (
                    <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      <XCircle className="w-3 h-3 mr-1" />
                      Inactive
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {location.etimsEnabled ? (
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      Enabled
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Disabled</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {location.paymentMethods.slice(0, 2).map((method) => (
                      <span 
                        key={method}
                        className="inline-flex items-center rounded-full bg-surface-alt px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {method.replace('_', ' ')}
                      </span>
                    ))}
                    {location.paymentMethods.length > 2 && (
                      <span className="text-xs text-muted-foreground">
                        +{location.paymentMethods.length - 2} more
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <button 
                      className={`p-1.5 ${mutedIconButton} hover:text-primary`}
                      onClick={() => {
                        // View details
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      className={`p-1.5 ${mutedIconButton} hover:text-primary`}
                      onClick={() => {
                        navigate(`/settings/locations/${location.id}/edit`);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      className={`p-1.5 ${mutedIconButton} hover:text-destructive`}
                      onClick={() => {
                        setLocationToDelete(location);
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

  return (
    <SettingsTabShell
      title="Business Locations"
      description="Manage all your business locations and their configurations"
    >
      {/* Header with Stats */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
            <Building2 className="w-6 h-6 text-primary" />
            Locations
          </h2>
          <p className="text-sm text-muted-foreground">
            {stats.total} total locations • {stats.active} active • {stats.withEtims} with eTIMS
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/business/locations/create')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-sm ${primaryButton}`}
          >
            <Plus className="w-4 h-4" />
            New Location
          </button>
          <button className={`${shellCard} p-2 transition-colors hover:bg-surface-alt`}>
            <DownloadIcon className="w-5 h-5 text-primary" />
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            className={`${shellCard} p-2 transition-colors hover:bg-surface-alt`}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-5 h-5 text-primary ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className={`${shellCard} p-3 text-center`}>
          <p className="text-xs text-muted-foreground">Total Locations</p>
          <p className="text-lg font-bold text-foreground">{stats.total}</p>
        </div>
        <div className={`${shellCard} p-3 text-center border-success/20`}>
          <p className="text-xs text-muted-foreground">Active</p>
          <p className="text-lg font-bold text-success">{stats.active}</p>
        </div>
        <div className={`${shellCard} p-3 text-center border-primary/20`}>
          <p className="text-xs text-muted-foreground">eTIMS Enabled</p>
          <p className="text-lg font-bold text-primary">{stats.withEtims}</p>
        </div>
        <div className={`${shellCard} p-3 text-center border-warning/20`}>
          <p className="text-xs text-muted-foreground">VAT Registered</p>
          <p className="text-lg font-bold text-warning">{stats.vatRegistered}</p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Toolbar */}
      <div className={`${shellCard} p-4 mb-6`}>
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex min-w-85 items-center gap-2">
            <div className="min-w-37.5">
              <Select
                instanceId="location-status-select"
                isSearchable
                isClearable={false}
                options={statusOptions}
                value={selectedStatusOption}
                onChange={(option) => {
                  if (option) setFilterStatus(option.value as 'all' | 'active' | 'inactive');
                }}
                styles={selectStyles}
                placeholder="All Status"
              />
            </div>

            <div className="min-w-[160px]">
              <Select
                instanceId="location-sort-select"
                isSearchable
                isClearable={false}
                options={sortOptions}
                value={selectedSortOption}
                onChange={(option) => {
                  if (option) setSortBy(option.value as 'name' | 'createdAt' | 'locationId');
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

      {/* Locations List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredLocations.length === 0 ? (
        <div className={`${shellCard} flex h-64 flex-col items-center justify-center text-muted-foreground`}>
          <Building2 className="mb-3 h-12 w-12 text-muted-foreground/40" />
          <p className="text-lg font-medium">No locations found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
          <button
            onClick={() => navigate('/settings/locations/create')}
            className={`mt-4 flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${primaryButton}`}
          >
            <Plus className="w-4 h-4" />
            Add Your First Location
          </button>
        </div>
      ) : (
        <div>
          {viewMode === 'grid' && renderGridView()}
          {viewMode === 'list' && renderListView()}
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
        <span>Showing {filteredLocations.length} of {locations.length} locations</span>
        <span>Last updated: {new Date().toLocaleString()}</span>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && locationToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${shellCard} max-w-md w-full mx-4 p-6`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                Delete Location
              </h3>
            </div>
            <p className="mb-6 text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-semibold">{locationToDelete.locationName}</span>? 
              This action cannot be undone and will affect all data associated with this location.
            </p>
            {locationToDelete.paymentMethods.length > 0 && (
              <div className="mb-4 rounded-lg border border-warning/20 bg-warning/10 p-3">
                <p className="flex items-start gap-2 text-xs text-warning">
                  <AlertCircle className="w-4 h-4 mt-0.5" />
                  <span>
                    This location has {locationToDelete.paymentMethods.length} payment methods configured.
                    Consider disabling them first.
                  </span>
                </p>
              </div>
            )}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setLocationToDelete(null);
                }}
                className="rounded-lg px-4 py-2 text-foreground transition-colors hover:bg-surface-alt"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deleteLocation(locationToDelete.id);
                  setShowDeleteModal(false);
                  setLocationToDelete(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Location
              </button>
            </div>
          </div>
        </div>
      )}
    </SettingsTabShell>
  );
}