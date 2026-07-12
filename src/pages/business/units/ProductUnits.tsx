import { useEffect, useMemo, useRef, useState } from 'react';
import Select, { type StylesConfig } from 'react-select';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MoreVertical, 
  RefreshCw,
  X,
  Check,
  AlertCircle,
  Package,
  Ruler,
  Scale,
  Box,
  Layers, 
} from 'lucide-react';
import { type BusinessUnitInput, type BusinessUnitRecord, useBusinessUnits } from '@/hooks/business/units/useBusinessUnits';

type Unit = BusinessUnitRecord;

type SelectOption = {
  value: string;
  label: string;
};

const selectStyles: StylesConfig<SelectOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: 42,
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

export default function ProductUnits() {
  const {
    units,
    isLoading,
    isSaving,
    error,
    loadUnits,
    createUnit,
    updateUnit,
    deleteUnit,
    clearError,
  } = useBusinessUnits();
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [showActions, setShowActions] = useState<string | null>(null);
  const [showActionMenuPosition, setShowActionMenuPosition] = useState<{
    top: number;
    left: number;
    placement: 'top' | 'bottom';
  } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<BusinessUnitInput>({
    name: '',
    shortName: '',
    allowDecimal: false,
    isMultipleOfOther: false,
    baseUnitId: '',
    conversionRate: 0
  });

  useEffect(() => {
    void loadUnits();
  }, [loadUnits]);

  useEffect(() => {
    if (error) {
      toast.error(error, { position: 'top-right' });
    }
  }, [error]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setShowActions(null);
        setShowActionMenuPosition(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowActions(null);
        setShowActionMenuPosition(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);
  
  // Filter units
  const filteredUnits = useMemo(() => {
    let nextUnits = [...units];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      nextUnits = nextUnits.filter((u) =>
        u.name.toLowerCase().includes(searchLower) ||
        u.shortName.toLowerCase().includes(searchLower) ||
        u.createdBy.toLowerCase().includes(searchLower)
      );
    }

    return nextUnits;
  }, [searchTerm, units]);
  
  // Get base unit name
  const getBaseUnitName = (unitId?: string) => {
    if (!unitId) return 'N/A';
    const baseUnit = units.find((u) => u.id === unitId);
    return baseUnit ? baseUnit.name : 'N/A';
  };

  const baseUnitOptions = useMemo<SelectOption[]>(() => {
    return units
      .filter((unit) => !unit.isMultipleOfOther || unit.id === formData.baseUnitId)
      .map((unit) => ({
        value: unit.id,
        label: `${unit.name} (${unit.shortName})`,
      }));
  }, [formData.baseUnitId, units]);

  const selectedBaseUnit = useMemo(
    () => baseUnitOptions.find((option) => option.value === formData.baseUnitId) ?? null,
    [baseUnitOptions, formData.baseUnitId],
  );
  
  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Handle submit
  const handleSubmit = async () => {
    if (!formData.name || !formData.shortName) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (editingUnit) {
        const response = await updateUnit(editingUnit.id, formData);
        toast.success(response.message || 'Business unit updated successfully.', { position: 'top-right' });
      } else {
        const response = await createUnit(formData);
        toast.success(response.message || 'Business unit created successfully.', { position: 'top-right' });
      }

      setShowAddModal(false);
      setEditingUnit(null);
      setFormData({
        name: '',
        shortName: '',
        allowDecimal: false,
        isMultipleOfOther: false,
        baseUnitId: '',
        conversionRate: 0,
      });
    } catch (submitError) {
      console.error('Saving unit failed:', submitError);
    }
  };
  
  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setFormData({
      name: unit.name,
      shortName: unit.shortName,
      allowDecimal: unit.allowDecimal,
      isMultipleOfOther: unit.isMultipleOfOther,
      baseUnitId: unit.baseUnitId || '',
      conversionRate: unit.conversionRate || 0,
    });
    setShowAddModal(true);
    setShowActions(null);
    setShowActionMenuPosition(null);
  };
  
  const handleDelete = async (id: string) => {
    try {
      const response = await deleteUnit(id);
      toast.success(response.message || 'Business unit deleted successfully.', { position: 'top-right' });
    } catch (deleteError) {
      console.error('Deleting unit failed:', deleteError);
    }
    setShowDeleteConfirm(null);
    setShowActions(null);
    setShowActionMenuPosition(null);
  };
  
  const handleResetFilters = () => {
    setSearchTerm('');
  };

  const toggleUnitActionMenu = (unitId: string, target: HTMLButtonElement) => {
    if (showActions === unitId) {
      setShowActions(null);
      setShowActionMenuPosition(null);
      return;
    }

    const rect = target.getBoundingClientRect();
    const menuHeight = 196;
    const menuWidth = 256;
    const gap = 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const placement: 'top' | 'bottom' = spaceBelow < menuHeight && spaceAbove > spaceBelow ? 'top' : 'bottom';
    const top = placement === 'bottom' ? rect.bottom + gap : Math.max(rect.top - menuHeight - gap, gap);
    const left = Math.min(Math.max(rect.right - menuWidth, gap), window.innerWidth - menuWidth - gap);

    setShowActions(unitId);
    setShowActionMenuPosition({ top, left, placement });
  };
  
  // Get unit icon
  const getUnitIcon = (unit: Unit) => {
    if (unit.name.toLowerCase().includes('kilogram') || unit.name.toLowerCase().includes('gram')) {
      return <Scale className="h-5 w-5" />;
    } else if (unit.name.toLowerCase().includes('liter') || unit.name.toLowerCase().includes('milliliter')) {
      return <Box className="h-5 w-5" />;
    } else if (unit.name.toLowerCase().includes('piece') || unit.name.toLowerCase().includes('dozen')) {
      return <Package className="h-5 w-5" />;
    } else if (unit.name.toLowerCase().includes('box') || unit.name.toLowerCase().includes('carton')) {
      return <Layers className="h-5 w-5" />;
    }
    return <Ruler className="h-5 w-5" />;
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Product Units</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage measurement units for your products. Define base units and their multiples.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            clearError();
            setEditingUnit(null);
            setFormData({
              name: '',
              shortName: '',
              allowDecimal: false,
              isMultipleOfOther: false,
              baseUnitId: '',
              conversionRate: 0
            });
            setShowAddModal(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add New Unit
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      
     
      
      {/* Filters */}
      <div className="rounded-xl border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search units..."
                className="rounded-lg border border-border bg-background py-1.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground w-64"
              />
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
          <span className="text-sm text-muted-foreground">
            {isLoading ? 'Loading units...' : `${filteredUnits.length} units found`}
          </span>
        </div>
      </div>
      
      {/* Units Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-surface-alt">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Unit</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Short Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Base Unit</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Conversion Rate</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground whitespace-nowrap">Allow Decimal</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Created By</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">Created At</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUnits.length > 0 ? (
                filteredUnits.map((unit) => (
                  <tr key={unit.id} className="hover:bg-surface-alt/30 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2 text-primary">
                          {getUnitIcon(unit)}
                        </div>
                        <span className="text-sm font-medium text-foreground">{unit.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {unit.shortName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        unit.isMultipleOfOther
                          ? 'bg-blue-500/10 text-blue-600'
                          : 'bg-success/10 text-success'
                      }`}>
                        {unit.isMultipleOfOther ? 'Multiple' : 'Base'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {unit.isMultipleOfOther ? getBaseUnitName(unit.baseUnitId) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {unit.isMultipleOfOther ? unit.conversionRate : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {unit.allowDecimal ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                          <Check className="h-3 w-3" />
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                          <X className="h-3 w-3" />
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <div>
                        <span className="text-foreground">{unit.createdBy}</span> 
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <div> 
                        <p className="text-xs">{formatDate(unit.createdAt)}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={(event) => toggleUnitActionMenu(unit.id, event.currentTarget)}
                        className="rounded-lg p-1.5 hover:bg-surface-alt transition-colors"
                      >
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No units found matching the current search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showActions && showActionMenuPosition && (
        <div
          className="fixed inset-0 z-40 bg-background/20 backdrop-blur-[1px]"
          onClick={() => {
            setShowActions(null);
            setShowActionMenuPosition(null);
          }}
        >
          <div
            ref={actionMenuRef}
            className="fixed z-50 w-64 rounded-xl border border-border bg-card shadow-2xl"
            style={{
              top: showActionMenuPosition.top,
              left: showActionMenuPosition.left,
            }}
          >
            <div className="border-b border-border px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Unit Actions
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {units.find((unit) => unit.id === showActions)?.name ?? 'Selected unit'}
              </p>
            </div>
            <div className="p-2">
              <button
                onClick={() => {
                  const unit = units.find((item) => item.id === showActions);
                  if (unit) {
                    handleEdit(unit);
                  }
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-surface-alt"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={() => {
                  if (showActions) {
                    setShowDeleteConfirm(showActions);
                  }
                  setShowActions(null);
                  setShowActionMenuPosition(null);
                }}
                className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add/Edit Unit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
          <div className="w-[98vw] max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl sm:w-[92vw] lg:w-[50%]">
            <div className="sticky top-0 z-10 border-b border-border bg-card px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">
                  {editingUnit ? 'Edit Unit' : 'Add New Unit'}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    clearError();
                    setShowAddModal(false);
                    setEditingUnit(null);
                  }}
                  className="rounded-lg p-2 hover:bg-surface-alt transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Name */}
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Unit Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Kilogram, Liter, Piece"
                      className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* Short Name */}
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Short Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.shortName || ''}
                      onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                      placeholder="e.g., kg, L, pc"
                      className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
                
                {/* Allow Decimal Toggle */}
                <div className="rounded-lg border border-border bg-background p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">Allow Decimal</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Enable for units that can have decimal values (e.g., 1.5 kg)
                      </p>
                    </div>
                    <ToggleSwitch
                      checked={Boolean(formData.allowDecimal)}
                      onClick={() => setFormData({ ...formData, allowDecimal: !formData.allowDecimal })}
                    />
                  </div>
                </div>
                
                {/* Is Multiple of Other Units Toggle */}
                <div className="rounded-lg border border-border bg-background p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">Multiple of Other Unit</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Enable if this unit is a multiple of another base unit
                      </p>
                    </div>
                    <ToggleSwitch
                      checked={Boolean(formData.isMultipleOfOther)}
                      onClick={() => {
                        setFormData({
                          ...formData,
                          isMultipleOfOther: !formData.isMultipleOfOther,
                          baseUnitId: !formData.isMultipleOfOther ? '' : formData.baseUnitId,
                          conversionRate: !formData.isMultipleOfOther ? 0 : formData.conversionRate
                        });
                      }}
                    />
                  </div>
                </div>
                
                 {formData.isMultipleOfOther && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                        <p className="text-sm font-semibold text-foreground">
                        Unit Conversion
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                        Enable this when this unit represents a fixed quantity of another (base)
                        unit. The conversion tells the system how much inventory to add or deduct
                        whenever this unit is purchased or sold.
                        </p>

                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <div className="rounded-lg border border-border bg-background p-3">
                            <p className="text-sm font-semibold text-foreground">
                            1 Box
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                            = 24 Pieces
                            </p>
                        </div>

                        <div className="rounded-lg border border-border bg-background p-3">
                            <p className="text-sm font-semibold text-foreground">
                            1 Dozen
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                            = 12 Pieces
                            </p>
                        </div>

                        <div className="rounded-lg border border-border bg-background p-3">
                            <p className="text-sm font-semibold text-foreground">
                            1 Jerry Can
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                            = 20 Liters
                            </p>
                        </div>
                        </div>

                        <div className="mt-4 rounded-md bg-background p-3 border border-border">
                        <p className="text-xs font-medium text-foreground">
                            Example
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            If your base unit is <strong>Liter</strong> and you create a
                            <strong> Jerry Can</strong> with a conversion of
                            <strong> 20</strong>, selling <strong>1 Jerry Can</strong> will deduct
                            <strong> 20 Liters</strong> from inventory.
                        </p>
                        </div>
                    </div>
                    )}
                
                {/* Base Unit Selection (conditional) */}
                {formData.isMultipleOfOther && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-foreground">
                        Base Unit <span className="text-destructive">*</span>
                      </label>
                      <div className="mt-2">
                        <Select
                          value={selectedBaseUnit}
                          onChange={(option) =>
                            setFormData({
                              ...formData,
                              baseUnitId: option?.value || '',
                            })
                          }
                          options={baseUnitOptions}
                          placeholder="Select Base Unit"
                          isClearable
                          styles={selectStyles}
                          classNamePrefix="react-select"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-foreground">
                        Conversion Rate <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={formData.conversionRate ?? ''}
                        onChange={(e) => {
                          const nextValue = e.target.value;
                          setFormData({
                            ...formData,
                            conversionRate: nextValue === '' ? 0 : Math.max(0, Number(nextValue) || 0),
                          });
                        }}
                        placeholder="e.g., 1000 (for grams to kilograms)"
                        className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        How many of this unit equals 1 base unit? (e.g., 1000g = 1kg)
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="mt-6 flex justify-end gap-3 border-t border-border pt-6">
                <button
                  type="button"
                  onClick={() => {
                    clearError();
                    setShowAddModal(false);
                    setEditingUnit(null);
                  }}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-alt"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? 'Saving...' : editingUnit ? 'Update Unit' : 'Add Unit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
          <div className="w-[95vw] rounded-2xl border border-border bg-card shadow-2xl sm:w-[80vw] md:w-[50%] lg:w-[30%]">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-xl font-bold text-foreground">Delete Unit</h2>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-destructive/10 p-3 text-destructive">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-foreground">
                    Are you sure you want to delete this unit?
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    This action cannot be undone. Products using this unit may be affected.
                  </p>
                </div>
              </div>
            </div>
            <div className="border-t border-border px-6 py-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  clearError();
                  setShowDeleteConfirm(null);
                }}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-alt"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={isSaving}
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color = 'primary'
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color?: 'primary' | 'success' | 'blue' | 'amber' | 'destructive';
}) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    blue: 'bg-blue-500/10 text-blue-500',
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

function ToggleSwitch({
  checked,
  onClick,
}: {
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={checked}
      className={`inline-flex h-6 w-11 flex-none items-center rounded-full border px-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:h-7 sm:w-12 sm:px-1 ${
        checked
          ? 'border-primary bg-primary'
          : 'border-border bg-muted/60'
      }`}
    >
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full bg-background text-[8px] font-semibold uppercase tracking-wide shadow-sm transition-transform sm:h-6 sm:w-6 ${
          checked ? 'translate-x-5 sm:translate-x-5' : 'translate-x-0'
        }`}
      >
        <span className="sr-only">{checked ? 'On' : 'Off'}</span>
      </span>
    </button>
  );
}
