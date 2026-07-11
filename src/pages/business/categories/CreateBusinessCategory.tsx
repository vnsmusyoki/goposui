import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
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
  Loader2,
  Star,
} from 'lucide-react';
import { ApiError } from '@/lib/api';
import { type CategoryFormData, useCategories } from '@/hooks/business/categories/useCategories';

type FormError = {
  field: string;
  message: string;
};

function formatFileSize(bytes: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const apiFieldToFormField: Record<string, string> = {
  category_code: 'categoryCode',
  meta_title: 'metaTitle',
  meta_description: 'metaDescription',
  image_url: 'imageUrl',
  business_id: 'form',
};

const MAX_CATEGORY_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_CATEGORY_IMAGE_TYPES = new Set(['image/png', 'image/jpeg']);

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
  const { createCategory, isLoading: isCategoryActionLoading } = useCategories();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<FormError[]>([]);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    categoryCode: '',
    description: '',
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
  const validateForm = (): FormError[] => {
    const newErrors: FormError[] = [];

    if (!formData.name.trim()) {
      newErrors.push({ field: 'name', message: 'Category name is required' });
    }

    setErrors(newErrors);
    return newErrors;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      await createCategory({
        name: formData.name,
        categoryCode: formData.categoryCode,
        description: formData.description,
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
        imageUrl: formData.imageUrl,
      });
      setErrors([]);
      setIsSuccess(true);
      toast.success('Category created successfully.');
      setTimeout(() => {
        navigate('/inventory/categories');
      }, 2000);
    } catch (error) {
      if (error instanceof ApiError) {
        const payload = error.data as {
          message?: string;
          errors?: Record<string, string>;
        };

        if (payload?.errors && typeof payload.errors === 'object') {
          const normalizedErrors = Object.entries(payload.errors).map(([field, message]) => ({
            field: apiFieldToFormField[field] ?? field,
            message,
          }));
          setErrors(normalizedErrors);
          const firstFieldError = normalizedErrors.find((entry) => entry.field !== 'form');
          if (firstFieldError) {
            const element = document.getElementById(firstFieldError.field);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              element.focus();
            }
          }
        } else {
          setErrors([
            {
              field: 'form',
              message: payload?.message ?? error.message ?? 'Unable to create category.',
            },
          ]);
        }
      } else {
        setErrors([
          {
            field: 'form',
            message: error instanceof Error ? error.message : 'Unable to create category.',
          },
        ]);
      }
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

  const applyImageFile = async (file: File) => {
    if (!ALLOWED_CATEGORY_IMAGE_TYPES.has(file.type)) {
      setErrors((prev) => [
        ...prev.filter((err) => err.field !== 'imageUrl'),
        { field: 'imageUrl', message: 'Only PNG and JPEG images are allowed.' },
      ]);
      return;
    }

    setErrors((prev) => prev.filter((err) => err.field !== 'imageUrl'));

    try {
      const compressed = await compressCategoryImage(file);
      setFormData((prev) => ({
        ...prev,
        imageUrl: compressed.imageUrl,
        imageName: file.name,
        imageSize: compressed.imageSize,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to process the selected image.';
      setErrors((prev) => [
        ...prev.filter((err) => err.field !== 'imageUrl'),
        { field: 'imageUrl', message },
      ]);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

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

  // Get error for field
  const getError = (field: string): string | undefined => {
    return errors.find(err => err.field === field)?.message;
  };
  const summaryErrors = errors.filter((error) => error.field === 'form' || error.field === 'name' || error.field === 'categoryCode' || error.field === 'description' || error.field === 'metaTitle' || error.field === 'metaDescription' || error.field === 'imageUrl' || error.field === 'sortOrder');

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
            disabled={isSubmitting || isSuccess || isCategoryActionLoading}
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
                We could not save the category because one or more fields need attention.
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
                <FormInput
                  id="categoryCode"
                  label="Category Code"
                  value={formData.categoryCode}
                  onChange={(e) => handleChange('categoryCode', e.target.value)}
                  error={getError('categoryCode')} 
                  placeholder="e.g., 29838"
                  helpText="Optional. Leave it blank and we will generate one for you."
                  icon={Hash}
                />
                <FormTextarea
                  id="description"
                  label="Description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Describe what products belong in this category..."
                  rows={3}
                />
              </div>
            </div>

            {/* SEO Information Card */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground">SEO Information</h2>
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                    Optional
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add SEO metadata to improve how this category appears in search results.
                </p>
              </div>
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
              <div className="mb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground">Category Image</h2>
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                    Optional
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upload an image to give this category a more visual identity.
                </p>
              </div>
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
                        PNG or JPG only. Images are compressed before being stored and must stay under 5 MB.
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
