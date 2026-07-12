import { useEffect } from 'react';
import {
  useBusinessStore,
  type BusinessSettingsRecord,
  type UpdateBusinessSettingsInput,
} from '@/business/businessStore';

export type { BusinessSettingsRecord, UpdateBusinessSettingsInput };

export function useBusinessSettings() {
  const settings = useBusinessStore((state) => state.settings);
  const isLoading = useBusinessStore((state) => state.isLoading);
  const isSaving = useBusinessStore((state) => state.isSaving);
  const error = useBusinessStore((state) => state.error);
  const loadBusinessSettings = useBusinessStore((state) => state.loadBusinessSettings);
  const saveBusinessSettings = useBusinessStore((state) => state.saveBusinessSettings);
  const clearError = useBusinessStore((state) => state.clearError);

  useEffect(() => {
    if (!settings && !isLoading) {
      void loadBusinessSettings();
    }
  }, [settings, isLoading, loadBusinessSettings]);

  return {
    settings,
    isLoading,
    isSaving,
    error,
    loadBusinessSettings,
    saveBusinessSettings,
    clearError,
  };
}
