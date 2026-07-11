import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import toast from 'react-hot-toast';
import { ClipboardCheck, ShoppingBag } from 'lucide-react';
import { ApiError } from '@/lib/api';
import {
  type PurchasesSettingsRecord,
  usePurchasesSettings,
  type UpdatePurchasesSettingsInput,
} from '@/hooks/business/settings/usePurchasesSettings';
import SettingsTabShell from '../SettingsTabShell';

type PurchasesFormState = {
  enableEditingProductPriceFromPurchaseScreen: boolean;
  enablePurchaseStatus: boolean;
  enableLotNumber: boolean;
  enablePurchaseOrder: boolean;
};

type ErrorState = Partial<Record<keyof PurchasesFormState, string>>;

const initialForm: PurchasesFormState = {
  enableEditingProductPriceFromPurchaseScreen: false,
  enablePurchaseStatus: false,
  enableLotNumber: false,
  enablePurchaseOrder: false,
};

export default function PurchasesSettingsTab() {
  const { settings, isLoading, isSaving, error: hookError, savePurchasesSettings, clearError } =
    usePurchasesSettings();
  const [form, setForm] = useState<PurchasesFormState>(initialForm);
  const [baselineForm, setBaselineForm] = useState<PurchasesFormState>(initialForm);
  const [errors, setErrors] = useState<ErrorState>({});
  const [hasHydrated, setHasHydrated] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const errorItems = useMemo(
    () => Array.from(new Set([...Object.values(errors), submitError, hookError].filter(Boolean) as string[])),
    [errors, submitError, hookError],
  );

  useEffect(() => {
    if (!settings || hasHydrated) {
      return;
    }

    const nextForm = settingsToForm(settings);
    setForm(nextForm);
    setBaselineForm(nextForm);
    setHasHydrated(true);
  }, [settings, hasHydrated]);

  const toggleField = (key: keyof PurchasesFormState) => {
    setForm((current) => ({ ...current, [key]: !current[key] }));
    setSubmitError(null);
    clearError();
  };

  const validate = () => {
    const nextErrors: ErrorState = {};

    if (typeof form.enableEditingProductPriceFromPurchaseScreen !== 'boolean') {
      nextErrors.enableEditingProductPriceFromPurchaseScreen = 'Editing product price setting is required.';
    }
    if (typeof form.enablePurchaseStatus !== 'boolean') {
      nextErrors.enablePurchaseStatus = 'Purchase status setting is required.';
    }
    if (typeof form.enableLotNumber !== 'boolean') {
      nextErrors.enableLotNumber = 'Lot number setting is required.';
    }
    if (typeof form.enablePurchaseOrder !== 'boolean') {
      nextErrors.enablePurchaseOrder = 'Purchase order setting is required.';
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

    const payload: UpdatePurchasesSettingsInput = {
      enableEditingProductPriceFromPurchaseScreen: form.enableEditingProductPriceFromPurchaseScreen,
      enablePurchaseStatus: form.enablePurchaseStatus,
      enableLotNumber: form.enableLotNumber,
      enablePurchaseOrder: form.enablePurchaseOrder,
    };

    try {
      const savedSettings = await savePurchasesSettings(payload);
      const nextForm = settingsToForm(savedSettings);
      setForm(nextForm);
      setBaselineForm(nextForm);
      setHasHydrated(true);
      setErrors({});
      toast.success('Purchases settings saved successfully.', { position: 'top-right' });
    } catch (error) {
      if (error instanceof ApiError && error.data && typeof error.data === 'object' && 'errors' in error.data) {
        const apiErrors = ((error.data as Record<string, unknown>).errors ?? {}) as Record<string, string>;
        setErrors((current) => ({ ...current, ...apiErrors }));
        setSubmitError(error.message);
      } else {
        setSubmitError(error instanceof Error ? error.message : 'Failed to save purchases settings.');
      }
      toast.error('Unable to save purchases settings.', { position: 'top-right' });
    }
  };

  const handleReset = () => {
    setForm(baselineForm);
    setErrors({});
    setSubmitError(null);
    clearError();
  };

  return (
    <SettingsTabShell title="Purchases Settings" description="Define purchase approval and receiving defaults.">
      <form onSubmit={handleSubmit} className="space-y-6">
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
            Loading purchases settings...
          </section>
        ) : (
          <>
            <Section
              icon={ShoppingBag}
              title="Purchase Screen"
              description="What users are allowed to change while recording a purchase."
            >
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <ToggleField
                  label="Enable Editing Product Price from Purchase Screen"
                  description="Allow the product's price to be updated directly while purchasing."
                  checked={form.enableEditingProductPriceFromPurchaseScreen}
                  onChange={() => toggleField('enableEditingProductPriceFromPurchaseScreen')}
                />
              </div>
            </Section>

            <Section
              icon={ClipboardCheck}
              title="Purchase Workflow"
              description="Additional tracking and approval steps available for purchases."
            >
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <ToggleField
                  label="Enable Purchase Status"
                  description="Track each purchase through statuses such as pending or received."
                  checked={form.enablePurchaseStatus}
                  onChange={() => toggleField('enablePurchaseStatus')}
                />
                <ToggleField
                  label="Enable Purchase Order"
                  description="Allow creating a purchase order before receiving stock."
                  checked={form.enablePurchaseOrder}
                  onChange={() => toggleField('enablePurchaseOrder')}
                />
                <ToggleField
                  label="Enable Lot Number"
                  description="Track lot numbers for received stock."
                  checked={form.enableLotNumber}
                  onChange={() => toggleField('enableLotNumber')}
                />
              </div>
            </Section>
          </>
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
            {isSaving ? 'Saving...' : 'Save Purchases Settings'}
          </button>
        </div>
      </form>
    </SettingsTabShell>
  );
}

function settingsToForm(settings: PurchasesSettingsRecord): PurchasesFormState {
  return {
    enableEditingProductPriceFromPurchaseScreen: settings.enableEditingProductPriceFromPurchaseScreen,
    enablePurchaseStatus: settings.enablePurchaseStatus,
    enableLotNumber: settings.enableLotNumber,
    enablePurchaseOrder: settings.enablePurchaseOrder,
  };
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className=" bg-card p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3 border-b border-border pb-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function ToggleField({
  label,
  description,
  checked,
  disabled = false,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`flex w-full items-start justify-between gap-4 rounded-lg border p-3 text-left transition-colors ${
        disabled
          ? 'cursor-not-allowed border-border bg-muted/40 opacity-60'
          : 'border-border bg-background hover:border-primary/40'
      }`}
    >
      <div>
        <span className="block text-sm font-medium text-foreground">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>}
      </div>
      <span
        aria-hidden
        className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300 ${
          checked ? 'bg-primary' : 'bg-muted'
        }`}
      >
        <span
          className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform duration-300 ease-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </span>
    </button>
  );
}
