import { useEffect, useMemo, useState } from 'react';
import { Filter, Plus, RefreshCw, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBusinessUnits } from '@/hooks/business/units/useBusinessUnits';
import { useCategories } from '@/hooks/business/categories/useCategories';
import { useBusinessBrands } from '@/hooks/business/brands/useBusinessBrands';
import { useBusinessLocations } from '@/hooks/business/settings/useBusinessLocations';
import { useProducts } from '@/hooks/business/products/useProducts';
import { useBusinessCurrency } from '@/business/businessStore';
import toast from 'react-hot-toast';
import { ProductsAnalyticsTab } from './ProductsAnalyticsTab';
import { ProductsAllProductsTab } from './ProductsAllProductsTab';
import { ProductsStockReportTab } from './ProductsStockReportTab';

type TabType = 'analytics' | 'all-products' | 'stock-report';

type Product = {
  id: string;
  name: string;
  sku: string | null;
  imageUrl?: string;
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
  taxType: string;
  taxRate: number;
  defaultPurchasePrice: number;
  defaultSellingPrice: number;
  currentStock: number;
  currentStockValue: number;
  totalUnitsSold: number;
  totalUnitsTransferred: number;
  totalUnitsAdjusted: number;
  profitMargin: number;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'inactive' | 'draft';
};

