import { useCallback, useState } from 'react';
import { ApiError, apiRequest } from '@/lib/api';

export type ProductSearchResult = {
  id: string;
  name: string;
  sku: string | null;
  unitName: string;
  sellingPrice: number;
  purchasePrice?: number;
  taxRate?: number;
  productType: 'single' | 'combo' | 'variable';
};

export type ProductListItem = {
  id: string;
  name: string;
  sku: string | null;
  imageUrl: string;
  barcode: string;
  productType: 'single' | 'combo' | 'variable';
  unitId: string;
  unitName: string;
  brandId: string;
  brandName: string;
  categoryId: string;
  categoryName: string;
  subCategoryId: string;
  subCategoryName: string;
  locationIds: string[];
  locationNames: string[];
  manageStock: boolean;
  alertQuantity: number;
  isForSelling: boolean;
  taxType: 'exclusive' | 'inclusive' | 'none';
  taxRate: number;
  defaultPurchasePrice: number;
  defaultSellingPrice: number;
  profitMargin: number;
  currentStock: number;
  currentStockValue: number;
  totalUnitsSold: number;
  totalUnitsTransferred: number;
  totalUnitsAdjusted: number;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'inactive' | 'draft';
};

export type ProductImageItem = {
  id: string;
  name: string;
  url: string;
  isPrimary: boolean;
};

export type ProductComboItem = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  quantity: number;
  priceEach: number;
  subtotal: number;
};

export type ProductVariantItem = {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  cost: number;
  selling: number;
  stock: number;
  showOptionalFields: boolean;
  weight: string;
  length: string;
  width: string;
  height: string;
  imageName: string;
  imageUrl: string;
  reorderLevel: number | null;
  expiryDate: string;
  supplierCode: string;
};

export type ProductDetailItem = ProductListItem & {
  unitId: string;
  unit?: {
    id: string;
    name: string;
    shortName?: string;
  };
  subUnitIds: string[];
  subUnits?: Array<{
    id: string;
    name: string;
    shortName?: string;
    conversionRate?: number;
  }>;
  brandId: string;
  brand?: {
    id: string;
    name: string;
    description?: string;
  };
  categoryId: string;
  category?: {
    id: string;
    name: string;
    description?: string;
  };
  subCategoryId: string;
  subCategory?: {
    id: string;
    name: string;
    description?: string;
  };
  allLocations: boolean;
  locations?: Array<{
    id: string;
    locationName: string;
  }>;
  purchasePriceExclusive: number;
  purchasePriceInclusive: number;
  images: ProductImageItem[];
  comboItems: ProductComboItem[];
  variants: ProductVariantItem[];
  brochureName: string;
  brochureUrl: string;
  description: string;
  hasWarranty: boolean;
  warranty?: {
    hasWarranty: boolean;
    duration?: number | string;
    period?: 'days' | 'months' | 'years';
    coverage?: string;
  };
  warrantyDuration: string;
  warrantyPeriod: 'months' | 'years';
  warrantyCoverage: string;
  currencyCode: string;
  currencySymbolPlacement: 'before' | 'after';
  currencyPrecision: number;
  stock?: number;
};

export type ProductImagePayload = {
  name: string;
  url: string;
  is_primary: boolean;
};

export type ProductComboItemPayload = {
  product_id: string;
  product_name: string;
  sku: string;
  unit: string;
  quantity: number;
  price_each: number;
  subtotal: number;
};

export type ProductVariantPayload = {
  name: string;
  sku: string;
  barcode: string;
  cost: number;
  selling: number;
  stock: number;
  show_optional_fields: boolean;
  weight?: string;
  length?: string;
  width?: string;
  height?: string;
  image_name?: string;
  image_url?: string;
  reorder_level?: number | null;
  expiry_date?: string;
  supplier_code?: string;
};

