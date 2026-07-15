import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Loader2,
  Plus,
  Trash2,
  PackageSearch,
  PackageX,
  AlertCircle,
  Building2,
  MapPin,
  ChevronDown,
  Undo2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useBusinessLocations } from '@/hooks/business/settings/useBusinessLocations';
import { useBusinessSettings } from '@/hooks/business/settings/useBusinessSettings';
import { useBusinessSuppliers, type BusinessSupplierRecord } from '@/hooks/business/suppliers/useBusinessSuppliers';
import {
  usePurchaseReturns,
  type ReturnableStockGroup,
  type CreatePurchaseReturnInput,
  type PurchaseReturnItem,
  type PurchaseReturnDetail,
} from '@/hooks/business/purchases/usePurchaseReturns';
import { ApiError } from '@/lib/api';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

type ReturnLineItem = ReturnableStockGroup & {
  lineId: string;
  returnQuantity: number;
  maxQuantity?: number | null;
};

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function formatMoney(amount: number, currencyCode: string, precision: number, placement: 'before' | 'after') {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const currencySymbol = getCurrencySymbol(currencyCode);
  const numeric = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(safeAmount);

  return placement === 'after' ? `${numeric} ${currencySymbol}` : `${currencySymbol} ${numeric}`;
}

function getCurrencySymbol(currencyCode?: string) {
  if (!currencyCode) return '$';
  try {
    const formatter = new Intl.NumberFormat('en', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return formatter.formatToParts(1).find((part) => part.type === 'currency')?.value ?? '$';
  } catch {
    return '$';
  }
}

function clampQuantityWithOptionalMax(value: number, max?: number | null) {
  if (Number.isNaN(value)) return 1;
  const normalized = Math.max(1, Math.floor(value));
  if (typeof max !== 'number' || Number.isNaN(max)) {
    return normalized;
  }
  return Math.min(normalized, Math.max(1, max));
}

function getReturnableQuantity(item: Pick<ReturnableStockGroup, 'availableQuantity' | 'suppliedBySupplier' | 'soldAlreadyForSupplier'>) {
  return Math.max(0, Math.min(item.availableQuantity, item.suppliedBySupplier - item.soldAlreadyForSupplier));
}

function getSupplierProductKey(item: Pick<ReturnableStockGroup, 'supplierId' | 'productId'>) {
  return `${item.supplierId}:${item.productId}`;
}

function shouldSearchReturnableStockQuery(query: string) {
  const trimmed = query.trim();
  if (trimmed.length >= 3) {
    return true;
  }

  return trimmed.length >= 2 && /^[A-Za-z0-9._-]+$/.test(trimmed) && (/^[A-Z0-9._-]+$/.test(trimmed) || /\d/.test(trimmed));
}

function mapPurchaseReturnItemToLineItem(item: PurchaseReturnItem): ReturnLineItem {
  return {
    lineId: item.id,
    groupKey: item.inventoryBatchId || item.id,
    productId: item.productId,
    productName: item.productName,
    sku: item.sku,
    supplierId: item.supplierId,
    supplierName: item.supplierName,
    locationName: item.locationName,
    suppliedBySupplier: item.quantity,
    soldAlreadyForSupplier: 0,
    availableQuantity: item.quantity,
    unitPrice: item.unitPrice,
    returnQuantity: item.quantity,
    maxQuantity: null,
  };
}

function getSupplierDisplayName(supplier: BusinessSupplierRecord | null, fallbackName: string) {
  if (supplier?.name?.trim()) {
    return supplier.name;
  }

  return fallbackName || 'Linked supplier';
}

function getLocationDisplayName(location: { locationName?: string } | null, fallbackName: string) {
  if (location?.locationName?.trim()) {
    return location.locationName;
  }

  return fallbackName || 'Selected branch';
}

// --------------------------------------------------------------------------
// Sub-components
// --------------------------------------------------------------------------

function FilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none"
        >
          <option value="all">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  );
}

