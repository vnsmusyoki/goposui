import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Select, { type StylesConfig } from 'react-select';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Save,
  Check,
  AlertCircle,
  FolderTree,
  Hash,
  Upload,
  Image as ImageIcon,
  Info,
  CheckCircle,
  Loader2,
  Star,
  Search,
} from 'lucide-react';
import { type CategoryItem, useCategories } from '@/hooks/business/categories/useCategories';
import { useSubCategories } from '@/hooks/business/subcategories/useSubCategories';

type FormError = {
  field: string;
  message: string;
};

type SubCategoryFormData = {
  name: string;
  categoryCode: string;
  description: string;
  parentCategoryId: string;
  active: boolean;
  featured: boolean;
  sortOrder: number;
  metaTitle: string;
  metaDescription: string;
  imageUrl: string;
  imageName: string;
  imageSize: number;
};

type SelectOption = {
  value: string;
  label: string;
  category: CategoryItem;
};

const MAX_CATEGORY_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_CATEGORY_IMAGE_TYPES = new Set(['image/png', 'image/jpeg']);

const selectStyles: StylesConfig<SelectOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: 40,
    borderRadius: 8,
    borderColor: 'hsl(var(--border))',
    backgroundColor: 'hsl(var(--background))',
    boxShadow: state.isFocused ? '0 0 0 2px hsl(var(--primary) / 0.2)' : 'none',
    outline: 'none',
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

function formatFileSize(bytes: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readBlobAsDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('Unable to process the selected image.'));
    };
    reader.onerror = () => reject(new Error('Unable to process the selected image.'));
    reader.readAsDataURL(blob);
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Unable to read the selected image.'));
    };

    image.src = objectUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Unable to process the selected image.'));
          return;
        }
        resolve(blob);
      },
      'image/jpeg',
      quality,
    );
  });
}

async function compressCategoryImage(file: File): Promise<{ imageUrl: string; imageSize: number }> {
  if (!ALLOWED_CATEGORY_IMAGE_TYPES.has(file.type)) {
    throw new Error('Only PNG and JPEG images are allowed.');
  }

  const image = await loadImage(file);
  let width = image.naturalWidth || image.width;
  let height = image.naturalHeight || image.height;
  const maxDimension = 1600;

  if (width <= 0 || height <= 0) {
    throw new Error('Unable to read the selected image.');
  }

  const scale = Math.min(1, maxDimension / Math.max(width, height));
  width = Math.max(1, Math.round(width * scale));
  height = Math.max(1, Math.round(height * scale));

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Unable to process the selected image.');
    }

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    for (const quality of [0.85, 0.75, 0.65, 0.55, 0.45]) {
      const blob = await canvasToBlob(canvas, quality);
      if (blob.size <= MAX_CATEGORY_IMAGE_BYTES) {
        return {
          imageUrl: await readBlobAsDataURL(blob),
          imageSize: blob.size,
        };
      }
    }

    width = Math.max(1, Math.floor(width * 0.8));
    height = Math.max(1, Math.floor(height * 0.8));
  }

  throw new Error('Image must be smaller than 5 MB after compression.');
}

const FormInput = ({
  label,
  id,
  type = 'text',
  min,
  inputMode,
  value,
  onChange,
  error,
  required = false,
  placeholder = '',
  helpText = '',
  icon: Icon,
  disabled = false,
}: {
  label: string;
  id: string;
  type?: string;
  min?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="text-sm font-medium text-foreground">
      {label}
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />}
      <input
        id={id}
        type={type}
        min={min}
        inputMode={inputMode}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 ${
          Icon ? 'pl-9' : ''
        } ${error ? 'border-destructive focus:border-destructive' : 'border-border'}`}
      />
    </div>
    {error && (
      <p className="flex items-center gap-1 text-xs text-destructive">
        <AlertCircle className="h-3 w-3" />
        {error}
      </p>
    )}
    {helpText && !error && <p className="text-xs text-muted-foreground">{helpText}</p>}
  </div>
);

const FormTextarea = ({
  label,
  id,
  value,
  onChange,
  error,
  required = false,
  placeholder = '',
  rows = 3,
  helpText = '',
}: {
  label: string;
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  helpText?: string;
}) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="text-sm font-medium text-foreground">
      {label}
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </label>
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 ${
        error ? 'border-destructive focus:border-destructive' : 'border-border'
      }`}
    />
    {error && (
      <p className="flex items-center gap-1 text-xs text-destructive">
        <AlertCircle className="h-3 w-3" />
        {error}
      </p>
    )}
    {helpText && !error && <p className="text-xs text-muted-foreground">{helpText}</p>}
  </div>
);

