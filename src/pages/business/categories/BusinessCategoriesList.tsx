import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Select, { type StylesConfig } from 'react-select';
import {
  Search, 
  Plus,
  Edit,
  Trash2, 
  ChevronDown, 
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
  ChevronRight, 
  Download as DownloadIcon, 
  Tags,
  Home,
  Sparkles, 
} from 'lucide-react';
import { type CategoryItem, useCategories } from '@/hooks/business/categories/useCategories';

type StatusBadgeProps = {
  active: boolean;
};

type FeaturedBadgeProps = {
  featured: boolean;
};

type CategoryIconProps = {
  iconName: string;
  className?: string;
};

type SelectOption<T extends string> = {
  value: T;
  label: string;
};

const selectStyles: StylesConfig<any, false> = {
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

const statusOptions: SelectOption<'all' | 'active' | 'inactive'>[] = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const sortOptions: SelectOption<'name' | 'productCount' | 'createdAt' | 'sortOrder'>[] = [
  { value: 'name', label: 'Sort by Name' },
  { value: 'productCount', label: 'Sort by Products' },
  { value: 'createdAt', label: 'Sort by Created' },
  { value: 'sortOrder', label: 'Sort by Order' },
];

// ===================== HELPER COMPONENTS =====================

// Status Badge Component
const StatusBadge = ({ active }: StatusBadgeProps) => {
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
const FeaturedBadge = ({ featured }: FeaturedBadgeProps) => {
  if (!featured) return null;
  return (
    <span className="inline-flex items-center rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">
      <Star className="w-3 h-3 mr-1 fill-current" />
      Featured
    </span>
  );
};

// Icon Renderer
const CategoryIcon = ({ iconName, className = "w-5 h-5" }: CategoryIconProps) => {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    'Package': Package,
    'Box': Box,
    'FolderTree': FolderTree,
    'FolderOpen': FolderOpen,
    'FolderClosed': FolderClosed,
    'Home': Home,
    'Sparkles': Sparkles,
    'User': User,
    'Tag': Tag,
    'Tags': Tags,
    'Hash': Hash,
    'Layers': Layers,
  };
  
  const IconComponent = iconMap[iconName] || FolderTree;
  return <IconComponent className={className} />;
};

// ===================== MAIN COMPONENT =====================

export default function BusinessCategoriesList() {
  const { categories, isLoading, error, fetchCategories, deleteCategory } = useCategories();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'tree' | 'grid' | 'list'>('tree');
  const [sortBy, setSortBy] = useState<'name' | 'productCount' | 'createdAt' | 'sortOrder'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null);
  const shellCard = 'rounded-xl border border-border bg-card text-card-foreground shadow-sm';
  const primaryButton = 'rounded-lg bg-primary text-primary-foreground hover:bg-primary/90';
  const mutedIconButton = 'rounded hover:bg-surface-alt transition-colors text-muted-foreground';
  const navigate = useNavigate();

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  const handleRefresh = async () => {
    await fetchCategories();
  };

  const selectedStatusOption = useMemo(
    () => statusOptions.find((option) => option.value === filterStatus) ?? statusOptions[0],
    [filterStatus],
  );
  const selectedSortOption = useMemo(
    () => sortOptions.find((option) => option.value === sortBy) ?? sortOptions[0],
    [sortBy],
  );

  // Toggle expand/collapse
  const toggleExpand = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Filter and sort categories
  const filteredCategories = useMemo(() => {
    let result = [...categories];

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(cat => 
        cat.name.toLowerCase().includes(searchLower) ||
        cat.description.toLowerCase().includes(searchLower) ||
        cat.slug.toLowerCase().includes(searchLower)
      );
    }

    // Filter by status
    if (filterStatus === 'active') {
      result = result.filter(cat => cat.active);
    } else if (filterStatus === 'inactive') {
      result = result.filter(cat => !cat.active);
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
        default:
          comparison = a.name.localeCompare(b.name);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [categories, searchTerm, filterStatus, sortBy, sortOrder]);

  // Total stats
  const stats = useMemo(() => ({
    total: categories.length,
    active: categories.filter(c => c.active).length,
    inactive: categories.filter(c => !c.active).length,
    featured: categories.filter(c => c.featured).length,
    totalProducts: categories.reduce((sum, cat) => sum + cat.productCount, 0),
  }), [categories]);

  // Render category tree item
  const renderCategoryTree = (category: CategoryItem, level = 0) => {
    const isExpanded = expandedCategories.has(category.id);
    const hasSubCategories = category.subCategories && category.subCategories.length > 0;
    const isSelected = selectedCategory?.id === category.id;

    return (
      <div key={category.id} className="border-b border-border last:border-0">
        <div 
          className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-alt ${
            isSelected ? 'bg-surface-alt' : ''
          }`}
          style={{ paddingLeft: `${level * 24 + 16}px` }}
          onClick={() => setSelectedCategory(category)}
        >
          {/* Expand/Collapse Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (hasSubCategories) toggleExpand(category.id);
            }}
            className={`rounded p-1 transition-colors hover:bg-surface-alt ${
              !hasSubCategories ? 'opacity-0' : ''
            }`}
          >
            {hasSubCategories && (
              isExpanded ? 
                <ChevronDown className="w-4 h-4 text-muted-foreground" /> : 
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {/* Icon */}
          <div className={`p-2 rounded-lg ${
            isSelected ? 'bg-primary/10 text-primary' : 'bg-surface-alt text-muted-foreground'
          }`}>
            <CategoryIcon iconName={category.icon} className="w-4 h-4" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium text-foreground">
                {category.name}
              </span>
              <StatusBadge active={category.active} />
              <FeaturedBadge featured={category.featured} />
              {hasSubCategories && (
                <span className="text-xs text-muted-foreground">
                  ({category.subCategories.length})
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="truncate">{category.description}</span>
              <span>•</span>
              <span>{category.productCount} products</span>
              <span>•</span>
              <span>Slug: {category.slug}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
            <button className={`p-1.5 ${mutedIconButton} hover:text-primary`}>
              <Eye className="w-4 h-4" />
            </button>
            <button className={`p-1.5 ${mutedIconButton} hover:text-primary`}>
              <Edit className="w-4 h-4" />
            </button>
            <button className={`p-1.5 ${mutedIconButton} hover:text-destructive`}>
              <CopyIcon className="w-4 h-4" />
            </button>
            <button 
              className={`p-1.5 ${mutedIconButton} hover:text-destructive`}
              onClick={() => {
                setCategoryToDelete(category);
                setShowDeleteModal(true);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-categories */}
        {hasSubCategories && isExpanded && (
          <div>
            {category.subCategories.map((subCat) => 
              renderCategoryTree(subCat, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  // Render grid view
  const renderGridView = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredCategories.map(category => (
          <div
            key={category.id}
            className={`${shellCard} p-4 hover:shadow-md transition-shadow cursor-pointer group`}
            onClick={() => setSelectedCategory(category)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="rounded-lg bg-primary/10 p-3 transition-colors group-hover:bg-primary/15">
                <CategoryIcon iconName={category.icon} className="w-6 h-6 text-primary" />
              </div>
              <button className="rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-surface-alt">
                <MoreVertical className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            
            <h3 className="mb-1 truncate font-medium text-foreground">
              {category.name}
            </h3>
            <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
              {category.description}
            </p>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Package className="w-3 h-3" />
                <span>{category.productCount} products</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge active={category.active} />
                {category.featured && <Star className="w-3 h-3 fill-current text-warning" />}
              </div>
            </div>

            {category.subCategories && category.subCategories.length > 0 && (
              <div className="mt-2 border-t border-border pt-2">
                <div className="flex flex-wrap gap-1">
                  <FolderTree className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {category.subCategories.length} sub-categories
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render list view
  const renderListView = () => {
    return (
      <div className={`${shellCard} overflow-hidden`}>
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-surface-alt/60">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Category
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
            {filteredCategories.map(category => (
              <tr 
                key={category.id} 
                className="cursor-pointer transition-colors hover:bg-surface-alt/70"
                onClick={() => setSelectedCategory(category)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded bg-surface-alt p-2">
                      <CategoryIcon iconName={category.icon} className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{category.name}</p>
                      <p className="max-w-xs truncate text-xs text-muted-foreground">{category.description}</p>
                      {category.subCategories && category.subCategories.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {category.subCategories.length} sub-categories
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-foreground">
                  {category.productCount}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge active={category.active} />
                </td>
                <td className="px-4 py-3">
                  {category.featured && (
                    <Star className="w-4 h-4 fill-current text-warning" />
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {new Date(category.createdAt).toLocaleDateString()}
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
                        setCategoryToDelete(category);
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
    <div className="min-h-screen bg-background">
      {/* ===== HEADER ===== */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <FolderTree className="w-6 h-6 text-primary" />
            Categories
          </h1>
          <p className="text-sm text-muted-foreground">Manage your product categories and sub-categories</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/inventory/subcategories')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-sm ${primaryButton}`}
          >
            <Plus className="w-4 h-4" />
            New Sub  Category
          </button>
          <button
            type="button"
            onClick={() => navigate('/inventory/categories/create')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-sm ${primaryButton}`}
          >
            <Plus className="w-4 h-4" />
            New Category
          </button>
          <button className={`${shellCard} p-2 transition-colors hover:bg-surface-alt`}>
            <DownloadIcon className="w-5 h-5 text-primary" />
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            className={`${shellCard} p-2 transition-colors hover:bg-surface-alt`}
          >
            <RefreshCw className="w-5 h-5 text-primary" />
          </button>
        </div>
      </div>
 

      {/* ===== TOOLBAR ===== */}
      <div className={`${shellCard} p-4 mb-6`}>
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-50">
              <div className="relative">
              <Search className="absolute left-3 top-1/2 w-4 h-4 outline:none focus:border-primary -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

          {/* Filters */}
          <div className="flex min-w-85 items-center gap-2">
            <div className="min-w-37.5">
              <Select<SelectOption<'all' | 'active' | 'inactive'>, false>
                instanceId="category-status-select"
                isSearchable
                isClearable={false}
                options={statusOptions}
                value={selectedStatusOption}
                onChange={(option) => {
                  if (option) setFilterStatus(option.value);
                }}
                styles={selectStyles}
                placeholder="All Status"
              />
            </div>

            <div className="min-w-[180px]">
              <Select<SelectOption<'name' | 'productCount' | 'createdAt' | 'sortOrder'>, false>
                instanceId="category-sort-select"
                isSearchable
                isClearable={false}
                options={sortOptions}
                value={selectedSortOption}
                onChange={(option) => {
                  if (option) setSortBy(option.value);
                }}
                styles={selectStyles}
                placeholder="Sort by"
              />
            </div>

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

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {/* ===== CATEGORIES LIST ===== */}
      <div className={`${shellCard} overflow-hidden`}>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
            <FolderTree className="mb-3 h-12 w-12 text-muted-foreground/40" />
            <p className="text-lg font-medium">No categories found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div>
            {viewMode === 'tree' && (
              <div className="divide-y divide-border">
                {filteredCategories.map(category => renderCategoryTree(category, 0))}
              </div>
            )}
            {viewMode === 'grid' && renderGridView()}
            {viewMode === 'list' && renderListView()}
          </div>
        )}
      </div>

      {/* ===== FOOTER ===== */}
      <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
        <span>Showing {filteredCategories.length} of {categories.length} categories</span>
        <span>Last updated: {new Date().toLocaleString()}</span>
      </div>

      {/* ===== DELETE MODAL ===== */}
      {showDeleteModal && categoryToDelete && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${shellCard} max-w-md w-full mx-4 p-6`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                Delete Category
              </h3>
            </div>
            <p className="mb-6 text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-semibold">{categoryToDelete.name}</span>? 
              This action cannot be undone and will affect {categoryToDelete.productCount} products.
            </p>
            {categoryToDelete.subCategories && categoryToDelete.subCategories.length > 0 && (
              <div className="mb-4 rounded-lg border border-warning/20 bg-warning/10 p-3">
                <p className="flex items-start gap-2 text-xs text-warning">
                  <AlertCircle className="w-4 h-4 mt-0.5" />
                  <span>
                    This category has {categoryToDelete.subCategories.length} sub-categories that will also be affected.
                    Consider moving or reassigning them first.
                  </span>
                </p>
              </div>
            )}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setCategoryToDelete(null);
                }}
                className="rounded-lg px-4 py-2 text-foreground transition-colors hover:bg-surface-alt"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  // Handle delete
                  await deleteCategory(categoryToDelete.id);
                  setShowDeleteModal(false);
                  setCategoryToDelete(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