function SearchResultGroupCard({
  group,
  currencyCode,
  currencyPrecision,
  currencyPlacement,
  addedSupplierProductKeys,
  onAdd,
}: {
  group: ReturnableStockGroup;
  currencyCode: string;
  currencyPrecision: number;
  currencyPlacement: 'before' | 'after';
  addedSupplierProductKeys: Set<string>;
  onAdd: (item: ReturnableStockGroup) => void;
}) {
  const groupReturnableQuantity = getReturnableQuantity(group);

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-0 hover:bg-muted/10">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground">{group.productName}</p>
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">SKU {group.sku}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Supplier: <span className="font-medium text-foreground">{group.supplierName}</span> • Location:{' '}
          <span className="font-medium text-foreground">{group.locationName}</span> • Supplied{' '}
          <span className="font-medium text-foreground">{group.suppliedBySupplier}</span> • Sold{' '}
          <span className="font-medium text-foreground">{group.soldAlreadyForSupplier}</span> • Returnable{' '}
          <span className="font-medium text-foreground">{groupReturnableQuantity}</span>
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-foreground">
          {formatMoney(group.unitPrice, currencyCode, currencyPrecision, currencyPlacement)}
        </span>
        <button
          type="button"
          onClick={() => onAdd(group)}
          disabled={addedSupplierProductKeys.has(getSupplierProductKey(group)) || groupReturnableQuantity <= 0}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          {addedSupplierProductKeys.has(getSupplierProductKey(group)) ? 'Added' : 'Add'}
        </button>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Main Component
// --------------------------------------------------------------------------

export default function EditPurchaseReturn() {
  const navigate = useNavigate();
  const { id: purchaseReturnId } = useParams<{ id: string }>();
  const { settings: businessSettings } = useBusinessSettings();
  const { locations } = useBusinessLocations();
  const { suppliers } = useBusinessSuppliers();
  const { searchReturnableStock, createPurchaseReturn, fetchPurchaseReturn, updatePurchaseReturn, submitting } =
    usePurchaseReturns();

  const currencyCode = businessSettings?.currency || 'USD';
  const currencyPrecision = typeof businessSettings?.currencyPrecision === 'number' ? businessSettings.currencyPrecision : 2;
  const currencyPlacement = businessSettings?.currencySymbolPlacement === 'after' ? 'after' : 'before';

  const [locationId, setLocationId] = useState('all');
  const [linkedSupplierId, setLinkedSupplierId] = useState('');
  const [linkedSupplierName, setLinkedSupplierName] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ReturnableStockGroup[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [resultsOpen, setResultsOpen] = useState(false);

  const [lineItems, setLineItems] = useState<ReturnLineItem[]>([]);
  const [purchaseReturnDetail, setPurchaseReturnDetail] = useState<PurchaseReturnDetail | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadingReturn, setLoadingReturn] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const searchWrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const query = searchQuery.trim();

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!shouldSearchReturnableStockQuery(query)) {
      setSearchResults([]);
      setSearching(false);
      setSearchError(null);
      return undefined;
    }

    const currentRequestId = ++requestIdRef.current;
    setSearching(true);
    setSearchError(null);

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchReturnableStock({
          query,
          locationId: locationId !== 'all' ? locationId : undefined,
          supplierId: linkedSupplierId || undefined,
        });

        if (currentRequestId === requestIdRef.current) {
          setSearchResults(results);
          setResultsOpen(true);
        }
      } catch (err) {
        if (currentRequestId === requestIdRef.current) {
          const message = err instanceof ApiError ? err.message : 'Failed to search for products';
          setSearchError(message);
          setSearchResults([]);
        }
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setSearching(false);
        }
      }
    }, 350);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery, locationId, linkedSupplierId, searchReturnableStock]);

  useEffect(() => {
    let active = true;

    const loadReturn = async () => {
      if (!purchaseReturnId) {
        if (active) {
          setLoadError('Purchase return ID is required.');
          setLoadingReturn(false);
        }
        return;
      }

      setLoadingReturn(true);
      setLoadError(null);

      try {
        const response = await fetchPurchaseReturn(purchaseReturnId);
        const detail = response.purchaseReturn;
        if (!detail) {
          throw new Error('Purchase return not found.');
        }

        if (!active) {
          return;
        }

        setLocationId(detail.locationId || 'all');
        setLinkedSupplierId(detail.supplierId || '');
        setLinkedSupplierName(detail.supplierName || '');
        setPurchaseReturnDetail(detail);
        setReason(detail.returnReason || '');
        setNote(detail.notes || '');

        const nextItems = (response.items ?? detail.items ?? []).map(mapPurchaseReturnItemToLineItem);
        setLineItems(nextItems);
      } catch (err) {
        if (!active) {
          return;
        }

        const message = err instanceof ApiError ? err.message : 'Failed to load purchase return.';
        setLoadError(message);
        setLineItems([]);
      } finally {
        if (active) {
          setLoadingReturn(false);
        }
      }
    };

    void loadReturn();

    return () => {
      active = false;
    };
  }, [fetchPurchaseReturn, purchaseReturnId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (searchWrapperRef.current && target && !searchWrapperRef.current.contains(target)) {
        setResultsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addedSupplierProductKeys = useMemo(
    () => new Set(lineItems.map((item) => getSupplierProductKey(item))),
    [lineItems],
  );

  const linkedSupplier = useMemo(() => {
    if (!linkedSupplierId) {
      return null;
    }

    return suppliers.find((supplier) => supplier.id === linkedSupplierId) ?? null;
  }, [linkedSupplierId, suppliers]);

  const selectedLocation = useMemo(() => {
    if (!locationId || locationId === 'all') {
      return null;
    }

    return locations.find((location) => location.id === locationId) ?? null;
  }, [locationId, locations]);

  const handleAddItem = (item: ReturnableStockGroup) => {
    const supplierProductKey = getSupplierProductKey(item);
    if (addedSupplierProductKeys.has(supplierProductKey)) {
      return;
    }
    const returnableQuantity = Math.max(0, Math.min(item.availableQuantity, item.suppliedBySupplier - item.soldAlreadyForSupplier));
    if (returnableQuantity <= 0) {
      toast.error('This lot has no available quantity to return.');
      return;
    }

    setLineItems((current) => [
      ...current,
      {
        ...item,
        lineId: `${item.groupKey}-${Date.now()}`,
        returnQuantity: 1,
        maxQuantity: getReturnableQuantity(item),
      },
    ]);
    setSearchQuery('');
    setSearchResults([]);
    setResultsOpen(false);
  };

  const handleRemoveItem = (lineId: string) => {
    setLineItems((current) => current.filter((item) => item.lineId !== lineId));
  };

  const handleQuantityChange = (lineId: string, value: number) => {
    setLineItems((current) =>
      current.map((item) =>
        item.lineId === lineId
          ? { ...item, returnQuantity: clampQuantityWithOptionalMax(value, item.maxQuantity) }
          : item,
      ),
    );
  };

  const totalQuantity = lineItems.reduce((sum, item) => sum + item.returnQuantity, 0);
  const totalValue = lineItems.reduce((sum, item) => sum + item.returnQuantity * item.unitPrice, 0);

  const handleSubmit = async () => {
    setSubmitError(null);

    const currentPurchaseReturnId = purchaseReturnId?.trim();

    if (lineItems.length === 0) {
      const message = 'Add at least one product before submitting the return.';
      setSubmitError(message);
      toast.error(message);
      return;
    }

    if (locationId === 'all') {
      const message = 'Select the business location for this return.';
      setSubmitError(message);
      toast.error(message);
      return;
    }

    const invalidItem = lineItems.find(
      (item) =>
        item.returnQuantity <= 0 ||
        (typeof item.maxQuantity === 'number' && item.returnQuantity > item.maxQuantity),
    );
    if (invalidItem) {
      const maxQuantity =
        typeof invalidItem.maxQuantity === 'number' ? invalidItem.maxQuantity : 'the available quantity';
      const message = `Quantity for ${invalidItem.productName} must be between 1 and ${maxQuantity}.`;
      setSubmitError(message);
      toast.error(message);
      return;
    }

    const payload: CreatePurchaseReturnInput = {
      locationId,
      reason: reason.trim() || undefined,
      note: note.trim() || undefined,
      items: lineItems.map((item) => ({
        productId: item.productId,
        batchId: item.groupKey,
        quantity: item.returnQuantity,
        unitPrice: item.unitPrice,
      })),
    };

    try {
      const isEditing = Boolean(currentPurchaseReturnId);
      if (isEditing && !currentPurchaseReturnId) {
        throw new Error('Purchase return ID is required.');
      }

      const response = isEditing
        ? await updatePurchaseReturn(currentPurchaseReturnId!, payload)
        : await createPurchaseReturn(payload);
      toast.success(response.message || (isEditing ? 'Purchase return updated successfully' : 'Purchase return created successfully'));
      navigate('/purchases/returns');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update purchase return';
      setSubmitError(message);
      toast.error(message);
    }
  };

  if (loadingReturn) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading purchase return...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/95 py-4 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="rounded-lg p-2 hover:bg-surface-alt transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          <div>
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">Edit Purchase Return</h1>
            <p className="mt-0.5 text-sm text-muted-foreground hidden sm:block">
              Review the saved return, adjust the lines, and save the updated record
            </p>
          </div>
        </div>
      </div>
      </div>

      {loadError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{loadError}</p>
          </div>
        </div>
      ) : null}

      {submitError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{submitError}</p>
          </div>
        </div>
      ) : null}

      {/* Context filters and search */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-background p-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Branch / Location</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {getLocationDisplayName(selectedLocation, purchaseReturnDetail?.locationName || '')}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Location ID: <span className="font-medium text-foreground">{locationId === 'all' ? '-' : locationId}</span>
                </p>
                {purchaseReturnDetail?.referenceNumber ? (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Return reference: <span className="font-medium text-foreground">{purchaseReturnDetail.referenceNumber}</span>
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-background p-2 text-muted-foreground">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Linked Supplier</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {getSupplierDisplayName(linkedSupplier, linkedSupplierName)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {linkedSupplier?.phone || linkedSupplier?.contactPersonPhone || 'No supplier phone on file'}
                  {linkedSupplier?.email || linkedSupplier?.contactPersonEmail ? (
                    <>
                      {' '}
                      • {linkedSupplier?.email || linkedSupplier?.contactPersonEmail}
                    </>
                  ) : null}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-border pt-4">
          <p className="text-sm font-semibold text-foreground">Find Products To Return</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Search by product name or SKU. Matching lots in stock will be listed below.
          </p>

          <div ref={searchWrapperRef} className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setResultsOpen(true)}
              placeholder="Search product name or SKU..."
              className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-9 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            {searching ? (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            ) : null}

            {resultsOpen && shouldSearchReturnableStockQuery(searchQuery) ? (
              <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-border bg-background shadow-2xl shadow-black/10">
                {searchError ? (
                  <div className="flex items-center gap-2 px-4 py-4 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {searchError}
                  </div>
                ) : searching ? (
                  <div className="flex items-center gap-2 px-4 py-4 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching stock...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
                    <PackageX className="h-6 w-6 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No matching stock found for "{searchQuery.trim()}". Try changing the location filter.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    {searchResults.map((group) => (
                      <SearchResultGroupCard
                        key={group.groupKey}
                        group={group}
                        currencyCode={currencyCode}
                        currencyPrecision={currencyPrecision}
                        currencyPlacement={currencyPlacement}
                        addedSupplierProductKeys={addedSupplierProductKeys}
                        onAdd={handleAddItem}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Section 2: Selected items table */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Items To Return</p>
            <p className="text-xs text-muted-foreground">Adjust quantities or remove a lot before submitting.</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>
              <span className="font-medium text-foreground">{lineItems.length}</span> line item
              {lineItems.length === 1 ? '' : 's'}
            </span>
            <span>
              <span className="font-medium text-foreground">{totalQuantity}</span> units
            </span>
            <span>
              Total{' '}
              <span className="font-medium text-foreground">
                {formatMoney(totalValue, currencyCode, currencyPrecision, currencyPlacement)}
              </span>
            </span>
          </div>
        </div>

        {lineItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <PackageSearch className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-sm font-medium text-foreground">No items added yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Search for a product above and click Add to start</p>
          </div>
        ) : (
          <div className="max-h-[26rem] overflow-x-auto overflow-y-auto">
            <table className="min-w-[1180px] divide-y divide-border">
              <thead className="sticky top-0 bg-muted/30">
                <tr>
                  <th className="w-[220px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Product
                  </th>
                  <th className="w-[260px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Supplier
                  </th>
                  <th className="w-[220px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Location
                  </th>
                  <th className="w-[160px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Available
                  </th>
                  <th className="w-[140px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Quantity
                  </th>
                  <th className="w-[140px] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Unit Price
                  </th>
                  <th className="w-[140px] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Subtotal
                  </th>
                  <th className="w-[70px] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    &nbsp;
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background">
                {lineItems.map((item) => {
                  return (
                    <tr key={item.lineId} className="hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{item.productName}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{item.supplierName}</p>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                        {item.locationName}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                        {formatMoney(item.availableQuantity, currencyCode, currencyPrecision, currencyPlacement)}
                        <div className="mt-1 space-y-1 text-[11px] text-muted-foreground">
                          <p>
                            Supplied by supplier: <span className="font-medium text-foreground">{item.suppliedBySupplier}</span>
                          </p>
                          <p>
                            Sold already for supplier: <span className="font-medium text-foreground">{item.soldAlreadyForSupplier}</span>
                          </p>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <input
                          type="number"
                          min={1}
                          max={item.maxQuantity ?? undefined}
                          value={item.returnQuantity}
                          onChange={(e) => handleQuantityChange(item.lineId, Number(e.target.value))}
                          className="w-20 rounded-lg border border-border bg-background px-2 py-1.5 text-right text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {typeof item.maxQuantity === 'number'
                            ? `of ${item.maxQuantity} returnable`
                            : 'originally saved quantity'}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-foreground">
                        {formatMoney(item.unitPrice, currencyCode, currencyPrecision, currencyPlacement)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-foreground">
                        {formatMoney(item.returnQuantity * item.unitPrice, currencyCode, currencyPrecision, currencyPlacement)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.lineId)}
                          aria-label={`Remove ${item.productName}`}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="rounded-xl border border-border bg-card p-4">
        <label className="text-sm font-medium text-foreground">Internal Note (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Add any additional context for this return..."
          className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Return reason and submit */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Return Reason (optional)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Damaged goods, wrong item"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting || lineItems.length === 0 || Boolean(loadError)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />}
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
