import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  X,
  Check,
  AlertCircle,
  FolderTree,
  FolderOpen,
  Package,
  Box,
  Tag, 
  Hash,
  Layers,
  Home,
  User,
  Star, 
  Sparkles, 
  FolderClosed,
  ChevronDown, 
  Link,
  Info,
  CheckCircle, 
  Loader2, 
  Upload,
  Image as ImageIcon,
  BottleWine,
  CoffeeIcon,
  AppleIcon,
  WashingMachineIcon,
  ScissorsIcon,
  CandyCane, 
} from 'lucide-react';

// ===================== TYPES =====================

type SubCategoryFormData = {
  name: string;
  description: string;
  icon: string;
  slug: string;
  parentCategoryId: string;
  active: boolean;
  featured: boolean;
  sortOrder: number;
  metaTitle: string;
  metaDescription: string;
  imageUrl: string;
};

type FormError = {
  field: string;
  message: string;
};

type ParentCategory = {
  id: string;
  name: string;
  description: string;
  icon: string;
  productCount: number;
  subCategoryCount: number;
  active: boolean;
};

// ===================== CONSTANTS =====================

const ICON_OPTIONS = [
  { value: 'Package', label: 'Package', icon: Package },
  { value: 'Box', label: 'Box', icon: Box },
  { value: 'FolderTree', label: 'Folder Tree', icon: FolderTree },
  { value: 'FolderOpen', label: 'Folder Open', icon: FolderOpen },
  { value: 'FolderClosed', label: 'Folder Closed', icon: FolderClosed },
  { value: 'Coffee', label: 'Coffee', icon: CoffeeIcon },
  { value: 'Bottle', label: 'Bottle', icon: BottleWine },
  { value: 'Apple', label: 'Apple', icon: AppleIcon },
  { value: 'Home', label: 'Home', icon: Home },
  { value: 'Sparkles', label: 'Sparkles', icon: Sparkles },
  { value: 'WashingMachine', label: 'Washing Machine', icon: WashingMachineIcon },
  { value: 'Candy', label: 'Candy', icon: CandyCane },
  { value: 'User', label: 'User', icon: User },
  { value: 'Scissors', label: 'Scissors', icon: ScissorsIcon },
  { value: 'Shower', label: 'Shower', icon: AppleIcon },
  { value: 'Tag', label: 'Tag', icon: Tag },
  { value: 'Tags', label: 'Tags', icon: Tag },
  { value: 'Hash', label: 'Hash', icon: Hash },
  { value: 'Layers', label: 'Layers', icon: Layers },
];

