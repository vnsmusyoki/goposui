import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  Grid,
  List,
  FolderTree,
  Package,
  Tag,
  Box,
  FolderOpen,
  FolderClosed,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  ArrowUp,
  ArrowDown,
  Layers,
  Hash,
  User,
  Star,
  MoreVertical,
  Copy as CopyIcon,
  Download as DownloadIcon,
  Home,
  Sparkles,
  Filter,
  ChevronLeft,
  ChevronUp,
  Folder,
  FolderPlus,
  ArrowLeft,
  Move,
  Link,
  Calendar,
  Clock,
  Info,
  AlertTriangle,
  Settings,
  Menu,
  X,
  Check,
} from 'lucide-react';

// ===================== TYPES =====================

type SubCategoryItem = {
  id: string;
  name: string;
  description: string;
  icon: string;
  slug: string;
  parentCategoryId: string;
  parentCategoryName: string;
  level: number;
  productCount: number;
  active: boolean;
  featured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  productCounts?: {
    total: number;
    active: number;
    inactive: number;
  };
  metadata?: {
    metaTitle: string;
    metaDescription: string;
  };
};

type ParentCategory = {
  id: string;
  name: string;
  subCategoryCount: number;
};

// ===================== MOCK DATA =====================

const mockSubCategories: SubCategoryItem[] = [
  {
    id: 'sub_001',
    name: 'Maize Flour',
    description: 'Various maize flour products including fine, medium, and coarse grind',
    icon: 'Box',
    slug: 'maize-flour',
    parentCategoryId: 'cat_001',
    parentCategoryName: 'Cereals & Grains',
    level: 1,
    productCount: 45,
    active: true,
    featured: true,
    sortOrder: 1,
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-07-10T14:30:00Z',
    createdBy: 'Admin User',
    productCounts: {
      total: 45,
      active: 40,
      inactive: 5,
    },
    metadata: {
      metaTitle: 'Maize Flour Products - Best Quality',
      metaDescription: 'Shop premium maize flour products for all your baking needs',
    },
  },
  {
    id: 'sub_002',
    name: 'Rice',
    description: 'All rice varieties including long grain, basmati, and jasmine',
    icon: 'Box',
    slug: 'rice',
    parentCategoryId: 'cat_001',
    parentCategoryName: 'Cereals & Grains',
    level: 1,
    productCount: 32,
    active: true,
    featured: true,
    sortOrder: 2,
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-07-10T14:30:00Z',
    createdBy: 'Admin User',
    productCounts: {
      total: 32,
      active: 30,
      inactive: 2,
    },
  },
  {
    id: 'sub_003',
    name: 'Beans & Pulses',
    description: 'Dried beans, lentils, and other pulses',
    icon: 'Box',
    slug: 'beans-pulses',
    parentCategoryId: 'cat_001',
    parentCategoryName: 'Cereals & Grains',
    level: 1,
    productCount: 28,
    active: true,
    featured: false,
    sortOrder: 3,
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-07-10T14:30:00Z',
    createdBy: 'Admin User',
    productCounts: {
      total: 28,
      active: 25,
      inactive: 3,
    },
  },
  {
    id: 'sub_004',
    name: 'Soft Drinks',
    description: 'Carbonated and non-carbonated soft drinks',
    icon: 'Bottle',
    slug: 'soft-drinks',
    parentCategoryId: 'cat_002',
    parentCategoryName: 'Beverages',
    level: 1,
    productCount: 34,
    active: true,
    featured: false,
    sortOrder: 1,
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-07-10T14:30:00Z',
    createdBy: 'Admin User',
    productCounts: {
      total: 34,
      active: 32,
      inactive: 2,
    },
  },
  {
    id: 'sub_005',
    name: 'Juices',
    description: 'Fresh and packaged fruit and vegetable juices',
    icon: 'Apple',
    slug: 'juices',
    parentCategoryId: 'cat_002',
    parentCategoryName: 'Beverages',
    level: 1,
    productCount: 26,
    active: true,
    featured: false,
    sortOrder: 2,
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-07-10T14:30:00Z',
    createdBy: 'Admin User',
    productCounts: {
      total: 26,
      active: 24,
      inactive: 2,
    },
  },
  {
    id: 'sub_006',
    name: 'Cleaning Products',
    description: 'Surface cleaners, disinfectants, and household cleaning solutions',
    icon: 'Sparkles',
    slug: 'cleaning-products',
    parentCategoryId: 'cat_003',
    parentCategoryName: 'Household Supplies',
    level: 1,
    productCount: 54,
    active: true,
    featured: false,
    sortOrder: 1,
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-07-10T14:30:00Z',
    createdBy: 'Admin User',
    productCounts: {
      total: 54,
      active: 48,
      inactive: 6,
    },
  },
  {
    id: 'sub_007',
    name: 'Laundry Products',
    description: 'Laundry detergents, fabric softeners, and stain removers',
    icon: 'WashingMachine',
    slug: 'laundry-products',
    parentCategoryId: 'cat_003',
    parentCategoryName: 'Household Supplies',
    level: 1,
    productCount: 38,
    active: false,
    featured: false,
    sortOrder: 2,
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-07-10T14:30:00Z',
    createdBy: 'Admin User',
    productCounts: {
      total: 38,
      active: 0,
      inactive: 38,
    },
  },
  {
    id: 'sub_008',
    name: 'Shampoo & Conditioner',
    description: 'Hair care products including shampoos, conditioners, and treatments',
    icon: 'Scissors',
    slug: 'shampoo-conditioner',
    parentCategoryId: 'cat_005',
    parentCategoryName: 'Personal Care',
    level: 1,
    productCount: 29,
    active: true,
    featured: false,
    sortOrder: 1,
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-07-10T14:30:00Z',
    createdBy: 'Admin User',
    productCounts: {
      total: 29,
      active: 27,
      inactive: 2,
    },
  },
  {
    id: 'sub_009',
    name: 'Soap & Body Wash',
    description: 'Bath and shower products including bar soaps and body washes',
    icon: 'Shower',
    slug: 'soap-body-wash',
    parentCategoryId: 'cat_005',
    parentCategoryName: 'Personal Care',
    level: 1,
    productCount: 33,
    active: true,
    featured: true,
    sortOrder: 2,
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-07-10T14:30:00Z',
    createdBy: 'Admin User',
    productCounts: {
      total: 33,
      active: 30,
      inactive: 3,
    },
  },
];

