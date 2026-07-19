import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type FocusEventHandler } from 'react';
import Select, { type StylesConfig } from 'react-select';
import DatePickerField from '@/components/forms/DatePickerField';
import { CKEditor } from '@ckeditor/ckeditor5-react';
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
} from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';
import {
  ArrowLeft,
  Save,
  Plus,
  FileText,
  Upload,
  Package,
  Tag,
  AlertCircle,
  AlertTriangle,
  Percent,
  DollarSign,
  TrendingUp,
  Check,
  Eye,
  X,
  Trash2,
  Download,
  MapPin,
  Boxes,
  Image as ImageIcon,
  ShieldCheck,
} from 'lucide-react';
import { useBusinessUnits } from '@/hooks/business/units/useBusinessUnits';
import { useCategories, type CategoryItem } from '@/hooks/business/categories/useCategories';
import { useBusinessBrands, type BrandRecord } from '@/hooks/business/brands/useBusinessBrands';
import { useBusinessLocations, type BusinessLocationRecord } from '@/hooks/business/settings/useBusinessLocations';
import { useBusinessSettings } from '@/hooks/business/settings/useBusinessSettings';
import { useProductSettings } from '@/hooks/business/settings/useProductSettings';
import { useSubCategories, type SubCategoryItem } from '@/hooks/business/subcategories/useSubCategories';
import {
  useProducts,
  type CreateProductPayload,
  type ProductDetailItem,
  type ProductSearchResult,
} from '@/hooks/business/products/useProducts';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ApiError } from '@/lib/api';
import { formatProductSkuDisplay } from '@/lib/productSku';

type ProductType = 'single' | 'combo' | 'variable';
type TaxType = 'inclusive' | 'exclusive' | 'none';
type ProductPriceType = 'wholesale' | 'tier' | 'location' | 'promotion' | 'customer_group';

type SelectOption<T extends string = string> = {
  value: T;
  label: string;
};

type ProductImage = {
  id: string;
  url: string;
  isPrimary: boolean;
  name: string;
  file?: File | null;
};

type ComboItem = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  priceEach: number;
  subtotal: number;
  unit: string;
};

type Variant = {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  cost: number;
  selling: number;
  stock: number;
  showOptionalFields: boolean;
  weight?: string;
  length?: string;
  width?: string;
  height?: string;
  imageName?: string;
  imageUrl?: string;
  imageFile?: File | null;
  reorderLevel?: number;
  expiryDate?: string;
  supplierCode?: string;
};

type ProductPriceRule = {
  id: string;
  priceType: ProductPriceType;
  minQuantity: number;
  price: number;
  locationId: string;
  customerGroup: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
  priority: number;
};

type FormState = {
  name: string;
  sku: string;
  barcode: string;
  unitId: string;
  subUnitIds: string[];
  brandId: string;
  categoryId: string;
  subCategoryId: string;
  locationIds: string[];
  allLocations: boolean;
  manageStock: boolean;
  alertQuantity: number;
  warranty: {
    hasWarranty: boolean;
    duration: string;
    period: 'months' | 'years';
    coverage: string;
  };
  description: string;
  productType: ProductType;
  isForSelling: boolean;
  taxType: TaxType;
  taxRate: number;
  defaultPurchasePrice: number;
  purchasePriceExclusive: number;
  purchasePriceInclusive: number;
  profitMargin: number;
  defaultSellingPrice: number;
  productPrices: ProductPriceRule[];
  images: ProductImage[];
  brochure: File | null;
  brochureName: string;
  brochureUrl: string;
  brochureRemoved: boolean;
};

const INITIAL_FORM_STATE: FormState = {
  name: '',
  sku: '',
  barcode: '',
  unitId: '',
  subUnitIds: [],
  brandId: '',
  categoryId: '',
  subCategoryId: '',
  locationIds: [],
  allLocations: false,
  manageStock: false,
  alertQuantity: 2,
  warranty: {
    hasWarranty: false,
    duration: '',
    period: 'months',
    coverage: '',
  },
  description: '',
  productType: 'single',
  isForSelling: true,
  taxType: 'exclusive',
  taxRate: 16,
  defaultPurchasePrice: 0,
  purchasePriceExclusive: 0,
  purchasePriceInclusive: 0,
  profitMargin: 0,
  defaultSellingPrice: 0,
  productPrices: [
    {
      id: 'wholesale-default',
      priceType: 'wholesale',
      minQuantity: 1,
      price: 0,
      locationId: '',
      customerGroup: '',
      startsAt: '',
      endsAt: '',
      active: true,
      priority: 90,
    },
  ],
  images: [],
  brochure: null,
  brochureName: '',
  brochureUrl: '',
  brochureRemoved: false,
};

/* ---------------------------------------------------------------------- */
/*  Small shared UI pieces                                                */
/* ---------------------------------------------------------------------- */

type ToggleSwitchProps = {
  checked: boolean;
  onChange: () => void;
  ariaLabel: string;
};

function ToggleSwitch({ checked, onChange, ariaLabel }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border p-0.5 transition-colors overflow-hidden ${
        checked ? 'border-primary bg-primary/15' : 'border-border bg-background'
      }`}
    >
      <span
        className={`h-5 w-5 rounded-full shadow-sm transition-transform duration-200 ${
          checked ? 'translate-x-5 bg-primary' : 'translate-x-0 bg-muted-foreground'
        }`}
      />
    </button>
  );
}

function RequiredMark() {
  return <span className="text-destructive">*</span>;
}

/** Card wrapper that gives every part of the form its own labelled section. */
function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <label className="text-sm font-medium text-foreground">
      {children} {required && <RequiredMark />}
    </label>
  );
}

/* ---------------------------------------------------------------------- */
/*  react-select theme                                                    */
/* ---------------------------------------------------------------------- */

const selectStyles: StylesConfig<SelectOption, boolean> = {
  control: (base, state) => ({
    ...base,
    minHeight: 42,
    borderRadius: 8,
    borderColor: 'hsl(var(--border))',
    backgroundColor: 'hsl(var(--background))',
    outline: 'none',
    boxShadow: state.isFocused ? '0 0 0 1px hsl(var(--primary))' : 'none',
    ':hover': { borderColor: 'hsl(var(--primary))' },
  }),
  valueContainer: (base) => ({ ...base, paddingTop: 0, paddingBottom: 0 }),
  input: (base) => ({ ...base, color: 'hsl(var(--foreground))' }),
  singleValue: (base) => ({ ...base, color: 'hsl(var(--foreground))' }),
  placeholder: (base) => ({ ...base, color: 'hsl(var(--muted-foreground))' }),
  menu: (base) => ({
    ...base,
    zIndex: 50,
    backgroundColor: 'hsl(var(--background))',
    border: '1px solid hsl(var(--border))',
    boxShadow: '0 18px 45px rgba(15, 23, 42, 0.12)',
  }),
  menuList: (base) => ({ ...base, padding: 4 }),
  option: (base, state) => ({
    ...base,
    borderRadius: 6,
    backgroundColor: state.isSelected
      ? 'hsl(var(--primary))'
      : state.isFocused
        ? 'hsl(var(--muted))'
        : 'transparent',
    color: state.isSelected ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
    ':active': { backgroundColor: 'hsl(var(--primary) / 0.9)', color: 'hsl(var(--primary-foreground))' },
  }),
  indicatorsContainer: (base) => ({ ...base, color: 'hsl(var(--muted-foreground))' }),
  dropdownIndicator: (base) => ({
    ...base,
    color: 'hsl(var(--muted-foreground))',
    ':hover': { color: 'hsl(var(--foreground))' },
  }),
  indicatorSeparator: (base) => ({ ...base, backgroundColor: 'hsl(var(--border))' }),
  multiValue: (base) => ({ ...base, backgroundColor: 'hsl(var(--muted))' }),
  multiValueLabel: (base) => ({ ...base, color: 'hsl(var(--foreground))' }),
  multiValueRemove: (base) => ({
    ...base,
    color: 'hsl(var(--muted-foreground))',
    ':hover': { backgroundColor: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))' },
  }),
};

const baseFieldClass =
  'mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary';
const baseFieldWithIconClass =
  'w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary';
const baseTextareaClass =
  'mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none focus:ring-1 focus:ring-primary';
const baseSelectClass =
  'mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground appearance-none outline-none focus:ring-1 focus:ring-primary';

const productPriceTypeOptions: Array<{ value: ProductPriceType; label: string }> = [
  { value: 'wholesale', label: 'Wholesale' },
  { value: 'tier', label: 'Tiered quantity' },
  { value: 'location', label: 'Location price' },
  { value: 'promotion', label: 'Promotion' },
  { value: 'customer_group', label: 'Customer group' },
];

function normalizeMoneyInput(rawValue: string) {
  const cleaned = rawValue.replace(/[^0-9.]/g, '');
  if (!cleaned) return '';

  const [integerPart = '', ...decimalParts] = cleaned.split('.');
  const integer = integerPart.replace(/^0+(?=\d)/, '') || '0';
  const decimal = decimalParts.join('').replace(/\./g, '');

  return decimalParts.length > 0 ? `${integer}.${decimal}` : integer;
}

function moneyInputToNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function toDateTimeLocalValue(value?: string | null) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value.slice(0, 16);
  }
  return parsed.toISOString().slice(0, 16);
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

function formatMoney(amount: number, currencyCode: string, precision: number, placement: 'before' | 'after') {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const currencySymbol = getCurrencySymbol(currencyCode);
  const numeric = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(safeAmount);

  return placement === 'after' ? `${numeric} ${currencySymbol}` : `${currencySymbol} ${numeric}`;
}

function MoneyInput({
  value,
  onChange,
  currencyCode,
  currencyPrecision,
  currencyPlacement,
  className = '',
  placeholderZero = true,
  onFocus,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  currencyCode: string;
  currencyPrecision: number;
  currencyPlacement: 'before' | 'after';
  className?: string;
  placeholderZero?: boolean;
  onFocus?: FocusEventHandler<HTMLInputElement>;
  disabled?: boolean;
}) {
  const currencySymbol = getCurrencySymbol(currencyCode);
  const placeholder = placeholderZero ? formatMoney(0, currencyCode, currencyPrecision, currencyPlacement) : '';
  const step = `0.${'0'.repeat(Math.max(0, currencyPrecision - 1))}1`;

  return (
    <div className="relative mt-2">
      {currencyPlacement === 'before' ? (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          {currencySymbol}
        </span>
      ) : null}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        inputMode="decimal"
        placeholder={placeholder}
        disabled={disabled}
        step={step as unknown as number}
        className={`${baseFieldWithIconClass} ${currencyPlacement === 'before' ? 'pl-9' : 'pr-12'} ${className}`}
      />
      {currencyPlacement === 'after' ? (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          {currencySymbol}
        </span>
      ) : null}
    </div>
  );
}

function fileToDataURL(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error(`Unable to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

const BARCODE_OPTIONS: SelectOption[] = [
  { value: 'code-128', label: 'Code 128' },
  { value: 'code-39', label: 'Code 39' },
  { value: 'ean-8', label: 'EAN-8' },
  { value: 'ean-13', label: 'EAN-13' },
  { value: 'upc-a', label: 'UPC-A' },
];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];

