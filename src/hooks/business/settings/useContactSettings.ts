import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

export type ContactSettingsRecord = {
  id: string;
  defaultCreditLimit: number | null;
  message?: string;
};

export type UpdateContactSettingsInput = {
  defaultCreditLimit: number;
};

type ContactSettingsApiResponse = {
  id: string;
  defaultCreditLimit?: number | null;
  message?: string;
};

type ContactSettingsStore = {
  settings: ContactSettingsRecord | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  loadContactSettings: () => Promise<ContactSettingsRecord | null>;
  saveContactSettings: (data: UpdateContactSettingsInput) => Promise<ContactSettingsRecord>;
  clearError: () => void;
};

function normalizeContactSettings(response: ContactSettingsApiResponse): ContactSettingsRecord {
  return {
    id: response.id,
    defaultCreditLimit: typeof response.defaultCreditLimit === 'number' ? response.defaultCreditLimit : null,
    message: response.message,
  };
}

export function useContactSettings() {
  const [settings, setSettings] = useState<ContactSettingsRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadContactSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest<ContactSettingsApiResponse>('/business/settings/contact');
      const nextSettings = normalizeContactSettings(response);
      setSettings(nextSettings);
      return nextSettings;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load contact settings.';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveContactSettings = useCallback(async (data: UpdateContactSettingsInput) => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await apiRequest<ContactSettingsApiResponse>('/business/settings/contact', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      const nextSettings = normalizeContactSettings(response);
      setSettings(nextSettings);
      return nextSettings;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to save contact settings.';
      setError(message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    void loadContactSettings();
  }, [loadContactSettings]);

  return {
    settings,
    isLoading,
    isSaving,
    error,
    loadContactSettings,
    saveContactSettings,
    clearError,
  } satisfies ContactSettingsStore;
}