export type CreateProductPayload = {
  name: string;
  sku: string | null;
  barcode: string;
  product_type: 'single' | 'combo' | 'variable';
  unit_id: string;
  sub_unit_ids: string[];
  brand_id: string;
  category_id: string;
  sub_category_id: string;
  location_ids: string[];
  all_locations: boolean;
  manage_stock: boolean;
  alert_quantity: number;
  is_for_selling: boolean;
  tax_type: 'inclusive' | 'exclusive' | 'none';
  tax_rate: number;
  default_purchase_price?: number | null;
  purchase_price_exclusive?: number | null;
  purchase_price_inclusive?: number | null;
  profit_margin?: number | null;
  default_selling_price?: number | null;
  description: string;
  has_warranty: boolean;
  warranty_duration: string;
  warranty_period: 'months' | 'years';
  warranty_coverage: string;
  brochure_name: string;
  brochure_url: string;
  currency_code: string;
  currency_symbol_placement: 'before' | 'after';
  currency_precision: number;
  images: ProductImagePayload[];
  combo_items: ProductComboItemPayload[];
  variants: ProductVariantPayload[];
};

export type CreateProductResponse = {
  id: string;
  name: string;
  sku: string | null;
  productType: string;
  message: string;
};

type ListProductsResponse = {
  products: ProductListItem[];
  message: string;
};

type ProductDetailResponse = ProductDetailItem;

type UpdateProductResponse = CreateProductResponse;

type FetchProductsFilters = {
  search?: string;
  productType?: string;
  categoryId?: string;
  brandId?: string;
  unitId?: string;
  locationId?: string;
  taxType?: string;
  showNotForSelling?: boolean;
};

export function useProducts() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const createProduct = useCallback(async (payload: CreateProductPayload) => {
    setIsSaving(true);
    setError(null);

    try {
      return await apiRequest<CreateProductResponse>('/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Unable to create product.';
      setError(message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const getProductById = useCallback(async (id: string) => {
    const productId = id.trim();
    if (!productId) {
      throw new ApiError('Product ID is required.', 400, { message: 'Product ID is required.' });
    }
    return apiRequest<ProductDetailResponse>(`/products/${productId}`);
  }, []);

  const updateProduct = useCallback(async (id: string, payload: CreateProductPayload) => {
    setIsSaving(true);
    setError(null);

    try {
      return await apiRequest<UpdateProductResponse>(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Unable to update product.';
      setError(message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const searchProducts = useCallback(async (query: string, productType?: string) => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 3) {
      return [];
    }

    const params = new URLSearchParams({ query: trimmedQuery });
    if (productType) {
      params.set('product_type', productType);
    }
    return apiRequest<ProductSearchResult[]>(`/products/search?${params.toString()}`);
  }, []);

  const fetchProducts = useCallback(async (filters?: FetchProductsFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters?.search?.trim()) params.set('search', filters.search.trim());
      if (filters?.productType && filters.productType !== 'all') params.set('product_type', filters.productType);
      if (filters?.categoryId && filters.categoryId !== 'all') params.set('category_id', filters.categoryId);
      if (filters?.brandId && filters.brandId !== 'all') params.set('brand_id', filters.brandId);
      if (filters?.unitId && filters.unitId !== 'all') params.set('unit_id', filters.unitId);
      if (filters?.locationId && filters.locationId !== 'all') params.set('location_id', filters.locationId);
      if (filters?.taxType && filters.taxType !== 'all') params.set('tax_type', filters.taxType);
      if (filters?.showNotForSelling) params.set('show_not_for_selling', 'true');

      const query = params.toString();
      const response = await apiRequest<ListProductsResponse>(`/products${query ? `?${query}` : ''}`);
      setProducts(response.products ?? []);
      setHasLoaded(true);
      return response.products ?? [];
    } catch (err) {
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Unable to load products.';
      setError(message);
      setHasLoaded(true);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    createProduct,
    getProductById,
    searchProducts,
    updateProduct,
    products,
    isLoading,
    fetchProducts,
    isSaving,
    error,
    clearError,
    hasLoaded,
  };
}

export type ProductDetails = ProductDetailItem;

export function useProduct() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getProduct = useCallback(async (id: string) => {
    const productId = id.trim();
    if (!productId) {
      throw new ApiError('Product ID is required.', 400, { message: 'Product ID is required.' });
    }

    setLoading(true);
    setError(null);

    try {
      return await apiRequest<ProductDetailResponse>(`/products/${productId}`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Unable to load product.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { getProduct, loading, error, clearError };
}
