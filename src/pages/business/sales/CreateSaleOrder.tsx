import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Select, { type StylesConfig } from "react-select";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  ClassicEditor,
  Essentials,
  Paragraph,
  Heading,
  Bold,
  Italic,
  Link,
  List,
  BlockQuote,
  Undo,
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";
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
  Package,
  Tag,
  Upload,
  Truck,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { useBusinessLocations } from "@/hooks/business/settings/useBusinessLocations";
import { useBusinessSettings } from "@/hooks/business/settings/useBusinessSettings";
import { usePurchasesSettings } from "@/hooks/business/settings/usePurchasesSettings";
import { useProductSettings } from "@/hooks/business/settings/useProductSettings";
import { useBusinessCustomers } from "@/hooks/business/customers/useBusinessCustomers";
import {
  useProducts,
  type ProductSearchResult,
} from "@/hooks/business/products/useProducts";
import {
  useSalesOrders,
  type SaleOrderStatus,
} from "@/hooks/business/sales/useSalesOrders";
import DatePickerField from "@/components/forms/DatePickerField";
import { ApiError } from "@/lib/api";
import { formatProductSkuDisplay } from "@/lib/productSku";

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

type PaymentTermUnit = "days" | "months";

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
  availableStock: number;
  orderQuantity: number;
  unitCostBeforeDiscount: number;
  discountPercentage: number;
  discountAmount: number;
  unitCostBeforeTax: number;
  productTaxRate: number;
  taxType: "exclusive" | "inclusive" | "none";
  purchasePriceExclusive: number;
  purchasePriceInclusive: number;
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
  customerId: string;
  referenceNumber: string;
  orderDate: string;
  deliveryDate: string;
  locationId: string;
  deliveryAddress: string;
  deliveryCharges: number;
  deliveryStatus: "pending_delivery" | "in_transit" | "delivered";
  orderDiscountAmount: number;
  paymentTerm: {
    value: number;
    unit: PaymentTermUnit;
  };
  attachment: File | null;
  deliveryDocument: File | null;
  notes: string;
  status: SaleOrderStatus;
  reserveOrderItems: boolean;
};

type AdditionalExpense = {
  id: string;
  name: string;
  amount: number;
};

function getTaxAmountFromStoredPrices(
  purchasePriceExclusive: number,
  purchasePriceInclusive: number,
  productTaxRate: number,
) {
  if (
    purchasePriceInclusive > purchasePriceExclusive &&
    purchasePriceExclusive >= 0
  ) {
    return Math.max(0, purchasePriceInclusive - purchasePriceExclusive);
  }

  if (productTaxRate > 0 && purchasePriceExclusive > 0) {
    return (purchasePriceExclusive * productTaxRate) / 100;
  }

  return 0;
}

type ToggleSwitchProps = {
  checked: boolean;
  onChange: () => void;
  label: string;
  description?: string;
};