export default function ProductsList() {
  const navigate = useNavigate();
  const { formatCurrency } = useBusinessCurrency();
  const { units } = useBusinessUnits();
  const { categories } = useCategories();
  const { brands } = useBusinessBrands();
  const { locations } = useBusinessLocations();
  const { products: realProductsRaw, fetchProducts } = useProducts();
  const realProducts = realProductsRaw as unknown as Product[] | undefined;

  const [activeTab, setActiveTab] = useState<TabType>('analytics');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductType, setSelectedProductType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedTaxType, setSelectedTaxType] = useState<string>('all');
  const [showNotForSelling, setShowNotForSelling] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showActions, setShowActions] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Product | null; direction: 'asc' | 'desc' }>({
    key: null,
    direction: 'asc',
  });

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchProducts({
        search: searchTerm,
        productType: selectedProductType,
        categoryId: selectedCategory,
        brandId: selectedBrand,
        unitId: selectedUnit,
        locationId: selectedLocation,
        taxType: selectedTaxType,
        showNotForSelling,
      });
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [
    fetchProducts,
    searchTerm,
    selectedProductType,
    selectedCategory,
    selectedBrand,
    selectedUnit,
    selectedLocation,
    selectedTaxType,
    showNotForSelling,
  ]);

  const products: Product[] = Array.isArray(realProducts) ? realProducts : [];

  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.sku ?? '').toLowerCase().includes(q) ||
          (p.barcode ?? '').toLowerCase().includes(q),
      );
    }
    if (selectedProductType !== 'all') filtered = filtered.filter((p) => p.productType === selectedProductType);
    if (selectedCategory !== 'all') filtered = filtered.filter((p) => p.categoryId === selectedCategory);
    if (selectedBrand !== 'all') filtered = filtered.filter((p) => p.brandId === selectedBrand);
    if (selectedUnit !== 'all') filtered = filtered.filter((p) => p.unitId === selectedUnit);
    if (selectedLocation !== 'all') filtered = filtered.filter((p) => p.locationIds.includes(selectedLocation));
    if (selectedTaxType !== 'all') filtered = filtered.filter((p) => p.taxType === selectedTaxType);
    if (!showNotForSelling) filtered = filtered.filter((p) => p.isForSelling);

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key!];
        const bVal = b[sortConfig.key!];
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        return 0;
      });
    }

    return filtered;
  }, [
    products,
    searchTerm,
    selectedProductType,
    selectedCategory,
    selectedBrand,
    selectedUnit,
    selectedLocation,
    selectedTaxType,
    showNotForSelling,
    sortConfig,
  ]);

  const analytics = useMemo(() => {
    const totalProducts = products.length;
    const activeProducts = products.filter((p) => p.status === 'active').length;
    const totalStockValue = products.reduce((sum, p) => sum + p.currentStockValue, 0);
    const totalPotentialProfit = products.reduce((sum, p) => sum + p.currentStock * (p.defaultSellingPrice - p.defaultPurchasePrice), 0);
    const totalUnitsSold = products.reduce((sum, p) => sum + p.totalUnitsSold, 0);
    const totalValueSold = products.reduce((sum, p) => sum + p.totalUnitsSold * p.defaultSellingPrice, 0);
    const totalProfit = totalValueSold - products.reduce((sum, p) => sum + p.totalUnitsSold * p.defaultPurchasePrice, 0);
    const profits = products.filter((p) => p.defaultPurchasePrice > 0);
    const avgProfitMargin = profits.reduce((sum, p) => sum + p.profitMargin, 0) / (profits.length || 1);
    const lowStockItems = products.filter((p) => p.manageStock && p.currentStock <= p.alertQuantity).length;
    const outOfStockItems = products.filter((p) => p.manageStock && p.currentStock === 0).length;
    const topSelling = [...products].sort((a, b) => b.totalUnitsSold - a.totalUnitsSold).slice(0, 5);
    const categoryDistribution = products.reduce((acc, p) => {
      acc[p.categoryName] = (acc[p.categoryName] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalProducts,
      activeProducts,
      totalStockValue,
      totalPotentialProfit,
      totalUnitsSold,
      totalValueSold,
      totalProfit,
      avgProfitMargin,
      lowStockItems,
      outOfStockItems,
      topSelling,
      categoryDistribution,
    };
  }, [products]);

  const handleSort = (key: keyof Product) => {
    setSortConfig((prev) => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
  };

  const getStockStatus = (product: Product) => {
    if (!product.manageStock) return { label: 'N/A', color: 'text-muted-foreground', bg: 'bg-muted' };
    if (product.currentStock === 0) return { label: 'Out of Stock', color: 'text-destructive', bg: 'bg-destructive/10' };
    if (product.currentStock <= product.alertQuantity) return { label: 'Low Stock', color: 'text-amber-600', bg: 'bg-amber-500/10' };
    return { label: 'In Stock', color: 'text-success', bg: 'bg-success/10' };
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedProductType('all');
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSelectedUnit('all');
    setSelectedLocation('all');
    setSelectedTaxType('all');
    setShowNotForSelling(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your product inventory, track stock levels, and analyze performance</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/products/create')}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Filters</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltersOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-alt"
            >
              <Filter className="h-3.5 w-3.5" />
              {filtersOpen ? 'Collapse' : 'Expand'}
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-alt"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
        </div>

        {filtersOpen ? (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Search</label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products..."
                className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Product Type</label>
            <select
              value={selectedProductType}
              onChange={(e) => setSelectedProductType(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Types</option>
              <option value="single">Single</option>
              <option value="combo">Combo</option>
              <option value="variable">Variable</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Categories</option>
              {categories.map((category: any) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Brand</label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Brands</option>
              {brands.map((brand: any) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Unit</label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Units</option>
              {units.map((unit: any) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Location</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Locations</option>
              {locations.map((location: any) => (
                <option key={location.id} value={location.id}>
                  {location.locationName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Tax Type</label>
            <select
              value={selectedTaxType}
              onChange={(e) => setSelectedTaxType(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Tax Types</option>
              <option value="exclusive">Exclusive</option>
              <option value="inclusive">Inclusive</option>
              <option value="none">No Tax</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={showNotForSelling}
                onChange={(e) => setShowNotForSelling(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              Show not for selling
            </label>
          </div>
        </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Filters are collapsed. Current query is still applied to the product list and analytics below.
          </p>
        )}
      </div>

      <div className="border-b border-border">
        <nav className="flex gap-6 overflow-x-auto">
          {(['analytics', 'all-products', 'stock-report'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium capitalize transition-colors ${
                activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'all-products' ? 'All Products' : tab === 'analytics' ? 'Analytics' : 'Stock Report'}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'analytics' && <ProductsAnalyticsTab analytics={analytics} products={products} formatCurrency={formatCurrency} />}

      {activeTab === 'all-products' && (
        <ProductsAllProductsTab
          filteredProducts={filteredProducts}
          products={products}
          showActions={showActions}
          setShowActions={setShowActions}
          handleSort={handleSort}
          sortConfig={sortConfig}
          getStockStatus={getStockStatus}
          navigate={navigate}
        />
      )}

      {activeTab === 'stock-report' && (
        <ProductsStockReportTab filteredProducts={filteredProducts} products={products} formatCurrency={formatCurrency} />
      )}

    </div>
  );
}
