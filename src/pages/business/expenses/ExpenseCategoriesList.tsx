import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  AlertCircle,
  FolderTree,
  Hash,
  Layers,
  Tag,
  ToggleLeft,
  ToggleRight,
  Calendar,
} from 'lucide-react';

type ExpenseCategoryRecord = {
  id: string;
  name: string;
  code: string;
  description: string;
  parentName: string;
  active: boolean;
  sortOrder: number;
  addedBy: string;
  addedAt: string;
};

type ExpenseCategoryFormState = {
  name: string;
  code: string;
  description: string;
  parentName: string;
  active: boolean;
  sortOrder: number;
};

const initialExpenseCategories: ExpenseCategoryRecord[] = [
  {
    id: '1',
    name: 'Utilities',
    code: 'UTIL',
    description: 'Electricity, water, internet, and related overheads.',
    parentName: 'General Expenses',
    active: true,
    sortOrder: 1,
    addedBy: 'Current User',
    addedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Transport',
    code: 'TRNS',
    description: 'Fuel, delivery, logistics, and travel costs.',
    parentName: 'General Expenses',
    active: true,
    sortOrder: 2,
    addedBy: 'Current User',
    addedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Office Supplies',
    code: 'OFFC',
    description: 'Stationery, print consumables, and office materials.',
    parentName: 'Operations',
    active: false,
    sortOrder: 3,
    addedBy: 'Current User',
    addedAt: new Date().toISOString(),
  },
];

