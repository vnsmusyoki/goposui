import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react';
import Select, { type StylesConfig } from 'react-select';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import { ClassicEditor, Essentials, Paragraph, Heading, Bold, Italic, Link, List, BlockQuote, Undo } from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Layers3,
  Loader2,
  Edit2,
  Shield,
  Save,
  X,
  Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { apiDownload, apiRequest, ApiError } from '@/lib/api';
import { useBusinessLocations } from '@/hooks/business/settings/useBusinessLocations';
import { useCategories } from '@/hooks/business/categories/useCategories';
import { useSubCategories } from '@/hooks/business/subcategories/useSubCategories';
import { useBusinessBrands } from '@/hooks/business/brands/useBusinessBrands';
import { useBusinessUnits } from '@/hooks/business/units/useBusinessUnits';

type SelectOption<T extends string = string> = {
  value: T;
  label: string;
  meta?: string;
};

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

type ImportRow = {
  id: string;
  batchId: string;
  rowNumber: number;
  rowData: Record<string, string>;
  validationErrors: string[];
  status: string;
  importedProductId: string;
  createdAt: string;
  updatedAt: string;
};

type ImportBatch = {
  id: string;
  businessId: string;
  fileName: string;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

type ImportPreviewResponse = {
  batch: ImportBatch;
  rows: ImportRow[];
  message: string;
};

type ImportRowFormState = {
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
  productType: string;
  unit: string;
  brand: string;
  categoryCode: string;
  subCategoryCode: string;
  locationCode: string;
  manageStock: boolean;
  alertQuantity: string;
  isForSelling: boolean;
  taxType: string;
  taxRate: string;
  purchasePriceExclusive: string;
  purchasePriceInclusive: string;
  profitMargin: string;
  defaultPurchasePrice: string;
  defaultSellingPrice: string;
  hasWarranty: boolean;
  warrantyDuration: string;
  warrantyPeriod: 'months' | 'years';
  warrantyCoverage: string;
  description: string;
  brochureName: string;
  brochureUrl: string;
  images: string;
};

const EMPTY_ROW_FORM: ImportRowFormState = {
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
  productType: 'single',
  unit: '',
  brand: '',
  categoryCode: '',
  subCategoryCode: '',
  locationCode: '',
  manageStock: true,
  alertQuantity: '2',
  isForSelling: true,
  taxType: 'exclusive',
  taxRate: '16',
  purchasePriceExclusive: '',
  purchasePriceInclusive: '',
  profitMargin: '',
  defaultPurchasePrice: '',
  defaultSellingPrice: '',
  hasWarranty: false,
  warrantyDuration: '',
  warrantyPeriod: 'months',
  warrantyCoverage: '',
  description: '',
  brochureName: '',
  brochureUrl: '',
  images: '',
};

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full border p-0.5 transition-colors ${
        checked ? 'border-primary bg-primary/20' : 'border-border bg-background'
      }`}
    >
      <span
        className={`h-5 w-5 rounded-full shadow-sm transition-transform ${
          checked ? 'translate-x-5 bg-primary' : 'translate-x-0 bg-muted-foreground'
        }`}
      />
    </button>
  );
}

function normalizeHeader(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[\s/-]+/g, '_')
    .replace(/__+/g, '_');
}

function labelForStatus(status: string) {
  switch (status) {
    case 'valid':
      return 'Ready';
    case 'approved':
      return 'Approved';
    case 'invalid':
      return 'Needs Fixing';
    case 'imported':
      return 'Imported';
    case 'error':
      return 'Error';
    default:
      return status || 'Pending';
  }
}

function getStatusPillClass(status: string) {
  switch (status) {
    case 'valid':
    case 'approved':
      return 'bg-emerald-100 text-emerald-700';
    case 'invalid':
      return 'bg-amber-100 text-amber-700';
    case 'imported':
      return 'bg-primary/10 text-primary';
    case 'error':
      return 'bg-rose-100 text-rose-700';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function stringifyRowValue(value: string | number | boolean | null | undefined) {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value === null || value === undefined) return '';
  return String(value);
}

function fileToDataURL(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_BROCHURE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_BROCHURE_SIZE = 10 * 1024 * 1024;

function compactOptionLabel(option: SelectOption) {
  return (
    <div className="min-w-0">
      <div className="truncate text-sm font-medium text-foreground">{option.label}</div>
      {option.meta ? <div className="truncate text-[11px] text-muted-foreground">{option.meta}</div> : null}
    </div>
  );
}

export default function ImportProducts() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const brochureInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [batch, setBatch] = useState<ImportBatch | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [editingRow, setEditingRow] = useState<ImportRow | null>(null);
  const [editForm, setEditForm] = useState<ImportRowFormState>(EMPTY_ROW_FORM);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editBrochureFile, setEditBrochureFile] = useState<File | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [brochureUploadError, setBrochureUploadError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showLocations, setShowLocations] = useState(true);
  const [showCategories, setShowCategories] = useState(true);
  const [showSubCategories, setShowSubCategories] = useState(false);
  const [showBrands, setShowBrands] = useState(false);
  const [showUnits, setShowUnits] = useState(false);

  const { locations, loadBusinessLocations, isLoading: loadingLocations } = useBusinessLocations();
  const { categories, fetchCategories, isLoading: loadingCategories } = useCategories();
  const { subCategories, fetchSubCategories, isLoading: loadingSubCategories } = useSubCategories();
  const { brands, loadBrands, isLoading: loadingBrands } = useBusinessBrands();
  const { units, loadUnits, isLoading: loadingUnits } = useBusinessUnits();

  const barcodeOptions = useMemo<SelectOption[]>(
    () => [
      { value: 'code-128', label: 'Code 128' },
      { value: 'code-39', label: 'Code 39' },
      { value: 'ean-8', label: 'EAN-8' },
      { value: 'ean-13', label: 'EAN-13' },
      { value: 'upc-a', label: 'UPC-A' },
    ],
    [],
  );

  const unitOptions = useMemo<SelectOption[]>(
    () =>
      units.map((unit) => ({
        value: unit.id,
        label: unit.name,
        meta: unit.shortName || '',
      })),
    [units],
  );

  const subUnitOptions = useMemo<SelectOption[]>(
    () =>
      units
        .filter((unit) => unit.isMultipleOfOther && unit.baseUnitId === editForm.unitId)
        .map((unit) => ({
          value: unit.id,
          label: unit.name,
          meta: unit.shortName || '',
        })),
    [editForm.unitId, units],
  );

  const brandOptions = useMemo<SelectOption[]>(
    () =>
      brands.map((brand) => ({
        value: brand.id,
        label: brand.name,
        meta: brand.shortDescription || '',
      })),
    [brands],
  );

  const categoryOptions = useMemo<SelectOption[]>(
    () =>
      categories.map((category) => ({
        value: category.id,
        label: category.name,
        meta: category.categoryCode,
      })),
    [categories],
  );

  const subCategoryOptions = useMemo<SelectOption[]>(
    () =>
      subCategories
        .filter((item) => item.parentCategoryId === editForm.categoryId)
        .map((subCategory) => ({
          value: subCategory.id,
          label: subCategory.name,
          meta: subCategory.subCategoryCode,
        })),
    [editForm.categoryId, subCategories],
  );

  const locationOptions = useMemo<SelectOption[]>(
    () =>
      locations.map((location) => ({
        value: location.id,
        label: location.locationName,
        meta: location.locationCode || location.locationId,
      })),
    [locations],
  );

  useEffect(() => {
    void loadBusinessLocations();
    void fetchCategories();
    void fetchSubCategories();
    void loadBrands();
    void loadUnits();
  }, [fetchCategories, fetchSubCategories, loadBrands, loadUnits, loadBusinessLocations]);

  const templateDetails = useMemo(
    () => [
      {
        title: 'Location code',
        lines: locations.map((location) => ({
          primary: `${location.locationName} (${location.locationCode || location.locationId})`,
        })),
        enabled: showLocations,
        setEnabled: setShowLocations,
      },
      {
        title: 'Categories',
        lines: categories.map((category) => ({
          primary: `${category.name} (${category.categoryCode})`,
        })),
        enabled: showCategories,
        setEnabled: setShowCategories,
      },
      {
        title: 'Sub-categories',
        lines: subCategories.map((subCategory) => ({
          primary: `${subCategory.name} (${subCategory.subCategoryCode})`,
        })),
        enabled: showSubCategories,
        setEnabled: setShowSubCategories,
      },
      {
        title: 'Brands',
        lines: brands.map((brand) => ({
          primary: brand.shortDescription ? `${brand.name} (${brand.shortDescription})` : brand.name,
        })),
        enabled: showBrands,
        setEnabled: setShowBrands,
      },
      {
        title: 'Units',
        lines: units.map((unit) => ({
          primary: unit.shortName ? `${unit.name} (${unit.shortName})` : unit.name,
        })),
        enabled: showUnits,
        setEnabled: setShowUnits,
      },
    ],
    [brands, categories, locations, showBrands, showCategories, showLocations, showSubCategories, showUnits, subCategories, units],
  );

  const handleDownloadTemplate = async () => {
    setIsDownloading(true);
    try {
      const { blob, filename } = await apiDownload('/products/import/template.csv');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'product_import_template.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Template downloaded successfully');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to download template';
      toast.error(message);
    } finally {
      setIsDownloading(false);
    }
  };

  const refreshBatch = async (batchId: string) => {
    const response = await apiRequest<ImportPreviewResponse>(`/products/import/batches/${batchId}`);
    setBatch(response.batch);
    setRows(response.rows ?? []);
  };

  const findUnitByValue = (value: string) =>
    units.find(
      (unit) =>
        unit.id === value ||
        unit.name.toLowerCase() === value.toLowerCase() ||
        unit.shortName.toLowerCase() === value.toLowerCase(),
    );

  const findBrandByValue = (value: string) =>
    brands.find((brand) => brand.id === value || brand.name.toLowerCase() === value.toLowerCase());

  const findCategoryByValue = (value: string) =>
    categories.find((category) => category.id === value || category.categoryCode.toLowerCase() === value.toLowerCase());

  const findSubCategoryByValue = (value: string) =>
    subCategories.find(
      (subCategory) => subCategory.id === value || subCategory.subCategoryCode.toLowerCase() === value.toLowerCase(),
    );

  const findLocationByValue = (value: string) =>
    locations.find(
      (location) =>
        location.id === value ||
        location.locationCode.toLowerCase() === value.toLowerCase() ||
        location.locationName.toLowerCase() === value.toLowerCase(),
    );

  const loadLatestBatch = useCallback(async () => {
    try {
      const response = await apiRequest<ImportPreviewResponse>('/products/import/batches/latest');
      setBatch(response.batch);
      setRows(response.rows ?? []);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return;
      }

      const message = err instanceof ApiError ? err.message : 'Failed to load staged imports';
      toast.error(message);
    }
  }, []);

  const handleEditImageUpload = (file: File | null) => {
    if (!file) {
      setEditImageFile(null);
      setImageUploadError(null);
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setEditImageFile(null);
      setImageUploadError('Only JPG, PNG, and WebP images are allowed.');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setEditImageFile(null);
      setImageUploadError('The image must be 5 MB or smaller.');
      return;
    }

    setImageUploadError(null);
    setEditImageFile(file);
  };

  const handleEditBrochureUpload = (file: File | null) => {
    if (!file) {
      setEditBrochureFile(null);
      setBrochureUploadError(null);
      return;
    }

    if (!ALLOWED_BROCHURE_TYPES.includes(file.type)) {
      setEditBrochureFile(null);
      setBrochureUploadError('Only PDF, DOC, and DOCX brochures are allowed.');
      return;
    }

    if (file.size > MAX_BROCHURE_SIZE) {
      setEditBrochureFile(null);
      setBrochureUploadError('The brochure must be 10 MB or smaller.');
      return;
    }

    setBrochureUploadError(null);
    setEditBrochureFile(file);
  };

  const openEditRow = (row: ImportRow) => {
    setEditingRow(row);
    setEditError(null);
    setEditImageFile(null);
    setEditBrochureFile(null);
    setImageUploadError(null);
    setBrochureUploadError(null);
    const resolvedUnit = findUnitByValue(row.rowData.unit || '');
    const resolvedBrand = findBrandByValue(row.rowData.brand || '');
    const resolvedCategory = findCategoryByValue(row.rowData.category_code || '');
    const resolvedSubCategory = findSubCategoryByValue(row.rowData.sub_category_code || '');
    const resolvedLocation = findLocationByValue(row.rowData.location_code || '');
    const resolvedLocationIds = row.rowData.location_ids
      ? row.rowData.location_ids
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)
          .map((value) => findLocationByValue(value)?.id ?? '')
          .filter(Boolean)
      : resolvedLocation
        ? [resolvedLocation.id]
        : [];
    const resolvedSubUnitIds = row.rowData.sub_unit_ids
      ? row.rowData.sub_unit_ids
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)
          .map((value) => findUnitByValue(value)?.id ?? '')
          .filter(Boolean)
      : [];

    setEditForm({
      name: row.rowData.name || '',
      sku: row.rowData.sku || '',
      barcode: row.rowData.barcode || '',
      unitId: resolvedUnit?.id || '',
      subUnitIds: resolvedSubUnitIds,
      brandId: resolvedBrand?.id || '',
      categoryId: resolvedCategory?.id || '',
      subCategoryId: resolvedSubCategory?.id || '',
      locationIds: resolvedLocationIds,
      allLocations: (row.rowData.all_locations || row.rowData.allLocations || 'false').toLowerCase() !== 'false',
      productType: row.rowData.product_type || 'single',
      unit: row.rowData.unit || resolvedUnit?.name || '',
      brand: row.rowData.brand || resolvedBrand?.name || '',
      categoryCode: row.rowData.category_code || resolvedCategory?.categoryCode || '',
      subCategoryCode: row.rowData.sub_category_code || resolvedSubCategory?.subCategoryCode || '',
      locationCode: row.rowData.location_code || resolvedLocation?.locationCode || '',
      manageStock: (row.rowData.manage_stock || 'true').toLowerCase() !== 'false',
      alertQuantity: row.rowData.alert_quantity || '2',
      isForSelling: (row.rowData.is_for_selling || 'true').toLowerCase() !== 'false',
      taxType: row.rowData.tax_type || 'exclusive',
      taxRate: row.rowData.tax_rate || '16',
      purchasePriceExclusive: row.rowData.purchase_price_exclusive || '',
      purchasePriceInclusive: row.rowData.purchase_price_inclusive || '',
      profitMargin: row.rowData.profit_margin || '',
      defaultPurchasePrice: row.rowData.default_purchase_price || '',
      defaultSellingPrice: row.rowData.default_selling_price || '',
      hasWarranty: (row.rowData.has_warranty || 'false').toLowerCase() === 'true',
      warrantyDuration: row.rowData.warranty_duration || '',
      warrantyPeriod: (row.rowData.warranty_period as 'months' | 'years') || 'months',
      warrantyCoverage: row.rowData.warranty_coverage || '',
      description: row.rowData.description || '',
      brochureName: row.rowData.brochure_name || '',
      brochureUrl: row.rowData.brochure_url || '',
      images: row.rowData.images || '',
    });
  };

  const closeEditRow = () => {
    setEditingRow(null);
    setEditForm(EMPTY_ROW_FORM);
    setEditError(null);
    setEditSaving(false);
    setEditImageFile(null);
    setEditBrochureFile(null);
    setImageUploadError(null);
    setBrochureUploadError(null);
  };

  const handleSaveEditedRow = async () => {
    if (!batch || !editingRow) {
      return;
    }

    setEditSaving(true);
    setEditError(null);

    try {
      const imagesValue = editImageFile ? await fileToDataURL(editImageFile) : editForm.images;
      const brochureValue = editBrochureFile ? await fileToDataURL(editBrochureFile) : editForm.brochureUrl;

      const response = await apiRequest<{ message: string; row: ImportRow; validationErrors: string[] }>(
        `/products/import/batches/${batch.id}/rows/${editingRow.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            productName: editForm.name,
            sku: editForm.sku,
            barcode: editForm.barcode,
            unitId: editForm.unitId,
            subUnitIds: JSON.stringify(editForm.subUnitIds),
            brandId: editForm.brandId,
            categoryId: editForm.categoryId,
            subCategoryId: editForm.subCategoryId,
            locationIds: JSON.stringify(editForm.locationIds),
            allLocations: editForm.allLocations,
            productType: editForm.productType,
            unit: editForm.unit,
            brand: editForm.brand,
            categoryCode: editForm.categoryCode,
            subCategoryCode: editForm.subCategoryCode,
            locationCode: editForm.locationCode,
            manageStock: editForm.manageStock,
            alertQuantity: editForm.alertQuantity,
            isForSelling: editForm.isForSelling,
            taxType: editForm.taxType,
            taxRate: editForm.taxRate,
            purchasePriceExclusive: editForm.purchasePriceExclusive,
            purchasePriceInclusive: editForm.purchasePriceInclusive,
            profitMargin: editForm.profitMargin,
            defaultPurchasePrice: editForm.defaultPurchasePrice,
            defaultSellingPrice: editForm.defaultSellingPrice,
            hasWarranty: editForm.hasWarranty,
            warrantyDuration: editForm.warrantyDuration,
            warrantyPeriod: editForm.warrantyPeriod,
            warrantyCoverage: editForm.warrantyCoverage,
            description: editForm.description,
            brochureName: editBrochureFile ? editBrochureFile.name : editForm.brochureName,
            brochureUrl: brochureValue,
            images: imagesValue,
          }),
        },
      );

      setRows((current) => current.map((item) => (item.id === response.row.id ? response.row : item)));
      if ((response.validationErrors ?? []).length > 0) {
        setEditingRow(response.row);
        toast.success('Row saved, but validation still needs attention');
      } else {
        setEditingRow(null);
        setEditForm(EMPTY_ROW_FORM);
        setEditImageFile(null);
        setEditBrochureFile(null);
        toast.success(response.message || 'Row approved successfully');
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update import row';
      setEditError(message);
      toast.error(message);
    } finally {
      setEditSaving(false);
    }
  };

  const editErrors = useMemo(
    () => ({
      productDetails: editingRow?.validationErrors.filter((error) =>
        /product name|sku|barcode|description/i.test(error),
      ) ?? [],
      classification: editingRow?.validationErrors.filter((error) =>
        /unit|category|sub-category|sub category|brand|location|product type/i.test(error),
      ) ?? [],
      pricing: editingRow?.validationErrors.filter((error) =>
        /stock|alert quantity|tax type|tax rate|purchase price|selling price|selling/i.test(error),
      ) ?? [],
    }),
    [editingRow],
  );

  const handleUpload = useCallback(async (fileToUpload: File) => {
    setErrorMessage(null);

    if (!fileToUpload.name.toLowerCase().endsWith('.csv')) {
      const message = 'Please upload a CSV file.';
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', fileToUpload);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api'}/products/import/preview`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const payload = (await response.json()) as ImportPreviewResponse & { message?: string; errors?: Record<string, string> };

      if (!response.ok) {
        const message = payload?.message || 'Failed to upload product import file';
        throw new ApiError(message, response.status, payload);
      }

      setBatch(payload.batch);
      setRows(payload.rows ?? []);
      toast.success(payload.message || 'Product import preview loaded successfully');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to upload product import file';
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  }, []);

  useEffect(() => {
    void loadLatestBatch();
  }, [loadLatestBatch]);

  useEffect(() => {
    if (!selectedFile) {
      return;
    }

    void handleUpload(selectedFile);
  }, [handleUpload, selectedFile]);

  const handleImportRow = async (rowId: string) => {
    if (!batch) {
      return;
    }

    try {
      await apiRequest(`/products/import/batches/${batch.id}/rows/${rowId}/import`, {
        method: 'POST',
      });
      await refreshBatch(batch.id);
      toast.success('Product imported successfully');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to import product row';
      toast.error(message);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setBatch(null);
    setRows([]);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="sticky top-0 z-20 border-b border-border bg-background/95 py-4 backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-lg p-2 hover:bg-muted/60"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">Import Products</h1>
              <p className="text-sm text-muted-foreground">
                Download the template, stage the rows, then import valid products one by one.
              </p>
            </div>
          </div>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6">
       <SectionCard
          icon={Layers3}
          title="Template Helper"
          description="Open the toggles to review the names and codes you can use in the CSV file."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {templateDetails.map((section) => (
              <div key={section.title} className="rounded-2xl border border-border bg-background">
                <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{section.title}</p>
                    <p className="text-xs text-muted-foreground">{section.lines.length} records available</p>
                  </div>
                  <ToggleSwitch
                    checked={section.enabled}
                    onChange={() => section.setEnabled((current) => !current)}
                    label={section.title}
                  />
                </div>
                {section.enabled ? (
                  <div className="max-h-72 overflow-y-auto p-3">
                    {section.lines.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No records available yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {section.lines.map((item, index) => (
                          <div
                            key={`${section.title}-${index}`}
                            className="inline-flex min-w-fit items-center rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                          >
                            <p className="whitespace-nowrap font-medium">{item.primary}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          icon={Upload}
          title="Upload CSV"
          description="Use the template to stage products before importing them into the catalog."
        >
          <div className="space-y-4">
            <div className=" bg-muted/20 p-6 text-center">
              <FileSpreadsheet className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium text-foreground">Drag and drop your CSV here</p>
              <p className="mt-1 text-xs text-muted-foreground">Only CSV is supported for now. Excel can open the template directly.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  disabled={isDownloading}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Download CSV
                </button>
                <label className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/40">
                  <Upload className="h-4 w-4" />
                  Choose File
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(event) => {
                      const nextFile = event.target.files?.[0] ?? null;
                      setBatch(null);
                      setRows([]);
                      setSelectedFile(nextFile);
                      setErrorMessage(null);
                    }}
                  />
                </label>
              </div>
              {selectedFile ? (
                <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-background px-3 py-2 text-sm text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{selectedFile.name}</span>
                  <span className="text-xs text-muted-foreground">({Math.round(selectedFile.size / 1024)} KB)</span>
                  <button type="button" onClick={clearSelection} className="ml-2 text-xs text-destructive hover:underline">
                    Remove
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </SectionCard>

       
      </div>

      {batch ? (
        <SectionCard
          icon={Shield}
          title="Preview Staging"
          description={`Batch ${batch.fileName} is staged and ready. Fix any invalid rows before importing.`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div className="text-sm text-muted-foreground">
              {rows.length} rows staged
              <span className="mx-2">•</span>
              <span className="font-medium text-foreground">
                {rows.filter((row) => row.status === 'valid' || row.status === 'approved').length}
              </span>{' '}
              ready
              <span className="mx-2">•</span>
              <span className="font-medium text-foreground">{rows.filter((row) => row.status === 'invalid' || row.validationErrors.length > 0).length}</span>{' '}
              need attention
            </div>
            <button
              type="button"
              onClick={() => refreshBatch(batch.id).catch(() => undefined)}
              className="rounded-xl border border-border px-3 py-2 text-sm text-foreground hover:bg-muted/40"
            >
              Refresh Preview
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[1400px] w-full divide-y divide-border">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Row</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Unit</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sub Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Brand</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Location</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">&nbsp;</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background">
                {rows.map((row) => {
                  const data = row.rowData;
                  const canSubmit =
                    (row.status === 'valid' || row.status === 'approved' || row.status === 'previewed' || row.status === 'pending') &&
                    row.validationErrors.length === 0;
                  return (
                    <tr key={row.id} className="align-top hover:bg-muted/10">
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">{row.rowNumber}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">{data.name || 'Unnamed product'}</p>
                        <p className="text-xs text-muted-foreground">
                          SKU: {data.sku || 'auto'}
                          {data.barcode ? ` • Barcode: ${data.barcode}` : ''}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{data.sku || 'auto'}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{data.unit || 'n/a'}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {data.category_code || 'n/a'}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {data.sub_category_code || 'n/a'}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {data.brand || 'n/a'}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{data.location_code || 'n/a'}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-muted-foreground">
                        {stringifyRowValue(data.default_selling_price || data.default_purchase_price || 0)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusPillClass(row.status)}`}>
                          {labelForStatus(row.status)}
                        </span>
                        {row.validationErrors.length > 0 ? (
                          <ul className="mt-2 space-y-1 text-xs text-rose-600">
                            {row.validationErrors.map((error) => (
                              <li key={error}>• {error}</li>
                            ))}
                          </ul>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {row.validationErrors.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => openEditRow(row)}
                              className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/40"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              Update
                            </button>
                          ) : null}
                          <button
                            type="button"
                            disabled={!canSubmit}
                            onClick={() => handleImportRow(row.id)}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {row.status === 'approved' ? 'Submit' : 'Import Row'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      ) : (
        <SectionCard
          icon={AlertCircle}
          title="No staged upload yet"
          description="Upload a CSV to create a temporary preview batch before importing."
        >
          <p className="text-sm text-muted-foreground">
            The staged preview lets the team fix errors first and then import rows one at a time.
          </p>
        </SectionCard>
      )}

      {editingRow ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4">
          <div className="flex h-full w-full max-h-[100vh] flex-col overflow-hidden rounded-2xl bg-background shadow-2xl lg:w-[80vw] lg:max-w-[80vw]">
            <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-4 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Edit staged row #{editingRow.rowNumber}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">
                  {editForm.name || 'Unnamed product'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Update the row data, save it, and the errors will clear once validation passes.
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditRow}
                className="rounded-xl p-2 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
              {editError ? (
                <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  {editError}
                </div>
              ) : null}

              {editingRow.validationErrors.length > 0 ? (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  <p className="font-semibold">Current issues</p>
                  <ul className="mt-2 space-y-1">
                    {editingRow.validationErrors.map((error) => (
                      <li key={error}>• {error}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="grid gap-6">
                <CardGroup title="Basic Information" description="Core identity fields used to find and identify this product." errors={editErrors.productDetails}>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="sm:col-span-2 lg:col-span-2">
                      <FieldLabel>Product Name</FieldLabel>
                      <FieldInput value={editForm.name} onChange={(value) => setEditForm((current) => ({ ...current, name: value }))} />
                    </div>
                    <div>
                      <FieldLabel>SKU</FieldLabel>
                      <FieldInput value={editForm.sku} onChange={(value) => setEditForm((current) => ({ ...current, sku: value }))} />
                    </div>
                    <div>
                      <FieldLabel>Barcode</FieldLabel>
                      <Select
                        instanceId="import-product-barcode"
                        value={barcodeOptions.find((option) => option.value === editForm.barcode) ?? null}
                        onChange={(option) => setEditForm((current) => ({ ...current, barcode: (option as SelectOption | null)?.value ?? '' }))}
                        options={barcodeOptions}
                        styles={selectStyles}
                        placeholder="Select barcode type"
                        isClearable
                      />
                    </div>
                    <div>
                      <FieldLabel>Unit</FieldLabel>
                      <Select
                        instanceId="import-product-unit"
                        value={unitOptions.find((option) => option.value === editForm.unitId) ?? null}
                        onChange={(option) => {
                          const next = option as SelectOption | null;
                          const unit = units.find((item) => item.id === next?.value);
                          setEditForm((current) => ({
                            ...current,
                            unitId: next?.value ?? '',
                            unit: unit ? unit.shortName || unit.name : '',
                            subUnitIds: [],
                          }));
                        }}
                        options={unitOptions}
                        styles={selectStyles}
                        placeholder="Select base unit"
                        isClearable
                        formatOptionLabel={compactOptionLabel}
                      />
                    </div>
                    <div>
                      <FieldLabel>Related Sub Units</FieldLabel>
                      <Select
                        instanceId="import-product-sub-units"
                        value={subUnitOptions.filter((option) => editForm.subUnitIds.includes(option.value))}
                        onChange={(options) =>
                          setEditForm((current) => ({
                            ...current,
                            subUnitIds: ((options as SelectOption[] | null) ?? []).map((option) => option.value),
                          }))
                        }
                        options={subUnitOptions}
                        styles={selectStyles}
                        placeholder={editForm.unitId ? 'Select related sub units' : 'Choose a base unit first'}
                        isMulti
                        isDisabled={!editForm.unitId || subUnitOptions.length === 0}
                        closeMenuOnSelect={false}
                        formatOptionLabel={compactOptionLabel}
                      />
                    </div>
                    <div>
                      <FieldLabel>Brand</FieldLabel>
                      <Select
                        instanceId="import-product-brand"
                        value={brandOptions.find((option) => option.value === editForm.brandId) ?? null}
                        onChange={(option) => {
                          const next = option as SelectOption | null;
                          const brand = brands.find((item) => item.id === next?.value);
                          setEditForm((current) => ({
                            ...current,
                            brandId: next?.value ?? '',
                            brand: brand?.name || '',
                          }));
                        }}
                        options={brandOptions}
                        styles={selectStyles}
                        placeholder="Select brand"
                        isClearable
                        formatOptionLabel={compactOptionLabel}
                      />
                    </div>
                    <div>
                      <FieldLabel>Category</FieldLabel>
                      <Select
                        instanceId="import-product-category"
                        value={categoryOptions.find((option) => option.value === editForm.categoryId) ?? null}
                        onChange={(option) => {
                          const next = option as SelectOption | null;
                          const category = categories.find((item) => item.id === next?.value);
                          setEditForm((current) => ({
                            ...current,
                            categoryId: next?.value ?? '',
                            categoryCode: category?.categoryCode || '',
                            subCategoryId: '',
                            subCategoryCode: '',
                          }));
                        }}
                        options={categoryOptions}
                        styles={selectStyles}
                        placeholder="Select category"
                        isClearable
                        formatOptionLabel={compactOptionLabel}
                      />
                    </div>
                    <div>
                      <FieldLabel>Sub Category</FieldLabel>
                      <Select
                        instanceId="import-product-sub-category"
                        value={subCategoryOptions.find((option) => option.value === editForm.subCategoryId) ?? null}
                        onChange={(option) => {
                          const next = option as SelectOption | null;
                          const subCategory = subCategories.find((item) => item.id === next?.value);
                          setEditForm((current) => ({
                            ...current,
                            subCategoryId: next?.value ?? '',
                            subCategoryCode: subCategory?.subCategoryCode || '',
                          }));
                        }}
                        options={subCategoryOptions}
                        styles={selectStyles}
                        placeholder={editForm.categoryId ? 'Select sub category' : 'Choose a category first'}
                        isClearable
                        isDisabled={!editForm.categoryId}
                        formatOptionLabel={compactOptionLabel}
                      />
                    </div>
                  </div>
                </CardGroup>

                <CardGroup title="Availability" description="Choose which business locations can sell this product." errors={editErrors.classification}>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setEditForm((current) => ({
                          ...current,
                          allLocations: !current.allLocations,
                          locationIds: !current.allLocations ? locations.map((location) => location.id) : [],
                        }))
                      }
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                        editForm.allLocations
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-foreground hover:bg-muted/40'
                      }`}
                    >
                      All Locations
                    </button>
                    <span className="text-xs text-muted-foreground">Toggle this if the product should be available in every business location.</span>
                  </div>
                  <div className="mt-3">
                    <Select
                      instanceId="import-product-locations"
                      value={locationOptions.filter((option) => editForm.locationIds.includes(option.value))}
                      onChange={(options) => {
                        const selectedOptions = (options as SelectOption[] | null) ?? [];
                        const firstLocation = locations.find((location) => location.id === selectedOptions[0]?.value);
                        setEditForm((current) => ({
                          ...current,
                          allLocations: false,
                          locationIds: selectedOptions.map((option) => option.value),
                          locationCode: firstLocation?.locationCode || '',
                        }));
                      }}
                      options={locationOptions}
                      styles={selectStyles}
                      placeholder="Select one or more locations"
                      isMulti
                      closeMenuOnSelect={false}
                      isDisabled={editForm.allLocations}
                      formatOptionLabel={compactOptionLabel}
                    />
                  </div>
                </CardGroup>

                <CardGroup title="Product Type" description="Choose whether this item is sold alone, as a bundle, or as a configurable variant product.">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {['single', 'combo', 'variable'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setEditForm((current) => ({ ...current, productType: type }))}
                        className={`rounded-lg border-2 px-4 py-3 text-left text-sm font-medium transition-colors ${
                          editForm.productType === type
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <span className="block capitalize">{type}</span>
                        <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                          {type === 'single'
                            ? 'One product, one SKU'
                            : type === 'combo'
                              ? 'Bundle of other products'
                              : 'Multiple size/colour variants'}
                        </span>
                      </button>
                    ))}
                  </div>
                  {editForm.productType === 'single' ? (
                    <div className="mt-6 rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">Single product</p>
                      <p className="mt-1">Use this for individual stock items like a laptop, a bottle of juice, or a packet of flour.</p>
                    </div>
                  ) : null}
                  {editForm.productType === 'combo' ? (
                    <div className="mt-6 rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">Combo / Bundle</p>
                      <p className="mt-1">Use this when you want to sell one product made up of multiple single products.</p>
                    </div>
                  ) : null}
                  {editForm.productType === 'variable' ? (
                    <div className="mt-6 rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">Variable product</p>
                      <p className="mt-1">Use this when one product has multiple sellable versions, such as different sizes or colors.</p>
                    </div>
                  ) : null}
                </CardGroup>

                {editForm.productType === 'single' ? (
                  <CardGroup title="Pricing & Tax" description="Set purchase cost, tax handling, and how the selling price is derived." errors={editErrors.pricing}>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
                        <div>
                          <p className="text-sm font-medium text-foreground">Product is for Selling</p>
                          <p className="text-xs text-muted-foreground">Enable if this product can be sold to customers</p>
                        </div>
                        <ToggleSwitch checked={editForm.isForSelling} onChange={() => setEditForm((current) => ({ ...current, isForSelling: !current.isForSelling }))} label="Toggle product for selling" />
                      </div>
                      <div>
                        <FieldLabel>Tax Type</FieldLabel>
                      <Select
                        instanceId="import-product-tax-type"
                        value={
                          [
                            { value: 'exclusive', label: 'Exclusive of Tax' },
                            { value: 'inclusive', label: 'Inclusive of Tax' },
                            { value: 'none', label: 'No Tax' },
                          ].find((option) => option.value === editForm.taxType) ?? null
                        }
                        onChange={(option) => setEditForm((current) => ({ ...current, taxType: (option as SelectOption | null)?.value ?? 'exclusive' }))}
                        options={[
                          { value: 'exclusive', label: 'Exclusive of Tax' },
                          { value: 'inclusive', label: 'Inclusive of Tax' },
                          { value: 'none', label: 'No Tax' },
                        ]}
                        styles={selectStyles}
                        placeholder="Select tax type"
                        isClearable
                        formatOptionLabel={compactOptionLabel}
                      />
                      </div>
                      <div>
                        <FieldLabel>Tax Rate (%)</FieldLabel>
                        <FieldInput value={editForm.taxRate} onChange={(value) => setEditForm((current) => ({ ...current, taxRate: value }))} />
                      </div>
                      <div>
                        <FieldLabel>Default Purchase Price</FieldLabel>
                        <FieldInput value={editForm.defaultPurchasePrice} onChange={(value) => setEditForm((current) => ({ ...current, defaultPurchasePrice: value }))} />
                      </div>
                      <div>
                        <FieldLabel>Purchase Price (Exclusive)</FieldLabel>
                        <FieldInput value={editForm.purchasePriceExclusive} onChange={(value) => setEditForm((current) => ({ ...current, purchasePriceExclusive: value }))} />
                      </div>
                      <div>
                        <FieldLabel>Purchase Price (Inclusive)</FieldLabel>
                        <FieldInput value={editForm.purchasePriceInclusive} onChange={(value) => setEditForm((current) => ({ ...current, purchasePriceInclusive: value }))} />
                      </div>
                      <div>
                        <FieldLabel>Profit Margin (%)</FieldLabel>
                        <FieldInput value={editForm.profitMargin} onChange={(value) => setEditForm((current) => ({ ...current, profitMargin: value }))} />
                      </div>
                      <div>
                        <FieldLabel>Default Selling Price</FieldLabel>
                        <FieldInput value={editForm.defaultSellingPrice} onChange={(value) => setEditForm((current) => ({ ...current, defaultSellingPrice: value }))} />
                      </div>
                    </div>
                  </CardGroup>
                ) : null}

                <CardGroup title="Inventory & Warranty" description="Stock tracking, low-stock alerts, and warranty terms.">
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">Manage Stock</p>
                        <p className="text-xs text-muted-foreground">Enable stock tracking for this product</p>
                      </div>
                      <ToggleSwitch checked={editForm.manageStock} onChange={() => setEditForm((current) => ({ ...current, manageStock: !current.manageStock }))} label="Toggle stock management" />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">Warranty</p>
                        <p className="text-xs text-muted-foreground">Enable warranty for this product</p>
                      </div>
                      <ToggleSwitch checked={editForm.hasWarranty} onChange={() => setEditForm((current) => ({ ...current, hasWarranty: !current.hasWarranty }))} label="Toggle warranty" />
                    </div>
                  </div>

                  {editForm.manageStock ? (
                    <div className="mt-5 max-w-sm">
                      <FieldLabel>Alert Quantity</FieldLabel>
                      <FieldInput value={editForm.alertQuantity} onChange={(value) => setEditForm((current) => ({ ...current, alertQuantity: value }))} />
                    </div>
                  ) : null}

                  {editForm.hasWarranty ? (
                    <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div>
                        <FieldLabel>Duration</FieldLabel>
                        <FieldInput value={editForm.warrantyDuration} onChange={(value) => setEditForm((current) => ({ ...current, warrantyDuration: value }))} />
                      </div>
                      <div>
                        <FieldLabel>Period</FieldLabel>
                        <Select
                          instanceId="import-product-warranty-period"
                          value={
                            [
                              { value: 'months', label: 'Months' },
                              { value: 'years', label: 'Years' },
                            ].find((option) => option.value === editForm.warrantyPeriod) ?? null
                          }
                          onChange={(option) =>
                            setEditForm((current) => ({
                              ...current,
                              warrantyPeriod: (option as SelectOption | null)?.value === 'years' ? 'years' : 'months',
                            }))
                          }
                          options={[
                            { value: 'months', label: 'Months' },
                            { value: 'years', label: 'Years' },
                          ]}
                          styles={selectStyles}
                          placeholder="Select period"
                          isClearable
                          formatOptionLabel={compactOptionLabel}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <FieldLabel>Warranty Coverage</FieldLabel>
                        <FieldInput value={editForm.warrantyCoverage} onChange={(value) => setEditForm((current) => ({ ...current, warrantyCoverage: value }))} textarea />
                      </div>
                    </div>
                  ) : null}
                </CardGroup>

                <CardGroup title="Description & Media" description="Details, photos, and documents shown to customers and staff.">
                  <div className="grid grid-cols-1 gap-5">
                    <div>
                      <FieldLabel>Description</FieldLabel>
                      <div className="mt-2 overflow-hidden rounded-xl border border-border bg-background outline-none focus-within:ring-1 focus-within:ring-primary">
                        <CKEditor
                          editor={ClassicEditor}
                          data={editForm.description}
                          config={{
                            licenseKey: 'GPL',
                            plugins: [Essentials, Paragraph, Heading, Bold, Italic, Link, List, BlockQuote, Undo],
                            toolbar: ['undo', 'redo', '|', 'heading', '|', 'bold', 'italic', 'link', '|', 'bulletedList', 'numberedList', 'blockQuote'],
                            placeholder: 'Enter product description...',
                          }}
                          onChange={(_, editor) => {
                            setEditForm((current) => ({ ...current, description: editor.getData() }));
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <FieldLabel>Product Image</FieldLabel>
                      <div className="mt-2 rounded-xl border border-dashed border-border bg-muted/20 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="text-sm text-muted-foreground">
                            {editImageFile ? (
                              <>
                                Selected file: <span className="font-medium text-foreground">{editImageFile.name}</span>
                              </>
                            ) : editForm.images ? (
                              <span>Current image is already saved for this staged row.</span>
                            ) : (
                              <span>Upload a product image to attach it to the staged row.</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                            className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/50"
                          >
                            Choose Image
                          </button>
                        </div>
                        <input
                          ref={imageInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(event) => {
                            handleEditImageUpload(event.target.files?.[0] ?? null);
                            event.target.value = '';
                          }}
                        />
                        {imageUploadError ? <p className="mt-2 text-xs text-destructive">{imageUploadError}</p> : null}
                      </div>
                    </div>
                    <div>
                      <FieldLabel>Brochure File</FieldLabel>
                      <div className="mt-2 rounded-xl border border-dashed border-border bg-muted/20 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="text-sm text-muted-foreground">
                            {editBrochureFile ? (
                              <>
                                Selected file: <span className="font-medium text-foreground">{editBrochureFile.name}</span>
                              </>
                            ) : editForm.brochureUrl ? (
                              <span>Current brochure is already saved for this staged row.</span>
                            ) : (
                              <span>Upload a brochure file to attach it to the staged row.</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => brochureInputRef.current?.click()}
                            className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/50"
                          >
                            Choose Brochure
                          </button>
                        </div>
                        <input
                          ref={brochureInputRef}
                          type="file"
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                          onChange={(event) => {
                            handleEditBrochureUpload(event.target.files?.[0] ?? null);
                            event.target.value = '';
                          }}
                        />
                        {brochureUploadError ? <p className="mt-2 text-xs text-destructive">{brochureUploadError}</p> : null}
                      </div>
                    </div>
                    <div>
                      <FieldLabel>Brochure Name</FieldLabel>
                      <FieldInput value={editForm.brochureName} onChange={(value) => setEditForm((current) => ({ ...current, brochureName: value }))} />
                    </div>
                  </div>
                </CardGroup>

                <CardGroup title="Status Summary" description="Validation updates after saving the row.">
                  <div className="rounded-xl border border-border bg-muted/20 p-3 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">Current status</p>
                    <p className="mt-1">{labelForStatus(editingRow.status)}</p>
                    <p className="mt-3 text-xs">After you save, this record is re-validated and marked error-free if all required values are valid.</p>
                  </div>
                </CardGroup>
              </div>
            </div>

            <div className="border-t border-border px-4 py-4 sm:px-6">
              <div className="flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEditRow}
                  className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/40"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditedRow}
                  disabled={editSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {editSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}

function CardGroup({
  title,
  description,
  errors,
  children,
}: {
  title: string;
  description?: string;
  errors?: string[];
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
        {errors && errors.length > 0 ? (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            <p className="font-semibold">Needs attention</p>
            <ul className="mt-1 space-y-1">
              {errors.map((error) => (
                <li key={error}>• {error}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}

function FieldInput({
  value,
  onChange,
  textarea,
}: {
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
}) {
  return (
    <label className="space-y-1.5">
      {textarea ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      )}
    </label>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{children}</span>;
}

 