const ToggleSwitch = ({
  label,
  checked,
  onChange,
  description = '',
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}) => (
  <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background px-4 py-3">
    <div className="min-w-0">
      <p className="text-sm font-medium text-foreground">{label}</p>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors ${
        checked ? 'bg-primary' : 'bg-muted'
      }`}
    >
      <span
        className={`pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-md ring-0 transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
);

const categoryOptionLabel = (option: SelectOption) => (
  <div className="flex flex-col">
    <span className="font-medium">{option.label}</span>
    <span className="text-xs text-muted-foreground">{option.category.description || 'No description available'}</span>
  </div>
);

export default function EditSubCategory() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const { categories, fetchCategories } = useCategories();
  const { subCategories, fetchSubCategories, updateSubCategory } = useSubCategories();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormError[]>([]);
  const [formData, setFormData] = useState<SubCategoryFormData>({
    name: '',
    categoryCode: '',
    description: '',
    parentCategoryId: '',
    active: true,
    featured: false,
    sortOrder: 0,
    metaTitle: '',
    metaDescription: '',
    imageUrl: '',
    imageName: '',
    imageSize: 0,
  });
  const [isDraggingImage, setIsDraggingImage] = useState(false);

  useEffect(() => {
    void fetchCategories();
    void fetchSubCategories();
  }, [fetchCategories, fetchSubCategories]);

  useEffect(() => {
    if (!id) return;
    const existing = subCategories.find((item) => item.id === id);
    if (!existing) return;

    setFormData((prev) => ({
      ...prev,
      name: existing.name,
      categoryCode: existing.subCategoryCode,
      description: existing.description,
      parentCategoryId: existing.parentCategoryId,
      active: existing.active,
      featured: existing.featured,
      sortOrder: existing.sortOrder,
      metaTitle: existing.metadata?.metaTitle ?? '',
      metaDescription: existing.metadata?.metaDescription ?? '',
      imageUrl: '',
      imageName: '',
      imageSize: 0,
    }));
  }, [id, subCategories]);

  const parentOptions = useMemo<SelectOption[]>(() => {
    return categories.map((category) => ({
      value: category.id,
      label: category.name,
      category,
    }));
  }, [categories]);

  const selectedParent = useMemo(
    () => categories.find((category) => category.id === formData.parentCategoryId) ?? null,
    [categories, formData.parentCategoryId],
  );

  const getError = (field: string) => errors.find((error) => error.field === field)?.message;

  const handleChange = <K extends keyof SubCategoryFormData>(field: K, value: SubCategoryFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => prev.filter((error) => error.field !== field && error.field !== 'form'));
  };

  const validateForm = (): FormError[] => {
    const newErrors: FormError[] = [];

    if (!formData.name.trim()) {
      newErrors.push({ field: 'name', message: 'Sub-category name is required.' });
    }

    if (!formData.categoryCode.trim()) {
      newErrors.push({ field: 'categoryCode', message: 'Sub-category code is required.' });
    }

    if (!formData.parentCategoryId) {
      newErrors.push({ field: 'parentCategoryId', message: 'Please select a parent category.' });
    }

    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      const firstError = validationErrors[0];
      const element = document.getElementById(firstError.field);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
      return;
    }

    setIsSubmitting(true);
    try {
      if (!id) {
        toast.error('Sub-category id is missing.');
        return;
      }

      const response = await updateSubCategory(id, {
        name: formData.name.trim(),
        subCategoryCode: formData.categoryCode.trim(),
        description: formData.description.trim(),
        parentCategoryId: formData.parentCategoryId,
        active: formData.active,
        featured: formData.featured,
        sortOrder: formData.sortOrder,
        metaTitle: formData.metaTitle.trim(),
        metaDescription: formData.metaDescription.trim(),
        imageUrl: formData.imageUrl,
      });
      toast.success(response.message || 'Sub-category updated successfully.');
      navigate('/products/sub-categories');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save sub-category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyImageFile = async (file: File) => {
    if (!ALLOWED_CATEGORY_IMAGE_TYPES.has(file.type)) {
      setErrors((prev) => [
        ...prev.filter((error) => error.field !== 'imageUrl'),
        { field: 'imageUrl', message: 'Only PNG and JPEG images are allowed.' },
      ]);
      return;
    }

    setErrors((prev) => prev.filter((error) => error.field !== 'imageUrl'));

    try {
      const compressed = await compressCategoryImage(file);
      handleChange('imageUrl', compressed.imageUrl);
      handleChange('imageName', file.name);
      handleChange('imageSize', compressed.imageSize);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to process the selected image.';
      setErrors((prev) => [
        ...prev.filter((entry) => entry.field !== 'imageUrl'),
        { field: 'imageUrl', message },
      ]);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await applyImageFile(file);
    event.target.value = '';
  };

  const handleImageDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingImage(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    await applyImageFile(file);
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({
      ...prev,
      imageUrl: '',
      imageName: '',
      imageSize: 0,
    }));
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const summaryErrors = errors.length > 0 ? errors : [];

  return (
    <div className="min-h-screen bg-background">
      

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/products/sub-categories')}
            className="rounded-lg p-2 transition-colors hover:bg-surface-alt"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <FolderTree className="h-6 w-6 text-primary" />
              Create New Sub-Category
            </h1>
            <p className="text-sm text-muted-foreground">
              Add a new sub-category under an existing parent category
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-alt"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="sub-category-form"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Create Sub-Category
              </>
            )}
          </button>
        </div>
      </div>

      {summaryErrors.length > 0 && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm dark:border-red-900 dark:bg-red-950/30">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-red-100 p-2 text-red-700 dark:bg-red-900/40 dark:text-red-300">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-red-900 dark:text-red-200">
                Please fix the following issues
              </h2>
              <p className="mt-1 text-xs text-red-800 dark:text-red-300">
                We could not save the sub-category because one or more fields need attention.
              </p>
              <ul className="mt-3 space-y-2 text-sm text-red-800 dark:text-red-200">
                {summaryErrors.map((error, index) => (
                  <li key={`${error.field}-${index}`} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                    <span>{error.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <form id="sub-category-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-foreground">Select Parent Category</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose the parent category this sub-category will belong to.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Parent Category <span className="ml-0.5 text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Select<SelectOption, false>
                      instanceId="parent-category-select"
                      isSearchable
                      isClearable
                      options={parentOptions}
                      value={parentOptions.find((option) => option.value === formData.parentCategoryId) ?? null}
                      onChange={(option) => handleChange('parentCategoryId', option?.value ?? '')}
                      styles={selectStyles}
                      placeholder="Search and select a parent category"
                      formatOptionLabel={categoryOptionLabel}
                      className="pl-8"
                    />
                  </div>
                  {getError('parentCategoryId') && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      {getError('parentCategoryId')}
                    </p>
                  )}
                </div>

                {selectedParent && (
                  <div className="rounded-lg border border-border bg-surface-alt/50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-primary/10 p-2 text-primary">
                        <FolderTree className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-foreground">{selectedParent.name}</p>
                          {selectedParent.active ? (
                            <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs text-success">
                              Active
                            </span>
                          ) : (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {selectedParent.description || 'No description available.'}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                          <span>{selectedParent.productCount} products</span>
                          <span>{selectedParent.subCategories.length} sub-categories</span>
                          <span>Code: {selectedParent.categoryCode || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Basic Information</h2>
              <div className="space-y-4">
                <FormInput
                  id="name"
                  label="Sub-Category Name"
                  value={formData.name}
                  onChange={(event) => handleChange('name', event.target.value)}
                  error={getError('name')}
                  required
                  placeholder="e.g. Soft Drinks"
                />
                <FormInput
                  id="categoryCode"
                  label="Sub-Category Code"
                  value={formData.categoryCode}
                  onChange={(event) => handleChange('categoryCode', event.target.value)}
                  error={getError('categoryCode')}
                  required
                  placeholder="e.g. SUB-001"
                  icon={Hash}
                  helpText="Use a unique code for quick lookups and reporting."
                />
                <FormTextarea
                  id="description"
                  label="Description"
                  value={formData.description}
                  onChange={(event) => handleChange('description', event.target.value)}
                  placeholder="Describe what products belong in this sub-category..."
                  rows={3}
                />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground">SEO Information</h2>
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                    Optional
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add SEO metadata to improve how this sub-category appears in search results.
                </p>
              </div>
              <div className="space-y-4">
                <FormInput
                  id="metaTitle"
                  label="Meta Title"
                  value={formData.metaTitle}
                  onChange={(event) => handleChange('metaTitle', event.target.value)}
                  placeholder="SEO title for search engines"
                  helpText="Recommended: 50-60 characters"
                />
                <FormTextarea
                  id="metaDescription"
                  label="Meta Description"
                  value={formData.metaDescription}
                  onChange={(event) => handleChange('metaDescription', event.target.value)}
                  placeholder="SEO description for search engines"
                  rows={2}
                  helpText="Recommended: 150-160 characters"
                />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground">Sub-Category Image</h2>
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                    Optional
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upload an image to give this sub-category a more visual identity.
                </p>
              </div>
              <div
                className={`cursor-pointer rounded-xl border-2 border-dashed p-5 transition-all ${
                  isDraggingImage
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-background hover:border-primary/60 hover:bg-muted/30'
                }`}
                onClick={() => imageInputRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDraggingImage(true);
                }}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setIsDraggingImage(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setIsDraggingImage(false);
                }}
                onDrop={handleImageDrop}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    imageInputRef.current?.click();
                  }
                }}
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                  <div className="flex h-36 w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-card lg:h-40 lg:w-40">
                    {formData.imageUrl ? (
                      <img
                        src={formData.imageUrl}
                        alt="Sub-category preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 px-4 text-center text-muted-foreground">
                        <div className="rounded-full bg-muted p-3">
                          <ImageIcon className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Drop an image here</p>
                          <p className="text-xs text-muted-foreground">Or click to browse from your device</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Upload image</p>
                      <p className="text-sm text-muted-foreground">
                        PNG or JPG only. Image uploaded should not exceed 5 MB.
                      </p>
                    </div>

                    {formData.imageUrl ? (
                      <div className="rounded-lg border border-border bg-muted/30 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {formData.imageName || 'Selected image'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(formData.imageSize) || 'Preview ready'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleRemoveImage();
                            }}
                            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-background"
                          >
                            Remove image
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-border bg-muted/20 p-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-primary/10 p-2 text-primary">
                            <Upload className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">Click to choose a file</p>
                            <p className="text-xs text-muted-foreground">
                              The uploaded image preview will appear here.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          imageInputRef.current?.click();
                        }}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        <Upload className="h-4 w-4" />
                        Select image
                      </button>

                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                        className="hidden"
                        onChange={handleImageUpload}
                      />

                      {formData.imageUrl && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleRemoveImage();
                          }}
                          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                          Clear selection
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {getError('imageUrl') && (
                <p className="mt-3 flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  {getError('imageUrl')}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Status</h2>
              <div className="space-y-4">
                <ToggleSwitch
                  label="Active"
                  checked={formData.active}
                  onChange={(checked) => handleChange('active', checked)}
                  description="Active sub-categories are visible in the store"
                />
                <ToggleSwitch
                  label="Featured"
                  checked={formData.featured}
                  onChange={(checked) => handleChange('featured', checked)}
                  description="Featured sub-categories appear prominently"
                />
                <div className="border-t border-border pt-4">
                  <FormInput
                    id="sortOrder"
                    label="Sort Order"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={String(formData.sortOrder)}
                    onChange={(event) => handleChange('sortOrder', Math.max(0, parseInt(event.target.value, 10) || 0))}
                    helpText="Lower numbers appear first"
                    icon={Hash}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Preview</h2>
              <div className="rounded-lg border border-border bg-surface-alt p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <FolderTree className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">
                      {formData.name || 'Sub-Category Name'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formData.description || 'Sub-category description...'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {formData.active ? (
                      <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs text-success">Active</span>
                    ) : (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        Inactive
                      </span>
                    )}
                    {formData.featured && <Star className="h-3 w-3 fill-warning text-warning" />}
                  </div>
                </div>
                {selectedParent && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <FolderTree className="h-3 w-3" />
                    <span>Parent: {selectedParent.name}</span>
                  </div>
                )}
                <div className="mt-2 text-xs text-muted-foreground">
                  <p>Code: {formData.categoryCode || 'not set'}</p>
                  <p>Sort Order: {formData.sortOrder}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Need Help?</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 text-primary" />
                  <p>Sub-categories help organize products within parent categories</p>
                </div>
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 text-primary" />
                  <p>Products can be assigned to sub-categories for better filtering</p>
                </div>
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 text-primary" />
                  <p>Each sub-category must belong to a parent category</p>
                </div>
                {selectedParent && (
                  <div className="mt-3 rounded-lg border border-primary/10 bg-primary/5 p-3">
                    <p className="text-xs text-foreground">
                      <span className="font-medium">Selected Parent:</span> {selectedParent.name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      This sub-category will be created under {selectedParent.name}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
