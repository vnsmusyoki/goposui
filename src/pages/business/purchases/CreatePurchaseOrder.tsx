import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Select, { type StylesConfig } from 'react-select';
import {
  ArrowLeft,
  Save,
  Plus,
  Search,
  X,
  Trash2, 
  MapPin,
  Building2,
  FileText,
  Percent,
  DollarSign,
  Package,
  Tag, 
  Upload, 
  Truck,
  Users, 
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useBusinessLocations } from '@/hooks/business/settings/useBusinessLocations';
import { useBusinessSettings } from '@/hooks/business/settings/useBusinessSettings';
import { usePurchasesSettings } from '@/hooks/business/settings/usePurchasesSettings';
import { useProductSettings } from '@/hooks/business/settings/useProductSettings';
import { useBusinessSuppliers } from '@/hooks/business/suppliers/useBusinessSuppliers';
import { useProducts, type ProductSearchResult } from '@/hooks/business/products/useProducts';
import { usePurchaseOrders } from '@/hooks/business/purchases/usePurchaseOrders';
import DatePickerField from '@/components/forms/DatePickerField';
import { ApiError } from '@/lib/api';
import { formatProductSkuDisplay } from '@/lib/productSku';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

type PaymentTermUnit = 'days' | 'months' | 'years';

type SelectOption = {
  value: string;
  label: string;
};

type PurchaseOrderItem = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  orderQuantity: number;
  unitCostBeforeDiscount: number;
  discountPercentage: number;
  discountAmount: number;
  unitCostBeforeTax: number;
  productTaxRate: number;
  taxAmount: number;
  netCost: number;
  sellingPrice: number;
  isSellingPriceManual?: boolean;
  lineCost: number;
  expiryDate: string;
  lotNumber: string;
  receivedQuantity?: number;
};

type FormState = {
  supplierId: string;
  referenceNumber: string;
  orderDate: string;
  deliveryDate: string;
  locationId: string;
  deliveryAddress: string;
  deliveryCharges: number;
  deliveryStatus: 'pending_delivery' | 'in_transit' | 'delivered';
  orderDiscountAmount: number;
  paymentTerm: {
    value: number;
    unit: PaymentTermUnit;
  };
  attachment: File | null;
  deliveryDocument: File | null;
  notes: string;
  status: 'draft' | 'pending' | 'approved';
};

type AdditionalExpense = {
  id: string;
  name: string;
  amount: number;
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

function generateId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// --------------------------------------------------------------------------
// Sub-components
// --------------------------------------------------------------------------

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  icon: Icon,
  className = '',
  error,
}: {
  label: string;
  value: string | number;
  onChange: (value: any) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  error?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${error ? 'text-destructive' : 'text-muted-foreground'}`} />
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-lg border ${error ? 'border-destructive' : 'border-border'} bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary ${Icon ? 'pl-9' : ''}`}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  required = false,
  icon: Icon,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder: string;
  required?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  error?: string;
}) {
  const selectedOption = options.find((option) => option.value === value) ?? null;

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className={`pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 ${error ? 'text-destructive' : 'text-muted-foreground'}`} />
        )}
        <Select
          value={selectedOption}
          onChange={(option) => onChange(option?.value ?? '')}
          options={options}
          placeholder={placeholder}
          isSearchable
          classNamePrefix="react-select"
          styles={Icon ? selectStylesWithIcon : selectStyles}
          unstyled={false}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