const mockParentCategories: ParentCategory[] = [
  { id: 'cat_001', name: 'Cereals & Grains', subCategoryCount: 3 },
  { id: 'cat_002', name: 'Beverages', subCategoryCount: 2 },
  { id: 'cat_003', name: 'Household Supplies', subCategoryCount: 2 },
  { id: 'cat_004', name: 'Snacks & Confectionery', subCategoryCount: 0 },
  { id: 'cat_005', name: 'Personal Care', subCategoryCount: 2 },
];

// ===================== HELPER COMPONENTS =====================

// Status Badge Component
const StatusBadge = ({ active }: { active: boolean }) => {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
      active
        ? 'bg-success/10 text-success'
        : 'bg-muted text-muted-foreground'
    }`}>
      {active ? (
        <>
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </>
      ) : (
        <>
          <XCircle className="w-3 h-3 mr-1" />
          Inactive
        </>
      )}
    </span>
  );
};

// Featured Badge Component
const FeaturedBadge = ({ featured }: { featured: boolean }) => {
  if (!featured) return null;
  return (
    <span className="inline-flex items-center rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">
      <Star className="w-3 h-3 mr-1 fill-current" />
      Featured
    </span>
  );
};

// Icon Renderer
const CategoryIcon = ({ iconName, className = "w-5 h-5" }: { iconName: string; className?: string }) => {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    'Package': Package,
    'Box': Box,
    'FolderTree': FolderTree,
    'FolderOpen': FolderOpen,
    'FolderClosed': FolderClosed,
    'Coffee': Coffee,
    'Bottle': Bottle,
    'Apple': Apple,
    'Home': Home,
    'Sparkles': Sparkles,
    'WashingMachine': WashingMachine,
    'Candy': Candy,
    'User': User,
    'Scissors': Scissors,
    'Shower': Shower,
    'Tag': Tag,
    'Tags': Tags,
    'Hash': Hash,
    'Layers': Layers,
  };
  
  const IconComponent = iconMap[iconName] || FolderTree;
  return <IconComponent className={className} />;
};

// ===================== MAIN COMPONENT =====================

export default function BusinessSubCategoryList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'tree' | 'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'name' | 'productCount' | 'createdAt' | 'sortOrder' | 'parentCategory'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterParent, setFilterParent] = useState<string>('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategoryItem | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subCategoryToDelete, setSubCategoryToDelete] = useState<SubCategoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [subCategories, setSubCategories] = useState(mockSubCategories);
  const [parentCategories] = useState(mockParentCategories);
  
  // UI constants
  const shellCard = 'rounded-xl border border-border bg-card text-card-foreground shadow-sm';
  const primaryButton = 'rounded-lg bg-primary text-primary-foreground hover:bg-primary/90';
  const mutedIconButton = 'rounded hover:bg-surface-alt transition-colors text-muted-foreground';

  // Filter and sort sub-categories
  const filteredSubCategories = useMemo(() => {
    let result = [...subCategories];

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(sub => 
        sub.name.toLowerCase().includes(searchLower) ||
        sub.description.toLowerCase().includes(searchLower) ||
        sub.slug.toLowerCase().includes(searchLower) ||
        sub.parentCategoryName.toLowerCase().includes(searchLower)
      );
    }

    // Filter by status
    if (filterStatus === 'active') {
      result = result.filter(sub => sub.active);
    } else if (filterStatus === 'inactive') {
      result = result.filter(sub => !sub.active);
    }

    // Filter by parent category
    if (filterParent !== 'all') {
      result = result.filter(sub => sub.parentCategoryId === filterParent);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'productCount':
          comparison = a.productCount - b.productCount;
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'sortOrder':
          comparison = a.sortOrder - b.sortOrder;
          break;
        case 'parentCategory':
          comparison = a.parentCategoryName.localeCompare(b.parentCategoryName);
          break;
        default:
          comparison = a.name.localeCompare(b.name);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [subCategories, searchTerm, filterStatus, filterParent, sortBy, sortOrder]);

  // Total stats
  const stats = useMemo(() => ({
    total: subCategories.length,
    active: subCategories.filter(s => s.active).length,
    inactive: subCategories.filter(s => !s.active).length,
    featured: subCategories.filter(s => s.featured).length,
    totalProducts: subCategories.reduce((sum, sub) => sum + sub.productCount, 0),
    parentCount: parentCategories.filter(p => p.subCategoryCount > 0).length,
  }), [subCategories, parentCategories]);

  // Render tree view
  const renderTreeView = () => {
    const groupedByParent = subCategories.reduce((acc, sub) => {
      const key = sub.parentCategoryId;
      if (!acc[key]) {
        acc[key] = {
          parentName: sub.parentCategoryName,
          children: [],
        };
      }
      acc[key].children.push(sub);
      return acc;
    }, {} as Record<string, { parentName: string; children: SubCategoryItem[] }>);

    return (
      <div className="divide-y divide-border">
        {Object.entries(groupedByParent).map(([parentId, group]) => (
          <div key={parentId} className="overflow-hidden">
            <div className="flex items-center gap-3 bg-surface-alt/50 px-4 py-3">
              <FolderTree className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground">{group.parentName}</span>
              <span className="text-sm text-muted-foreground">
                ({group.children.length} sub-categories)
              </span>
            </div>
            <div className="divide-y divide-border">
              {group.children.map((sub) => (
                <div
                  key={sub.id}
                  className={`flex cursor-pointer items-center gap-3 px-4 py-3 pl-12 transition-colors hover:bg-surface-alt ${
                    selectedSubCategory?.id === sub.id ? 'bg-surface-alt' : ''
                  }`}
                  onClick={() => setSelectedSubCategory(sub)}
                >
                  <div className="p-2 rounded-lg bg-surface-alt">
                    <CategoryIcon iconName={sub.icon} className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">
                        {sub.name}
                      </span>
                      <StatusBadge active={sub.active} />
                      <FeaturedBadge featured={sub.featured} />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="truncate">{sub.description}</span>
                      <span>•</span>
                      <span>{sub.productCount} products</span>
                      <span>•</span>
                      <span>Slug: {sub.slug}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button className={`p-1.5 ${mutedIconButton} hover:text-primary`}>
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className={`p-1.5 ${mutedIconButton} hover:text-primary`}>
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      className={`p-1.5 ${mutedIconButton} hover:text-destructive`}
                      onClick={() => {
                        setSubCategoryToDelete(sub);
                        setShowDeleteModal(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render grid view
  const renderGridView = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
        {filteredSubCategories.map((sub) => (
          <div
            key={sub.id}
            className={`${shellCard} p-4 hover:shadow-md transition-shadow cursor-pointer group`}
            onClick={() => setSelectedSubCategory(sub)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="rounded-lg bg-primary/10 p-3 transition-colors group-hover:bg-primary/15">
                <CategoryIcon iconName={sub.icon} className="w-6 h-6 text-primary" />
              </div>
              <button className="rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-surface-alt">
                <MoreVertical className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            
            <h3 className="mb-1 truncate font-medium text-foreground">
              {sub.name}
            </h3>
            <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">
              {sub.description}
            </p>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FolderTree className="w-3 h-3" />
              <span className="truncate">{sub.parentCategoryName}</span>
            </div>
            
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Package className="w-3 h-3" />
                <span>{sub.productCount} products</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge active={sub.active} />
                {sub.featured && <Star className="w-3 h-3 fill-current text-warning" />}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render list view
  const renderListView = () => {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-surface-alt/60">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Sub-Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Parent Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Products
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Featured
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Created
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredSubCategories.map((sub) => (
              <tr 
                key={sub.id} 
                className="cursor-pointer transition-colors hover:bg-surface-alt/70"
                onClick={() => setSelectedSubCategory(sub)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded bg-surface-alt p-2">
                      <CategoryIcon iconName={sub.icon} className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{sub.name}</p>
                      <p className="max-w-xs truncate text-xs text-muted-foreground">{sub.description}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-foreground">
                  <div className="flex items-center gap-1">
                    <FolderTree className="w-3 h-3 text-muted-foreground" />
                    <span>{sub.parentCategoryName}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-foreground">
                  {sub.productCount}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge active={sub.active} />
                </td>
                <td className="px-4 py-3">
                  {sub.featured && (
                    <Star className="w-4 h-4 fill-current text-warning" />
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {new Date(sub.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <button className={`p-1.5 ${mutedIconButton} hover:text-primary`}>
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className={`p-1.5 ${mutedIconButton} hover:text-primary`}>
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      className={`p-1.5 ${mutedIconButton} hover:text-destructive`}
                      onClick={() => {
                        setSubCategoryToDelete(sub);
                        setShowDeleteModal(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {/* ===== HEADER ===== */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/inventory/categories')}
              className="rounded-lg p-2 transition-colors hover:bg-surface-alt"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
                <FolderOpen className="w-6 h-6 text-primary" />
                Sub-Categories
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage sub-categories within your product categories
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/inventory/subcategories/create')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-sm ${primaryButton}`}
          >
            <Plus className="w-4 h-4" />
            New Sub-Category
          </button>
          <button className={`${shellCard} p-2 transition-colors hover:bg-surface-alt`}>
            <DownloadIcon className="w-5 h-5 text-primary" />
          </button>
          <button className={`${shellCard} p-2 transition-colors hover:bg-surface-alt`}>
            <RefreshCw className="w-5 h-5 text-primary" />
          </button>
        </div>
      </div>

      {/* ===== STATS ===== */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div className={`${shellCard} p-4`}>
          <p className="text-sm text-muted-foreground">Total Sub-Categories</p>
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
        </div>
        <div className={`${shellCard} p-4`}>
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="text-2xl font-bold text-success">{stats.active}</p>
        </div>
        <div className={`${shellCard} p-4`}>
          <p className="text-sm text-muted-foreground">Inactive</p>
          <p className="text-2xl font-bold text-muted-foreground">{stats.inactive}</p>
        </div>
        <div className={`${shellCard} p-4`}>
          <p className="text-sm text-muted-foreground">Featured</p>
          <p className="text-2xl font-bold text-warning">{stats.featured}</p>
        </div>
        <div className={`${shellCard} p-4`}>
          <p className="text-sm text-muted-foreground">Total Products</p>
          <p className="text-2xl font-bold text-primary">{stats.totalProducts}</p>
        </div>
        <div className={`${shellCard} p-4`}>
          <p className="text-sm text-muted-foreground">Categories with Subs</p>
          <p className="text-2xl font-bold text-blue-500">{stats.parentCount}</p>
        </div>
      </div>

      {/* ===== TOOLBAR ===== */}
      <div className={`${shellCard} p-4 mb-6`}>
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search sub-categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={filterParent}
              onChange={(e) => setFilterParent(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Categories</option>
              {parentCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.subCategoryCount})
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="name">Sort by Name</option>
              <option value="parentCategory">Sort by Parent</option>
              <option value="productCount">Sort by Products</option>
              <option value="createdAt">Sort by Created</option>
              <option value="sortOrder">Sort by Order</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="rounded-lg border border-border bg-background p-2 transition-colors hover:bg-surface-alt"
            >
              {sortOrder === 'asc' ? 
                <ArrowUp className="w-4 h-4 text-foreground" /> : 
                <ArrowDown className="w-4 h-4 text-foreground" />
              }
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 rounded-lg bg-surface-alt p-1">
            <button
              onClick={() => setViewMode('tree')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'tree' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FolderTree className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'grid' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'list' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ===== SUB-CATEGORIES LIST ===== */}
      <div className={`${shellCard} overflow-hidden`}>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredSubCategories.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
            <FolderOpen className="mb-3 h-12 w-12 text-muted-foreground/40" />
            <p className="text-lg font-medium">No sub-categories found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div>
            {viewMode === 'tree' && renderTreeView()}
            {viewMode === 'grid' && renderGridView()}
            {viewMode === 'list' && renderListView()}
          </div>
        )}
      </div>

      {/* ===== FOOTER ===== */}
      <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
        <span>Showing {filteredSubCategories.length} of {subCategories.length} sub-categories</span>
        <span>Last updated: {new Date().toLocaleString()}</span>
      </div>

      {/* ===== DELETE MODAL ===== */}
      {showDeleteModal && subCategoryToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${shellCard} max-w-md w-full mx-4 p-6`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                Delete Sub-Category
              </h3>
            </div>
            <p className="mb-6 text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-semibold">{subCategoryToDelete.name}</span>? 
              This action cannot be undone and will affect {subCategoryToDelete.productCount} products.
            </p>
            <div className="mb-4 rounded-lg border border-warning/20 bg-warning/10 p-3">
              <p className="flex items-start gap-2 text-xs text-warning">
                <AlertTriangle className="w-4 h-4 mt-0.5" />
                <span>
                  This will also remove the sub-category from <strong>{subCategoryToDelete.parentCategoryName}</strong>.
                </span>
              </p>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSubCategoryToDelete(null);
                }}
                className="rounded-lg px-4 py-2 text-foreground transition-colors hover:bg-surface-alt"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle delete
                  setSubCategories((prev) => prev.filter((s) => s.id !== subCategoryToDelete.id));
                  setShowDeleteModal(false);
                  setSubCategoryToDelete(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Sub-Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== DETAIL SIDEBAR ===== */}
      {selectedSubCategory && (
        <div className="fixed inset-y-0 right-0 w-96 bg-card shadow-xl border-l border-border transform transition-transform z-40 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Sub-Category Details</h3>
              <button
                onClick={() => setSelectedSubCategory(null)}
                className="rounded p-1 hover:bg-surface-alt transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Icon and Name */}
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <CategoryIcon iconName={selectedSubCategory.icon} className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-foreground">{selectedSubCategory.name}</h4>
                  <p className="text-sm text-muted-foreground">{selectedSubCategory.slug}</p>
                </div>
              </div>

              {/* Parent Category */}
              <div className="flex items-center gap-2 rounded-lg bg-surface-alt p-3">
                <FolderTree className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">Parent: </span>
                <span className="text-sm font-medium">{selectedSubCategory.parentCategoryName}</span>
              </div>

              {/* Description */}
              <div className="border-t border-border pt-4">
                <p className="text-sm text-muted-foreground">{selectedSubCategory.description}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-surface-alt p-3">
                  <p className="text-xs text-muted-foreground">Total Products</p>
                  <p className="text-lg font-bold text-foreground">{selectedSubCategory.productCount}</p>
                </div>
                <div className="rounded-lg bg-surface-alt p-3">
                  <p className="text-xs text-muted-foreground">Sort Order</p>
                  <p className="text-lg font-bold text-foreground">{selectedSubCategory.sortOrder}</p>
                </div>
              </div>

              {/* Product Breakdown */}
              {selectedSubCategory.productCounts && (
                <div className="rounded-lg bg-surface-alt p-3">
                  <p className="text-xs text-muted-foreground mb-2">Product Breakdown</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-success" />
                      <span className="text-sm font-medium text-foreground">{selectedSubCategory.productCounts.active}</span>
                      <span className="text-xs text-muted-foreground">Active</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{selectedSubCategory.productCounts.inactive}</span>
                      <span className="text-xs text-muted-foreground">Inactive</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center gap-4">
                <StatusBadge active={selectedSubCategory.active} />
                {selectedSubCategory.featured && <FeaturedBadge featured={true} />}
              </div>

              {/* Meta Data */}
              {selectedSubCategory.metadata && (
                <div className="border-t border-border pt-4">
                  <h5 className="text-sm font-medium text-foreground mb-2">SEO Metadata</h5>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Meta Title</p>
                      <p className="text-foreground">{selectedSubCategory.metadata.metaTitle || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Meta Description</p>
                      <p className="text-sm text-muted-foreground">{selectedSubCategory.metadata.metaDescription || 'Not set'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="border-t border-border pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span className="text-foreground">
                    {new Date(selectedSubCategory.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created By</span>
                  <span className="text-foreground">{selectedSubCategory.createdBy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="text-foreground">
                    {new Date(selectedSubCategory.updatedAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-border pt-4 flex flex-col gap-2">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                  <Edit className="w-4 h-4" />
                  Edit Sub-Category
                </button>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-surface-alt text-foreground rounded-lg hover:bg-surface-alt/80 transition-colors">
                  <Eye className="w-4 h-4" />
                  View Products
                </button>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 text-destructive bg-destructive/10 rounded-lg hover:bg-destructive/20 transition-colors">
                  <Trash2 className="w-4 h-4" />
                  Delete Sub-Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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

const TagsIcon = Tags;