export default function ExpenseCategoriesList() {
  const [categories, setCategories] = useState<ExpenseCategoryRecord[]>(initialExpenseCategories);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategoryRecord | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<ExpenseCategoryRecord | null>(null);
  const [formData, setFormData] = useState<ExpenseCategoryFormState>({
    name: '',
    code: '',
    description: '',
    parentName: '',
    active: true,
    sortOrder: 0,
  });
  const [formError, setFormError] = useState<string | null>(null);

  const shellCard = 'rounded-xl border border-border bg-card text-card-foreground shadow-sm';
  const primaryButton = 'rounded-lg bg-primary text-primary-foreground hover:bg-primary/90';
  const mutedButton = 'rounded-lg border border-border bg-background text-foreground hover:bg-surface-alt';

  const filteredCategories = useMemo(() => {
    const searchLower = searchTerm.trim().toLowerCase();
    if (!searchLower) return categories;

    return categories.filter(
      (category) =>
        category.name.toLowerCase().includes(searchLower) ||
        category.code.toLowerCase().includes(searchLower) ||
        category.description.toLowerCase().includes(searchLower) ||
        category.parentName.toLowerCase().includes(searchLower) ||
        category.addedBy.toLowerCase().includes(searchLower),
    );
  }, [categories, searchTerm]);

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      parentName: '',
      active: true,
      sortOrder: 0,
    });
    setFormError(null);
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (category: ExpenseCategoryRecord) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      code: category.code,
      description: category.description,
      parentName: category.parentName,
      active: category.active,
      sortOrder: category.sortOrder,
    });
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormError(null);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      setFormError('Expense category name is required.');
      return;
    }

    if (!formData.code.trim()) {
      setFormError('Expense category code is required.');
      return;
    }

    const payload: ExpenseCategoryRecord = {
      id: editingCategory?.id ?? crypto.randomUUID(),
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      description: formData.description.trim(),
      parentName: formData.parentName.trim() || 'General Expenses',
      active: formData.active,
      sortOrder: Number.isFinite(formData.sortOrder) ? formData.sortOrder : 0,
      addedBy: editingCategory?.addedBy ?? 'Current User',
      addedAt: editingCategory?.addedAt ?? new Date().toISOString(),
    };

    setCategories((current) => {
      if (editingCategory) {
        return current.map((category) => (category.id === editingCategory.id ? payload : category));
      }
      return [payload, ...current];
    });

    toast.success(
      editingCategory ? 'Expense category updated successfully.' : 'Expense category created successfully.',
      { position: 'top-right' },
    );
    closeModal();
  };

  const handleDelete = () => {
    if (!categoryToDelete) return;

    setCategories((current) => current.filter((category) => category.id !== categoryToDelete.id));
    toast.success('Expense category deleted successfully.', { position: 'top-right' });
    setCategoryToDelete(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <FolderTree className="h-6 w-6 text-primary" />
            Expense Categories
          </h1>
          <p className="text-sm text-muted-foreground">Manage the expense category structure for your business</p>
        </div>

        <div className="flex items-center gap-3">
          <button type="button" onClick={openCreateModal} className={`flex items-center gap-2 px-4 py-2 ${primaryButton}`}>
            <Plus className="h-4 w-4" />
            Add Category
          </button>
          <button
            type="button"
            onClick={() => {
              setCategories(initialExpenseCategories);
              toast.success('Expense categories refreshed.', { position: 'top-right' });
            }}
            className={`${shellCard} p-2 transition-colors hover:bg-surface-alt`}
          >
            <RefreshCw className="h-5 w-5 text-primary" />
          </button>
        </div>
      </div>

      <div className={`${shellCard} mb-6 p-4`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search expense categories..."
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {filteredCategories.length === 0 ? (
        <div className={`${shellCard} flex h-64 flex-col items-center justify-center text-muted-foreground`}>
          <FolderTree className="mb-3 h-12 w-12 text-muted-foreground/40" />
          <p className="text-lg font-medium">No expense categories found</p>
          <p className="text-sm">Try adjusting your search or add a new category</p>
        </div>
      ) : (
        <div className={`${shellCard} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-surface-alt/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Parent
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Added At
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCategories.map((category) => (
                  <tr key={category.id} className="transition-colors hover:bg-surface-alt/70">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded bg-surface-alt p-2">
                          <Layers className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{category.name}</p>
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Hash className="h-3 w-3" />
                            {category.code}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <span>{category.parentName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <p className="max-w-md truncate">{category.description || 'No description added'}</p>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          category.active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {category.active ? (
                          <>
                            <ToggleRight className="mr-1 h-3 w-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="mr-1 h-3 w-3" />
                            Inactive
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(category.addedAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(category)}
                          className={`${mutedButton} p-2 transition-colors`}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCategoryToDelete(category)}
                          className={`${mutedButton} p-2 text-destructive transition-colors hover:bg-destructive/10`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className={`${shellCard} w-full max-w-2xl p-6`}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {editingCategory ? 'Edit Expense Category' : 'Add Expense Category'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {editingCategory ? 'Update the category details below.' : 'Create a new expense category below.'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-surface-alt"
              >
                Close
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-foreground">Name</span>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((current) => ({ ...current, name: e.target.value }))}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. Utilities"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-foreground">Code</span>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData((current) => ({ ...current, code: e.target.value }))}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. UTIL"
                />
              </label>

              <label className="grid gap-2 md:col-span-2">
                <span className="text-sm font-medium text-foreground">Description</span>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((current) => ({ ...current, description: e.target.value }))}
                  className="min-h-24 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Describe what this expense category is used for"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-foreground">Parent Category</span>
                <input
                  type="text"
                  value={formData.parentName}
                  onChange={(e) => setFormData((current) => ({ ...current, parentName: e.target.value }))}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. General Expenses"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-foreground">Sort Order</span>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData((current) => ({
                      ...current,
                      sortOrder: Number(e.target.value),
                    }))
                  }
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>

              <label className="flex items-center gap-3 md:col-span-2">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData((current) => ({ ...current, active: e.target.checked }))}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
                />
                <span className="text-sm font-medium text-foreground">Active</span>
              </label>
            </div>

            {formError ? (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            ) : null}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button type="button" onClick={closeModal} className={`px-4 py-2 ${mutedButton}`}>
                Cancel
              </button>
              <button type="button" onClick={handleSubmit} className={`px-4 py-2 ${primaryButton}`}>
                {editingCategory ? 'Update Category' : 'Save Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className={`${shellCard} w-full max-w-md p-6`}>
            <h2 className="text-lg font-semibold text-foreground">Delete Expense Category</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-medium text-foreground">{categoryToDelete.name}</span>?
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button type="button" onClick={() => setCategoryToDelete(null)} className={`px-4 py-2 ${mutedButton}`}>
                Cancel
              </button>
              <button type="button" onClick={handleDelete} className="rounded-lg bg-destructive px-4 py-2 text-destructive-foreground hover:bg-destructive/90">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