const selectStyles: StylesConfig<SelectOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: '42px',
    borderRadius: '0.125rem',
    borderColor: state.isFocused ? 'hsl(var(--primary))' : 'hsl(var(--border))',
    backgroundColor: 'hsl(var(--background))',
    boxShadow: state.isFocused ? '0 0 0 1px hsl(var(--primary))' : 'none',
    paddingLeft: '0.25rem',
    '&:hover': {
      borderColor: state.isFocused ? 'hsl(var(--primary))' : 'hsl(var(--border))',
    },
  }),
  valueContainer: (base) => ({
    ...base,
    padding: '0.25rem 0.5rem',
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
    borderRadius: '0.125rem',
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
    color: state.isSelected ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
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

const selectStylesWithIcon: StylesConfig<SelectOption, false> = {
  ...selectStyles,
  control: (base, state) => ({
    ...base,
    minHeight: '42px',
    borderRadius: '0.125rem',
    borderColor: state.isFocused ? 'hsl(var(--primary))' : 'hsl(var(--border))',
    backgroundColor: 'hsl(var(--background))',
    boxShadow: state.isFocused ? '0 0 0 1px hsl(var(--primary))' : 'none',
    paddingLeft: '2rem',
    '&:hover': {
      borderColor: state.isFocused ? 'hsl(var(--primary))' : 'hsl(var(--border))',
    },
  }),
  valueContainer: (base) => ({
    ...base,
    padding: '0.25rem 0.5rem',
    paddingLeft: '1.75rem',
  }),
};

function SectionCard({
  title,
  description,
  children,
  icon: Icon,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-sm border border-border bg-card p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        {Icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-primary">
            <Icon className="h-4.5 w-4.5" />
          </div>
        )}
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function ProductSearchResult({
  product,
  onAdd,
}: {
  product: ProductSearchResult;
  onAdd: (product: ProductSearchResult) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onAdd(product)}
      className="flex w-full items-center justify-between rounded-lg border border-border bg-background p-3 hover:bg-muted/30 transition-colors"
    >
      <div className="min-w-0 flex-1 text-left">
        <p className="text-sm font-medium text-foreground">{product.name}</p>
        <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>SKU: {product.sku}</span>
          <span>•</span>
          <span>Unit: {product.unitName}</span>
          <span>•</span>
          <span>Selling: {formatMoney(product.sellingPrice, 'USD', 2, 'before')}</span>
        </div>
      </div>
      <button
        type="button"
        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
      >
        Add
      </button>
    </button>
  );
}

// --------------------------------------------------------------------------
// Main Component
// --------------------------------------------------------------------------

export default function CreatePurchaseOrder() {
  const navigate = useNavigate();
  const { settings: businessSettings } = useBusinessSettings();
  const { settings: productSettings } = useProductSettings();
  const { settings: purchasesSettings } = usePurchasesSettings();
  const { locations } = useBusinessLocations();
  const { suppliers } = useBusinessSuppliers();
  const { searchProducts, isLoading: searchLoading } = useProducts();
  const { createPurchaseOrder, loading: saveLoading } = usePurchaseOrders();

  const [formData, setFormData] = useState<FormState>({
    supplierId: '',
    referenceNumber: '',
    orderDate: format(new Date(), 'yyyy-MM-dd'),
    deliveryDate: '',
    locationId: '',
    deliveryAddress: '',
    deliveryCharges: 0,
    deliveryStatus: 'pending_delivery',
    orderDiscountAmount: 0,
    paymentTerm: {
      value: 30,
      unit: 'days',
    },
    attachment: null,
    deliveryDocument: null,
    notes: '',
    status: 'draft',
  });

  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  const [additionalExpenses, setAdditionalExpenses] = useState<AdditionalExpense[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const deliveryFileInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currencyCode = businessSettings?.currency || 'USD';
  const currencyPrecision = typeof businessSettings?.currencyPrecision === 'number' ? businessSettings.currencyPrecision : 2;
  const currencyPlacement = businessSettings?.currencySymbolPlacement === 'after' ? 'after' : 'before';
  const currencySymbol = getCurrencySymbol(currencyCode);
  const defaultProfitPercentage =
    typeof businessSettings?.defaultProfitPercentage === 'number' ? businessSettings.defaultProfitPercentage : 0;
  const showExpiryFields = Boolean(productSettings?.enableProductExpiry);
  const showLotNumberField = Boolean(purchasesSettings?.enableLotNumber);
  const itemTableColumnCount = 10 + (showExpiryFields ? 1 : 0) + (showLotNumberField ? 1 : 0);

  const calculateSellingPrice = useCallback(
    (cost: number) => {
      const safeCost = Number.isFinite(cost) ? Math.max(0, cost) : 0;
      return safeCost * (1 + defaultProfitPercentage / 100);
    },
    [defaultProfitPercentage],
  );

  // Search products with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchProducts(searchQuery.trim());
        // Filter out products already added
        const existingIds = new Set(items.map((item) => item.productId));
        const filtered = results.filter((product) => !existingIds.has(product.id));
        setSearchResults(filtered);
      } catch (err) {
        toast.error('Failed to search products');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, items, searchProducts]);

  // Calculate item totals
  const calculateItemTotals = useCallback((item: PurchaseOrderItem): PurchaseOrderItem => {
    const discountAmount = (item.unitCostBeforeDiscount * item.discountPercentage) / 100;
    const unitCostBeforeTax = item.unitCostBeforeDiscount - discountAmount;
    const taxAmount = (unitCostBeforeTax * item.productTaxRate) / 100;
    const netCost = unitCostBeforeTax + taxAmount;
    const sellingPrice = item.isSellingPriceManual ? Math.max(0, item.sellingPrice) : calculateSellingPrice(unitCostBeforeTax);
    const lineCost = netCost * item.orderQuantity;

    return {
      ...item,
      discountAmount,
      unitCostBeforeTax,
      taxAmount,
      netCost,
      sellingPrice,
      lineCost,
    };
  }, [calculateSellingPrice]);

  // Add product to items
  const addProduct = (product: ProductSearchResult) => {
    const newItem: PurchaseOrderItem = {
      id: generateId(),
      productId: product.id,
      productName: product.name,
      sku: product.sku || '',
      unit: product.unitName || '',
      orderQuantity: 1,
      unitCostBeforeDiscount: product.purchasePrice || 0,
      discountPercentage: 0,
      discountAmount: 0,
      unitCostBeforeTax: product.purchasePrice || 0,
      productTaxRate: product.taxRate || 0,
      taxAmount: 0,
      netCost: product.purchasePrice || 0,
      sellingPrice: calculateSellingPrice(product.purchasePrice || 0),
      isSellingPriceManual: false,
      lineCost: product.purchasePrice || 0,
      expiryDate: '',
      lotNumber: '',
    };

    const calculatedItem = calculateItemTotals(newItem);
    setItems((prev) => [...prev, calculatedItem]);
    setSearchQuery('');
    setSearchResults([]);
    toast.success(`${product.name} added to order`);
  };

  // Update item
  const updateItem = (id: string, field: keyof PurchaseOrderItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = {
          ...item,
          [field]: value,
          ...(field === 'sellingPrice' ? { isSellingPriceManual: true } : {}),
        };
        return calculateItemTotals(updated);
      })
    );
  };

  // Remove item
  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Calculate order totals
  const orderTotals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.unitCostBeforeDiscount * item.orderQuantity, 0);
    const totalDiscount = items.reduce((sum, item) => sum + item.discountAmount * item.orderQuantity, 0);
    const totalTax = items.reduce((sum, item) => sum + item.taxAmount * item.orderQuantity, 0);
    const total = items.reduce((sum, item) => sum + item.lineCost, 0);

    return {
      subtotal,
      totalDiscount,
      totalTax,
      total,
      itemCount: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.orderQuantity, 0),
    };
  }, [items]);

  const additionalExpensesTotal = useMemo(
    () => additionalExpenses.reduce((sum, expense) => sum + (Number.isFinite(expense.amount) ? expense.amount : 0), 0),
    [additionalExpenses],
  );

  const grandTotal = useMemo(
    () =>
      Math.max(
        0,
        orderTotals.total +
          (Number.isFinite(formData.deliveryCharges) ? formData.deliveryCharges : 0) +
          additionalExpensesTotal -
          (Number.isFinite(formData.orderDiscountAmount) ? formData.orderDiscountAmount : 0),
      ),
    [additionalExpensesTotal, formData.deliveryCharges, formData.orderDiscountAmount, orderTotals.total],
  );

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.supplierId) {
      newErrors.supplierId = 'Please select a supplier';
    }
    if (!formData.orderDate) {
      newErrors.orderDate = 'Order date is required';
    }
    if (!formData.locationId) {
      newErrors.locationId = 'Please select a business location';
    }
    if (items.length === 0) {
      newErrors.items = 'Please add at least one item to the order';
    }
    if (items.some((item) => item.orderQuantity <= 0)) {
      newErrors.quantity = 'All items must have a quantity greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save purchase order
  const handleSave = async (status: 'draft' | 'pending' | 'approved') => {
    if (!validate()) {
      toast.error('Please fix the errors before saving');
      return;
    }

    try {
      const payload = {
        ...formData,
        status,
        deliveryDocument: formData.deliveryDocument ? formData.deliveryDocument.name : null,
        items: items.map((item) => ({
          productId: item.productId,
          orderQuantity: item.orderQuantity,
          unitCostBeforeDiscount: item.unitCostBeforeDiscount,
          discountPercentage: item.discountPercentage,
          discountAmount: item.discountAmount,
          unitCostBeforeTax: item.unitCostBeforeTax,
          productTaxRate: item.productTaxRate,
          taxAmount: item.taxAmount,
          netCost: item.netCost,
          sellingPrice: item.sellingPrice,
          lineCost: item.lineCost,
          expiryDate: item.expiryDate,
          lotNumber: item.lotNumber,
        })),
        totals: orderTotals,
        additionalExpenses,
        grandTotal,
      };

      await createPurchaseOrder(payload);
      toast.success(`Purchase order ${status === 'draft' ? 'saved as draft' : 'created'} successfully`);
      navigate('/purchases/order');
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message || 'Failed to create purchase order');
      } else {
        toast.error('Failed to create purchase order');
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        toast.error('Only PDF documents are allowed');
        e.target.value = '';
        return;
      }
      if (file.size > maxSize) {
        toast.error('File size must be less than 10MB');
        e.target.value = '';
        return;
      }
      setFormData({ ...formData, attachment: file });
    }
    e.target.value = '';
  };

  const handleDeliveryDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 10 * 1024 * 1024;
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        toast.error('Only PDF documents are allowed for delivery documents');
        e.target.value = '';
        return;
      }
      if (file.size > maxSize) {
        toast.error('Delivery document must be less than 10MB');
        e.target.value = '';
        return;
      }
      setFormData((current) => ({ ...current, deliveryDocument: file }));
    }
    e.target.value = '';
  };

  const addAdditionalExpense = () => {
    setAdditionalExpenses((current) => {
      if (current.length >= 5) {
        toast.error('You can only add up to 5 additional expenses');
        return current;
      }
      return [...current, { id: generateId(), name: '', amount: 0 }];
    });
  };

  const updateAdditionalExpense = (id: string, field: keyof Omit<AdditionalExpense, 'id'>, value: string | number) => {
    setAdditionalExpenses((current) =>
      current.map((expense) => (expense.id === id ? { ...expense, [field]: value } : expense))
    );
  };

  const removeAdditionalExpense = (id: string) => {
    setAdditionalExpenses((current) => current.filter((expense) => expense.id !== id));
  };

  const locationOptions = locations.map((loc) => ({
    value: loc.id,
    label: loc.locationName,
  }));

  const supplierOptions = suppliers.map((sup) => ({
    value: sup.id,
    label: sup.name,
  }));

  const paymentUnitOptions: SelectOption[] = [
    { value: 'days', label: 'Days' },
    { value: 'months', label: 'Months' },
    { value: 'years', label: 'Years' },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/95 px-4 py-4 backdrop-blur sm:px-6">
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
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">Create Purchase Order</h1>
              <p className="mt-0.5 text-sm text-muted-foreground hidden sm:block">
                Add a new purchase order with products and supplier details
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleSave('draft')}
              disabled={saveLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-alt disabled:opacity-50"
            >
              <FileText className="h-4 w-4" />
              Save as Draft
            </button>
            <button
              type="button"
              onClick={() => handleSave('pending')}
              disabled={saveLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Create Order
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Supplier & Order Details Card */}
        <SectionCard
          title="Supplier & Order Details"
          description="Enter the supplier information and order details"
          icon={Building2}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Supplier */}
            <SelectField
              label="Supplier"
              value={formData.supplierId}
              onChange={(value) => setFormData({ ...formData, supplierId: value })}
              options={supplierOptions}
              placeholder="Select supplier"
              required
              icon={Users}
              error={errors.supplierId}
            />

            {/* Reference Number */}
            <FormInput
              label="Reference Number"
              value={formData.referenceNumber}
              onChange={(value) => setFormData({ ...formData, referenceNumber: value })}
              placeholder="e.g., PO-2024-001"
              icon={Tag}
            />

            {/* Order Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Order Date <span className="ml-1 text-destructive">*</span>
              </label>
              <DatePickerField
                value={formData.orderDate}
                onChange={(value) => setFormData({ ...formData, orderDate: value })}
                placeholder="Select order date"
              />
              {errors.orderDate && <p className="text-xs text-destructive">{errors.orderDate}</p>}
            </div>

            {/* Delivery Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Expected Delivery Date</label>
              <DatePickerField
                value={formData.deliveryDate}
                onChange={(value) => setFormData({ ...formData, deliveryDate: value })}
                placeholder="Select delivery date"
              />
            </div>

            {/* Business Location */}
            <SelectField
              label="Business Location"
              value={formData.locationId}
              onChange={(value) => setFormData({ ...formData, locationId: value })}
              options={locationOptions}
              placeholder="Select location"
              required
              icon={MapPin}
              error={errors.locationId}
            />

            {/* Payment Term */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Payment Term</label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="number"
                    min={0}
                    value={formData.paymentTerm.value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentTerm: { ...formData.paymentTerm, value: parseInt(e.target.value) || 0 },
                      })
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="30"
                  />
                </div>
                <div className="flex-1">
                  <Select
                    value={paymentUnitOptions.find((option) => option.value === formData.paymentTerm.unit) ?? null}
                    onChange={(option) =>
                      setFormData({
                        ...formData,
                        paymentTerm: { ...formData.paymentTerm, unit: (option?.value ?? 'days') as PaymentTermUnit },
                      })
                    }
                    options={paymentUnitOptions}
                    placeholder="Select term"
                    isSearchable
                    classNamePrefix="react-select"
                    styles={selectStyles}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Attachment & Notes */}
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-1">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Attach Document</label>
              <div className="mt-1.5">
                {formData.attachment ? (
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{formData.attachment.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(formData.attachment.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, attachment: null })}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-background p-4 text-sm text-muted-foreground hover:border-primary/60 hover:bg-muted/20 transition-colors"
                  >
                    <Upload className="h-5 w-5" />
                    Upload Document (PDF only, Max 10MB)
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes for this purchase order..."
                className="mt-1.5 min-h-[80px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                rows={3}
              />
            </div>
          </div>
        </SectionCard>

        {/* Products Card */}
        <SectionCard
          title="Order Items"
          description="Search and add products to this purchase order"
          icon={Package}
        >
          {/* Product Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name or SKU (min 3 characters)..."
                className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-4 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-3 max-h-60 overflow-y-auto rounded-lg border border-border bg-background p-2 space-y-2">
                {searchResults.map((product) => (
                  <ProductSearchResult key={product.id} product={product} onAdd={addProduct} />
                ))}
              </div>
            )}
            {searchQuery.trim().length >= 3 && searchResults.length === 0 && !isSearching && (
              <p className="mt-2 text-sm text-muted-foreground">No products found matching your search.</p>
            )}
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto rounded-sm border border-border bg-background">
            <table
              className="divide-y divide-border text-sm"
              style={{
                minWidth: showExpiryFields && showLotNumberField ? '1400px' : showExpiryFields || showLotNumberField ? '1250px' : '1100px',
              }}
            >
              <thead className="bg-muted/30">
                <tr>
                  <th className="w-[360px] px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Product
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Qty
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Unit Cost <br />(Before Discount)
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Discount %
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Unit Cost <br />(Before Tax)
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Tax %
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Net Cost
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Selling Price
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Line Cost
                  </th>
                  {showExpiryFields && (
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Expiry
                    </th>
                  )}
                  {showLotNumberField && (
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Lot #
                    </th>
                  )}
                  <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={itemTableColumnCount} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      <Package className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                      No items added yet. Search for products above to add them.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                      <td className="w-[360px] px-4 py-3">
                        <div className="space-y-0.5">
                          <p className="font-medium text-foreground">{item.productName}</p>
                          <p className="truncate text-xs text-muted-foreground">SKU: {item.sku}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={1}
                          value={item.orderQuantity}
                          onChange={(e) => updateItem(item.id, 'orderQuantity', Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-16 rounded border border-border bg-background px-2 py-1 text-right text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.unitCostBeforeDiscount}
                          onChange={(e) => updateItem(item.id, 'unitCostBeforeDiscount', parseFloat(e.target.value) || 0)}
                          className="w-24 rounded border border-border bg-background px-2 py-1 text-right text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="0.1"
                          value={item.discountPercentage}
                          onChange={(e) => updateItem(item.id, 'discountPercentage', Math.min(100, parseFloat(e.target.value) || 0))}
                          className="w-16 rounded border border-border bg-background px-2 py-1 text-right text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">
                        {formatMoney(item.unitCostBeforeTax, currencyCode, currencyPrecision, currencyPlacement)}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="0.1"
                          value={item.productTaxRate}
                          onChange={(e) => updateItem(item.id, 'productTaxRate', Math.min(100, parseFloat(e.target.value) || 0))}
                          className="w-16 rounded border border-border bg-background px-2 py-1 text-right text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">
                        {formatMoney(item.netCost, currencyCode, currencyPrecision, currencyPlacement)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={item.sellingPrice}
                            onChange={(e) => updateItem(item.id, 'sellingPrice', Math.max(0, parseFloat(e.target.value) || 0))}
                            className="w-24 rounded border border-border bg-background px-2 py-1 text-right text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          />
                          <p className="text-[11px] leading-4 text-muted-foreground">
                            {item.isSellingPriceManual
                              ? 'Manual override enabled'
                              : `Auto-applied from default profit margin (${defaultProfitPercentage}%)`}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground">
                        {formatMoney(item.lineCost, currencyCode, currencyPrecision, currencyPlacement)}
                      </td>
                      {showExpiryFields && (
                        <td className="px-4 py-3">
                          <div className="min-w-[180px]">
                            <DatePickerField
                              value={item.expiryDate}
                              onChange={(value) => updateItem(item.id, 'expiryDate', value)}
                              placeholder="Select expiry"
                              usePortal
                            />
                          </div>
                        </td>
                      )}
                      {showLotNumberField && (
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={item.lotNumber}
                            onChange={(e) => updateItem(item.id, 'lotNumber', e.target.value)}
                            placeholder="Lot #"
                            className="w-20 rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          />
                        </td>
                      )}
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {errors.items && (
            <p className="mt-2 text-sm text-destructive">{errors.items}</p>
          )}
          {errors.quantity && (
            <p className="mt-1 text-sm text-destructive">{errors.quantity}</p>
          )}
        </SectionCard>

        {/* Delivery & Summary Card */}
        <SectionCard
          title="Delivery, Discount & Summary"
          description="Capture delivery details, extra charges and review the final amounts"
          icon={Truck}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="space-y-4 rounded-sm border border-border bg-background p-4">
                <h3 className="text-sm font-semibold text-foreground">Delivery Details</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Delivery Address</label>
                    <textarea
                      value={formData.deliveryAddress}
                      onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                      placeholder="Enter delivery address"
                      className="min-h-[96px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <FormInput
                    label="Delivery Charges"
                    value={formData.deliveryCharges}
                    onChange={(value) => setFormData({ ...formData, deliveryCharges: Math.max(0, Number(value) || 0) })}
                    placeholder="0.00"
                    type="number"
                    icon={DollarSign}
                  />
                  <p className="text-[11px] text-muted-foreground md:col-span-2">
                    Using business currency: {currencyPlacement === 'after' ? `amount ${currencySymbol}` : `${currencySymbol} amount`}
                  </p>
                  <SelectField
                    label="Delivery Status"
                    value={formData.deliveryStatus}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        deliveryStatus: value as FormState['deliveryStatus'],
                      })
                    }
                    options={[
                      { value: 'pending_delivery', label: 'Pending Delivery' },
                      { value: 'in_transit', label: 'In Transit' },
                      { value: 'delivered', label: 'Delivered' },
                    ]}
                    placeholder="Select status"
                    icon={Truck}
                  />
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Delivery Documents</label>
                    {formData.deliveryDocument ? (
                      <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
                        <FileText className="h-8 w-8 text-primary" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{formData.deliveryDocument.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(formData.deliveryDocument.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, deliveryDocument: null })}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => deliveryFileInputRef.current?.click()}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-background p-4 text-sm text-muted-foreground hover:border-primary/60 hover:bg-muted/20 transition-colors"
                      >
                        <Upload className="h-5 w-5" />
                        Upload Delivery Document (PDF only, Max 10MB)
                      </button>
                    )}
                    <input
                      ref={deliveryFileInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleDeliveryDocumentUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-sm border border-border bg-background p-4">
                <h3 className="text-sm font-semibold text-foreground">Discount & Additional Expenses</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormInput
                    label="Discount"
                    value={formData.orderDiscountAmount}
                    onChange={(value) => setFormData({ ...formData, orderDiscountAmount: Math.max(0, Number(value) || 0) })}
                    placeholder={`0 ${currencyCode}`}
                    type="number"
                    icon={Percent}
                  />
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={addAdditionalExpense}
                      disabled={additionalExpenses.length >= 5}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                      Add Expense
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {additionalExpenses.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No additional expenses added yet.</p>
                  ) : (
                    additionalExpenses.map((expense, index) => (
                      <div key={expense.id} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_160px_auto]">
                        <FormInput
                          label={`Expense ${index + 1} Name`}
                          value={expense.name}
                          onChange={(value) => updateAdditionalExpense(expense.id, 'name', value)}
                          placeholder="e.g. Loading fees"
                        />
                        <FormInput
                          label="Amount"
                          value={expense.amount}
                          onChange={(value) => updateAdditionalExpense(expense.id, 'amount', Math.max(0, Number(value) || 0))}
                          placeholder={`0 ${currencyCode}`}
                          type="number"
                          icon={DollarSign}
                        />
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => removeAdditionalExpense(expense.id)}
                            className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-3 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-sm border border-border bg-background p-4">
                <p className="text-xs font-medium text-muted-foreground">Total Items</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{orderTotals.itemCount}</p>
              </div>
              <div className="rounded-sm border border-border bg-background p-4">
                <p className="text-xs font-medium text-muted-foreground">Total Quantity</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{orderTotals.totalQuantity}</p>
              </div>
              <div className="rounded-sm border border-border bg-background p-4">
                <p className="text-xs font-medium text-muted-foreground">Items Total</p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {formatMoney(orderTotals.total, currencyCode, currencyPrecision, currencyPlacement)}
                </p>
              </div>
              <div className="rounded-sm border border-border bg-background p-4">
                <p className="text-xs font-medium text-muted-foreground">Grand Total</p>
                <p className="mt-1 text-xl font-bold text-foreground">
                  {formatMoney(grandTotal, currencyCode, currencyPrecision, currencyPlacement)}
                </p>
              </div>
            </div>

            <div className="rounded-sm border border-border bg-background p-4">
              <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Subtotal</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {formatMoney(orderTotals.subtotal, currencyCode, currencyPrecision, currencyPlacement)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Discount</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    -{formatMoney(formData.orderDiscountAmount, currencyCode, currencyPrecision, currencyPlacement)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Delivery Charges</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {formatMoney(formData.deliveryCharges, currencyCode, currencyPrecision, currencyPlacement)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Additional Expenses</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {formatMoney(additionalExpensesTotal, currencyCode, currencyPrecision, currencyPlacement)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
