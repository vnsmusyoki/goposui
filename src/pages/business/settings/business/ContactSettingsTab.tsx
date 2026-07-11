import { useEffect, useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { ApiError } from '@/lib/api';
import {
  type ContactSettingsRecord,
  useContactSettings,
  type UpdateContactSettingsInput,
} from '@/hooks/business/settings/useContactSettings';
import SettingsTabShell from '../SettingsTabShell';

type ContactFormState = {
  defaultCreditLimit: string;
};

type ErrorState = Partial<Record<keyof ContactFormState, string>>;

const initialForm: ContactFormState = {
  defaultCreditLimit: '',
};

export default function ContactSettingsTab() {
  const {
    settings,
    isLoading,
    isSaving,
    error: hookError,
    saveContactSettings,
    clearError,
  } = useContactSettings();
  const [form, setForm] = useState<ContactFormState>(initialForm);
  const [baselineForm, setBaselineForm] = useState<ContactFormState>(initialForm);
  const [errors, setErrors] = useState<ErrorState>({});
  const [hasHydrated, setHasHydrated] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const errorItems = [errors.defaultCreditLimit, submitError, hookError].filter(Boolean) as string[];

  useEffect(() => {
    if (!settings || hasHydrated) {
      return;
    }

    const nextForm = settingsToForm(settings);
    setForm(nextForm);
    setBaselineForm(nextForm);
    setHasHydrated(true);
  }, [settings, hasHydrated]);

  const updateField = (value: string) => {
    setForm((current) => ({ ...current, defaultCreditLimit: value }));
    setErrors((current) => {
      if (!current.defaultCreditLimit) {
        return current;
      }
      return {};
    });
    setSubmitError(null);
    clearError();
  };

  const validate = () => {
    const nextErrors: ErrorState = {};
    const limit = Number(form.defaultCreditLimit);

    if (form.defaultCreditLimit.trim() === '' || Number.isNaN(limit)) {
      nextErrors.defaultCreditLimit = 'Default credit limit is required.';
    } else if (limit < 0) {
      nextErrors.defaultCreditLimit = 'Default credit limit must be zero or more.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    clearError();

    if (!validate()) {
      toast.error('Please fix the highlighted errors.', { position: 'top-right' });
      return;
    }

    const payload: UpdateContactSettingsInput = {
      defaultCreditLimit: Number(form.defaultCreditLimit),
    };

    try {
      const savedSettings = await saveContactSettings(payload);
      const nextForm = settingsToForm(savedSettings);
      setForm(nextForm);
      setBaselineForm(nextForm);
      setHasHydrated(true);
      setErrors({});
      toast.success('Contact settings saved successfully.', { position: 'top-right' });
    } catch (error) {
      if (error instanceof ApiError && error.data && typeof error.data === 'object' && 'errors' in error.data) {
        const apiErrors = ((error.data as Record<string, unknown>).errors ?? {}) as Record<string, string>;
        if (apiErrors.defaultCreditLimit) {
          setErrors({ defaultCreditLimit: apiErrors.defaultCreditLimit });
        }
        setSubmitError(error.message);
      } else {
        setSubmitError(error instanceof Error ? error.message : 'Failed to save contact settings.');
      }
      toast.error('Unable to save contact settings.', { position: 'top-right' });
    }
  };

  const handleReset = () => {
    setForm(baselineForm);
    setErrors({});
    setSubmitError(null);
    clearError();
  };

  return (
    <SettingsTabShell
      title="Contact Settings"
      description="Set the default credit limit used for contact records."
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        {errorItems.length > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
            <p className="mb-2 font-semibold">Please fix the following errors:</p>
            <ul className="list-disc space-y-1 pl-5">
              {errorItems.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {isLoading && !hasHydrated ? (
          <section className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Loading contact settings...
          </section>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Field
              label="Default Credit Limit"
              placeholder="Enter default credit limit"
              value={form.defaultCreditLimit}
              error={errors.defaultCreditLimit}
              onChange={updateField}
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <button
            type="button"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-alt"
            onClick={handleReset}
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? 'Saving...' : 'Save Contact Settings'}
          </button>
        </div>
      </form>
    </SettingsTabShell>
  );
}

function settingsToForm(settings: ContactSettingsRecord): ContactFormState {
  return {
    defaultCreditLimit: typeof settings.defaultCreditLimit === 'number' ? String(settings.defaultCreditLimit) : '',
  };
}

function Field({
  label,
  placeholder,
  value,
  error,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-foreground">{label}</span>
      <input
        type="number"
        placeholder={placeholder}
        min="0"
        step="0.01"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 ${
          error ? 'border-red-500' : 'border-border'
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </label>
  );
}
