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
  Clock3,
} from 'lucide-react';
import { useBusinessWarranties, type WarrantyRecord } from '@/hooks/business/warranties/useBusinessWarranties';

type WarrantyFormState = {
  name: string;
  description: string;
  durationValue: number;
  durationUnit: 'days' | 'months';
};

export default function WarrantiesList() {
  const { warranties, isLoading, isSaving, error, loadWarranties, createWarranty, updateWarranty, deleteWarranty, clearError } =
    useBusinessWarranties();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingWarranty, setEditingWarranty] = useState<WarrantyRecord | null>(null);
  const [warrantyToDelete, setWarrantyToDelete] = useState<WarrantyRecord | null>(null);
  const [formData, setFormData] = useState<WarrantyFormState>({
    name: '',
    description: '',
    durationValue: 0,
    durationUnit: 'days',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const shellCard = 'rounded-xl border border-border bg-card text-card-foreground shadow-sm';
  const primaryButton = 'rounded-lg bg-primary text-primary-foreground hover:bg-primary/90';
  const mutedButton = 'rounded-lg border border-border bg-background text-foreground hover:bg-surface-alt';

  useEffect(() => {
    void loadWarranties();
  }, [loadWarranties]);

  useEffect(() => {
    if (error) {
      toast.error(error, { position: 'top-right' });
      clearError();
    }
  }, [clearError, error]);

  const filteredWarranties = useMemo(() => {
    const searchLower = searchTerm.trim().toLowerCase();
    if (!searchLower) return warranties;

    return warranties.filter(
      (warranty) =>
        warranty.name.toLowerCase().includes(searchLower) ||
        warranty.description.toLowerCase().includes(searchLower) ||
        warranty.addedBy.toLowerCase().includes(searchLower),
    );
  }, [searchTerm, warranties]);

  const openCreateModal = () => {
    setEditingWarranty(null);
    setFormData({
      name: '',
      description: '',
      durationValue: 0,
      durationUnit: 'days',
    });
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (warranty: WarrantyRecord) => {
    setEditingWarranty(warranty);
    setFormData({
      name: warranty.name,
      description: warranty.description,
      durationValue: warranty.durationValue,
      durationUnit: warranty.durationUnit,
    });
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingWarranty(null);
    setFormError(null);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setFormError('Warranty name is required.');
      return;
    }
    if (formData.durationValue < 0) {
      setFormError('Duration cannot be negative.');
      return;
    }

    try {
      if (editingWarranty) {
        const response = await updateWarranty(editingWarranty.id, {
          name: formData.name.trim(),
          description: formData.description.trim(),
          durationValue: formData.durationValue,
          durationUnit: formData.durationUnit,
        });
        toast.success(response.message || 'Warranty updated successfully.', { position: 'top-right' });
      } else {
        const response = await createWarranty({
          name: formData.name.trim(),
          description: formData.description.trim(),
          durationValue: formData.durationValue,
          durationUnit: formData.durationUnit,
        });
        toast.success(response.message || 'Warranty created successfully.', { position: 'top-right' });
      }
      closeModal();
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : 'Unable to save warranty.', {
        position: 'top-right',
      });
    }
  };

  const handleDelete = async () => {
    if (!warrantyToDelete) return;

    try {
      const response = await deleteWarranty(warrantyToDelete.id);
      toast.success(response.message || 'Warranty deleted successfully.', { position: 'top-right' });
      setWarrantyToDelete(null);
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : 'Unable to delete warranty.', {
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
            Warranties
          </h1>
          <p className="text-sm text-muted-foreground">Manage your product warranties</p>
        </div>

        <div className="flex items-center gap-3">
          <button type="button" onClick={openCreateModal} className={`flex items-center gap-2 px-4 py-2 ${primaryButton}`}>
            <Plus className="h-4 w-4" />
            Add Warranty
          </button>
          <button type="button" onClick={() => void loadWarranties()} className={`${shellCard} p-2 transition-colors hover:bg-surface-alt`}>
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
            placeholder="Search warranties..."
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredWarranties.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
          <Package className="mb-3 h-12 w-12 text-muted-foreground/40" />
          <p className="text-lg font-medium">No warranties found</p>
          <p className="text-sm">Try adjusting your search or add a new warranty</p>
        </div>
      ) : (
        <div className={`${shellCard} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-surface-alt/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Warranty
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Duration
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
                {filteredWarranties.map((warranty) => (
                  <tr key={warranty.id} className="transition-colors hover:bg-surface-alt/70">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded bg-surface-alt p-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-foreground">{warranty.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <p className="max-w-md truncate">{warranty.description || 'No description added'}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      <div className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {warranty.durationValue} {warranty.durationUnit}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      <div className="flex items-center gap-2">
                        <span>{warranty.addedBy || 'Current User'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{warranty.addedAt ? new Date(warranty.addedAt).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(warranty)}
                          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${mutedButton}`}
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setWarrantyToDelete(warranty)}
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
        <span>Showing {filteredWarranties.length} of {warranties.length} warranties</span>
        <span>Last updated: {new Date().toLocaleString()}</span>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className={`${shellCard} w-full max-w-lg p-6`}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                {editingWarranty ? 'Edit Warranty' : 'Add Warranty'}
              </h3>
              <button type="button" onClick={closeModal} className="rounded p-1 hover:bg-surface-alt">
                <span className="text-muted-foreground">✕</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Warranty Name *</label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. 1 Year Warranty"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                  rows={3}
                  placeholder="Short description of the warranty"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Duration *</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.durationValue}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        durationValue: Number(e.target.value),
                      }))
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Unit *</label>
                  <select
                    value={formData.durationUnit}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        durationUnit: e.target.value as 'days' | 'months',
                      }))
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="days">Days</option>
                    <option value="months">Months</option>
                  </select>
                </div>
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
                  {isSaving ? 'Saving...' : editingWarranty ? 'Update Warranty' : 'Create Warranty'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {warrantyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className={`${shellCard} w-full max-w-md p-6`}>
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-full bg-destructive/10 p-2 text-destructive">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Delete Warranty</h3>
            </div>
            <p className="mb-6 text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-semibold text-foreground">{warrantyToDelete.name}</span>?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button type="button" onClick={() => setWarrantyToDelete(null)} className="rounded-lg px-4 py-2 text-foreground hover:bg-surface-alt">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSaving}
                className="rounded-lg bg-destructive px-4 py-2 font-medium text-white hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? 'Deleting...' : 'Delete Warranty'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
