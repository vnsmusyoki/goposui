import { useState } from 'react';
import {
  ArrowLeft,
  Save,
  Plus,
  X,
  Image as ImageIcon,
  FileText,
  Upload,
  Package,
  Tag,
  Barcode,
  Ruler,
  Layers,
  Building,
  AlertCircle,
  Shield,
  FileSpreadsheet,
  ShoppingCart,
  Percent,
  DollarSign,
  TrendingUp,
  Check,
  ChevronDown,
  Eye,
  Trash2,
  Download,
  Printer
} from 'lucide-react';

type ProductType = 'single' | 'combo' | 'variable';
type TaxType = 'inclusive' | 'exclusive' | 'none';

type SubUnit = {
  id: string;
  name: string;
  conversionRate: number;
  isDefault: boolean;
};

type ProductImage = {
  id: string;
  url: string;
  isPrimary: boolean;
  name: string;
};

type ComboItem = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
};

type Variant = {
  id: string;
  sku: string;
  attributes: Record<string, string>;
  price: number;
  cost: number;
  stock: number;
  alertQuantity: number;
};

// Mock data
const mockUnits = [
  { id: '1', name: 'Kilogram', shortName: 'kg' },
  { id: '2', name: 'Gram', shortName: 'g' },
  { id: '3', name: 'Liter', shortName: 'L' },
  { id: '4', name: 'Milliliter', shortName: 'mL' },
  { id: '5', name: 'Piece', shortName: 'pc' },
  { id: '6', name: 'Dozen', shortName: 'dz' },
  { id: '7', name: 'Box', shortName: 'bx' },
];

const mockSubUnits = [
  { id: '1', name: 'Piece', conversionRate: 1, isDefault: true },
  { id: '2', name: 'Pack (12 pcs)', conversionRate: 12, isDefault: false },
  { id: '3', name: 'Box (24 pcs)', conversionRate: 24, isDefault: false },
];

const mockBrands = [
  { id: '1', name: 'Nike' },
  { id: '2', name: 'Adidas' },
  { id: '3', name: 'Apple' },
  { id: '4', name: 'Samsung' },
  { id: '5', name: 'Generic' },
];

const mockCategories = [
  { id: '1', name: 'Electronics' },
  { id: '2', name: 'Clothing' },
  { id: '3', name: 'Food & Beverages' },
  { id: '4', name: 'Furniture' },
  { id: '5', name: 'Office Supplies' },
];

const mockSubCategories = {
  '1': ['Laptops', 'Smartphones', 'Accessories', 'Audio'],
  '2': ['Shirts', 'Pants', 'Shoes', 'Jackets'],
  '3': ['Beverages', 'Snacks', 'Canned Goods', 'Fresh Produce'],
  '4': ['Chairs', 'Tables', 'Desks', 'Storage'],
  '5': ['Paper', 'Pens', 'Printers', 'Desk Accessories'],
};

const mockLocations = [
  { id: '1', name: 'Warehouse A - Main' },
  { id: '2', name: 'Warehouse B - North' },
  { id: '3', name: 'Warehouse C - South' },
  { id: '4', name: 'Retail Store - Downtown' },
];

