import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Select, { type StylesConfig } from 'react-select';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  ClassicEditor,
  Essentials,
  Paragraph,
  Bold,
  Italic,
  Link,
  List,
  BlockQuote,
  Undo,
} from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Package,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Truck,
  Trash2,
} from 'lucide-react';
import DatePickerField from '@/components/forms/DatePickerField';
import { useBusinessLocations } from '@/hooks/business/settings/useBusinessLocations';
import { useBusinessSettings } from '@/hooks/business/settings/useBusinessSettings';
import { useProducts, type ProductSearchResult } from '@/hooks/business/products/useProducts';
import { useBusinessTransfers, type TransferItemRecord, type TransferStatus, type TransferType } from '@/hooks/business/transfers/useBusinessTransfers';

type TransferLineItem = TransferItemRecord;

type FormState = {
  referenceNumber: string;
  transferDate: string;
  status: TransferStatus;
  locationFromId: string;
  locationToId: string;
  shippingCharges: number;
  notes: string;
  type: TransferType;
  items: TransferLineItem[];
};

type SelectOption = {
  value: string;
  label: string;
};

const statusOptions: Array<{ value: TransferStatus; label: string; tone: string; icon: typeof FileText }> = [
  { value: 'draft', label: 'Draft', tone: 'bg-slate-100 text-slate-700 border-slate-200', icon: FileText },
  { value: 'pending', label: 'Pending', tone: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock },
  { value: 'approved', label: 'Approved', tone: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle },
  { value: 'completed', label: 'Completed', tone: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: ShieldCheck },
  { value: 'cancelled', label: 'Cancelled', tone: 'bg-rose-100 text-rose-800 border-rose-200', icon: Trash2 },
];

const transferTypes: Array<{ value: TransferType; label: string; tone: string; icon: typeof Truck }> = [
  { value: 'local', label: 'Local', tone: 'bg-violet-100 text-violet-800', icon: Truck },
  { value: 'international', label: 'International', tone: 'bg-indigo-100 text-indigo-800', icon: Truck },
  { value: 'mobile', label: 'Mobile', tone: 'bg-cyan-100 text-cyan-800', icon: Truck },
];

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

function generateReference() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const suffix = Math.floor(Math.random() * 9000 + 1000);
  return `ST-${yyyy}${mm}${dd}-${suffix}`;
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
    return formatter.formatToParts(1).find((part) => part.type === 'currency')?.value ?? currencyCode;
  } catch {
    return currencyCode;
  }
}

function formatMoney(amount: number, currencyCode: string, precision: number, placement: 'before' | 'after') {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const currencySymbol = getCurrencySymbol(currencyCode);
  const numeric = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(safeAmount);

  return placement === 'after' ? `${numeric} ${currencySymbol}` : `${currencySymbol} ${numeric}`;
}

const selectStyles: StylesConfig<SelectOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: '42px',
    borderRadius: '0.75rem',
    borderColor: state.isFocused ? 'hsl(var(--primary))' : 'hsl(var(--border))',
    backgroundColor: 'hsl(var(--background))',
    boxShadow: state.isFocused ? '0 0 0 1px hsl(var(--primary))' : 'none',
    '&:hover': {
      borderColor: state.isFocused ? 'hsl(var(--primary))' : 'hsl(var(--border))',
    },
  }),
  valueContainer: (base) => ({
    ...base,
    padding: '0.25rem 0.75rem',
  }),
  input: (base) => ({
    ...base,
    margin: 0,
    padding: 0,
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
    borderRadius: '0.75rem',
    overflow: 'hidden',
    backgroundColor: 'hsl(var(--background))',
    border: '1px solid hsl(var(--border))',
    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12)',
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? 'hsl(var(--primary))'
      : state.isFocused
        ? 'hsl(var(--muted))'
        : 'hsl(var(--background))',
    color: state.isSelected
      ? 'hsl(var(--primary-foreground))'
      : 'hsl(var(--foreground))',
  }),
  indicatorSeparator: (base) => ({
    ...base,
    backgroundColor: 'hsl(var(--border))',
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: 'hsl(var(--muted-foreground))',
    ':hover': {
      color: 'hsl(var(--foreground))',
    },
  }),
};