function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="flex w-full items-center justify-between gap-4 rounded-lg border border-border bg-background px-4 py-3 text-left transition-colors hover:border-primary/60"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-muted"
        }`}
        aria-hidden="true"
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-background shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function formatMoney(
  amount: number,
  currencyCode: string,
  precision: number,
  placement: "before" | "after",
  showSymbol = true,
) {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const currencySymbol = getCurrencySymbol(currencyCode);
  const numeric = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(safeAmount);

  if (!showSymbol) {
    return numeric;
  }

  return placement === "after"
    ? `${numeric} ${currencySymbol}`
    : `${currencySymbol} ${numeric}`;
}

function getCurrencySymbol(currencyCode?: string) {
  if (!currencyCode) return "KES";
  try {
    const formatter = new Intl.NumberFormat("en", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return (
      formatter.formatToParts(1).find((part) => part.type === "currency")
        ?.value ?? currencyCode
    );
  } catch {
    return currencyCode;
  }
}

function generateId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  );
}

// --------------------------------------------------------------------------
// Sub-components
// --------------------------------------------------------------------------

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  icon: Icon,
  className = "",
  error,
  readOnly = false,
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
  readOnly?: boolean;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${error ? "text-destructive" : "text-muted-foreground"}`}
          />
        )}
        <input
          type={type}
          value={value}
          onChange={
            readOnly
              ? undefined
              : (e) =>
                  onChange(
                    type === "number"
                      ? parseFloat(e.target.value) || 0
                      : e.target.value,
                  )
          }
          readOnly={readOnly}
          placeholder={placeholder}
          className={`w-full rounded-lg border ${error ? "border-destructive" : "border-border"} bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary ${Icon ? "pl-9" : ""} ${readOnly ? "cursor-not-allowed bg-muted/40" : ""}`}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function CurrencyInput({
  label,
  value,
  onChange,
  placeholder,
  currencySymbol,
  currencyPlacement,
  required = false,
  error,
}: {
  label: string;
  value: string | number;
  onChange: (value: number) => void;
  placeholder?: string;
  currencySymbol: string;
  currencyPlacement: "before" | "after";
  required?: boolean;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </label>
      <div className="relative">
        {currencyPlacement === "before" ? (
          <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-sm font-medium text-muted-foreground">
            {currencySymbol}
          </span>
        ) : null}
        <input
          type="number"
          min={0}
          value={value}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          placeholder={placeholder}
          className={`w-full rounded-lg border ${error ? "border-destructive" : "border-border"} bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary ${
            currencyPlacement === "before" ? "pl-12" : "pr-12"
          }`}
        />
        {currencyPlacement === "after" ? (
          <span className="pointer-events-none absolute right-3 top-1/2 z-10 -translate-y-1/2 text-sm font-medium text-muted-foreground">
            {currencySymbol}
          </span>
        ) : null}
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
  const selectedOption =
    options.find((option) => option.value === value) ?? null;

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            className={`pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 ${error ? "text-destructive" : "text-muted-foreground"}`}
          />
        )}
        <Select
          value={selectedOption}
          onChange={(option) => onChange(option?.value ?? "")}
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
    minHeight: "42px",
    borderRadius: "0.125rem",
    borderColor: state.isFocused ? "hsl(var(--primary))" : "hsl(var(--border))",
    backgroundColor: "hsl(var(--background))",
    boxShadow: state.isFocused ? "0 0 0 1px hsl(var(--primary))" : "none",
    paddingLeft: "0.25rem",
    "&:hover": {
      borderColor: state.isFocused
        ? "hsl(var(--primary))"
        : "hsl(var(--border))",
    },
  }),
  valueContainer: (base) => ({
    ...base,
    padding: "0.25rem 0.5rem",
  }),
  input: (base) => ({
    ...base,
    margin: 0,
    padding: 0,
    color: "hsl(var(--foreground))",
  }),
  singleValue: (base) => ({
    ...base,
    color: "hsl(var(--foreground))",
  }),
  placeholder: (base) => ({
    ...base,
    color: "hsl(var(--muted-foreground))",
  }),
  menu: (base) => ({
    ...base,
    zIndex: 50,
    borderRadius: "0.125rem",
    overflow: "hidden",
    backgroundColor: "hsl(var(--background))",
    border: "1px solid hsl(var(--border))",
    boxShadow: "0 12px 30px rgba(0, 0, 0, 0.12)",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "hsl(var(--primary))"
      : state.isFocused
        ? "hsl(var(--muted))"
        : "hsl(var(--background))",
    color: state.isSelected
      ? "hsl(var(--primary-foreground))"
      : "hsl(var(--foreground))",
  }),
  indicatorSeparator: (base) => ({
    ...base,
    backgroundColor: "hsl(var(--border))",
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: "hsl(var(--muted-foreground))",
    ":hover": {
      color: "hsl(var(--foreground))",
    },
  }),
};