export default function CreateProduct() {
  // Main form state
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    sku: '',
    barcode: '',
    unitId: '',
    subUnitId: '',
    brandId: '',
    categoryId: '',
    subCategory: '',
    locationId: '',
    
    // Stock Management
    manageStock: false,
    alertQuantity: 0,
    
    // Warranty
    warranty: {
      hasWarranty: false,
      duration: '',
      period: 'months' as 'months' | 'years',
      coverage: '',
    },
    
    // Description
    description: '',
    
    // Product Type
    productType: 'single' as ProductType,
    isForSelling: true,
    
    // Pricing
    taxType: 'exclusive' as TaxType,
    taxRate: 0,
    defaultPurchasePrice: 0,
    purchasePriceExclusive: 0,
    purchasePriceInclusive: 0,
    profitMargin: 0,
    defaultSellingPrice: 0,
    
    // Images
    images: [] as ProductImage[],
    brochure: null as File | null,
  });
  
  // Combo items state
  const [comboItems, setComboItems] = useState<ComboItem[]>([]);
  const [showAddComboItem, setShowAddComboItem] = useState(false);
  
  // Variants state
  const [variants, setVariants] = useState<Variant[]>([]);
  const [showAddVariant, setShowAddVariant] = useState(false);
  
  // UI state
  const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'inventory' | 'media'>('basic');
  const [isSaving, setIsSaving] = useState(false);
  
  // Handle form field changes
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  // Handle warranty changes
  const handleWarrantyChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      warranty: { ...prev.warranty, [field]: value }
    }));
  };
  
  // Calculate prices
  const calculatePrices = (purchasePrice: number, taxRate: number, profitMargin: number) => {
    const exclusive = purchasePrice;
    const inclusive = purchasePrice * (1 + taxRate / 100);
    const sellingPrice = purchasePrice * (1 + profitMargin / 100);
    
    return { exclusive, inclusive, sellingPrice };
  };
  
  // Handle purchase price change
  const handlePurchasePriceChange = (price: number) => {
    const { exclusive, inclusive, sellingPrice } = calculatePrices(
      price,
      formData.taxRate,
      formData.profitMargin
    );
    setFormData(prev => ({
      ...prev,
      defaultPurchasePrice: price,
      purchasePriceExclusive: exclusive,
      purchasePriceInclusive: inclusive,
      defaultSellingPrice: sellingPrice,
    }));
  };
  
  // Handle tax rate change
  const handleTaxRateChange = (rate: number) => {
    const { exclusive, inclusive, sellingPrice } = calculatePrices(
      formData.defaultPurchasePrice,
      rate,
      formData.profitMargin
    );
    setFormData(prev => ({
      ...prev,
      taxRate: rate,
      purchasePriceExclusive: exclusive,
      purchasePriceInclusive: inclusive,
      defaultSellingPrice: sellingPrice,
    }));
  };
  
  // Handle profit margin change
  const handleProfitMarginChange = (margin: number) => {
    const { exclusive, inclusive, sellingPrice } = calculatePrices(
      formData.defaultPurchasePrice,
      formData.taxRate,
      margin
    );
    setFormData(prev => ({
      ...prev,
      profitMargin: margin,
      purchasePriceExclusive: exclusive,
      purchasePriceInclusive: inclusive,
      defaultSellingPrice: sellingPrice,
    }));
  };
  
  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newImages: ProductImage[] = Array.from(files).map((file, index) => ({
      id: `img-${Date.now()}-${index}`,
      url: URL.createObjectURL(file),
      isPrimary: formData.images.length === 0 && index === 0,
      name: file.name,
    }));
    
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newImages]
    }));
  };
  
  // Remove image
  const removeImage = (id: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== id)
    }));
  };
  
  // Set primary image
  const setPrimaryImage = (id: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map(img => ({
        ...img,
        isPrimary: img.id === id
      }))
    }));
  };
  
  // Handle brochure upload
  const handleBrochureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, brochure: file }));
    }
  };
  
  // Remove brochure
  const removeBrochure = () => {
    setFormData(prev => ({ ...prev, brochure: null }));
  };
  
  // Handle combo item add
  const handleAddComboItem = (item: ComboItem) => {
    setComboItems(prev => [...prev, item]);
    setShowAddComboItem(false);
  };
  
  // Remove combo item
  const removeComboItem = (id: string) => {
    setComboItems(prev => prev.filter(item => item.id !== id));
  };
  
  // Handle variant add
  const handleAddVariant = (variant: Variant) => {
    setVariants(prev => [...prev, variant]);
    setShowAddVariant(false);
  };
  
  // Remove variant
  const removeVariant = (id: string) => {
    setVariants(prev => prev.filter(v => v.id !== id));
  };
  
  // Save handlers
  const handleSave = () => {
    setIsSaving(true);
    // Validate required fields
    if (!formData.name || !formData.sku || !formData.unitId) {
      alert('Please fill in all required fields');
      setIsSaving(false);
      return;
    }
    
    console.log('Saving product:', { ...formData, comboItems, variants });
    setIsSaving(false);
  };
  
  const handleSaveAndAddAnother = () => {
    handleSave();
    // Reset form after save
    // In real app, this would redirect to new form
  };
  
  const handleSaveAndAddStock = () => {
    handleSave();
    // In real app, this would redirect to opening stock form
  };
  
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="rounded-lg p-2 hover:bg-surface-alt transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Create Product</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Add a new product to your inventory
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-alt disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            Save
          </button>
          <button
            type="button"
            onClick={handleSaveAndAddAnother}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-alt disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Save & Add Another
          </button>
          <button
            type="button"
            onClick={handleSaveAndAddStock}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Package className="h-4 w-4" />
            Save & Add Opening Stock
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('basic')}
            className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'basic'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Basic Information
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'pricing'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Pricing & Tax
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'inventory'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Inventory
          </button>
          <button
            onClick={() => setActiveTab('media')}
            className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'media'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Media
          </button>
        </nav>
      </div>
      
      {/* Content */}
      <div className="rounded-xl border border-border bg-card">
        <div className="p-6">
          {/* Basic Information Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Name */}
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-foreground">
                    Product Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Enter product name"
                    className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                
                {/* SKU */}
                <div>
                  <label className="text-sm font-medium text-foreground">
                    SKU <span className="text-destructive">*</span>
                  </label>
                  <div className="relative mt-2">
                    <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => handleChange('sku', e.target.value)}
                      placeholder="e.g., PRD-001"
                      className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
                
                {/* Barcode */}
                <div>
                  <label className="text-sm font-medium text-foreground">Barcode</label>
                  <div className="relative mt-2">
                    <Barcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => handleChange('barcode', e.target.value)}
                      placeholder="Enter barcode (optional)"
                      className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
                
                {/* Unit */}
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Unit <span className="text-destructive">*</span>
                  </label>
                  <div className="relative mt-2">
                    <Ruler className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <select
                      value={formData.unitId}
                      onChange={(e) => handleChange('unitId', e.target.value)}
                      className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2.5 text-sm text-foreground appearance-none"
                    >
                      <option value="">Select Unit</option>
                      {mockUnits.map(unit => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name} ({unit.shortName})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                
                {/* Sub Unit */}
                <div>
                  <label className="text-sm font-medium text-foreground">Related Sub Unit</label>
                  <div className="relative mt-2">
                    <Layers className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <select
                      value={formData.subUnitId}
                      onChange={(e) => handleChange('subUnitId', e.target.value)}
                      className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2.5 text-sm text-foreground appearance-none"
                    >
                      <option value="">Select Sub Unit</option>
                      {mockSubUnits.map(unit => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name} ({unit.conversionRate} pcs)
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                
                {/* Brand */}
                <div>
                  <label className="text-sm font-medium text-foreground">Brand</label>
                  <select
                    value={formData.brandId}
                    onChange={(e) => handleChange('brandId', e.target.value)}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground appearance-none"
                  >
                    <option value="">Select Brand</option>
                    {mockBrands.map(brand => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Category */}
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Category <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => {
                      handleChange('categoryId', e.target.value);
                      handleChange('subCategory', '');
                    }}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground appearance-none"
                  >
                    <option value="">Select Category</option>
                    {mockCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Sub Category */}
                <div>
                  <label className="text-sm font-medium text-foreground">Sub Category</label>
                  <select
                    value={formData.subCategory}
                    onChange={(e) => handleChange('subCategory', e.target.value)}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground appearance-none"
                    disabled={!formData.categoryId}
                  >
                    <option value="">Select Sub Category</option>
                    {formData.categoryId && mockSubCategories[formData.categoryId as keyof typeof mockSubCategories]?.map(sub => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Business Location */}
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Business Location <span className="text-destructive">*</span>
                  </label>
                  <div className="relative mt-2">
                    <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <select
                      value={formData.locationId}
                      onChange={(e) => handleChange('locationId', e.target.value)}
                      className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2.5 text-sm text-foreground appearance-none"
                    >
                      <option value="">Select Location</option>
                      {mockLocations.map(loc => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
              </div>
              
              {/* Product Type */}
              <div>
                <label className="text-sm font-medium text-foreground">
                  Product Type <span className="text-destructive">*</span>
                </label>
                <div className="mt-2 grid grid-cols-3 gap-3">
                  {(['single', 'combo', 'variable'] as ProductType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleChange('productType', type)}
                      className={`rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors capitalize ${
                        formData.productType === type
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Combo Items (if combo) */}
              {formData.productType === 'combo' && (
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-foreground">Combo Items</h3>
                    <button
                      type="button"
                      onClick={() => setShowAddComboItem(true)}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      <Plus className="h-4 w-4" />
                      Add Item
                    </button>
                  </div>
                  {comboItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No items added to this combo yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {comboItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">{item.productName}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity} {item.unit}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeComboItem(item.id)}
                            className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Variants (if variable) */}
              {formData.productType === 'variable' && (
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-foreground">Variants</h3>
                    <button
                      type="button"
                      onClick={() => setShowAddVariant(true)}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      <Plus className="h-4 w-4" />
                      Add Variant
                    </button>
                  </div>
                  {variants.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No variants added yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {variants.map((variant) => (
                        <div key={variant.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">{variant.sku}</p>
                            <p className="text-xs text-muted-foreground">
                              Price: ${variant.price} | Stock: {variant.stock}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeVariant(variant.id)}
                            className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Description */}
              <div>
                <label className="text-sm font-medium text-foreground">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Enter product description..."
                  rows={4}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none"
                />
              </div>
            </div>
          )}
          
          {/* Pricing & Tax Tab */}
          {activeTab === 'pricing' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Is For Selling */}
                <div className="md:col-span-2 flex items-center justify-between rounded-lg border border-border bg-background p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Product is for Selling</p>
                    <p className="text-xs text-muted-foreground">Enable if this product can be sold to customers</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleChange('isForSelling', !formData.isForSelling)}
                    className="relative h-7 w-12 rounded-full transition-colors"
                    style={{
                      backgroundColor: formData.isForSelling ? '#10b981' : '#d1d5db'
                    }}
                  >
                    <span
                      className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
                        formData.isForSelling ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
                
                {/* Tax Type */}
                <div>
                  <label className="text-sm font-medium text-foreground">Tax Type</label>
                  <select
                    value={formData.taxType}
                    onChange={(e) => handleChange('taxType', e.target.value)}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground appearance-none"
                  >
                    <option value="exclusive">Exclusive of Tax</option>
                    <option value="inclusive">Inclusive of Tax</option>
                    <option value="none">No Tax</option>
                  </select>
                </div>
                
                {/* Tax Rate */}
                <div>
                  <label className="text-sm font-medium text-foreground">Tax Rate (%)</label>
                  <div className="relative mt-2">
                    <Percent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="number"
                      value={formData.taxRate}
                      onChange={(e) => handleTaxRateChange(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
                
                {/* Default Purchase Price */}
                <div>
                  <label className="text-sm font-medium text-foreground">Default Purchase Price</label>
                  <div className="relative mt-2">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="number"
                      value={formData.defaultPurchasePrice}
                      onChange={(e) => handlePurchasePriceChange(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
                
                {/* Purchase Price Exclusive */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Purchase Price (Exclusive)</label>
                  <div className="relative mt-2">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={formData.purchasePriceExclusive.toFixed(2)}
                      disabled
                      className="w-full rounded-lg border border-border bg-surface-alt pl-9 pr-4 py-2.5 text-sm text-foreground opacity-70"
                    />
                  </div>
                </div>
                
                {/* Purchase Price Inclusive */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Purchase Price (Inclusive)</label>
                  <div className="relative mt-2">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={formData.purchasePriceInclusive.toFixed(2)}
                      disabled
                      className="w-full rounded-lg border border-border bg-surface-alt pl-9 pr-4 py-2.5 text-sm text-foreground opacity-70"
                    />
                  </div>
                </div>
              </div>
              
              {/* Profit Margin and Selling Price */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-foreground">Profit Margin (%)</label>
                  <div className="relative mt-2">
                    <TrendingUp className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="number"
                      value={formData.profitMargin}
                      onChange={(e) => handleProfitMarginChange(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground">Default Selling Price</label>
                  <div className="relative mt-2">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={formData.defaultSellingPrice.toFixed(2)}
                      disabled
                      className="w-full rounded-lg border border-border bg-surface-alt pl-9 pr-4 py-2.5 text-sm text-foreground opacity-70"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Inventory Tab */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              {/* Manage Stock */}
              <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Manage Stock</p>
                  <p className="text-xs text-muted-foreground">Enable stock tracking for this product</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange('manageStock', !formData.manageStock)}
                  className="relative h-7 w-12 rounded-full transition-colors"
                  style={{
                    backgroundColor: formData.manageStock ? '#10b981' : '#d1d5db'
                  }}
                >
                  <span
                    className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
                      formData.manageStock ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
              
              {/* Alert Quantity */}
              {formData.manageStock && (
                <div>
                  <label className="text-sm font-medium text-foreground">Alert Quantity</label>
                  <div className="relative mt-2">
                    <AlertCircle className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="number"
                      value={formData.alertQuantity}
                      onChange={(e) => handleChange('alertQuantity', parseInt(e.target.value) || 0)}
                      placeholder="Enter alert quantity"
                      className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    You will be notified when stock falls below this quantity
                  </p>
                </div>
              )}
              
              {/* Warranty */}
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Warranty</p>
                    <p className="text-xs text-muted-foreground">Enable warranty for this product</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleWarrantyChange('hasWarranty', !formData.warranty.hasWarranty)}
                    className="relative h-7 w-12 rounded-full transition-colors"
                    style={{
                      backgroundColor: formData.warranty.hasWarranty ? '#10b981' : '#d1d5db'
                    }}
                  >
                    <span
                      className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
                        formData.warranty.hasWarranty ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
                
                {formData.warranty.hasWarranty && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-foreground">Duration</label>
                      <input
                        type="number"
                        value={formData.warranty.duration}
                        onChange={(e) => handleWarrantyChange('duration', e.target.value)}
                        placeholder="Enter duration"
                        className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Period</label>
                      <select
                        value={formData.warranty.period}
                        onChange={(e) => handleWarrantyChange('period', e.target.value)}
                        className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground appearance-none"
                      >
                        <option value="months">Months</option>
                        <option value="years">Years</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-foreground">Warranty Coverage</label>
                      <textarea
                        value={formData.warranty.coverage}
                        onChange={(e) => handleWarrantyChange('coverage', e.target.value)}
                        placeholder="Describe warranty coverage..."
                        rows={2}
                        className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Media Tab */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              {/* Product Images */}
              <div>
                <label className="text-sm font-medium text-foreground">Product Images</label>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {formData.images.map((image) => (
                    <div key={image.id} className="relative group">
                      <div className="aspect-square rounded-lg border border-border bg-background overflow-hidden">
                        <img
                          src={image.url}
                          alt={image.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!image.isPrimary && (
                          <button
                            type="button"
                            onClick={() => setPrimaryImage(image.id)}
                            className="rounded-lg bg-white/20 p-1.5 text-white hover:bg-white/30"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(image.id)}
                          className="rounded-lg bg-destructive/80 p-1.5 text-white hover:bg-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      {image.isPrimary && (
                        <span className="absolute top-2 left-2 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                          Primary
                        </span>
                      )}
                    </div>
                  ))}
                  
                  {/* Upload Button */}
                  <label className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary cursor-pointer transition-colors flex flex-col items-center justify-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Upload product images. First image will be set as primary.
                </p>
              </div>
              
              {/* Product Brochure */}
              <div>
                <label className="text-sm font-medium text-foreground">Product Brochure</label>
                <div className="mt-2">
                  {formData.brochure ? (
                    <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{formData.brochure.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(formData.brochure.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-surface-alt"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={removeBrochure}
                          className="rounded-lg border border-destructive px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 hover:border-primary cursor-pointer transition-colors">
                      <Upload className="h-10 w-10 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">Upload Product Brochure</p>
                      <p className="text-xs text-muted-foreground">PDF, DOC, DOCX (Max 10MB)</p>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleBrochureUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}