function shellButtonClass(kind: 'primary' | 'secondary' | 'danger' = 'secondary') {
  if (kind === 'primary') {
    return 'inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60';
  }

  if (kind === 'danger') {
    return 'inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100';
  }

  return 'inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface-alt';
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
  actions,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="rounded-sm border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
          </div>
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

function InitialFormState(): FormState {
  return {
    referenceNumber: generateReference(),
    transferDate: todayValue(),
    status: 'pending',
    locationFromId: '',
    locationToId: '',
    shippingCharges: 0,
    notes: '',
    type: 'local',
    items: [],
  };
}

export default function CreateTransferList() {
  const navigate = useNavigate();
  const { settings } = useBusinessSettings();
  const { locations, isLoading: locationsLoading, error: locationsError, clearError: clearLocationsError } = useBusinessLocations();
  const { searchProducts } = useProducts();
  const { createTransfer, isSaving, error, clearError } = useBusinessTransfers();

  const [form, setForm] = useState<FormState>(() => InitialFormState());
  const [productQuery, setProductQuery] = useState('');
  const [productResults, setProductResults] = useState<ProductSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [bannerErrors, setBannerErrors] = useState<string[]>([]);

  const currencyCode = settings?.currency ?? 'USD';
  const currencyPrecision = settings?.currencyPrecision ?? 2;
  const currencyPlacement = settings?.currencySymbolPlacement === 'after' ? 'after' : 'before';

  const transferFromLocation = useMemo(
    () => locations.find((location) => location.locationId === form.locationFromId) ?? null,
    [form.locationFromId, locations],
  );
  const transferToLocation = useMemo(
    () => locations.find((location) => location.locationId === form.locationToId) ?? null,
    [form.locationToId, locations],
  );
  const canSubmit = Boolean(form.locationFromId && form.locationToId && form.locationFromId !== form.locationToId && form.items.length > 0);
  const locationOptions = useMemo(
    () => locations.map((location) => ({ value: location.locationId, label: location.locationName })),
    [locations],
  );
  const selectedFromLocation = locationOptions.find((option) => option.value === form.locationFromId) ?? null;
  const selectedToLocation = locationOptions.find((option) => option.value === form.locationToId) ?? null;

  useEffect(() => {
    if (locationsError) {
      setBannerErrors((current) => [locationsError, ...current.filter((message) => message !== locationsError)].slice(0, 3));
      toast.error(locationsError, { position: 'top-right' });
      clearLocationsError();
    }
  }, [clearLocationsError, locationsError]);

  useEffect(() => {
    if (error) {
      setBannerErrors((current) => [error, ...current.filter((message) => message !== error)].slice(0, 3));
      toast.error(error, { position: 'top-right' });
      clearError();
    }
  }, [clearError, error]);

  useEffect(() => {
    if (productQuery.trim().length < 2) {
      setProductResults([]);
      setSearchError(null);
      return;
    }

    let active = true;
    const timeout = window.setTimeout(() => {
      setIsSearching(true);
      void searchProducts(productQuery.trim())
        .then((results) => {
          if (!active) return;
          setProductResults(results);
          setSearchError(null);
        })
        .catch((searchErr) => {
          if (!active) return;
          setProductResults([]);
          setSearchError(searchErr instanceof Error ? searchErr.message : 'Unable to search products.');
        })
        .finally(() => {
          if (active) {
            setIsSearching(false);
          }
        });
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [productQuery, searchProducts]);

  const addProduct = (product: ProductSearchResult) => {
    setForm((current) => {
      const existingItem = current.items.find((item) => item.productId === product.id);
      const unitPrice = Number(product.purchasePrice ?? product.sellingPrice ?? 0);

      if (existingItem) {
        return {
          ...current,
          items: current.items.map((item) =>
            item.productId === product.id
              ? {
                  ...item,
                  quantity: item.quantity + 1,
                  subtotal: (item.quantity + 1) * item.unitPrice,
                }
              : item,
          ),
        };
      }

      const nextItem: TransferLineItem = {
        id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        productId: product.id,
        productName: product.name,
        sku: product.sku ?? '',
        unit: product.unitName || 'pcs',
        quantity: 1,
        unitPrice,
        subtotal: unitPrice,
      };

      return { ...current, items: [...current.items, nextItem] };
    });

    setProductQuery('');
    setProductResults([]);
    setSearchError(null);
    toast.success(`Added ${product.name}`, { position: 'top-right' });
  };

  const updateItem = (id: string, field: keyof Pick<TransferLineItem, 'quantity' | 'unitPrice'>, value: number) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
              subtotal: field === 'quantity' ? value * item.unitPrice : item.quantity * value,
            }
          : item,
      ),
    }));
  };

  const removeItem = (id: string) => {
    setForm((current) => ({ ...current, items: current.items.filter((item) => item.id !== id) }));
  };

  const resetForm = () => {
    setForm(InitialFormState());
    setProductQuery('');
    setProductResults([]);
    setSearchError(null);
    setBannerErrors([]);
  };

  const submitTransfer = async (nextStatus: TransferStatus) => {
    if (!form.locationFromId || !form.locationToId) {
      const message = 'Please select both source and destination locations.';
      setBannerErrors([message]);
      toast.error(message, { position: 'top-right' });
      return;
    }

    if (form.locationFromId === form.locationToId) {
      const message = 'Source and destination locations must be different.';
      setBannerErrors([message]);
      toast.error(message, { position: 'top-right' });
      return;
    }

    if (form.items.length === 0) {
      const message = 'Please add at least one product to transfer.';
      setBannerErrors([message]);
      toast.error(message, { position: 'top-right' });
      return;
    }

    try {
      setBannerErrors([]);
      await createTransfer({
        referenceNumber: form.referenceNumber.trim() || generateReference(),
        transferDate: form.transferDate,
        status: nextStatus,
        locationFromId: form.locationFromId,
        locationToId: form.locationToId,
        locationFromName: transferFromLocation?.locationName ?? '',
        locationToName: transferToLocation?.locationName ?? '',
        currency: currencyCode,
        shippingCharges: form.shippingCharges,
        notes: form.notes.trim(),
        type: form.type,
        items: form.items,
      });

      toast.success(nextStatus === 'draft' ? 'Transfer saved as draft.' : 'Transfer created successfully.', {
        position: 'top-right',
      });
      navigate('/transfers/list');
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Unable to create transfer.';
      setBannerErrors([message]);
      toast.error(message, { position: 'top-right' });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full py-6">
        {bannerErrors.length > 0 ? (
          <div className="mb-6 rounded-sm border border-rose-200 bg-rose-50 p-4 text-rose-800 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-rose-100 p-2">
                <AlertTriangle className="h-5 w-5 text-rose-700" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold">Something needs attention</h2>
                <ul className="mt-2 space-y-1 text-sm">
                  {bannerErrors.map((message, index) => (
                    <li key={`${message}-${index}`} className="leading-5">
                      {message}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mb-4 inline-flex items-center gap-2 rounded-sm border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-alt"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Transfers
            </button>
             
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Create Transfer</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Move inventory between locations with live product lookup, dynamic totals, and the same business theme used across the app.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void submitTransfer('draft')}
              disabled={isSaving}
              className={shellButtonClass('secondary')}
            >
              <Save className="h-4 w-4" />
              Save Draft
            </button>
            <button
              type="button"
              onClick={resetForm}
              className={shellButtonClass()}
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>

        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            void submitTransfer(form.status);
          }}
        >
          <SectionCard
            icon={FileText}
            title="Transfer Details"
            description="Reference, transfer date, type, and status."
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Reference Number</span>
                <input
                  type="text"
                  value={form.referenceNumber}
                  onChange={(event) => setForm((current) => ({ ...current, referenceNumber: event.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Transfer Date</span>
                <DatePickerField
                  value={form.transferDate}
                  onChange={(value) => setForm((current) => ({ ...current, transferDate: value }))}
                  placeholder="Select transfer date"
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Transfer Type</span>
                <select
                  value={form.type}
                  onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as TransferType }))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  {transferTypes.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Status</span>
                <select
                  value={form.status}
                  onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as TransferStatus }))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </label>

              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">From Location</span>
                <Select
                  value={selectedFromLocation}
                  onChange={(option) => setForm((current) => ({ ...current, locationFromId: option?.value ?? '' }))}
                  options={locationOptions}
                  placeholder="Select source location"
                  isSearchable
                  classNamePrefix="react-select"
                  styles={selectStyles}
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">To Location</span>
                <Select
                  value={selectedToLocation}
                  onChange={(option) => setForm((current) => ({ ...current, locationToId: option?.value ?? '' }))}
                  options={locationOptions}
                  placeholder="Select destination location"
                  isSearchable
                  classNamePrefix="react-select"
                  styles={selectStyles}
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <span className="text-xs font-medium text-muted-foreground">Notes</span>
                <div className="mt-1.5 overflow-hidden rounded-xl border border-border bg-background outline-none focus-within:ring-1 focus-within:ring-primary">
                  <CKEditor
                    editor={ClassicEditor}
                    data={form.notes}
                    config={{
                      licenseKey: 'GPL',
                      plugins: [Essentials, Paragraph, Bold, Italic, Link, List, BlockQuote, Undo],
                      toolbar: ['undo', 'redo', '|', 'bold', 'italic', 'link', '|', 'bulletedList', 'numberedList', 'blockQuote'],
                      placeholder: 'Add notes for this transfer...',
                    }}
                    onChange={(_, editor) => {
                      setForm((current) => ({
                        ...current,
                        notes: editor.getData(),
                      }));
                    }}
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon={Package}
            title="Products to Transfer"
            description="Search the catalog, add items, and fine tune quantities or unit costs."
            actions={
              <button
                type="button"
                onClick={() => setProductQuery('')}
                className="inline-flex items-center gap-2 rounded-sm border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition hover:bg-surface-alt"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Clear Search
              </button>
            }
          >
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={productQuery}
                    onChange={(event) => setProductQuery(event.target.value)}
                    placeholder="Search products by name or SKU..."
                    className="w-full rounded-2xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {searchError ? (
                  <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                    {searchError}
                  </div>
                ) : null}

                {productQuery.trim().length >= 2 ? (
                  <div className="mt-4 rounded-2xl border border-border bg-surface">
                    {isSearching ? (
                      <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-muted-foreground">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Searching products...
                      </div>
                    ) : productResults.length > 0 ? (
                      <div className="divide-y divide-border">
                        {productResults.map((product) => (
                          <div key={product.id} className="flex items-center justify-between gap-4 px-4 py-4">
                            <div className="min-w-0">
                              <p className="font-medium text-foreground">{product.name}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                SKU: {product.sku ?? 'N/A'} • Unit: {product.unitName} • Stock: {product.currentStock ?? 0}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-foreground">
                                {formatMoney(Number(product.purchasePrice ?? product.sellingPrice ?? 0), currencyCode, currencyPrecision, currencyPlacement)}
                              </span>
                              <button
                                type="button"
                                onClick={() => addProduct(product)}
                                className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Add
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-6 text-sm text-muted-foreground">
                        No products found for “{productQuery}”.
                      </div>
                    )}
                  </div>
                ) : null}

                <div className="mt-5 overflow-hidden rounded-sm border border-border">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-surface-alt/60">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">SKU</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Qty</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unit Cost</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subtotal</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-card">
                        {form.items.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                              <div className="flex flex-col items-center gap-2">
                                <Package className="h-10 w-10 text-muted-foreground/40" />
                                <p>No products added yet.</p>
                                <p className="text-xs">Search above to add stock items to this transfer.</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          form.items.map((item) => (
                            <tr key={item.id} className="transition hover:bg-surface-alt/70">
                              <td className="px-4 py-3">
                                <p className="text-sm font-medium text-foreground">{item.productName}</p>
                                <p className="text-xs text-muted-foreground">{item.unit}</p>
                              </td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">{item.sku || 'N/A'}</td>
                              <td className="px-4 py-3 text-right">
                                <input
                                  type="number"
                                  min={1}
                                  value={item.quantity}
                                  onChange={(event) => updateItem(item.id, 'quantity', Math.max(1, Number(event.target.value) || 1))}
                                  className="w-20 rounded-lg border border-border bg-background px-3 py-2 text-right text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />
                              </td>
                              <td className="px-4 py-3 text-right">
                                <input
                                  type="number"
                                  min={0}
                                  value={item.unitPrice}
                                  onChange={(event) => updateItem(item.id, 'unitPrice', Math.max(0, Number(event.target.value) || 0))}
                                  className="w-28 rounded-lg border border-border bg-background px-3 py-2 text-right text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                                {formatMoney(item.subtotal, currencyCode, currencyPrecision, currencyPlacement)}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => removeItem(item.id)}
                                  className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </SectionCard>

          <div className="flex flex-wrap items-center justify-end gap-3 rounded-sm border border-border bg-card p-4 shadow-sm">
            <button
              type="button"
              onClick={resetForm}
              className={shellButtonClass()}
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </button>
            <button
              type="button"
              onClick={() => void submitTransfer('draft')}
              disabled={isSaving}
              className={shellButtonClass('secondary')}
            >
              <Save className="h-4 w-4" />
              Save Draft
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={shellButtonClass('primary')}
            >
              <Plus className="h-4 w-4" />
              {isSaving ? 'Submitting...' : 'Submit Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
