import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Select, { type SingleValue, type StylesConfig } from 'react-select';
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
} from 'lucide-react';

// ===================== TYPES =====================

type CategoryFormData = {
  name: string;
  description: string;
  parentId: string | null;
  active: boolean;
  featured: boolean;
  sortOrder: number;
  metaTitle: string;
  metaDescription: string;
  imageUrl: string;
  imageName: string;
  imageSize: number;
};

type FormError = {
  field: string;
  message: string;
};

type SelectOption<T extends string> = {
  value: T;
  label: string;
};

// ===================== CONSTANTS =====================

const PARENT_CATEGORIES = [
  { id: '', name: 'None (Top Level)' },
  { id: 'cat_001', name: 'Cereals & Grains' },
  { id: 'cat_002', name: 'Beverages' },
  { id: 'cat_003', name: 'Household Supplies' },
  { id: 'cat_004', name: 'Snacks & Confectionery' },
  { id: 'cat_005', name: 'Personal Care' },
];

const parentCategoryOptions: SelectOption<string>[] = PARENT_CATEGORIES.map((category) => ({
  value: category.id,
  label: category.name,
}));

const selectStyles: StylesConfig<SelectOption<string>, false> = {
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

function formatFileSize(bytes: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ===================== COMPONENTS =====================

// Form Input Component
const FormInput = ({ 
  label, 
  id, 
  type = 'text', 
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
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}) => {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed ${
            Icon ? 'pl-9' : ''
          } ${error ? 'border-destructive focus:border-destructive' : 'border-border'}`}
        />
      </div>
      {error && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
      {helpText && !error && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}
    </div>
  );
};

// Form Textarea Component
const FormTextarea = ({
  label,
  id,
  value,
  onChange,
  error,
  required = false,
  placeholder = '',
  rows = 3,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  rows?: number;
}) => {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={`w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed ${
          error ? 'border-destructive focus:border-destructive' : 'border-border'
        }`}
      />
      {error && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
};

// Form Select Component
const FormSelect = ({
  label,
  id,
  value,
  onChange,
  options,
  error,
  required = false,
  placeholder = 'Select...',
}: {
  label: string;
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { id: string; name: string }[];
  error?: string;
  required?: boolean;
  placeholder?: string;
}) => {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <select
        id={id}
        value={value}
        onChange={onChange}
        className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed ${
          error ? 'border-destructive focus:border-destructive' : 'border-border'
        }`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
      {error && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
};

// Toggle Switch Component
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
}) => {
  return (
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
};

// ===================== MAIN COMPONENT =====================

export default function CreateBusinessCategory() {
  const navigate = useNavigate();
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<FormError[]>([]);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    parentId: null,
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

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormError[] = [];

    if (!formData.name.trim()) {
      newErrors.push({ field: 'name', message: 'Category name is required' });
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to first error
      const firstError = errors[0];
      const element = document.getElementById(firstError.field);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Category data:', formData);
      setIsSuccess(true);
      
      // Redirect after success
      setTimeout(() => {
        navigate('/inventory/categories');
      }, 2000);
    } catch (error) {
      console.error('Error creating category:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle field change
  const handleChange = (field: keyof CategoryFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    setErrors(prev => prev.filter(err => err.field !== field));
  };

  const handleImagePick = () => {
    imageInputRef.current?.click();
  };

  const applyImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrors((prev) => [
        ...prev.filter((err) => err.field !== 'imageUrl'),
        { field: 'imageUrl', message: 'Please choose an image file' },
      ]);
      return;
    }

    setErrors((prev) => prev.filter((err) => err.field !== 'imageUrl'));

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormData((prev) => ({
          ...prev,
          imageUrl: reader.result as string,
          imageName: file.name,
          imageSize: file.size,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    applyImageFile(file);
    event.target.value = '';
  };

  const handleImageDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingImage(false);

    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    applyImageFile(file);
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

  // Get error for field
  const getError = (field: string): string | undefined => {
    return errors.find(err => err.field === field)?.message;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ===== HEADER ===== */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="rounded-lg p-2 transition-colors hover:bg-surface-alt"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
                <FolderTree className="w-6 h-6 text-primary" />
                Create New Category
              </h1>
              <p className="text-sm text-muted-foreground">
                Add a new product category to organize your inventory
              </p>
            </div>
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
            form="category-form"
            disabled={isSubmitting || isSuccess}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : isSuccess ? (
              <>
                <Check className="w-4 h-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Category
              </>
            )}
          </button>
        </div>
      </div>

      {/* ===== SUCCESS BANNER ===== */}
      {isSuccess && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-300">
                Category created successfully!
              </p>
              <p className="text-sm text-green-700 dark:text-green-400">
                Redirecting to categories list...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ===== FORM ===== */}
      <form id="category-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ===== MAIN COLUMN ===== */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information Card */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Basic Information</h2>
              <div className="space-y-4">
                <FormInput
                  id="name"
                  label="Category Name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  error={getError('name')}
                  required
                  placeholder="e.g., Organic Products"
                />

                <FormTextarea
                  id="description"
                  label="Description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Describe what products belong in this category..."
                  rows={3}
                />

                <div className="space-y-1.5">
                  <label htmlFor="parentId" className="text-sm font-medium text-foreground">
                    Parent Category
                  </label>
                  <Select<SelectOption<string>, false>
                    inputId="parentId"
                    instanceId="parentId"
                    isSearchable
                    isClearable={false}
                    options={parentCategoryOptions}
                    value={parentCategoryOptions.find((option) => option.value === (formData.parentId ?? '')) ?? parentCategoryOptions[0]}
                    onChange={(option: SingleValue<SelectOption<string>>) => {
                      handleChange('parentId', option?.value || null);
                    }}
                    styles={selectStyles}
                    placeholder="None (Top Level)"
                  />
                </div>
              </div>
            </div>

            {/* SEO Information Card */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-foreground">SEO Information</h2>
              <div className="space-y-4">
                <FormInput
                  id="metaTitle"
                  label="Meta Title"
                  value={formData.metaTitle}
                  onChange={(e) => handleChange('metaTitle', e.target.value)}
                  placeholder="SEO title for search engines"
                  helpText="Recommended: 50-60 characters"
                />

                <FormTextarea
                  id="metaDescription"
                  label="Meta Description"
                value={formData.metaDescription}
                onChange={(e) => handleChange('metaDescription', e.target.value)}
                placeholder="SEO description for search engines"
                rows={2}
              />
              </div>
            </div>

            {/* Category Image Card */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Category Image</h2>
              <div
                className={`cursor-pointer rounded-xl border-2 border-dashed p-5 transition-all ${
                  isDraggingImage
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-background hover:border-primary/60 hover:bg-muted/30'
                }`}
                onClick={handleImagePick}
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
                    handleImagePick();
                  }
                }}
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                  <div className="flex h-36 w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-card lg:h-40 lg:w-40">
                    {formData.imageUrl ? (
                      <img
                        src={formData.imageUrl}
                        alt="Category preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 px-4 text-center text-muted-foreground">
                        <div className="rounded-full bg-muted p-3">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Drop an image here
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Or click to browse from your device
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Upload image</p>
                      <p className="text-sm text-muted-foreground">
                        PNG, JPG, GIF or WebP. Keep it crisp for the category card.
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
                            <p className="text-sm font-medium text-foreground">
                              Click to choose a file
                            </p>
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
                          handleImagePick();
                        }}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        <Upload className="w-4 h-4" />
                        Select image
                      </button>

                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
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
            </div>
          </div>

          {/* ===== SIDEBAR ===== */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Status</h2>
              <div className="space-y-4">
                <ToggleSwitch
                  label="Active"
                  checked={formData.active}
                  onChange={(checked) => handleChange('active', checked)}
                  description="Active categories are visible in the store"
                />

                <ToggleSwitch
                  label="Featured"
                  checked={formData.featured}
                  onChange={(checked) => handleChange('featured', checked)}
                  description="Featured categories appear prominently"
                />

                <div className="pt-4 border-t border-border">
                  <FormInput
                    id="sortOrder"
                    label="Sort Order"
                    type="number"
                    value={String(formData.sortOrder)}
                    onChange={(e) => handleChange('sortOrder', parseInt(e.target.value) || 0)}
                    helpText="Lower numbers appear first"
                    icon={Hash}
                  />
                </div>
              </div>
            </div>

            {/* Preview Card */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Preview</h2>
              <div className="rounded-lg border border-border bg-surface-alt p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <FolderTree className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">
                      {formData.name || 'Category Name'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formData.description || 'Category description...'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {formData.active ? (
                      <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs text-success">Active</span>
                    ) : (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Inactive</span>
                    )}
                    {formData.featured && (
                      <Star className="w-3 h-3 fill-warning text-warning" />
                    )}
                  </div>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  <p>Sort Order: {formData.sortOrder}</p>
                </div>
              </div>
            </div>

            {/* Help Card */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Need Help?</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 mt-0.5 text-primary" />
                  <p>Categories help organize your products for easier browsing</p>
                </div>
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 mt-0.5 text-primary" />
                  <p>Use sub-categories to create a hierarchical structure</p>
                </div>
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 mt-0.5 text-primary" />
                  <p>Featured categories appear on the homepage</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