const MOCK_PARENT_CATEGORIES: ParentCategory[] = [
  {
    id: 'cat_001',
    name: 'Cereals & Grains',
    description: 'All cereal products including maize, rice, wheat, and beans',
    icon: 'Package',
    productCount: 156,
    subCategoryCount: 3,
    active: true,
  },
  {
    id: 'cat_002',
    name: 'Beverages',
    description: 'Drinks and beverages including sodas, juices, and water',
    icon: 'Coffee',
    productCount: 89,
    subCategoryCount: 2,
    active: true,
  },
  {
    id: 'cat_003',
    name: 'Household Supplies',
    description: 'Cleaning products, detergents, and household essentials',
    icon: 'Home',
    productCount: 124,
    subCategoryCount: 2,
    active: true,
  },
  {
    id: 'cat_004',
    name: 'Snacks & Confectionery',
    description: 'Chips, candies, chocolates, and snack foods',
    icon: 'Candy',
    productCount: 78,
    subCategoryCount: 0,
    active: false,
  },
  {
    id: 'cat_005',
    name: 'Personal Care',
    description: 'Toiletries, cosmetics, and personal hygiene products',
    icon: 'User',
    productCount: 92,
    subCategoryCount: 2,
    active: true,
  },
];

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
          className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed ${
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
        className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 ${
          error ? 'border-destructive focus:border-destructive' : 'border-border'
        }`}
      />
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
  options: { id: string; name: string; subCategoryCount?: number; active?: boolean }[];
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
        className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 ${
          error ? 'border-destructive focus:border-destructive' : 'border-border'
        }`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
            {option.subCategoryCount !== undefined && ` (${option.subCategoryCount} sub-categories)`}
            {option.active === false && ' (Inactive)'}
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

// Icon Selector Component
const IconSelector = ({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedIcon = ICON_OPTIONS.find(opt => opt.value === value);

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">
        Icon <span className="text-destructive ml-0.5">*</span>
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex w-full items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm text-foreground transition-colors hover:bg-surface-alt ${
            error ? 'border-destructive' : 'border-border'
          }`}
        >
          <div className="flex items-center gap-2">
            {selectedIcon ? (
              <>
                <selectedIcon.icon className="w-5 h-5 text-primary" />
                <span>{selectedIcon.label}</span>
              </>
            ) : (
              <span className="text-muted-foreground">Select an icon</span>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-background shadow-lg">
            <div className="grid grid-cols-4 gap-1 p-2">
              {ICON_OPTIONS.map((option) => {
                const IconComponent = option.icon;
                const isSelected = value === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`flex flex-col items-center gap-1 rounded-lg p-2 text-xs transition-colors ${
                      isSelected
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-surface-alt text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span className="truncate max-w-full">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
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
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
          checked ? 'bg-primary' : 'bg-muted'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
};

// Parent Category Card Component
const ParentCategoryCard = ({
  category,
  isSelected,
  onSelect,
}: {
  category: ParentCategory;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    'Package': Package,
    'Box': Box,
    'FolderTree': FolderTree,
    'Coffee': Coffee,
    'Home': Home,
    'Candy': Candy,
    'User': User,
    'Sparkles': Sparkles,
    'Tag': Tag,
    'Hash': Hash,
    'Layers': Layers,
  };
  const IconComponent = iconMap[category.icon] || FolderTree;

  return (
    <div
      onClick={onSelect}
      className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
        isSelected
          ? 'border-primary bg-primary/5 shadow-md'
          : 'border-border hover:border-primary/50 hover:bg-surface-alt'
      } ${!category.active ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className={`rounded-lg p-2 ${
          isSelected ? 'bg-primary/10 text-primary' : 'bg-surface-alt text-muted-foreground'
        }`}>
          <IconComponent className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground">{category.name}</p>
            {!category.active && (
              <span className="text-xs text-muted-foreground">(Inactive)</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">{category.description}</p>
          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
            <span>{category.productCount} products</span>
            <span>•</span>
            <span>{category.subCategoryCount} sub-categories</span>
          </div>
        </div>
        {isSelected && (
          <div className="rounded-full bg-primary p-1">
            <Check className="w-3 h-3 text-primary-foreground" />
          </div>
        )}
      </div>
    </div>
  );
};

// ===================== MAIN COMPONENT =====================

export default function CreateSubCategory() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<FormError[]>([]);
  const [parentCategories] = useState(MOCK_PARENT_CATEGORIES);
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [formData, setFormData] = useState<SubCategoryFormData>({
    name: '',
    description: '',
    icon: 'FolderOpen',
    slug: '',
    parentCategoryId: '',
    active: true,
    featured: false,
    sortOrder: 0,
    metaTitle: '',
    metaDescription: '',
    imageUrl: '',
  });

  // Auto-generate slug from name
  useEffect(() => {
    if (formData.name && !formData.slug) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.name]);

  // Update parent category ID when selected from card
  useEffect(() => {
    if (selectedParentId) {
      setFormData(prev => ({ ...prev, parentCategoryId: selectedParentId }));
      // Clear error for parentCategoryId
      setErrors(prev => prev.filter(err => err.field !== 'parentCategoryId'));
    }
  }, [selectedParentId]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormError[] = [];

    if (!formData.name.trim()) {
      newErrors.push({ field: 'name', message: 'Sub-category name is required' });
    }

    if (!formData.slug.trim()) {
      newErrors.push({ field: 'slug', message: 'Slug is required' });
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.push({ field: 'slug', message: 'Slug can only contain lowercase letters, numbers, and hyphens' });
    }

    if (!formData.parentCategoryId) {
      newErrors.push({ field: 'parentCategoryId', message: 'Please select a parent category' });
    }

    if (!formData.icon) {
      newErrors.push({ field: 'icon', message: 'Please select an icon' });
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
      console.log('Sub-category data:', formData);
      setIsSuccess(true);
      
      // Redirect after success
      setTimeout(() => {
        navigate('/inventory/categories/sub-categories');
      }, 2000);
    } catch (error) {
      console.error('Error creating sub-category:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle field change
  const handleChange = (field: keyof SubCategoryFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    setErrors(prev => prev.filter(err => err.field !== field));
  };

  // Get error for field
  const getError = (field: string): string | undefined => {
    return errors.find(err => err.field === field)?.message;
  };

  // Get selected parent category
  const selectedParent = parentCategories.find(cat => cat.id === selectedParentId);

  return (
    <div className="min-h-screen bg-background p-6">
      {/* ===== HEADER ===== */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/inventory/categories/sub-categories')}
              className="rounded-lg p-2 transition-colors hover:bg-surface-alt"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
                <FolderOpen className="w-6 h-6 text-primary" />
                Create New Sub-Category
              </h1>
              <p className="text-sm text-muted-foreground">
                Add a new sub-category under an existing parent category
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/inventory/categories/sub-categories')}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-alt"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="sub-category-form"
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
                Create Sub-Category
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
                Sub-category created successfully!
              </p>
              <p className="text-sm text-green-700 dark:text-green-400">
                Redirecting to sub-categories list...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ===== FORM ===== */}
      <form id="sub-category-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ===== MAIN COLUMN ===== */}
          <div className="lg:col-span-2 space-y-6">
            {/* Select Parent Category Card */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                Select Parent Category
                <span className="text-destructive ml-0.5">*</span>
              </h2>
              {getError('parentCategoryId') && (
                <p className="flex items-center gap-1 text-xs text-destructive mb-3">
                  <AlertCircle className="w-3 h-3" />
                  {getError('parentCategoryId')}
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {parentCategories.map((category) => (
                  <ParentCategoryCard
                    key={category.id}
                    category={category}
                    isSelected={selectedParentId === category.id}
                    onSelect={() => setSelectedParentId(category.id)}
                  />
                ))}
              </div>
            </div>

            {/* Basic Information Card */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Basic Information</h2>
              <div className="space-y-4">
                <FormInput
                  id="name"
                  label="Sub-Category Name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  error={getError('name')}
                  required
                  placeholder="e.g., Organic Maize Flour"
                  icon={Tag}
                />

                <FormTextarea
                  id="description"
                  label="Description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Describe what products belong in this sub-category..."
                  rows={3}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    id="slug"
                    label="Slug"
                    value={formData.slug}
                    onChange={(e) => handleChange('slug', e.target.value)}
                    error={getError('slug')}
                    required
                    placeholder="e.g., organic-maize-flour"
                    helpText="URL-friendly version of the sub-category name"
                    icon={Link}
                  />

                  <IconSelector
                    value={formData.icon}
                    onChange={(value) => handleChange('icon', value)}
                    error={getError('icon')}
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
                  helpText="Recommended: 150-160 characters"
                />
              </div>
            </div>

            {/* Sub-Category Image Card */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Sub-Category Image</h2>
              <div className="flex items-center gap-6">
                <div className="flex h-32 w-32 items-center justify-center rounded-lg border-2 border-dashed border-border bg-surface-alt">
                  {formData.imageUrl ? (
                    <img
                      src={formData.imageUrl}
                      alt="Sub-category preview"
                      className="h-full w-full rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <ImageIcon className="w-8 h-8" />
                      <span className="text-xs">No image</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <FormInput
                    id="imageUrl"
                    label="Image URL"
                    value={formData.imageUrl}
                    onChange={(e) => handleChange('imageUrl', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    icon={Link}
                  />
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Image
                  </button>
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
                  description="Active sub-categories are visible in the store"
                />

                <ToggleSwitch
                  label="Featured"
                  checked={formData.featured}
                  onChange={(checked) => handleChange('featured', checked)}
                  description="Featured sub-categories appear prominently"
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
                    {(() => {
                      const IconComponent = ICON_OPTIONS.find(opt => opt.value === formData.icon)?.icon || FolderOpen;
                      return <IconComponent className="w-5 h-5 text-primary" />;
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
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
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Inactive</span>
                    )}
                    {formData.featured && (
                      <Star className="w-3 h-3 fill-warning text-warning" />
                    )}
                  </div>
                </div>
                {selectedParent && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <FolderTree className="w-3 h-3" />
                    <span>Parent: {selectedParent.name}</span>
                  </div>
                )}
                <div className="mt-2 text-xs text-muted-foreground">
                  <p>Slug: {formData.slug || 'auto-generated'}</p>
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
                  <p>Sub-categories help organize products within parent categories</p>
                </div>
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 mt-0.5 text-primary" />
                  <p>Products can be assigned to sub-categories for better filtering</p>
                </div>
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 mt-0.5 text-primary" />
                  <p>Each sub-category must belong to a parent category</p>
                </div>
                {selectedParent && (
                  <div className="mt-3 rounded-lg bg-primary/5 p-3 border border-primary/10">
                    <p className="text-xs text-foreground">
                      <span className="font-medium">Selected Parent:</span> {selectedParent.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
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

// ===================== MISSING ICON COMPONENTS =====================

const Coffee = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
    <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" />
    <line x1="6" y1="2" x2="6" y2="4" />
    <line x1="10" y1="2" x2="10" y2="4" />
    <line x1="14" y1="2" x2="14" y2="4" />
  </svg>
);

const Bottle = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v4" />
    <path d="M12 6c-2 0-3.5 1.5-3.5 4v8a2 2 0 0 0 2 2h3a2 2 0 0 0 2-2v-8c0-2.5-1.5-4-3.5-4z" />
  </svg>
);

const Apple = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" />
    <path d="M10 2c1 .5 2 2 2 5" />
  </svg>
);

const WashingMachine = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <circle cx="12" cy="12" r="3" />
    <line x1="4" y1="8" x2="20" y2="8" />
    <line x1="4" y1="16" x2="20" y2="16" />
  </svg>
);

const Candy = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v4" />
    <path d="M12 18v4" />
    <path d="M4 12H2" />
    <path d="M22 12h-2" />
    <path d="M6.5 6.5L5 5" />
    <path d="M19 19l-1.5-1.5" />
    <path d="M17.5 6.5L19 5" />
    <path d="M5 19l1.5-1.5" />
    <circle cx="12" cy="12" r="4" />
  </svg>
);

const Scissors = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <line x1="20" y1="4" x2="8.12" y2="15.88" />
    <line x1="14.47" y1="14.48" x2="20" y2="20" />
    <line x1="8.12" y1="8.12" x2="12" y2="12" />
  </svg>
);

const Shower = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 8h16" />
    <path d="M8 4v4" />
    <path d="M16 4v4" />
    <path d="M12 12v8" />
    <path d="M8 16h8" />
    <path d="M20 16h2" />
    <path d="M2 16h2" />
  </svg>
);

const Tags = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 2H5a2 2 0 0 0-2 2v4l6 6 6-6-6-6z" />
    <path d="M21 15l-6 6-6-6" />
    <path d="M15 21l-6-6" />
  </svg>
);