const selectStylesWithIcon: StylesConfig<SelectOption, false> = {
  ...selectStyles,
  control: (base, state) => ({
    ...base,
    minHeight: "42px",
    borderRadius: "0.125rem",
    borderColor: state.isFocused ? "hsl(var(--primary))" : "hsl(var(--border))",
    backgroundColor: "hsl(var(--background))",
    boxShadow: state.isFocused ? "0 0 0 1px hsl(var(--primary))" : "none",
    paddingLeft: "2rem",
    "&:hover": {
      borderColor: state.isFocused
        ? "hsl(var(--primary))"
        : "hsl(var(--border))",
    },
  }),
  valueContainer: (base) => ({
    ...base,
    padding: "0.25rem 0.5rem",
    paddingLeft: "1.75rem",
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
          {description && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

function ProductSearchResultCard({
  product,
  onAdd,
  currencyCode,
  currencyPrecision,
  currencyPlacement,
}: {
  product: ProductSearchResult;
  onAdd: (product: ProductSearchResult) => void;
  currencyCode: string;
  currencyPrecision: number;
  currencyPlacement: "before" | "after";
}) {
  const isOutOfStock = (product.currentStock ?? 0) <= 0;

  return (
    <div
      className={`flex w-full items-center justify-between rounded-lg border border-border bg-background p-3 transition-colors ${
        isOutOfStock ? "opacity-50 grayscale" : "hover:bg-muted/30"
      }`}
    >
      <div className="min-w-0 flex-1 text-left">
        <p className="text-sm font-medium text-foreground">{product.name}</p>
        <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>SKU: {product.sku}</span>
          <span>•</span>
          <span>Unit: {product.unitName}</span>
          <span>•</span>
          <span>
            Selling:{" "}
            {formatMoney(
              product.sellingPrice,
              currencyCode,
              currencyPrecision,
              currencyPlacement,
            )}
          </span>
          <span>•</span>
          <span>Stock: {product.currentStock ?? 0}</span>
        </div>
        {isOutOfStock && (
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            Out of stock
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onAdd(product)}
        disabled={isOutOfStock}
        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
      >
        Add
      </button>
    </div>
  );
}

// --------------------------------------------------------------------------
// Main Component
// --------------------------------------------------------------------------

export default function CreateSaleOrder() {
  const navigate = useNavigate();
  const { settings: businessSettings } = useBusinessSettings();
  const { settings: productSettings } = useProductSettings();
  const { settings: purchasesSettings } = usePurchasesSettings();
  const { locations } = useBusinessLocations();
  const { customers } = useBusinessCustomers();
  const { searchProducts, isLoading: searchLoading } = useProducts();
  const {
    createSaleOrder,
    loading: saveLoading,
    error: apiError,
    clearError,
  } = useSalesOrders();

  const [formData, setFormData] = useState<FormState>({
    customerId: "",
    referenceNumber: "",
    orderDate: format(new Date(), "yyyy-MM-dd"),
    deliveryDate: format(new Date(), "yyyy-MM-dd"),
    locationId: "",
    deliveryAddress: "",
    deliveryCharges: 0,
    deliveryStatus: "pending_delivery",
    orderDiscountAmount: 0,
    paymentTerm: {
      value: 1,
      unit: "days",
    },
    attachment: null,
    deliveryDocument: null,
    notes: "",
    status: "draft",
    reserveOrderItems: Boolean(businessSettings?.preserveSaleOrderRequests),
  });

  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  const [additionalExpenses, setAdditionalExpenses] = useState<
    AdditionalExpense[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const deliveryFileInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currencyCode = businessSettings?.currency || "KES";
  const currencyPrecision =
    typeof businessSettings?.currencyPrecision === "number"
      ? businessSettings.currencyPrecision
      : 2;
  const currencyPlacement =
    businessSettings?.currencySymbolPlacement === "after" ? "after" : "before";
  const currencySymbol = getCurrencySymbol(currencyCode);
  const defaultProfitPercentage =
    typeof businessSettings?.defaultProfitPercentage === "number"
      ? businessSettings.defaultProfitPercentage
      : 0;
  const moneyHeaderSuffix = `(${currencyCode})`;
  const sellingPriceHeader =
    defaultProfitPercentage > 0
      ? `Selling Price (${defaultProfitPercentage}% profit)`
      : "Selling Price";
  const showExpiryFields = Boolean(productSettings?.enableProductExpiry);
  const showLotNumberField = Boolean(purchasesSettings?.enableLotNumber);
  const itemTableColumnCount = 9;

  const selectedLocation = useMemo(
    () =>
      locations.find((location) => location.id === formData.locationId) ?? null,
    [formData.locationId, locations],
  );

  useEffect(() => {
    if (formData.status === "approved") {
      setFormData((current) => ({
        ...current,
        reserveOrderItems:
          current.reserveOrderItems ||
          Boolean(businessSettings?.preserveSaleOrderRequests),
      }));
    }
  }, [businessSettings?.preserveSaleOrderRequests, formData.status]);

  useEffect(() => {
    if (!selectedLocation) {
      return;
    }

    const defaultDeliveryAddress = [
      selectedLocation.exactAddress,
      selectedLocation.landmark,
      selectedLocation.city,
      selectedLocation.state,
      selectedLocation.country,
    ]
      .map((part) => part?.trim())
      .filter((part): part is string => Boolean(part))
      .join(", ");

    setFormData((current) => ({
      ...current,
      deliveryAddress: defaultDeliveryAddress || current.deliveryAddress,
    }));
  }, [selectedLocation]);

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
        const filtered = results.filter(
          (product) => !existingIds.has(product.id),
        );
        setSearchResults(filtered);
      } catch (err) {
        toast.error("Failed to search products");
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
  const calculateItemTotals = useCallback(
    (item: PurchaseOrderItem): PurchaseOrderItem => {
      const discountAmount =
        (item.unitCostBeforeDiscount * item.discountPercentage) / 100;
      const discountedUnitPrice = Math.max(
        0,
        item.unitCostBeforeDiscount - discountAmount,
      );
      const storedTaxAmount = getTaxAmountFromStoredPrices(
        item.purchasePriceExclusive,
        item.purchasePriceInclusive,
        item.productTaxRate,
      );
      const ratio =
        item.unitCostBeforeDiscount > 0
          ? discountedUnitPrice / item.unitCostBeforeDiscount
          : 0;
      const taxAmount =
        item.taxType === "none"
          ? 0
          : storedTaxAmount > 0
            ? storedTaxAmount * ratio
            : item.taxType === "inclusive"
              ? discountedUnitPrice -
                discountedUnitPrice / (1 + item.productTaxRate / 100)
              : (discountedUnitPrice * item.productTaxRate) / 100;
      const unitCostBeforeTax =
        item.taxType === "inclusive"
          ? Math.max(0, discountedUnitPrice - taxAmount)
          : discountedUnitPrice;
      const netCost =
        item.taxType === "exclusive"
          ? discountedUnitPrice + taxAmount
          : discountedUnitPrice;
      const sellingPrice = item.isSellingPriceManual
        ? Math.max(0, item.sellingPrice)
        : netCost;
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
    },
    [calculateSellingPrice],
  );

  // Add product to items
  const addProduct = (product: ProductSearchResult) => {
    if ((product.currentStock ?? 0) <= 0) {
      toast.error(`${product.name} is out of stock`);
      return;
    }

    const taxType = product.taxType ?? "exclusive";
    const taxRate = product.taxRate || 0;
    const purchasePriceExclusive =
      typeof product.purchasePriceExclusive === "number" &&
      Number.isFinite(product.purchasePriceExclusive)
        ? product.purchasePriceExclusive
        : typeof product.purchasePrice === "number" &&
            Number.isFinite(product.purchasePrice)
          ? product.purchasePrice
          : typeof product.sellingPrice === "number" &&
              Number.isFinite(product.sellingPrice)
            ? product.sellingPrice
            : 0;
    const purchasePriceInclusive =
      typeof product.purchasePriceInclusive === "number" &&
      Number.isFinite(product.purchasePriceInclusive)
        ? product.purchasePriceInclusive
        : taxType === "exclusive" && taxRate > 0
          ? purchasePriceExclusive * (1 + taxRate / 100)
          : typeof product.sellingPrice === "number" &&
              Number.isFinite(product.sellingPrice)
            ? product.sellingPrice
            : purchasePriceExclusive;
    const baseUnitPrice =
      typeof product.sellingPrice === "number" &&
      Number.isFinite(product.sellingPrice)
        ? product.sellingPrice
        : taxType === "inclusive"
          ? purchasePriceInclusive
          : calculateSellingPrice(purchasePriceExclusive);
    const storedTaxAmount = getTaxAmountFromStoredPrices(
      purchasePriceExclusive,
      purchasePriceInclusive,
      taxRate,
    );
    const finalUnitPrice =
      taxType === "exclusive" ? baseUnitPrice + storedTaxAmount : baseUnitPrice;

    const newItem: PurchaseOrderItem = {
      id: generateId(),
      productId: product.id,
      productName: product.name,
      sku: product.sku || "",
      unit: product.unitName || "",
      availableStock: product.currentStock ?? 0,
      orderQuantity: 1,
      unitCostBeforeDiscount: baseUnitPrice,
      discountPercentage: 0,
      discountAmount: 0,
      unitCostBeforeTax:
        taxType === "inclusive"
          ? Math.max(0, baseUnitPrice - storedTaxAmount)
          : baseUnitPrice,
      productTaxRate: taxRate,
      taxType,
      purchasePriceExclusive,
      purchasePriceInclusive,
      taxAmount: storedTaxAmount,
      netCost: finalUnitPrice,
      sellingPrice: finalUnitPrice,
      isSellingPriceManual: false,
      lineCost: finalUnitPrice,
      expiryDate: "",
      lotNumber: "",
    };

    const calculatedItem = calculateItemTotals(newItem);
    setItems((prev) => [...prev, calculatedItem]);
    setSearchQuery("");
    setSearchResults([]);
    toast.success(`${product.name} added to order`);
  };

  // Update item
  const updateItem = (
    id: string,
    field: keyof PurchaseOrderItem,
    value: any,
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = {
          ...item,
          [field]: value,
          ...(field === "sellingPrice" ? { isSellingPriceManual: true } : {}),
        };
        return calculateItemTotals(updated);
      }),
    );
  };

  // Remove item
  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Calculate order totals
  const orderTotals = useMemo(() => {
    const subtotal = items.reduce(
      (sum, item) => sum + item.unitCostBeforeDiscount * item.orderQuantity,
      0,
    );
    const totalDiscount = items.reduce(
      (sum, item) => sum + item.discountAmount * item.orderQuantity,
      0,
    );
    const totalTax = items.reduce(
      (sum, item) => sum + item.taxAmount * item.orderQuantity,
      0,
    );
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
    () =>
      additionalExpenses.reduce(
        (sum, expense) =>
          sum + (Number.isFinite(expense.amount) ? expense.amount : 0),
        0,
      ),
    [additionalExpenses],
  );

  const grandTotal = useMemo(
    () =>
      Math.max(
        0,
        orderTotals.total +
          (Number.isFinite(formData.deliveryCharges)
            ? formData.deliveryCharges
            : 0) +
          additionalExpensesTotal -
          (Number.isFinite(formData.orderDiscountAmount)
            ? formData.orderDiscountAmount
            : 0),
      ),
    [
      additionalExpensesTotal,
      formData.deliveryCharges,
      formData.orderDiscountAmount,
      orderTotals.total,
    ],
  );

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerId) {
      newErrors.customerId = "Please select a customer";
    }
    if (!formData.orderDate) {
      newErrors.orderDate = "Sale date is required";
    }
    if (!formData.locationId) {
      newErrors.locationId = "Please select a business location";
    }
    if (items.length === 0) {
      newErrors.items = "Please add at least one item to the order";
    }
    if (items.some((item) => item.orderQuantity <= 0)) {
      newErrors.quantity = "All items must have a quantity greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save sale order
  const handleSave = async (statusOverride?: SaleOrderStatus) => {
    if (!validate()) {
      toast.error("Please fix the errors before saving");
      return;
    }

    try {
      const payload = {
        customer_id: formData.customerId,
        customer_name:
          selectedCustomer?.displayName ||
          selectedCustomer?.name ||
          selectedCustomer?.companyName ||
          "",
        customer_phone: selectedCustomer?.phone || "",
        customer_email: selectedCustomer?.email || "",
        reference_number: formData.referenceNumber,
        sale_date: formData.orderDate,
        location_id: formData.locationId,
        notes: formData.notes,
        status: statusOverride ?? formData.status,
        subtotal: orderTotals.subtotal,
        total_discount: orderTotals.totalDiscount,
        total_tax: orderTotals.totalTax,
        grand_total: grandTotal,
        reserve_order_items:
          formData.status === "approved" ? formData.reserveOrderItems : false,
        items_count: orderTotals.itemCount,
        total_quantity: orderTotals.totalQuantity,
        items: items.map((item, index) => ({
          product_id: item.productId,
          quantity: item.orderQuantity,
          unit_cost: item.unitCostBeforeTax,
          discount_percentage: item.discountPercentage,
          discount_amount: item.discountAmount,
          tax_rate: item.productTaxRate,
          tax_amount: item.taxAmount,
          unit_price: item.sellingPrice,
          line_total: item.lineCost,
          batch_tracking_enabled: item.availableStock >= 0,
          sort_order: index,
        })),
      };

      await createSaleOrder(payload);
      toast.success(
        `Sale order ${statusOverride === "draft" || formData.status === "draft" ? "saved as draft" : "created"} successfully`,
      );
      navigate("/sales/order");
    } catch (err) {
      if (err instanceof ApiError) {
        const apiErrors =
          err.data && typeof err.data === "object"
            ? (((err.data as Record<string, unknown>).errors ?? {}) as Record<
                string,
                string
              >)
            : {};
        if (Object.keys(apiErrors).length > 0) {
          setErrors(apiErrors);
          setSubmitError(err.message || "Failed to create sale order");
        } else {
          setSubmitError(err.message || "Failed to create sale order");
        }
      } else {
        setSubmitError("Failed to create sale order");
      }
      toast.error("Failed to create sale order");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const isPdf =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");
      if (!isPdf) {
        toast.error("Only PDF documents are allowed");
        e.target.value = "";
        return;
      }
      if (file.size > maxSize) {
        toast.error("File size must be less than 10MB");
        e.target.value = "";
        return;
      }
      setFormData({ ...formData, attachment: file });
    }
    e.target.value = "";
  };

  const handleDeliveryDocumentUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 10 * 1024 * 1024;
      const isPdf =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");
      if (!isPdf) {
        toast.error("Only PDF documents are allowed for delivery documents");
        e.target.value = "";
        return;
      }
      if (file.size > maxSize) {
        toast.error("Delivery document must be less than 10MB");
        e.target.value = "";
        return;
      }
      setFormData((current) => ({ ...current, deliveryDocument: file }));
    }
    e.target.value = "";
  };

  const addAdditionalExpense = () => {
    setAdditionalExpenses((current) => {
      if (current.length >= 5) {
        toast.error("You can only add up to 5 additional expenses");
        return current;
      }
      return [...current, { id: generateId(), name: "", amount: 0 }];
    });
  };

  const updateAdditionalExpense = (
    id: string,
    field: keyof Omit<AdditionalExpense, "id">,
    value: string | number,
  ) => {
    setAdditionalExpenses((current) =>
      current.map((expense) =>
        expense.id === id ? { ...expense, [field]: value } : expense,
      ),
    );
  };

  const removeAdditionalExpense = (id: string) => {
    setAdditionalExpenses((current) =>
      current.filter((expense) => expense.id !== id),
    );
  };

  const locationOptions = locations.map((loc) => ({
    value: loc.id,
    label: loc.locationName,
  }));

  const customerOptions = customers.map((customer) => ({
    value: customer.id,
    label:
      customer.displayName ||
      customer.name ||
      customer.companyName ||
      "Customer",
  }));

  const paymentUnitOptions: SelectOption[] = [
    { value: "days", label: "Days" },
    { value: "months", label: "Months" },
  ];

  const saleStatusOptions: SelectOption[] = [
    { value: "draft", label: "Draft" },
    { value: "pending_approval", label: "Pending Approval" },
    { value: "approved", label: "Approved" },
    { value: "processing", label: "Processing" },
    { value: "ready_for_shipment", label: "Ready for Shipment" },
    { value: "completed", label: "Completed" },
  ];

  const statusGuidance: Record<SaleOrderStatus, string> = {
    draft: "Draft orders are saved for later and do not change stock.",
    pending_approval:
      "Pending approval keeps the order under review and does not move stock yet.",
    approved:
      "Approved orders can reserve stock for this order when Reserve Order items is turned on.",
    processing:
      "Processing orders keep stock reserved when reservation is enabled, but do not consume it yet.",
    ready_for_shipment:
      "Ready for shipment orders deduct stock immediately from inventory.",
    completed:
      "Completed orders deduct stock immediately and finalize the inventory update.",
  };

  const selectedCustomer = useMemo(
    () =>
      customers.find((customer) => customer.id === formData.customerId) ?? null,
    [customers, formData.customerId],
  );

  const errorMessages = useMemo(
    () =>
      Array.from(
        new Set(
          [submitError, apiError, ...Object.values(errors)].filter(
            Boolean,
          ) as string[],
        ),
      ),
    [apiError, errors, submitError],
  );

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
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">
                Create Sale Order
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground hidden sm:block">
                Add a new sale order with products and customer details
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleSave("draft")}
              disabled={saveLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-alt disabled:opacity-50"
            >
              <FileText className="h-4 w-4" />
              Save as Draft
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saveLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Create Sale Order
            </button>
          </div>
        </div>
      </div>

      {errorMessages.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">Please fix the following issues:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {errorMessages.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-8">
        {/* Customer & Order Details Card */}
        <SectionCard
          title="Customer & Order Details"
          description="Enter the customer information and sale details"
          icon={Building2}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Customer */}
            <SelectField
              label="Customer"
              value={formData.customerId}
              onChange={(value) =>
                setFormData({ ...formData, customerId: value })
              }
              options={customerOptions}
              placeholder="Select customer"
              required
              icon={Users}
              error={errors.customerId}
            />

            {/* Reference Number */}
            <FormInput
              label="Reference Number"
              value={formData.referenceNumber}
              onChange={(value) =>
                setFormData({ ...formData, referenceNumber: value })
              }
              placeholder="Generated automatically as SO-00001, SO-00002, and so on"
              icon={Tag}
              readOnly
            />

            {/* Sale Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Sale Date <span className="ml-1 text-destructive">*</span>
              </label>
              <DatePickerField
                value={formData.orderDate}
                onChange={(value) =>
                  setFormData({ ...formData, orderDate: value })
                }
                placeholder="Select sale date"
              />
              {errors.orderDate && (
                <p className="text-xs text-destructive">{errors.orderDate}</p>
              )}
            </div>

            {/* Delivery Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Expected Delivery Date
              </label>
              <DatePickerField
                value={formData.deliveryDate}
                onChange={(value) =>
                  setFormData({ ...formData, deliveryDate: value })
                }
                placeholder="Defaults to today"
              />
            </div>

            {/* Business Location */}
            <SelectField
              label="Business Location"
              value={formData.locationId}
              onChange={(value) =>
                setFormData({ ...formData, locationId: value })
              }
              options={locationOptions}
              placeholder="Select location"
              required
              icon={MapPin}
              error={errors.locationId}
            />

            {/* Payment Date / Term */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Payment Date
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="number"
                    min={1}
                    value={formData.paymentTerm.value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentTerm: {
                          ...formData.paymentTerm,
                          value: Math.max(1, parseInt(e.target.value) || 1),
                        },
                      })
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="1"
                  />
                </div>
                <div className="flex-1">
                  <Select
                    value={
                      paymentUnitOptions.find(
                        (option) => option.value === formData.paymentTerm.unit,
                      ) ?? null
                    }
                    onChange={(option) =>
                      setFormData({
                        ...formData,
                        paymentTerm: {
                          ...formData.paymentTerm,
                          unit: (option?.value ?? "days") as PaymentTermUnit,
                        },
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

            <SelectField
              label="Status"
              value={formData.status}
              onChange={(value) =>
                setFormData((current) => ({
                  ...current,
                  status: value as SaleOrderStatus,
                }))
              }
              options={saleStatusOptions}
              placeholder="Select status"
              required
            />

            <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
              {statusGuidance[formData.status]}
            </div>

            {formData.status === "approved" ? (
              <ToggleSwitch
                checked={formData.reserveOrderItems}
                onChange={() =>
                  setFormData((current) => ({
                    ...current,
                    reserveOrderItems: !current.reserveOrderItems,
                  }))
                }
                label="Reserve Order items"
                description="Keep these items reserved instead of consuming stock immediately."
              />
            ) : null}
          </div>

          {/* Attachment & Notes */}
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-1">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Attach Document
              </label>
              <div className="mt-1.5">
                {formData.attachment ? (
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {formData.attachment.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(formData.attachment.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, attachment: null })
                      }
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
              <label className="text-xs font-medium text-muted-foreground">
                Notes
              </label>
              <div className="mt-1.5 overflow-hidden rounded-lg border border-border bg-background outline-none focus-within:ring-1 focus-within:ring-primary">
                <CKEditor
                  editor={ClassicEditor}
                  data={formData.notes}
                  config={{
                    licenseKey: "GPL",
                    plugins: [
                      Essentials,
                      Paragraph,
                      Heading,
                      Bold,
                      Italic,
                      Link,
                      List,
                      BlockQuote,
                      Undo,
                    ],
                    toolbar: [
                      "undo",
                      "redo",
                      "|",
                      "heading",
                      "|",
                      "bold",
                      "italic",
                      "link",
                      "|",
                      "bulletedList",
                      "numberedList",
                      "blockQuote",
                    ],
                    placeholder: "Additional notes for this sale order...",
                  }}
                  onChange={(_, editor) => {
                    setFormData((current) => ({
                      ...current,
                      notes: editor.getData(),
                    }));
                  }}
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Products Card */}
        <SectionCard
          title="Order Items"
          description="Search and add products to this sale order"
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
                  <ProductSearchResultCard
                    key={product.id}
                    product={product}
                    onAdd={addProduct}
                    currencyCode={currencyCode}
                    currencyPrecision={currencyPrecision}
                    currencyPlacement={currencyPlacement}
                  />
                ))}
              </div>
            )}
            {searchQuery.trim().length >= 3 &&
              searchResults.length === 0 &&
              !isSearching && (
                <p className="mt-2 text-sm text-muted-foreground">
                  No products found matching your search.
                </p>
              )}
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto rounded-sm border border-border bg-background">
            <table
              className="divide-y divide-border text-sm"
              style={{
                minWidth: "1280px",
              }}
            >
              <thead className="bg-muted/30">
                <tr>
                  <th className="w-[360px] px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Product Name
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Stock Method
                  </th>
                  <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Quantity
                  </th>
                  <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Unit Price <br />
                    {moneyHeaderSuffix}
                  </th>
                  <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Discount
                  </th>
                  <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Tax
                  </th>
                  <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Price inc Tax
                  </th>
                  <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Sub Total
                  </th>
                  <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background">
                {items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={itemTableColumnCount}
                      className="px-4 py-10 text-center text-sm text-muted-foreground"
                    >
                      <Package className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                      No items added yet. Search for products above to add them.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-muted/10 transition-colors"
                    >
                      <td className="w-[360px] px-4 py-3">
                        <div className="space-y-0.5">
                          <p className="font-medium text-foreground">
                            {item.productName}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            SKU: {item.sku}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-left text-sm text-muted-foreground">
                        {businessSettings?.stockAccountingMethod || "FIFO"}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={1}
                          value={item.orderQuantity}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "orderQuantity",
                              Math.max(1, parseInt(e.target.value) || 1),
                            )
                          }
                          className="w-16 rounded border border-border bg-background px-2 py-1 text-right text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.unitCostBeforeDiscount}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "unitCostBeforeDiscount",
                              parseFloat(e.target.value) || 0,
                            )
                          }
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
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "discountPercentage",
                              Math.min(100, parseFloat(e.target.value) || 0),
                            )
                          }
                          className="w-16 rounded border border-border bg-background px-2 py-1 text-right text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">
                        {formatMoney(
                          item.taxAmount,
                          currencyCode,
                          currencyPrecision,
                          currencyPlacement,
                          false,
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">
                        {formatMoney(
                          item.netCost,
                          currencyCode,
                          currencyPrecision,
                          currencyPlacement,
                          false,
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground">
                        {formatMoney(
                          item.lineCost,
                          currencyCode,
                          currencyPrecision,
                          currencyPlacement,
                          false,
                        )}
                      </td>
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
            <div className="w-full space-y-4 rounded-sm border border-border bg-background p-4">
              <h3 className="text-sm font-semibold text-foreground">
                Delivery Details
              </h3>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                <div className="space-y-1.5 lg:col-span-4">
                  <label className="text-xs font-medium text-muted-foreground">
                    Delivery Address
                  </label>
                  <textarea
                    value={formData.deliveryAddress}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deliveryAddress: e.target.value,
                      })
                    }
                    placeholder={
                      selectedLocation
                        ? "Defaulted from selected location, editable"
                        : "Select a location to auto-fill the address"
                    }
                    className="min-h-[96px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="lg:col-span-1">
                  <CurrencyInput
                    label="Delivery Charges"
                    value={formData.deliveryCharges}
                    onChange={(value) =>
                      setFormData({ ...formData, deliveryCharges: value })
                    }
                    placeholder="0.00"
                    currencySymbol={currencySymbol}
                    currencyPlacement={currencyPlacement}
                  />
                </div>
                <div className="lg:col-span-1">
                  <SelectField
                    label="Delivery Status"
                    value={formData.deliveryStatus}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        deliveryStatus: value as FormState["deliveryStatus"],
                      })
                    }
                    options={[
                      { value: "pending_delivery", label: "Pending Delivery" },
                      { value: "in_transit", label: "In Transit" },
                      { value: "delivered", label: "Delivered" },
                    ]}
                    placeholder="Select status"
                    icon={Truck}
                  />
                </div>
                <div className="lg:col-span-2 space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Delivery Documents
                  </label>
                  {formData.deliveryDocument ? (
                    <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
                      <FileText className="h-8 w-8 text-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {formData.deliveryDocument.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(
                            formData.deliveryDocument.size /
                            1024 /
                            1024
                          ).toFixed(2)}{" "}
                          MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, deliveryDocument: null })
                        }
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

            <div className="w-full space-y-4 rounded-sm border border-border bg-background p-4">
              <h3 className="text-sm font-semibold text-foreground">
                Discount & Additional Expenses
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <CurrencyInput
                  label="Discount"
                  value={formData.orderDiscountAmount}
                  onChange={(value) =>
                    setFormData({ ...formData, orderDiscountAmount: value })
                  }
                  placeholder="0.00"
                  currencySymbol={currencySymbol}
                  currencyPlacement={currencyPlacement}
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
                  <p className="text-sm text-muted-foreground">
                    No additional expenses added yet.
                  </p>
                ) : (
                  additionalExpenses.map((expense, index) => (
                    <div
                      key={expense.id}
                      className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_160px_auto]"
                    >
                      <FormInput
                        label={`Expense ${index + 1} Name`}
                        value={expense.name}
                        onChange={(value) =>
                          updateAdditionalExpense(expense.id, "name", value)
                        }
                        placeholder="e.g. Loading fees"
                      />
                      <CurrencyInput
                        label="Amount"
                        value={expense.amount}
                        onChange={(value) =>
                          updateAdditionalExpense(expense.id, "amount", value)
                        }
                        placeholder="0.00"
                        currencySymbol={currencySymbol}
                        currencyPlacement={currencyPlacement}
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-sm border border-border bg-background p-4">
                <p className="text-xs font-medium text-muted-foreground">
                  Total Items
                </p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {orderTotals.itemCount}
                </p>
              </div>
              <div className="rounded-sm border border-border bg-background p-4">
                <p className="text-xs font-medium text-muted-foreground">
                  Total Quantity
                </p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {orderTotals.totalQuantity}
                </p>
              </div>
              <div className="rounded-sm border border-border bg-background p-4">
                <p className="text-xs font-medium text-muted-foreground">
                  Items Total
                </p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {formatMoney(
                    orderTotals.total,
                    currencyCode,
                    currencyPrecision,
                    currencyPlacement,
                  )}
                </p>
              </div>
              <div className="rounded-sm border border-border bg-background p-4">
                <p className="text-xs font-medium text-muted-foreground">
                  Grand Total
                </p>
                <p className="mt-1 text-xl font-bold text-foreground">
                  {formatMoney(
                    grandTotal,
                    currencyCode,
                    currencyPrecision,
                    currencyPlacement,
                  )}
                </p>
              </div>
            </div>

            <div className="rounded-sm border border-border bg-background p-4">
              <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Subtotal
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {formatMoney(
                      orderTotals.subtotal,
                      currencyCode,
                      currencyPrecision,
                      currencyPlacement,
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Discount
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    -
                    {formatMoney(
                      formData.orderDiscountAmount,
                      currencyCode,
                      currencyPrecision,
                      currencyPlacement,
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Delivery Charges
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {formatMoney(
                      formData.deliveryCharges,
                      currencyCode,
                      currencyPrecision,
                      currencyPlacement,
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Additional Expenses
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {formatMoney(
                      additionalExpensesTotal,
                      currencyCode,
                      currencyPrecision,
                      currencyPlacement,
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <div className="flex flex-col-reverse gap-3 rounded-lg border border-border bg-background p-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => handleSave("draft")}
            disabled={saveLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-alt disabled:opacity-50"
          >
            <FileText className="h-4 w-4" />
            Save as Draft
          </button>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saveLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            Create Sale Order
          </button>
        </div>
      </div>
    </div>
  );
}
