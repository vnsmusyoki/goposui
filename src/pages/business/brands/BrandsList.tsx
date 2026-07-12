import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  AlertCircle,
  Package,
  Calendar,
  User,
} from 'lucide-react';
import { useBusinessBrands, type BrandRecord } from '@/hooks/business/brands/useBusinessBrands';

type BrandFormState = {
  name: string;
  shortDescription: string;
};

export default function BrandsList() {
  const { brands, isLoading, isSaving, error, loadBrands, createBrand, updateBrand, deleteBrand, clearError } =
    useBusinessBrands();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandRecord | null>(null);
  const [brandToDelete, setBrandToDelete] = useState<BrandRecord | null>(null);
  const [formData, setFormData] = useState<BrandFormState>({
    name: '',
    shortDescription: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const shellCard = 'rounded-xl border border-border bg-card text-card-foreground shadow-sm';
  const primaryButton = 'rounded-lg bg-primary text-primary-foreground hover:bg-primary/90';
  const mutedButton = 'rounded-lg border border-border bg-background text-foreground hover:bg-surface-alt';

  useEffect(() => {
    void loadBrands();
  }, [loadBrands]);

  useEffect(() => {
    if (error) {
      toast.error(error, { position: 'top-right' });
      clearError();
    }
  }, [clearError, error]);

  const filteredBrands = useMemo(() => {
    const searchLower = searchTerm.trim().toLowerCase();
    if (!searchLower) return brands;

    return brands.filter(
      (brand) =>
        brand.name.toLowerCase().includes(searchLower) ||
        brand.shortDescription.toLowerCase().includes(searchLower) ||
        brand.addedBy.toLowerCase().includes(searchLower),
    );
  }, [brands, searchTerm]);

  const openCreateModal = () => {
    setEditingBrand(null);
    setFormData({
      name: '',
      shortDescription: '',
    });
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (brand: BrandRecord) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      shortDescription: brand.shortDescription,
    });
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBrand(null);
    setFormError(null);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setFormError('Brand name is required.');
      return;
    }

    try {
      if (editingBrand) {
        const response = await updateBrand(editingBrand.id, {
          name: formData.name.trim(),
          shortDescription: formData.shortDescription.trim(),
        });
        toast.success(response.message || 'Brand updated successfully.', { position: 'top-right' });
      } else {
        const response = await createBrand({
          name: formData.name.trim(),
          shortDescription: formData.shortDescription.trim(),
        });
        toast.success(response.message || 'Brand created successfully.', { position: 'top-right' });
      }
      closeModal();
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : 'Unable to save brand.', {
        position: 'top-right',
      });
    }
  };

  const handleDelete = async () => {
    if (!brandToDelete) return;

    try {
      const response = await deleteBrand(brandToDelete.id);
      toast.success(response.message || 'Brand deleted successfully.', { position: 'top-right' });
      setBrandToDelete(null);
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : 'Unable to delete brand.', {
        position: 'top-right',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Package className="h-6 w-6 text-primary" />
            Brands
          </h1>
          <p className="text-sm text-muted-foreground">Manage your product brands</p>
        </div>

        <div className="flex items-center gap-3">
          <button type="button" onClick={openCreateModal} className={`flex items-center gap-2 px-4 py-2 ${primaryButton}`}>
            <Plus className="h-4 w-4" />
            Add Brand
          </button>
          <button type="button" onClick={() => void loadBrands()} className={`${shellCard} p-2 transition-colors hover:bg-surface-alt`}>
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
            placeholder="Search brands..."
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredBrands.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
          <Package className="mb-3 h-12 w-12 text-muted-foreground/40" />
          <p className="text-lg font-medium">No brands found</p>
          <p className="text-sm">Try adjusting your search or add a new brand</p>
        </div>
      ) : (
        <div className={`${shellCard} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-surface-alt/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Brand
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Added By
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
                {filteredBrands.map((brand) => (
                  <tr key={brand.id} className="transition-colors hover:bg-surface-alt/70">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded bg-surface-alt p-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-foreground">{brand.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <p className="max-w-md truncate">{brand.shortDescription || 'No description added'}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{brand.addedBy || 'Current User'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{brand.addedAt ? new Date(brand.addedAt).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(brand)}
                          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${mutedButton}`}
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setBrandToDelete(brand)}
                          className="inline-flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
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

      <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
        <span>Showing {filteredBrands.length} of {brands.length} brands</span>
        <span>Last updated: {new Date().toLocaleString()}</span>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className={`${shellCard} w-full max-w-lg p-6`}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                {editingBrand ? 'Edit Brand' : 'Add Brand'}
              </h3>
              <button type="button" onClick={closeModal} className="rounded p-1 hover:bg-surface-alt">
                <span className="text-muted-foreground">✕</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Brand Name *</label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. Coca-Cola"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Short Description</label>
                <textarea
                  value={formData.shortDescription}
                  onChange={(e) => setFormData((prev) => ({ ...prev, shortDescription: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                  rows={4}
                  placeholder="Short note about the brand"
                />
              </div>
              {formError && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                  {formError}
                </div>
              )}
              <div className="flex items-center justify-end gap-3">
                <button type="button" onClick={closeModal} className="rounded-lg px-4 py-2 text-foreground hover:bg-surface-alt">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className={`rounded-lg px-4 py-2 font-medium ${primaryButton} disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {isSaving ? 'Saving...' : editingBrand ? 'Update Brand' : 'Create Brand'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {brandToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className={`${shellCard} w-full max-w-md p-6`}>
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-full bg-destructive/10 p-2 text-destructive">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Delete Brand</h3>
            </div>
            <p className="mb-6 text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-semibold text-foreground">{brandToDelete.name}</span>?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button type="button" onClick={() => setBrandToDelete(null)} className="rounded-lg px-4 py-2 text-foreground hover:bg-surface-alt">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSaving}
                className="rounded-lg bg-destructive px-4 py-2 font-medium text-white hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? 'Deleting...' : 'Delete Brand'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