const PRODUCT_TYPES: { value: ProductType; label: string; description: string }[] = [
  { value: 'single', label: 'Single', description: 'One product, one SKU' },
  { value: 'combo', label: 'Combo', description: 'Bundle of other products' },
  { value: 'variable', label: 'Variable', description: 'Multiple size/colour variants' },
];

/* ---------------------------------------------------------------------- */
/*  Main component                                                        */
/* ---------------------------------------------------------------------- */

export default function EditProduct() {
  const { id: productId = '' } = useParams<{ id: string }>();
  const isEditMode = Boolean(productId);
  const { units, loadUnits } = useBusinessUnits();
  const { categories, fetchCategories } = useCategories();
  const { brands, loadBrands } = useBusinessBrands();
  const { locations } = useBusinessLocations();
  const { settings: businessSettings } = useBusinessSettings();
  const { settings: productSettings } = useProductSettings();
  const { subCategories, fetchSubCategories } = useSubCategories();
  const { createProduct, updateProduct, getProductById, searchProducts } = useProducts();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormState>(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const [comboItems, setComboItems] = useState<ComboItem[]>([]);
  const [showAddComboItem, setShowAddComboItem] = useState(false);
  const [comboItemDraftQuery, setComboItemDraftQuery] = useState('');
  const [comboItemSearchResults, setComboItemSearchResults] = useState<ProductSearchResult[]>([]);
  const [comboItemSearchLoading, setComboItemSearchLoading] = useState(false);
  const [comboItemDraftProduct, setComboItemDraftProduct] = useState<ProductSearchResult | null>(null);
  const [comboItemDraftQuantity, setComboItemDraftQuantity] = useState('1');
  const [comboItemDraftPriceEach, setComboItemDraftPriceEach] = useState('');
  const [comboItemDraftManualPrice, setComboItemDraftManualPrice] = useState(false);
  const [comboSellingPriceInput, setComboSellingPriceInput] = useState('');
  const [comboSellingPriceManual, setComboSellingPriceManual] = useState(false);

  const [variants, setVariants] = useState<Variant[]>([]);
  const [showAddVariant, setShowAddVariant] = useState(false);
  const [variantDraft, setVariantDraft] = useState<Variant>({
    id: '',
    name: '',
    sku: '',
    barcode: '',
    cost: 0,
    selling: 0,
    stock: 0,
    showOptionalFields: false,
  });
  const [variantImagePreview, setVariantImagePreview] = useState<ProductImage | null>(null);
  const [variantModalError, setVariantModalError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [isImageDragging, setIsImageDragging] = useState(false);
  const [imageUploadErrors, setImageUploadErrors] = useState<string[]>([]);
  const [isBrochureDragging, setIsBrochureDragging] = useState(false);
  const [brochureUploadError, setBrochureUploadError] = useState<string | null>(null);
  const [formSubmitError, setFormSubmitError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<ProductImage | null>(null);
  const [purchasePriceInput, setPurchasePriceInput] = useState('');
  const [sellingPriceInput, setSellingPriceInput] = useState('');
  const [isSellingPriceManual, setIsSellingPriceManual] = useState(false);
  const [hasAppliedBusinessProfit, setHasAppliedBusinessProfit] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const brochureInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void loadUnits();
    void fetchCategories();
    void loadBrands();
    void fetchSubCategories();
  }, [fetchCategories, fetchSubCategories, loadBrands, loadUnits]);

  useEffect(() => {
    if (hasAppliedBusinessProfit) {
      return;
    }

    if (typeof businessSettings?.defaultProfitPercentage === 'number') {
      setFormData((prev) => ({ ...prev, profitMargin: businessSettings.defaultProfitPercentage ?? 0 }));
      if (!isSellingPriceManual) {
        setSellingPriceInput('');
      }
      setHasAppliedBusinessProfit(true);
    }
  }, [businessSettings?.defaultProfitPercentage, hasAppliedBusinessProfit, isSellingPriceManual]);

  useEffect(() => {
    if (formData.productType === 'combo' && !comboSellingPriceManual) {
      const subtotal = comboItems.reduce((sum, item) => sum + item.subtotal, 0);
      setComboSellingPriceInput(subtotal > 0 ? String(subtotal) : '');
      setFormData((prev) => ({ ...prev, defaultSellingPrice: subtotal }));
    }
  }, [comboItems, comboSellingPriceManual, formData.productType]);

  // Release object URLs created for image previews when the component unmounts,
  // so we don't leak memory for images the user uploaded but never saved.
  useEffect(() => {
    return () => {
      formData.images.forEach((image) => URL.revokeObjectURL(image.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleWarrantyChange = <K extends keyof FormState['warranty']>(
    field: K,
    value: FormState['warranty'][K],
  ) => {
    setFormData((prev) => ({ ...prev, warranty: { ...prev.warranty, [field]: value } }));
  };

  const calculatePrices = (purchasePrice: number, taxRate: number, profitMargin: number) => ({
    exclusive: purchasePrice,
    inclusive: purchasePrice * (1 + taxRate / 100),
    suggestedSellingPrice: purchasePrice * (1 + profitMargin / 100),
  });

  const handlePurchasePriceChange = (rawValue: string) => {
    const normalizedValue = normalizeMoneyInput(rawValue);
    const purchasePrice = moneyInputToNumber(normalizedValue);
    const { exclusive, inclusive, suggestedSellingPrice } = calculatePrices(
      purchasePrice,
      formData.taxRate,
      formData.profitMargin,
    );

    setPurchasePriceInput(normalizedValue);
    setFormData((prev) => ({
      ...prev,
      defaultPurchasePrice: purchasePrice,
      purchasePriceExclusive: exclusive,
      purchasePriceInclusive: inclusive,
      defaultSellingPrice: isSellingPriceManual ? prev.defaultSellingPrice : suggestedSellingPrice,
    }));

    if (!isSellingPriceManual) {
      setSellingPriceInput(purchasePrice > 0 ? String(suggestedSellingPrice) : '');
    }
  };

  const handleTaxRateChange = (rate: number) => {
    const { exclusive, inclusive, suggestedSellingPrice } = calculatePrices(
      formData.defaultPurchasePrice,
      rate,
      formData.profitMargin,
    );
    setFormData((prev) => ({
      ...prev,
      taxRate: rate,
      purchasePriceExclusive: exclusive,
      purchasePriceInclusive: inclusive,
      defaultSellingPrice: isSellingPriceManual ? prev.defaultSellingPrice : suggestedSellingPrice,
    }));

    if (!isSellingPriceManual) {
      setSellingPriceInput(formData.defaultPurchasePrice > 0 ? String(suggestedSellingPrice) : '');
    }
  };

  const handleProfitMarginChange = (margin: number) => {
    const { exclusive, inclusive, suggestedSellingPrice } = calculatePrices(
      formData.defaultPurchasePrice,
      formData.taxRate,
      margin,
    );
    setFormData((prev) => ({
      ...prev,
      profitMargin: margin,
      purchasePriceExclusive: exclusive,
      purchasePriceInclusive: inclusive,
      defaultSellingPrice: isSellingPriceManual ? prev.defaultSellingPrice : suggestedSellingPrice,
    }));

    if (!isSellingPriceManual) {
      setSellingPriceInput(formData.defaultPurchasePrice > 0 ? String(suggestedSellingPrice) : '');
    }
  };

  const handleSellingPriceChange = (rawValue: string) => {
    const normalizedValue = normalizeMoneyInput(rawValue);
    const sellingPrice = moneyInputToNumber(normalizedValue);
    setIsSellingPriceManual(true);
    setSellingPriceInput(normalizedValue);
    setFormData((prev) => ({
      ...prev,
      defaultSellingPrice: sellingPrice,
    }));
  };

  const applyProductDetailToForm = useCallback((product: ProductDetailItem) => {
    setFormData({
      name: product.name ?? '',
      sku: product.sku ?? '',
      barcode: product.barcode ?? '',
      unitId: product.unitId ?? '',
      subUnitIds: product.subUnitIds ?? [],
      brandId: product.brandId ?? '',
      categoryId: product.categoryId ?? '',
      subCategoryId: product.subCategoryId ?? '',
      locationIds: product.locationIds ?? [],
      allLocations: product.allLocations ?? false,
      manageStock: product.manageStock ?? false,
      alertQuantity: product.alertQuantity ?? 2,
      warranty: {
        hasWarranty: product.hasWarranty ?? false,
        duration: product.warrantyDuration ?? '',
        period: product.warrantyPeriod === 'years' ? 'years' : 'months',
        coverage: product.warrantyCoverage ?? '',
      },
      description: product.description ?? '',
      productType: product.productType ?? 'single',
      isForSelling: product.isForSelling ?? true,
      taxType: (product.taxType as TaxType) ?? 'exclusive',
      taxRate: product.taxRate ?? 0,
      defaultPurchasePrice: product.defaultPurchasePrice ?? 0,
      purchasePriceExclusive: product.purchasePriceExclusive ?? 0,
      purchasePriceInclusive: product.purchasePriceInclusive ?? 0,
      profitMargin: product.profitMargin ?? 0,
      defaultSellingPrice: product.defaultSellingPrice ?? 0,
      productPrices: (product.productPrices ?? [])
        .filter((price) => price.priceType !== 'retail')
        .map((price) => ({
          id: price.id,
          priceType: price.priceType as ProductPriceType,
          minQuantity: price.minQuantity || 1,
          price: price.price || 0,
          locationId: price.locationId || '',
          customerGroup: price.customerGroup || '',
          startsAt: toDateTimeLocalValue(price.startsAt),
          endsAt: toDateTimeLocalValue(price.endsAt),
          active: price.active,
          priority: price.priority || 100,
        })),
      images: (product.images ?? []).map((image) => ({
        id: image.id,
        name: image.name,
        url: image.url,
        isPrimary: image.isPrimary,
      })),
      brochure: null,
      brochureName: product.brochureName ?? '',
      brochureUrl: product.brochureUrl ?? '',
      brochureRemoved: false,
    });

    setComboItems(
      (product.comboItems ?? []).map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        priceEach: item.priceEach,
        subtotal: item.subtotal,
        unit: item.unit,
      })),
    );

    setVariants(
      (product.variants ?? []).map((variant) => ({
        id: variant.id,
        name: variant.name,
        sku: variant.sku,
        barcode: variant.barcode,
        cost: variant.cost,
        selling: variant.selling,
        stock: variant.stock,
        showOptionalFields: variant.showOptionalFields,
        weight: variant.weight,
        length: variant.length,
        width: variant.width,
        height: variant.height,
        imageName: variant.imageName,
        imageUrl: variant.imageUrl,
        imageFile: null,
        reorderLevel: variant.reorderLevel ?? 0,
        expiryDate: variant.expiryDate,
        supplierCode: variant.supplierCode,
      })),
    );

    setPurchasePriceInput(product.defaultPurchasePrice ? String(product.defaultPurchasePrice) : '');
    setSellingPriceInput(product.defaultSellingPrice ? String(product.defaultSellingPrice) : '');
    setComboSellingPriceInput(product.defaultSellingPrice ? String(product.defaultSellingPrice) : '');
    setIsSellingPriceManual(true);
    setComboSellingPriceManual(true);
    setHasAppliedBusinessProfit(true);
    setImageUploadErrors([]);
    setBrochureUploadError(null);
  }, []);

  useEffect(() => {
    if (!isEditMode || !productId) return;

    let isMounted = true;
    setIsLoadingProduct(true);

    void getProductById(productId)
      .then((product) => {
        if (!isMounted) return;
        applyProductDetailToForm(product);
      })
      .catch((err) => {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : 'Unable to load product.';
        toast.error(message);
        navigate('/products/list');
      })
      .finally(() => {
        if (isMounted) setIsLoadingProduct(false);
      });

    return () => {
      isMounted = false;
    };
  }, [applyProductDetailToForm, getProductById, isEditMode, navigate, productId]);

  const resetComboDraft = () => {
    setComboItemDraftQuery('');
    setComboItemSearchResults([]);
    setComboItemSearchLoading(false);
    setComboItemDraftProduct(null);
    setComboItemDraftQuantity('1');
    setComboItemDraftPriceEach('');
    setComboItemDraftManualPrice(false);
  };

  const resetVariantDraft = () => {
    setVariantDraft({
      id: '',
      name: '',
      sku: '',
      barcode: '',
      cost: 0,
      selling: 0,
      stock: 0,
      showOptionalFields: false,
      imageFile: null,
    });
    setVariantModalError(null);
  };

  useEffect(() => {
    if (!showAddComboItem) {
      return;
    }

    if (comboItemDraftQuery.trim().length < 3) {
      setComboItemSearchResults([]);
      return;
    }

    const timeout = window.setTimeout(() => {
      setComboItemSearchLoading(true);
      void searchProducts(comboItemDraftQuery.trim(), 'single')
        .then((results) => {
          setComboItemSearchResults(results.filter((item) => item.productType === 'single'));
        })
        .catch(() => {
          setComboItemSearchResults([]);
        })
        .finally(() => {
          setComboItemSearchLoading(false);
        });
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [comboItemDraftQuery, searchProducts, showAddComboItem]);

  useEffect(() => {
    if (!comboItemDraftProduct || comboItemDraftManualPrice) {
      return;
    }

    setComboItemDraftPriceEach(String(comboItemDraftProduct.sellingPrice));
  }, [comboItemDraftManualPrice, comboItemDraftProduct]);

  const addComboDraftItem = () => {
    if (!comboItemDraftProduct) return;

    const quantity = Math.max(1, parseInt(comboItemDraftQuantity, 10) || 1);
    const priceEach = moneyInputToNumber(comboItemDraftPriceEach || String(comboItemDraftProduct.sellingPrice));
    const subtotal = quantity * priceEach;

    setComboItems((prev) => [
      ...prev,
      {
        id: `combo-${Date.now()}-${comboItemDraftProduct.id}`,
        productId: comboItemDraftProduct.id,
        productName: comboItemDraftProduct.name,
        sku: comboItemDraftProduct.sku ?? '',
        quantity,
        priceEach,
        subtotal,
        unit: comboItemDraftProduct.unitName,
      },
    ]);

    setComboSellingPriceManual(false);
    setComboSellingPriceInput('');
    resetComboDraft();
    setShowAddComboItem(false);
  };

  const handleComboSellingPriceChange = (rawValue: string) => {
    const normalized = normalizeMoneyInput(rawValue);
    setComboSellingPriceManual(true);
    setComboSellingPriceInput(normalized);
    setFormData((prev) => ({ ...prev, defaultSellingPrice: moneyInputToNumber(normalized) }));
  };

  const addVariantDraft = () => {
    if (!variantDraft.name.trim()) {
      setVariantModalError('Variant name is required.');
      return;
    }

    if (!variantDraft.sku.trim()) {
      setVariantModalError('Variant SKU is required.');
      return;
    }

    if (variantDraft.cost < 1) {
      setVariantModalError('Cost must be at least 1.');
      return;
    }

    if (variantDraft.selling < 1) {
      setVariantModalError('Selling price must be at least 1.');
      return;
    }

    if (variantDraft.cost > variantDraft.selling) {
      setVariantModalError('Cost cannot be higher than selling price.');
      return;
    }

    const nextVariant: Variant = {
      ...variantDraft,
      id: `variant-${Date.now()}`,
      name: variantDraft.name.trim(),
      sku: variantDraft.sku.trim(),
      barcode: variantDraft.barcode.trim(),
      cost: Math.max(1, variantDraft.cost),
      selling: Math.max(1, variantDraft.selling),
      stock: Math.max(0, variantDraft.stock),
      reorderLevel: variantDraft.reorderLevel ?? 0,
    };

    setVariants((prev) => [...prev, nextVariant]);
    resetVariantDraft();
    setShowAddVariant(false);
  };

  const baseUnitOptions = useMemo<SelectOption[]>(
    () =>
      units
        .filter((unit) => !unit.isMultipleOfOther)
        .map((unit) => ({ value: unit.id, label: `${unit.name} (${unit.shortName})` })),
    [units],
  );

  const relatedSubUnitOptions = useMemo<SelectOption[]>(() => {
    if (!formData.unitId) return [];
    return units
      .filter((unit) => unit.isMultipleOfOther && unit.baseUnitId === formData.unitId)
      .map((unit) => ({ value: unit.id, label: `${unit.name} (${unit.shortName})` }));
  }, [formData.unitId, units]);

  const categoryOptions = useMemo<SelectOption[]>(
    () => categories.map((category: CategoryItem) => ({ value: category.id, label: category.name })),
    [categories],
  );

  const brandOptions = useMemo<SelectOption[]>(
    () => brands.map((brand: BrandRecord) => ({ value: brand.id, label: brand.name })),
    [brands],
  );

  const subCategoryOptions = useMemo<SelectOption[]>(
    () =>
      subCategories
        .filter((subCategory: SubCategoryItem) => subCategory.parentCategoryId === formData.categoryId)
        .map((subCategory: SubCategoryItem) => ({ value: subCategory.id, label: subCategory.name })),
    [formData.categoryId, subCategories],
  );

  const locationOptions = useMemo<SelectOption[]>(
    () => locations.map((location: BusinessLocationRecord) => ({ value: location.id, label: location.locationName })),
    [locations],
  );

  const selectedBaseUnitOption = useMemo(
    () => baseUnitOptions.find((option) => option.value === formData.unitId) ?? null,
    [baseUnitOptions, formData.unitId],
  );
  const selectedSubUnitOptions = useMemo(
    () => relatedSubUnitOptions.filter((option) => formData.subUnitIds.includes(option.value)),
    [formData.subUnitIds, relatedSubUnitOptions],
  );
  const selectedBrandOption = useMemo(
    () => brandOptions.find((option) => option.value === formData.brandId) ?? null,
    [brandOptions, formData.brandId],
  );
  const selectedCategoryOption = useMemo(
    () => categoryOptions.find((option) => option.value === formData.categoryId) ?? null,
    [categoryOptions, formData.categoryId],
  );
  const selectedSubCategoryOption = useMemo(
    () => subCategoryOptions.find((option) => option.value === formData.subCategoryId) ?? null,
    [formData.subCategoryId, subCategoryOptions],
  );
  const selectedLocationOptions = useMemo(
    () => locationOptions.filter((option) => formData.locationIds.includes(option.value)),
    [formData.locationIds, locationOptions],
  );
  const selectedBarcodeOption = useMemo(
    () => BARCODE_OPTIONS.find((option) => option.value === formData.barcode) ?? null,
    [formData.barcode],
  );

  const currencyCode = businessSettings?.currency || 'USD';
  const currencyPrecision = typeof businessSettings?.currencyPrecision === 'number' ? businessSettings.currencyPrecision : 2;
  const currencyPlacement =
    businessSettings?.currencySymbolPlacement === 'after' ? 'after' : 'before';
  const currencySymbol = getCurrencySymbol(currencyCode);
  const currencySummary = `${currencyCode} ${currencyPlacement} ${currencyPrecision} decimal${currencyPrecision === 1 ? '' : 's'}`;
  const skuPrefix = productSettings?.skuPrefix ?? '';

  const appendValidImages = (files: FileList | File[]) => {
    const nextErrors: string[] = [];
    const validImages: ProductImage[] = [];
    const existingCount = formData.images.length;
    const remainingSlots = Math.max(0, 5 - existingCount);

    if (remainingSlots === 0) {
      setImageUploadErrors(['You can upload a maximum of 5 product images.']);
      return;
    }

    Array.from(files).forEach((file, index) => {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        nextErrors.push(`${file.name}: only JPG and PNG images are allowed.`);
        return;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        nextErrors.push(`${file.name}: must be less than 5 MB.`);
        return;
      }

      validImages.push({
        id: `img-${Date.now()}-${index}-${file.name}`,
        url: URL.createObjectURL(file),
        isPrimary: false,
        name: file.name,
        file,
      });
    });

    const limitedImages = validImages.slice(0, remainingSlots);

    if (validImages.length > remainingSlots) {
      nextErrors.push('Only 5 product images can be uploaded.');
    }

    if (limitedImages.length > 0) {
      setFormData((prev) => {
        const hasPrimary = prev.images.some((image) => image.isPrimary);
        const mergedImages = [...prev.images, ...limitedImages.map((image, index) => ({
          ...image,
          isPrimary: !hasPrimary && prev.images.length === 0 && index === 0,
        }))];
        return { ...prev, images: mergedImages };
      });
    }

    if (nextErrors.length > 0) {
      setImageUploadErrors(nextErrors);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    appendValidImages(files);
    e.target.value = '';
  };

  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsImageDragging(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    appendValidImages(files);
  };

  const removeImage = (id: string) => {
    setFormData((prev) => {
      const target = prev.images.find((image) => image.id === id);
      if (target) URL.revokeObjectURL(target.url);
      const remaining = prev.images.filter((image) => image.id !== id);
      // If we removed the primary image, promote the next one so there's always a primary.
      if (target?.isPrimary && remaining.length > 0 && !remaining.some((image) => image.isPrimary)) {
        remaining[0] = { ...remaining[0], isPrimary: true };
      }
      return { ...prev, images: remaining };
    });
  };

  const setPrimaryImage = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.map((image) => ({ ...image, isPrimary: image.id === id })),
    }));
  };

  const handleBrochureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
        setBrochureUploadError('Only PDF, DOC, and DOCX brochures are allowed.');
        e.target.value = '';
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setBrochureUploadError('The brochure must be 10 MB or smaller.');
        e.target.value = '';
        return;
      }

      setBrochureUploadError(null);
      setFormData((prev) => ({ ...prev, brochure: file, brochureRemoved: false }));
    }
    e.target.value = '';
  };

  const handleBrochureDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsBrochureDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const syntheticEvent = {
      target: { files: [file], value: '' },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    handleBrochureUpload(syntheticEvent);
  };

  const removeBrochure = () =>
    setFormData((prev) => ({
      ...prev,
      brochure: null,
      brochureName: '',
      brochureUrl: '',
      brochureRemoved: true,
    }));

  const handleAddComboItem = (item: ComboItem) => {
    setComboItems((prev) => [...prev, item]);
    setShowAddComboItem(false);
  };
  const removeComboItem = (id: string) => setComboItems((prev) => prev.filter((item) => item.id !== id));

  const handleAddVariant = (variant: Variant) => {
    setVariants((prev) => [...prev, variant]);
    setShowAddVariant(false);
  };
  const removeVariant = (id: string) => setVariants((prev) => prev.filter((v) => v.id !== id));

  const handleAddPriceRule = () => {
    setFormData((prev) => ({
      ...prev,
      productPrices: [
        ...prev.productPrices,
        {
          id: `price-${Date.now()}`,
          priceType: 'wholesale',
          minQuantity: 1,
          price: 0,
          locationId: '',
          customerGroup: '',
          startsAt: '',
          endsAt: '',
          active: true,
          priority: 100,
        },
      ],
    }));
  };

  const handlePriceRuleChange = <K extends keyof ProductPriceRule>(
    id: string,
    field: K,
    value: ProductPriceRule[K],
  ) => {
    setFormData((prev) => ({
      ...prev,
      productPrices: prev.productPrices.map((rule) => (rule.id === id ? { ...rule, [field]: value } : rule)),
    }));
  };

  const removePriceRule = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      productPrices: prev.productPrices.filter((rule) => rule.id !== id),
    }));
  };

  const handleUnitChange = (option: SelectOption | null) => {
    setFormData((prev) => ({ ...prev, unitId: option?.value ?? '', subUnitIds: [] }));
  };

  const handleCategoryChange = (option: SelectOption | null) => {
    setFormData((prev) => ({ ...prev, categoryId: option?.value ?? '', subCategoryId: '' }));
  };

  const handleLocationToggle = () => {
    setFormData((prev) => ({
      ...prev,
      allLocations: !prev.allLocations,
      locationIds: !prev.allLocations ? locations.map((location) => location.id) : [],
    }));
  };

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!formData.name.trim()) nextErrors.name = 'Product name is required.';
    if (!formData.unitId) nextErrors.unitId = 'Select a base unit.';
    if (!formData.categoryId) nextErrors.categoryId = 'Select a category.';
    if (!formData.allLocations && formData.locationIds.length === 0) {
      nextErrors.locationIds = 'Select at least one business location.';
    }
    if (formData.manageStock && formData.alertQuantity < 2) {
      nextErrors.alertQuantity = 'Alert quantity must be at least 2.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async (shouldResetAfterSave = false): Promise<boolean> => {
    setIsSaving(true);
    setFormSubmitError(null);
    if (!validate()) {
      setIsSaving(false);
      return false;
    }
    try {
      const serializedImages = await Promise.all(
        formData.images.map(async (image) => ({
          name: image.name,
          url: image.file ? await fileToDataURL(image.file) : image.url,
          is_primary: image.isPrimary,
        })),
      );

      const brochureUrl = formData.brochure ? await fileToDataURL(formData.brochure) : '';
      const brochureName = formData.brochure ? formData.brochure.name : formData.brochureRemoved ? '' : formData.brochureName;
      const brochureLink = formData.brochure ? brochureUrl : formData.brochureRemoved ? '' : formData.brochureUrl;
      const productPrices =
        formData.productType === 'single'
          ? [
              {
                price_type: 'retail' as const,
                min_quantity: 1,
                price: formData.defaultSellingPrice,
                location_id: null,
                customer_group: null,
                starts_at: null,
                ends_at: null,
                active: true,
                priority: 100,
              },
              ...formData.productPrices
                .filter((rule) => rule.price > 0)
                .map((rule) => ({
                  price_type: rule.priceType,
                  min_quantity: Math.max(1, rule.minQuantity || 1),
                  price: rule.price,
                  location_id: rule.locationId || null,
                  customer_group: rule.customerGroup.trim() || null,
                  starts_at: rule.startsAt || null,
                  ends_at: rule.endsAt || null,
                  active: rule.active,
                  priority: rule.priority || 100,
                })),
            ]
          : [];

      const payload: CreateProductPayload = {
        name: formData.name.trim(),
        sku: formData.sku.trim() ? formData.sku.trim() : null,
        barcode: formData.barcode.trim(),
        product_type: formData.productType,
        unit_id: formData.unitId,
        sub_unit_ids: formData.subUnitIds,
        brand_id: formData.brandId,
        category_id: formData.categoryId,
        sub_category_id: formData.subCategoryId,
        location_ids: formData.locationIds,
        all_locations: formData.allLocations,
        manage_stock: formData.manageStock,
        alert_quantity: formData.alertQuantity,
        is_for_selling: formData.isForSelling,
        tax_type: formData.taxType,
        tax_rate: formData.taxRate,
        default_purchase_price: formData.productType === 'single' ? formData.defaultPurchasePrice : null,
        purchase_price_exclusive: formData.productType === 'single' ? formData.purchasePriceExclusive : null,
        purchase_price_inclusive: formData.productType === 'single' ? formData.purchasePriceInclusive : null,
        profit_margin: formData.productType === 'single' ? formData.profitMargin : null,
        default_selling_price: formData.defaultSellingPrice,
        description: formData.description,
        has_warranty: formData.warranty.hasWarranty,
        warranty_duration: formData.warranty.duration,
        warranty_period: formData.warranty.period,
        warranty_coverage: formData.warranty.coverage,
        brochure_name: brochureName,
        brochure_url: brochureLink,
        currency_code: currencyCode,
        currency_symbol_placement: currencyPlacement,
        currency_precision: currencyPrecision,
        product_prices: productPrices,
        images: serializedImages,
        combo_items: comboItems.map((item) => ({
          product_id: item.productId,
          product_name: item.productName,
          sku: item.sku,
          unit: item.unit,
          quantity: item.quantity,
          price_each: item.priceEach,
          subtotal: item.subtotal,
        })),
        variants: await Promise.all(
          variants.map(async (variant) => ({
            name: variant.name,
            sku: variant.sku,
            barcode: variant.barcode,
            cost: variant.cost,
            selling: variant.selling,
            stock: variant.stock,
            show_optional_fields: variant.showOptionalFields,
            weight: variant.weight,
            length: variant.length,
            width: variant.width,
            height: variant.height,
            image_name: variant.imageName,
            image_url: variant.imageFile ? await fileToDataURL(variant.imageFile) : variant.imageUrl,
            reorder_level: variant.reorderLevel ?? null,
            expiry_date: variant.expiryDate,
            supplier_code: variant.supplierCode,
          })),
        ),
      };

      const response = isEditMode && productId ? await updateProduct(productId, payload) : await createProduct(payload);
      toast.success(response.message || 'Product created successfully');
      setErrors({});
      setFormSubmitError(null);

      if (shouldResetAfterSave) {
        setFormData(INITIAL_FORM_STATE);
        setComboItems([]);
        setVariants([]);
        setPurchasePriceInput('');
        setSellingPriceInput('');
        setComboSellingPriceInput('');
        setComboSellingPriceManual(false);
        setIsSellingPriceManual(false);
        setHasAppliedBusinessProfit(false);
        resetComboDraft();
        resetVariantDraft();
      } else if (isEditMode) {
        // Keep the loaded data in sync with the latest save result.
        setFormData((prev) => ({
          ...prev,
          brochureRemoved: false,
        }));
      }

      setIsSaving(false);
      return true;
    } catch (err) {
      if (err instanceof ApiError) {
        setFormSubmitError(err.message);
      } else if (err instanceof Error) {
        setFormSubmitError(err.message);
      } else {
        setFormSubmitError('Unable to save product.');
      }

      const apiErrors = err instanceof ApiError ? (err.data as { errors?: Record<string, string> } | undefined)?.errors : undefined;
      if (apiErrors) {
        setErrors(apiErrors);
      }

      setIsSaving(false);
      return false;
    }
  };

  const handleSaveAndAddAnother = async () => {
    await handleSave(true);
  };

  const handleSaveAndAddStock = async () => {
    const saved = await handleSave(false);
    if (saved) {
      // In a real app this would redirect to the opening-stock form for the new product.
    }
  };

  const errorList = Object.values(errors).filter(Boolean) as string[];

  return (
    <div className="space-y-6 pb-10 overflow-x-clip">
      {/* Sticky header keeps the primary actions reachable on long forms and small screens */}
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
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">{isEditMode ? 'Edit Product' : 'Create Product'}</h1>
              <p className="text-sm text-muted-foreground mt-0.5 hidden sm:block">
                {isEditMode ? 'Update the saved product details' : 'Add a new product to your inventory'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {isLoadingProduct ? (
        <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          Loading product details...
        </div>
      ) : null}

      {errorList.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Please fix the following before saving:</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              {errorList.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {formSubmitError && errorList.length === 0 && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {formSubmitError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {/* ---------------------------------------------------------- */}
        {/* Basic information                                          */}
        {/* ---------------------------------------------------------- */}
        <SectionCard icon={Tag} title="Basic Information" description="Core identity fields used to find and identify this product.">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-2">
              <FieldLabel required>Product Name</FieldLabel>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter product name"
                className={`${baseFieldClass} ${
                  errors.name ? 'border-destructive' : 'border-border'
                }`}
              />
            </div>

            <div>
              <FieldLabel>SKU</FieldLabel>
              <p className="mt-1 text-xs text-muted-foreground">Optional. Leave blank if you do not use SKUs for this product.</p>
              <div className="relative mt-2">
                <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => handleChange('sku', e.target.value)}
                  placeholder="e.g., PRD-001"
                  className={`${baseFieldWithIconClass} ${
                  errors.sku ? 'border-destructive' : 'border-border'
                }`}
                />
              </div>
            </div>

            <div>
              <FieldLabel>Barcode</FieldLabel>
              <div className="mt-2">
                <Select
                  instanceId="product-barcode"
                  value={selectedBarcodeOption}
                  onChange={(option) => handleChange('barcode', (option as SelectOption | null)?.value ?? '')}
                  options={BARCODE_OPTIONS}
                  styles={selectStyles}
                  placeholder="Select barcode type"
                  isClearable
                />
              </div>
            </div>

            <div>
              <FieldLabel required>Unit</FieldLabel>
              <div className="mt-2">
                <Select
                  instanceId="product-unit"
                  value={selectedBaseUnitOption}
                  onChange={(option) => handleUnitChange(option as SelectOption | null)}
                  options={baseUnitOptions}
                  styles={selectStyles}
                  placeholder="Select base unit"
                  isClearable
                />
              </div>
            </div>

            <div>
              <FieldLabel>Related Sub Units</FieldLabel>
              <div className="mt-2">
                <Select
                  instanceId="product-sub-units"
                  value={selectedSubUnitOptions}
                  onChange={(options) =>
                    handleChange('subUnitIds', ((options as SelectOption[] | null) ?? []).map((o) => o.value))
                  }
                  options={relatedSubUnitOptions}
                  styles={selectStyles}
                  placeholder={formData.unitId ? 'Select related sub units' : 'Choose a base unit first'}
                  isMulti
                  isDisabled={!formData.unitId || relatedSubUnitOptions.length === 0}
                  closeMenuOnSelect={false}
                />
              </div>
              {formData.unitId && relatedSubUnitOptions.length === 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  No sub units are linked to the selected base unit yet.
                </p>
              )}
            </div>

            <div>
              <FieldLabel>Brand</FieldLabel>
              <div className="mt-2">
                <Select
                  instanceId="product-brand"
                  value={selectedBrandOption}
                  onChange={(option) => handleChange('brandId', (option as SelectOption | null)?.value ?? '')}
                  options={brandOptions}
                  styles={selectStyles}
                  placeholder="Select brand"
                  isClearable
                />
              </div>
            </div>

            <div>
              <FieldLabel required>Category</FieldLabel>
              <div className="mt-2">
                <Select
                  instanceId="product-category"
                  value={selectedCategoryOption}
                  onChange={(option) => handleCategoryChange(option as SelectOption | null)}
                  options={categoryOptions}
                  styles={{
                    ...selectStyles,
                    control: (base, state) => ({
                      ...selectStyles.control!(base, state),
                      borderColor: errors.categoryId ? 'hsl(var(--destructive))' : 'hsl(var(--border))',
                    }),
                  }}
                  placeholder="Select category"
                  isClearable
                />
              </div>
            </div>

            <div>
              <FieldLabel>Sub Category</FieldLabel>
              <div className="mt-2">
                <Select
                  instanceId="product-sub-category"
                  value={selectedSubCategoryOption}
                  onChange={(option) => handleChange('subCategoryId', (option as SelectOption | null)?.value ?? '')}
                  options={subCategoryOptions}
                  styles={selectStyles}
                  placeholder={formData.categoryId ? 'Select sub category' : 'Choose a category first'}
                  isClearable
                  isDisabled={!formData.categoryId}
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ---------------------------------------------------------- */}
        {/* Locations                                                   */}
        {/* ---------------------------------------------------------- */}
        <SectionCard icon={MapPin} title="Availability" description="Choose which business locations can sell this product.">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleLocationToggle}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                formData.allLocations
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground hover:bg-surface-alt'
              }`}
            >
              All Locations
            </button>
            <span className="text-xs text-muted-foreground">
              Toggle this if the product should be available in every business location.
            </span>
          </div>
          <div className="mt-3">
            <Select
              instanceId="product-locations"
              value={selectedLocationOptions}
              onChange={(options) => {
                const selectedOptions = (options as SelectOption[] | null) ?? [];
                setFormData((prev) => ({
                  ...prev,
                  allLocations: false,
                  locationIds: selectedOptions.map((option) => option.value),
                }));
                setErrors((prev) => ({ ...prev, locationIds: undefined }));
              }}
              options={locationOptions}
              styles={selectStyles}
              placeholder="Select one or more locations"
              isMulti
              closeMenuOnSelect={false}
              isDisabled={formData.allLocations}
            />
          </div>
        </SectionCard>

        {/* ---------------------------------------------------------- */}
        {/* Product type                                                */}
        {/* ---------------------------------------------------------- */}
        <SectionCard icon={Boxes} title="Product Type" description="Choose whether this item is sold alone, as a bundle, or as a configurable variant product.">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {PRODUCT_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => handleChange('productType', type.value)}
                className={`rounded-lg border-2 px-4 py-3 text-left text-sm font-medium transition-colors ${
                  formData.productType === type.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <span className="block">{type.label}</span>
                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{type.description}</span>
              </button>
            ))}
          </div>

          {formData.productType === 'single' && (
            <div className="mt-6 rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Single product</p>
              <p className="mt-1">
                Use this for individual stock items like a laptop, a bottle of juice, or a packet of flour.
              </p>
            </div>
          )}

          {formData.productType === 'combo' && (
            <div className="mt-6 space-y-5">
              <div className="rounded-lg border border-border bg-background p-4">
                <p className="text-sm font-semibold text-foreground">Combo / Bundle</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use this when you want to sell one product made up of multiple single products.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Example: a breakfast pack that includes bread, milk, and eggs sold together at a bundle price.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Combo Items</h3>
                  <p className="text-xs text-muted-foreground">Search existing single products and add them to this bundle.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    resetComboDraft();
                    setShowAddComboItem(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                  Add new one
                </button>
              </div>

              <div className="overflow-hidden rounded-lg border border-border">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border text-sm">
                    <thead className="bg-surface-alt/60">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-foreground">Product</th>
                        <th className="px-4 py-3 text-left font-medium text-foreground">Qty</th>
                        <th className="px-4 py-3 text-left font-medium text-foreground">Price each</th>
                        <th className="px-4 py-3 text-left font-medium text-foreground">Unit</th>
                        <th className="px-4 py-3 text-left font-medium text-foreground">Subtotal</th>
                        <th className="px-4 py-3 text-right font-medium text-foreground">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-background">
                      {comboItems.length === 0 ? (
                        <tr>
                          <td className="px-4 py-6 text-sm text-muted-foreground" colSpan={6}>
                            No combo items added yet.
                          </td>
                        </tr>
                      ) : (
                        comboItems.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-foreground">{item.productName}</p>
                                <p className="text-xs text-muted-foreground">{item.sku}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-foreground">{item.quantity}</td>
                            <td className="px-4 py-3 text-foreground">{formatMoney(item.priceEach, currencyCode, currencyPrecision, currencyPlacement)}</td>
                            <td className="px-4 py-3 text-foreground">{item.unit}</td>
                            <td className="px-4 py-3 text-foreground">{formatMoney(item.subtotal, currencyCode, currencyPrecision, currencyPlacement)}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => removeComboItem(item.id)}
                                aria-label={`Remove ${item.productName}`}
                                className="shrink-0 rounded-lg p-1.5 text-destructive hover:bg-destructive/10"
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
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <FieldLabel>Bundle Selling Price</FieldLabel>
                  <div className="relative mt-2">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={comboSellingPriceInput}
                      onChange={(e) => handleComboSellingPriceChange(e.target.value)}
                      onFocus={(e) => e.currentTarget.select()}
                      inputMode="decimal"
                      min={0}
                      className={baseFieldWithIconClass}
                      placeholder={`0.${'0'.repeat(currencyPrecision)}`}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Auto-calculated from the selected items, but you can override it whenever needed.
                  </p>
                </div>
              </div>
            </div>
          )}

        {formData.productType === 'variable' && (
            <div className="mt-6 space-y-5">
              <div className="rounded-lg border border-border bg-background p-4">
                <p className="text-sm font-semibold text-foreground">Variable product</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use this when one product has multiple sellable versions, such as different sizes or colors.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Example: a T-shirt sold as Small, Medium, and Large with different prices or stock levels.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Variants</h3>
                  <p className="text-xs text-muted-foreground">Add each version of the product with its own SKU and stock.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    resetVariantDraft();
                    setShowAddVariant(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                  Add variant
                </button>
              </div>

              <div className="overflow-hidden rounded-lg border border-border">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border text-sm">
                    <thead className="bg-surface-alt/60">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-foreground">Variant</th>
                        <th className="px-4 py-3 text-left font-medium text-foreground">SKU</th>
                        <th className="px-4 py-3 text-left font-medium text-foreground">Barcode</th>
                        <th className="px-4 py-3 text-left font-medium text-foreground">Cost</th>
                        <th className="px-4 py-3 text-left font-medium text-foreground">Selling</th>
                        <th className="px-4 py-3 text-left font-medium text-foreground">Stock</th>
                        <th className="px-4 py-3 text-right font-medium text-foreground">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-background">
                      {variants.length === 0 ? (
                        <tr>
                          <td className="px-4 py-6 text-sm text-muted-foreground" colSpan={7}>
                            No variants added yet.
                          </td>
                        </tr>
                      ) : (
                        variants.map((variant) => (
                          <tr key={variant.id}>
                            <td className="px-4 py-3 text-foreground">
                              <div>
                                <p className="font-medium text-foreground">{variant.name}</p>
                                <p className="text-xs text-muted-foreground">{variant.supplierCode || 'No supplier code'}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-foreground">{variant.sku}</td>
                            <td className="px-4 py-3 text-foreground">{variant.barcode || '-'}</td>
                            <td className="px-4 py-3 text-foreground">{formatMoney(variant.cost, currencyCode, currencyPrecision, currencyPlacement)}</td>
                            <td className="px-4 py-3 text-foreground">{formatMoney(variant.selling, currencyCode, currencyPrecision, currencyPlacement)}</td>
                            <td className="px-4 py-3 text-foreground">{variant.stock}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => removeVariant(variant.id)}
                                aria-label={`Remove variant ${variant.sku}`}
                                className="shrink-0 rounded-lg p-1.5 text-destructive hover:bg-destructive/10"
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
              </div>
            </div>
          )}
        </SectionCard>

        {/* ---------------------------------------------------------- */}
        {/* Pricing & tax                                               */}
        {/* ---------------------------------------------------------- */}
        {formData.productType === 'single' && (
          <SectionCard icon={DollarSign} title="Pricing &amp; Tax" description="Set purchase cost, tax handling, and how the selling price is derived.">
          <p className="mb-4 text-sm text-muted-foreground">
            Using {currencySummary}. The money fields below reflect the business currency symbol, placement, and precision.
          </p>
          <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Product is for Selling</p>
              <p className="text-xs text-muted-foreground">Enable if this product can be sold to customers</p>
            </div>
            <ToggleSwitch
              checked={formData.isForSelling}
              onChange={() => handleChange('isForSelling', !formData.isForSelling)}
              ariaLabel="Toggle product for selling"
            />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <FieldLabel>Tax Type</FieldLabel>
              <select
                value={formData.taxType}
                onChange={(e) => handleChange('taxType', e.target.value as TaxType)}
                className={baseSelectClass}
              >
                <option value="exclusive">Exclusive of Tax</option>
                <option value="inclusive">Inclusive of Tax</option>
                <option value="none">No Tax</option>
              </select>
            </div>

            <div>
              <FieldLabel>Tax Rate (%)</FieldLabel>
              <div className="relative mt-2">
                <Percent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="number"
                  value={formData.taxRate}
                  onChange={(e) => handleTaxRateChange(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className={`${baseFieldWithIconClass}`}
                />
              </div>
            </div>

            <div>
              <FieldLabel>Default Purchase Price</FieldLabel>
              <MoneyInput
                value={purchasePriceInput}
                onChange={handlePurchasePriceChange}
                onFocus={(e) => e.currentTarget.select()}
                currencyCode={currencyCode}
                currencyPrecision={currencyPrecision}
                currencyPlacement={currencyPlacement}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                How much you bought a unit item of this product.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Purchase Price (Exclusive)</label>
              <input
                type="text"
                value={formatMoney(formData.purchasePriceExclusive, currencyCode, currencyPrecision, currencyPlacement)}
                disabled
                className="mt-2 w-full rounded-lg border border-border bg-surface-alt px-4 py-2.5 text-sm text-foreground opacity-70 outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Purchase Price (Inclusive)</label>
              <input
                type="text"
                value={formatMoney(formData.purchasePriceInclusive, currencyCode, currencyPrecision, currencyPlacement)}
                disabled
                className="mt-2 w-full rounded-lg border border-border bg-surface-alt px-4 py-2.5 text-sm text-foreground opacity-70 outline-none"
              />
            </div>

            <div>
              <FieldLabel>Profit Margin (%)</FieldLabel>
              <div className="relative mt-2">
                <TrendingUp className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="number"
                  value={formData.profitMargin}
                  onChange={(e) => handleProfitMarginChange(parseFloat(e.target.value) || 0)}
                  min={0}
                  max={100}
                  inputMode="decimal"
                  placeholder="0"
                  className={`${baseFieldWithIconClass}`}
                />
              </div>
            </div>

            <div>
              <FieldLabel>Default Selling Price</FieldLabel>
              <MoneyInput
                value={sellingPriceInput}
                onChange={handleSellingPriceChange}
                onFocus={(e) => e.currentTarget.select()}
                currencyCode={currencyCode}
                currencyPrecision={currencyPrecision}
                currencyPlacement={currencyPlacement}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                How much will you be selling the product for.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                You can adjust this manually without changing the profit percentage.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-border bg-background p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Advanced selling prices</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Retail is saved from the default selling price above. Manage wholesale, tiered, location, promotion, or customer group rules here.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddPriceRule}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-3.5 w-3.5" />
                Add price
              </button>
            </div>

            <div className="mt-4 rounded-lg border border-dashed border-border bg-surface-alt/60 p-3 text-xs text-muted-foreground">
              Retail price: <span className="font-semibold text-foreground">{formatMoney(formData.defaultSellingPrice, currencyCode, currencyPrecision, currencyPlacement)}</span>
            </div>

            <div className="mt-4 space-y-3">
              {formData.productPrices.length === 0 ? (
                <div className="rounded-lg border border-border bg-surface-alt p-4 text-sm text-muted-foreground">
                  No extra price rules yet. Add one when this product needs wholesale, tiered, promotional, customer group, or location-specific pricing.
                </div>
              ) : (
                formData.productPrices.map((rule) => (
                  <div key={rule.id} className="rounded-lg border border-border bg-card p-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <FieldLabel>Rule Type</FieldLabel>
                        <select
                          value={rule.priceType}
                          onChange={(e) => handlePriceRuleChange(rule.id, 'priceType', e.target.value as ProductPriceType)}
                          className={baseSelectClass}
                        >
                          {productPriceTypeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <FieldLabel>Price</FieldLabel>
                        <MoneyInput
                          value={rule.price > 0 ? String(rule.price) : ''}
                          onChange={(value) => handlePriceRuleChange(rule.id, 'price', moneyInputToNumber(normalizeMoneyInput(value)))}
                          onFocus={(e) => e.currentTarget.select()}
                          currencyCode={currencyCode}
                          currencyPrecision={currencyPrecision}
                          currencyPlacement={currencyPlacement}
                        />
                      </div>

                      <div>
                        <FieldLabel>Minimum Qty</FieldLabel>
                        <input
                          type="number"
                          min={1}
                          value={rule.minQuantity}
                          onChange={(e) => handlePriceRuleChange(rule.id, 'minQuantity', Math.max(1, parseFloat(e.target.value) || 1))}
                          className={baseFieldClass}
                        />
                      </div>

                      <div>
                        <FieldLabel>Priority</FieldLabel>
                        <input
                          type="number"
                          value={rule.priority}
                          onChange={(e) => handlePriceRuleChange(rule.id, 'priority', parseInt(e.target.value, 10) || 100)}
                          className={baseFieldClass}
                        />
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <FieldLabel>Location</FieldLabel>
                        <select
                          value={rule.locationId}
                          onChange={(e) => handlePriceRuleChange(rule.id, 'locationId', e.target.value)}
                          className={baseSelectClass}
                        >
                          <option value="">All locations</option>
                          {locationOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <FieldLabel>Customer Group</FieldLabel>
                        <input
                          type="text"
                          value={rule.customerGroup}
                          onChange={(e) => handlePriceRuleChange(rule.id, 'customerGroup', e.target.value)}
                          placeholder="Example: VIP, Distributor"
                          className={baseFieldClass}
                        />
                      </div>

                      <div>
                        <FieldLabel>Starts At</FieldLabel>
                        <input
                          type="datetime-local"
                          value={rule.startsAt}
                          onChange={(e) => handlePriceRuleChange(rule.id, 'startsAt', e.target.value)}
                          className={baseFieldClass}
                        />
                      </div>

                      <div>
                        <FieldLabel>Ends At</FieldLabel>
                        <input
                          type="datetime-local"
                          value={rule.endsAt}
                          onChange={(e) => handlePriceRuleChange(rule.id, 'endsAt', e.target.value)}
                          className={baseFieldClass}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <ToggleSwitch
                          checked={rule.active}
                          onChange={() => handlePriceRuleChange(rule.id, 'active', !rule.active)}
                          ariaLabel={`Toggle ${rule.priceType} price rule`}
                        />
                        <span className="text-xs font-medium text-muted-foreground">
                          {rule.active ? 'Active rule' : 'Inactive rule'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removePriceRule(rule.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </SectionCard>
        )}

        {/* ---------------------------------------------------------- */}
        {/* Stock & warranty                                            */}
        {/* ---------------------------------------------------------- */}
        <SectionCard icon={AlertCircle} title="Inventory &amp; Warranty" description="Stock tracking, low-stock alerts, and warranty terms.">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
              <div>
                <p className="text-sm font-medium text-foreground">Manage Stock</p>
                <p className="text-xs text-muted-foreground">Enable stock tracking for this product</p>
              </div>
              <ToggleSwitch
                checked={formData.manageStock}
                onChange={() => handleChange('manageStock', !formData.manageStock)}
                ariaLabel="Toggle stock management"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
              <div>
                <p className="text-sm font-medium text-foreground">Warranty</p>
                <p className="text-xs text-muted-foreground">Enable warranty for this product</p>
              </div>
              <ToggleSwitch
                checked={formData.warranty.hasWarranty}
                onChange={() => handleWarrantyChange('hasWarranty', !formData.warranty.hasWarranty)}
                ariaLabel="Toggle warranty"
              />
            </div>
          </div>

          {formData.manageStock && (
            <div className="mt-5 max-w-sm">
              <FieldLabel>Alert Quantity</FieldLabel>
              <div className="relative mt-2">
                <AlertCircle className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="number"
                  value={formData.alertQuantity}
                  min={2}
                  onChange={(e) => handleChange('alertQuantity', Math.max(2, parseInt(e.target.value, 10) || 2))}
                  placeholder="Enter alert quantity"
                  className={baseFieldWithIconClass}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                You will be notified when stock falls below this quantity
              </p>
            </div>
          )}

          {formData.warranty.hasWarranty && (
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <FieldLabel>Duration</FieldLabel>
                <input
                  type="number"
                  value={formData.warranty.duration}
                  onChange={(e) => handleWarrantyChange('duration', e.target.value)}
                  placeholder="Enter duration"
                  className={baseFieldClass}
                />
              </div>
              <div>
                <FieldLabel>Period</FieldLabel>
                <select
                  value={formData.warranty.period}
                  onChange={(e) => handleWarrantyChange('period', e.target.value as 'months' | 'years')}
                  className={baseSelectClass}
                >
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <FieldLabel>Warranty Coverage</FieldLabel>
                <textarea
                  value={formData.warranty.coverage}
                  onChange={(e) => handleWarrantyChange('coverage', e.target.value)}
                  placeholder="Describe warranty coverage..."
                  rows={2}
                  className={baseTextareaClass}
                />
              </div>
            </div>
          )}
        </SectionCard>

        {/* ---------------------------------------------------------- */}
        {/* Description, media, brochure                                */}
        {/* ---------------------------------------------------------- */}
        <SectionCard icon={ImageIcon} title="Description &amp; Media" description="Details, photos, and documents shown to customers and staff.">
          <div>
            <FieldLabel>Description</FieldLabel>
            <div className="mt-2 overflow-hidden rounded-lg border border-border bg-background outline-none focus-within:ring-1 focus-within:ring-primary">
              <CKEditor
                editor={ClassicEditor}
                data={formData.description}
                config={{
                  licenseKey: 'GPL',
                  plugins: [Essentials, Paragraph, Heading, Bold, Italic, Link, List, BlockQuote, Undo],
                  toolbar: ['undo', 'redo', '|', 'heading', '|', 'bold', 'italic', 'link', '|', 'bulletedList', 'numberedList', 'blockQuote'],
                  placeholder: 'Enter product description...',
                }}
                onChange={(_, editor) => {
                  handleChange('description', editor.getData());
                }}
              />
            </div>
          </div>

          <div className="mt-6">
            <FieldLabel>Product Images</FieldLabel>
            <p className="mt-2 text-xs text-muted-foreground">
              Drop JPG or PNG images here, each under 5 MB, or click to browse.
            </p>
            {imageUploadErrors.length > 0 && (
              <div className="mt-3 space-y-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
                {imageUploadErrors.map((error) => (
                  <p key={error}>{error}</p>
                ))}
              </div>
            )}
            <div
              className={`mt-3 rounded-2xl border-2 border-dashed p-4 transition-colors sm:p-5 ${
                isImageDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-background hover:border-primary/60'
              }`}
              onClick={() => imageInputRef.current?.click()}
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsImageDragging(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsImageDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsImageDragging(false);
              }}
              onDrop={handleImageDrop}
              role="button"
              tabIndex={0}
            >
              <div className="flex flex-col items-center justify-center gap-2 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Drag & drop images here</p>
                  <p className="text-xs text-muted-foreground">or click to select multiple files</p>
                </div>
                <p className="text-xs text-muted-foreground">Only JPG and PNG images under 5 MB each are allowed.</p>
              </div>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/png,image/jpeg"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
              {formData.images.map((image) => (
                <div key={image.id} className="group relative shrink-0 w-24 sm:w-28 md:w-32">
                  <div className="aspect-square overflow-hidden rounded-lg border border-border bg-background">
                    <img src={image.url} alt={image.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <button
                      type="button"
                      onClick={() => setPreviewImage(image)}
                      aria-label={`Preview ${image.name}`}
                      className="rounded-lg bg-white/20 p-1.5 text-white hover:bg-white/30"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {!image.isPrimary && (
                      <button
                        type="button"
                        onClick={() => setPrimaryImage(image.id)}
                        aria-label={`Set ${image.name} as primary image`}
                        className="rounded-lg bg-white/20 p-1.5 text-white hover:bg-white/30"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(image.id)}
                      aria-label={`Remove ${image.name}`}
                      className="rounded-lg bg-destructive/80 p-1.5 text-white hover:bg-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {image.isPrimary && (
                    <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                      Primary
                    </span>
                  )}
                </div>
              ))}

            </div>
          </div>

          <div className="mt-6">
            <FieldLabel>Product Brochure</FieldLabel>
            <div className="mt-2">
              {formData.brochure || formData.brochureUrl ? (
                <div className="flex flex-col gap-3 rounded-lg border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText className="h-8 w-8 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {formData.brochure?.name ?? formData.brochureName ?? 'Existing brochure'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formData.brochure
                          ? `${(formData.brochure.size / 1024).toFixed(2)} KB`
                          : formData.brochureUrl
                            ? 'Saved brochure'
                            : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      aria-label="Download brochure"
                      onClick={() => {
                        if (formData.brochureUrl) window.open(formData.brochureUrl, '_blank', 'noopener,noreferrer');
                      }}
                      className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-surface-alt"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={removeBrochure}
                      aria-label="Remove brochure"
                      className="rounded-lg border border-destructive px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors outline-none focus-within:ring-1 focus-within:ring-primary ${
                    isBrochureDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary'
                  }`}
                  role="button"
                  tabIndex={0}
                  onClick={() => brochureInputRef.current?.click()}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsBrochureDragging(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsBrochureDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsBrochureDragging(false);
                  }}
                  onDrop={handleBrochureDrop}
                >
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">Drop brochure here or click to browse</p>
                  <p className="text-xs text-muted-foreground">PDF, DOC, DOCX (Max 10MB)</p>
                  {brochureUploadError && <p className="mt-2 text-xs text-destructive">{brochureUploadError}</p>}
                  <input
                    ref={brochureInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleBrochureUpload}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          </div>
        </SectionCard>

        <div className="flex flex-col-reverse gap-3 rounded-xl border border-border bg-background p-4 sm:flex-row sm:justify-end">
          {isEditMode ? (
            <>
              <button
                type="button"
                onClick={() => navigate(-1)}
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-alt disabled:opacity-50"
              >
                <span>Cancel</span>
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving || isLoadingProduct}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>Update Product</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => void handleSaveAndAddAnother()}
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-alt disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                <span>Save &amp; Add Another</span>
              </button>
              <button
                type="button"
                onClick={() => void handleSaveAndAddStock()}
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-alt disabled:opacity-50"
              >
                <Package className="h-4 w-4" />
                <span>Save &amp; Add Opening Stock</span>
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>Save Product</span>
              </button>
            </>
          )}
        </div>

        {previewImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setPreviewImage(null)}
          >
            <div
              className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-background shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
                aria-label="Close preview"
              >
                <X className="h-4 w-4" />
              </button>
              <img src={previewImage.url} alt={previewImage.name} className="max-h-[80vh] w-full object-contain" />
              <div className="flex items-center justify-between gap-3 border-t border-border p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{previewImage.name}</p>
                  {previewImage.isPrimary && <p className="text-xs text-primary">Primary image</p>}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    removeImage(previewImage.id);
                    setPreviewImage(null);
                  }}
                  className="rounded-lg border border-destructive px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}

        {showAddComboItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3 backdrop-blur-sm">
            <div
              className="w-full max-w-3xl rounded-sm border border-border bg-background shadow-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-border p-5">
                <div>
                  <p className="text-sm font-semibold text-foreground">Add combo item</p>
                  <p className="text-xs text-muted-foreground">
                    Search existing single products and add them to this combo.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddComboItem(false);
                    resetComboDraft();
                  }}
                  className="rounded-full p-2 text-muted-foreground hover:bg-surface-alt hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-5 p-5">
                <div>
                  <FieldLabel required>Search product</FieldLabel>
                  <Select
                    instanceId="combo-item-search"
                    inputValue={comboItemDraftQuery}
                    onInputChange={(value, meta) => {
                      if (meta.action === 'input-change') {
                        setComboItemDraftQuery(value);
                        if (value.trim().length < 3) {
                          setComboItemSearchResults([]);
                        }
                      }
                      return value;
                    }}
                    value={
                      comboItemDraftProduct
                        ? {
                            value: comboItemDraftProduct.id,
                            label: `${comboItemDraftProduct.name} (${formatProductSkuDisplay(comboItemDraftProduct.sku, skuPrefix)})`,
                          }
                        : null
                    }
                    onChange={(option) => {
                      const selected = comboItemSearchResults.find((item) => item.id === (option as SelectOption | null)?.value) ?? null;
                      setComboItemDraftProduct(selected);
                      setComboItemDraftManualPrice(false);
                      setComboItemDraftPriceEach(selected ? String(selected.sellingPrice) : '');
                    }}
                    options={comboItemSearchResults.map((item) => ({
                      value: item.id,
                      label: `${item.name} (${formatProductSkuDisplay(item.sku, skuPrefix)}) - ${formatMoney(item.sellingPrice, currencyCode, currencyPrecision, currencyPlacement)}`,
                    }))}
                    styles={selectStyles}
                    placeholder="Type at least 3 letters to search"
                    isClearable
                    isLoading={comboItemSearchLoading}
                    menuPlacement="auto"
                    noOptionsMessage={() =>
                      comboItemDraftQuery.trim().length < 3
                        ? 'Type at least 3 letters'
                        : 'No matching single products found'
                    }
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Only products with product type set to single can be added here.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <FieldLabel required>Count</FieldLabel>
                    <input
                      type="number"
                      min={1}
                      value={comboItemDraftQuantity}
                      onChange={(e) => setComboItemDraftQuantity(e.target.value)}
                      className={baseFieldClass}
                    />
                  </div>

                  <div>
                    <FieldLabel>Unit price</FieldLabel>
                  <MoneyInput
                    value={comboItemDraftPriceEach}
                    onChange={(value) => {
                      setComboItemDraftManualPrice(true);
                      setComboItemDraftPriceEach(normalizeMoneyInput(value));
                    }}
                    currencyCode={currencyCode}
                    currencyPrecision={currencyPrecision}
                    currencyPlacement={currencyPlacement}
                  />
                    <p className="mt-1 text-xs text-muted-foreground">Pulled from the selected product by default.</p>
                  </div>

                  <div>
                    <FieldLabel>Subtotal</FieldLabel>
                    <input
                      type="text"
                      value={formatMoney(
                        Math.max(1, parseInt(comboItemDraftQuantity, 10) || 1) *
                          moneyInputToNumber(comboItemDraftPriceEach || String(comboItemDraftProduct?.sellingPrice ?? 0)),
                        currencyCode,
                        currencyPrecision,
                        currencyPlacement,
                      )}
                      disabled
                      className="mt-2 w-full rounded-lg border border-border bg-surface-alt px-4 py-2.5 text-sm text-foreground outline-none"
                    />
                  </div>
                </div>

                {comboItemDraftProduct && (
                  <div className="rounded-lg border border-border bg-surface-alt/40 p-4 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">Selected product</p>
                    <p className="mt-1">
                      {comboItemDraftProduct.name} • SKU {formatProductSkuDisplay(comboItemDraftProduct.sku, skuPrefix)} • {comboItemDraftProduct.unitName}
                    </p>
                    <p className="mt-1 text-xs">
                      Selling price: {formatMoney(comboItemDraftProduct.sellingPrice, currencyCode, currencyPrecision, currencyPlacement)}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddComboItem(false);
                      resetComboDraft();
                    }}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-alt"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addComboDraftItem}
                    disabled={!comboItemDraftProduct}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    Add to combo
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showAddVariant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3 backdrop-blur-sm">
            <div
              className="w-full rounded-sm border border-border bg-background shadow-2xl md:w-4/5 xl:max-w-7xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-border p-5">
                <div>
                  <p className="text-sm font-semibold text-foreground">Add variant</p>
                  <p className="text-xs text-muted-foreground">
                    Define a sellable variation and optionally reveal additional stock and dimension fields.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddVariant(false);
                    resetVariantDraft();
                  }}
                  className="rounded-full p-2 text-muted-foreground hover:bg-surface-alt hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-5 p-5">
                {variantModalError && (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                    {variantModalError}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-4">
                  <div>
                    <FieldLabel required>Variant</FieldLabel>
                    <input
                      type="text"
                      value={variantDraft.name}
                      onChange={(e) => setVariantDraft((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Red / Large / 500ml"
                      className={baseFieldClass}
                    />
                  </div>
                  <div>
                    <FieldLabel required>SKU</FieldLabel>
                    <input
                      type="text"
                      value={variantDraft.sku}
                      onChange={(e) => setVariantDraft((prev) => ({ ...prev, sku: e.target.value }))}
                      className={baseFieldClass}
                    />
                  </div>
                  <div>
                    <FieldLabel>Barcode</FieldLabel>
                    <input
                      type="text"
                      value={variantDraft.barcode}
                      onChange={(e) => setVariantDraft((prev) => ({ ...prev, barcode: e.target.value }))}
                      className={baseFieldClass}
                    />
                  </div>
                  <div>
                    <FieldLabel>Stock</FieldLabel>
                    <input
                      type="number"
                      min={0}
                      value={variantDraft.stock}
                      onChange={(e) => setVariantDraft((prev) => ({ ...prev, stock: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
                      className={baseFieldClass}
                    />
                  </div>
                  <div>
                    <FieldLabel required>Cost</FieldLabel>
                    <MoneyInput
                      value={String(variantDraft.cost || '')}
                      onChange={(value) =>
                        setVariantDraft((prev) => ({
                          ...prev,
                          cost: Math.max(1, moneyInputToNumber(normalizeMoneyInput(value))),
                        }))
                      }
                      currencyCode={currencyCode}
                      currencyPrecision={currencyPrecision}
                      currencyPlacement={currencyPlacement}
                    />
                  </div>
                  <div>
                    <FieldLabel required>Selling</FieldLabel>
                    <MoneyInput
                      value={String(variantDraft.selling || '')}
                      onChange={(value) =>
                        setVariantDraft((prev) => ({
                          ...prev,
                          selling: Math.max(1, moneyInputToNumber(normalizeMoneyInput(value))),
                        }))
                      }
                      currencyCode={currencyCode}
                      currencyPrecision={currencyPrecision}
                      currencyPlacement={currencyPlacement}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border bg-surface-alt/40 p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Show optional fields</p>
                    <p className="text-xs text-muted-foreground">
                      Reveal extra fields like dimensions, image, reorder level, and supplier code.
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={variantDraft.showOptionalFields}
                    onChange={() =>
                      setVariantDraft((prev) => ({ ...prev, showOptionalFields: !prev.showOptionalFields }))
                    }
                    ariaLabel="Toggle optional variant fields"
                  />
                </div>

                {variantDraft.showOptionalFields && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-4">
                    <div>
                      <FieldLabel>Weight</FieldLabel>
                      <p className="mt-1 text-xs text-muted-foreground">Measured in cm</p>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={variantDraft.weight ?? ''}
                        onChange={(e) => setVariantDraft((prev) => ({ ...prev, weight: e.target.value }))}
                        className={baseFieldClass}
                      />
                    </div>
                    <div>
                      <FieldLabel>Length</FieldLabel>
                      <p className="mt-1 text-xs text-muted-foreground">Measured in cm</p>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={variantDraft.length ?? ''}
                        onChange={(e) => setVariantDraft((prev) => ({ ...prev, length: e.target.value }))}
                        className={baseFieldClass}
                      />
                    </div>
                    <div>
                      <FieldLabel>Width</FieldLabel>
                      <p className="mt-1 text-xs text-muted-foreground">Measured in cm</p>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={variantDraft.width ?? ''}
                        onChange={(e) => setVariantDraft((prev) => ({ ...prev, width: e.target.value }))}
                        className={baseFieldClass}
                      />
                    </div>
                    <div>
                      <FieldLabel>Height</FieldLabel>
                      <p className="mt-1 text-xs text-muted-foreground">Measured in cm</p>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={variantDraft.height ?? ''}
                        onChange={(e) => setVariantDraft((prev) => ({ ...prev, height: e.target.value }))}
                        className={baseFieldClass}
                      />
                    </div>
                    <div>
                      <FieldLabel>Reorder Level</FieldLabel>
                      <input
                        type="number"
                        min={0}
                        value={variantDraft.reorderLevel ?? ''}
                        onChange={(e) =>
                          setVariantDraft((prev) => ({ ...prev, reorderLevel: Math.max(0, parseInt(e.target.value, 10) || 0) }))
                        }
                        className={baseFieldClass}
                      />
                    </div>
                    <div>
                    <FieldLabel>Expiry Date</FieldLabel>
                      <DatePickerField
                        value={variantDraft.expiryDate ?? ''}
                        onChange={(value) => setVariantDraft((prev) => ({ ...prev, expiryDate: value }))}
                        placeholder="Select expiry date"
                      />
                    </div>
                    <div>
                      <FieldLabel>Supplier Code</FieldLabel>
                      <input
                        type="text"
                        value={variantDraft.supplierCode ?? ''}
                        onChange={(e) => setVariantDraft((prev) => ({ ...prev, supplierCode: e.target.value }))}
                        className={baseFieldClass}
                      />
                    </div>
                    <div>
                      <FieldLabel>Image</FieldLabel>
                      <input
                        type="file"
                        accept="image/png,image/jpeg"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          setVariantDraft((prev) => ({
                            ...prev,
                            imageFile: file,
                            imageName: file?.name ?? '',
                            imageUrl: file ? URL.createObjectURL(file) : undefined,
                          }));
                          e.target.value = '';
                        }}
                        className={`${baseFieldClass} py-2`}
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        {variantDraft.imageName ? `Selected: ${variantDraft.imageName}` : 'Choose a JPG or PNG image.'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddVariant(false);
                      resetVariantDraft();
                    }}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-alt"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addVariantDraft}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4" />
                    Add variant
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
