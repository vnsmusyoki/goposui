import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import toast from 'react-hot-toast';
import Select, { type StylesConfig } from 'react-select';
import {
  CalendarClock,
  Hash,
  LayoutGrid,
  Ruler,
  ShieldCheck,
  Warehouse,
} from 'lucide-react';
import { ApiError } from '@/lib/api';
import {
  type ProductSettingsRecord,
  useProductSettings,
  type UpdateProductSettingsInput,
} from '@/hooks/business/settings/useProductSettings';
import SettingsTabShell from '../SettingsTabShell';

type SelectOption = {
  value: string;
  label: string;
};

type ExpiryTrackingMethod = 'item_expiry' | 'manufacturing_and_period';
type ExpirySellingBehavior = 'keep_selling' | 'stop_selling_before';

type ProductFormState = {
  skuPrefix: string;
  enableProductExpiry: boolean;
  expiryTrackingMethod: ExpiryTrackingMethod;
  expirySellingBehavior: ExpirySellingBehavior;
  stopSellingDaysBefore: string;
  enableBrands: boolean;
  enableCategories: boolean;
  enableSubCategories: boolean;
  enablePriceTaxInfo: boolean;
  defaultUnit: string;
  enableSubUnits: boolean;
  enableSecondaryUnit: boolean;
  enableRacks: boolean;
  enableRow: boolean;
  enablePosition: boolean;
  enableWarranty: boolean;
};

type ErrorState = Partial<Record<keyof ProductFormState, string>>;

const selectStyles: StylesConfig<SelectOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: 42,
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

const unitOptions: SelectOption[] = [
  { value: 'Pieces', label: 'Pieces' },
  { value: 'Kilogram', label: 'Kilogram' },
  { value: 'Litre', label: 'Litre' },
  { value: 'Box', label: 'Box' },
  { value: 'Pack', label: 'Pack' },
  { value: 'Dozen', label: 'Dozen' },
];

const expiryTrackingOptions: { value: ExpiryTrackingMethod; label: string }[] = [
  { value: 'item_expiry', label: 'Add Item Expiry' },
  { value: 'manufacturing_and_period', label: 'Add Manufacturing Date & Expiry Period' },
];

const expirySellingOptions: { value: ExpirySellingBehavior; label: string }[] = [
  { value: 'keep_selling', label: 'Keep Selling' },
  { value: 'stop_selling_before', label: 'Stop Selling N Days Before' },
];

const initialForm: ProductFormState = {
  skuPrefix: '',
  enableProductExpiry: false,
  expiryTrackingMethod: 'item_expiry',
  expirySellingBehavior: 'keep_selling',
  stopSellingDaysBefore: '',
  enableBrands: false,
  enableCategories: false,
  enableSubCategories: false,
  enablePriceTaxInfo: false,
  defaultUnit: 'Pieces',
  enableSubUnits: false,
  enableSecondaryUnit: false,
  enableRacks: false,
  enableRow: false,
  enablePosition: false,
  enableWarranty: false,
};

const allowedUnits = new Set(unitOptions.map((option) => option.value));

export default function ProductSettingsTab() {
  const {
    settings,
    isLoading,
    isSaving,
    error: hookError,
    saveProductSettings,
    clearError,
  } = useProductSettings();
  const [form, setForm] = useState<ProductFormState>(initialForm);
  const [baselineForm, setBaselineForm] = useState<ProductFormState>(initialForm);
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

  const updateField = <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) {
        return current;
      }
      const next = { ...current };
      delete next[key];
      return next;
    });
    setSubmitError(null);
    clearError();

    if (key === 'expirySellingBehavior' && value === 'keep_selling') {
      setForm((current) => ({ ...current, stopSellingDaysBefore: '' }));
      setErrors((current) => {
        if (!current.stopSellingDaysBefore) {
          return current;
        }
        const next = { ...current };
        delete next.stopSellingDaysBefore;
        return next;
      });
    }
  };

  const toggleField = (key: keyof ProductFormState) => {
    setForm((current) => {
      const nextValue = !current[key];
      const next: ProductFormState = { ...current, [key]: nextValue } as ProductFormState;

      if (key === 'enableCategories' && !nextValue) {
        next.enableSubCategories = false;
      }

      return next;
    });
  };

  const validate = () => {
    const nextErrors: ErrorState = {};

    if (!allowedUnits.has(form.defaultUnit)) {
      nextErrors.defaultUnit = 'Default unit is required.';
    }

    if (form.enableProductExpiry) {
      if (!form.expiryTrackingMethod) {
        nextErrors.expiryTrackingMethod = 'Expiry tracking method is required.';
      }

      if (!form.expirySellingBehavior) {
        nextErrors.expirySellingBehavior = 'Expiry selling behavior is required.';
      }

      if (
        form.expirySellingBehavior === 'stop_selling_before' &&
        (form.stopSellingDaysBefore.trim() === '' || Number.isNaN(Number(form.stopSellingDaysBefore)) || Number(form.stopSellingDaysBefore) <= 0)
      ) {
        nextErrors.stopSellingDaysBefore = 'Enter how many days before expiry selling should stop.';
      }
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

    const payload: UpdateProductSettingsInput = {
      skuPrefix: form.skuPrefix.trim(),
      enableProductExpiry: form.enableProductExpiry,
      expiryTrackingMethod: form.expiryTrackingMethod,
      expirySellingBehavior: form.expirySellingBehavior,
      stopSellingDaysBefore:
        form.enableProductExpiry && form.expirySellingBehavior === 'stop_selling_before'
          ? Number(form.stopSellingDaysBefore)
          : null,
      enableBrands: form.enableBrands,
      enableCategories: form.enableCategories,
      enableSubCategories: form.enableSubCategories,
      enablePriceTaxInfo: form.enablePriceTaxInfo,
      defaultUnit: form.defaultUnit,
      enableSubUnits: form.enableSubUnits,
      enableSecondaryUnit: form.enableSecondaryUnit,
      enableRacks: form.enableRacks,
      enableRow: form.enableRow,
      enablePosition: form.enablePosition,
      enableWarranty: form.enableWarranty,
    };

    try {
      const savedSettings = await saveProductSettings(payload);
      const nextForm = settingsToForm(savedSettings);
      setForm(nextForm);
      setBaselineForm(nextForm);
      setHasHydrated(true);
      setErrors({});
      toast.success('Product settings saved successfully.', { position: 'top-right' });
    } catch (error) {
      if (error instanceof ApiError && error.data && typeof error.data === 'object' && 'errors' in error.data) {
        const apiErrors = ((error.data as Record<string, unknown>).errors ?? {}) as Record<string, string>;
        setErrors(mapApiErrorsToFormErrors(apiErrors));
        setSubmitError(error.message);
      } else {
        setSubmitError(error instanceof Error ? error.message : 'Failed to save product settings.');
      }
      toast.error('Unable to save product settings.', { position: 'top-right' });
    }
  };

  const handleReset = () => {
    setForm(baselineForm);
    setErrors({});
    setSubmitError(null);
    clearError();
  };

  return (
    <SettingsTabShell title="Product Settings" description="Define how products behave across the business.">
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
            Loading product settings...
          </section>
        ) : (
          <>
            <Section icon={Hash} title="SKU & Identification" description="How new products are coded and identified.">
              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="SKU Prefix"
                  placeholder="e.g. PRD-"
                  value={form.skuPrefix}
                  error={errors.skuPrefix}
                  description="Optional prefix added before product codes are generated."
                  onChange={(value) => updateField('skuPrefix', value)}
                />
              </div>
            </Section>

            <Section
              icon={CalendarClock}
              title="Expiry Tracking"
              description="Control whether products carry expiry information and how selling is restricted near expiry."
            >
              <div className="space-y-5">
                <ToggleField
                  label="Enable Product Expiry"
                  description="Track expiry dates for products in this business."
                  checked={form.enableProductExpiry}
                  onChange={() => toggleField('enableProductExpiry')}
                />

                {form.enableProductExpiry && (
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    <SelectField
                      label="Expiry Tracking Method"
                      description="Choose how the system records expiry details for stock items."
                      value={expiryTrackingOptions.find((option) => option.value === form.expiryTrackingMethod) ?? null}
                      options={expiryTrackingOptions}
                      onChange={(option) =>
                        option && updateField('expiryTrackingMethod', option.value as ExpiryTrackingMethod)
                      }
                    />
                    <SelectField
                      label="Expiry Selling Behavior"
                      description="Choose what happens when products get close to expiry."
                      value={expirySellingOptions.find((option) => option.value === form.expirySellingBehavior) ?? null}
                      options={expirySellingOptions}
                      onChange={(option) =>
                        option && updateField('expirySellingBehavior', option.value as ExpirySellingBehavior)
                      }
                    />
                    {form.expirySellingBehavior === 'stop_selling_before' && (
                      <Field
                        label="Days Before Expiry to Stop Selling"
                        placeholder="e.g. 7"
                        value={form.stopSellingDaysBefore}
                        error={errors.stopSellingDaysBefore}
                        description="Only needed when selling should stop a number of days before expiry."
                        onChange={(value) => updateField('stopSellingDaysBefore', value)}
                        type="number"
                        min="1"
                      />
                    )}
                  </div>
                )}
              </div>
            </Section>

            <Section
              icon={LayoutGrid}
              title="Catalog Organization"
              description="Choose which classification layers are available when creating products."
            >
              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-3">
                <ToggleField
                  label="Enable Brands"
                  description="Allow assigning brands to products."
                  checked={form.enableBrands}
                  onChange={() => toggleField('enableBrands')}
                />
                <ToggleField
                  label="Enable Categories"
                  description="Allow assigning categories to products."
                  checked={form.enableCategories}
                  onChange={() => toggleField('enableCategories')}
                />
                <ToggleField
                  label="Enable Sub Categories"
                  description={
                    !form.enableCategories
                      ? 'Requires Categories to be enabled.'
                      : 'Allow assigning sub categories to products.'
                  }
                  checked={form.enableSubCategories}
                  disabled={!form.enableCategories}
                  onChange={() => toggleField('enableSubCategories')}
                />
              </div>
            </Section>

            <Section
              icon={ShieldCheck}
              title="Pricing & Warranty"
              description="Additional information collected when adding a product."
            >
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <ToggleField
                  label="Enable Price & Tax Info"
                  description="Show price and tax fields while creating products."
                  checked={form.enablePriceTaxInfo}
                  onChange={() => toggleField('enablePriceTaxInfo')}
                />
                <ToggleField
                  label="Enable Warranty"
                  description="Collect warranty details for products."
                  checked={form.enableWarranty}
                  onChange={() => toggleField('enableWarranty')}
                />
              </div>
            </Section>

            <Section icon={Ruler} title="Units of Measurement" description="Defaults for how product quantities are measured.">
              <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
                <SelectField
                  label="Default Unit"
                  description="Choose the unit preselected for new products."
                  value={unitOptions.find((option) => option.value === form.defaultUnit) ?? null}
                  options={unitOptions}
                  error={errors.defaultUnit}
                  onChange={(option) => option && updateField('defaultUnit', option.value)}
                />
                <ToggleField
                  label="Enable Sub Units"
                  description="Allow smaller units beneath the default unit."
                  checked={form.enableSubUnits}
                  onChange={() => toggleField('enableSubUnits')}
                />
                <ToggleField
                  label="Enable Secondary Unit"
                  description="Allow assigning a second unit to the same product."
                  checked={form.enableSecondaryUnit}
                  onChange={() => toggleField('enableSecondaryUnit')}
                />
              </div>
            </Section>

            <Section icon={Warehouse} title="Storage Location" description="Track exactly where stock physically sits in your warehouse or store.">
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                <ToggleField
                  label="Enable Racks"
                  description="Track the rack location for stock items."
                  checked={form.enableRacks}
                  onChange={() => toggleField('enableRacks')}
                />
                <ToggleField
                  label="Enable Row"
                  description="Track the row location for stock items."
                  checked={form.enableRow}
                  onChange={() => toggleField('enableRow')}
                />
                <ToggleField
                  label="Enable Position"
                  description="Track the exact position within a row."
                  checked={form.enablePosition}
                  onChange={() => toggleField('enablePosition')}
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
            {isSaving ? 'Saving...' : 'Save Product Settings'}
          </button>
        </div>
      </form>
    </SettingsTabShell>
  );
}

function settingsToForm(settings: ProductSettingsRecord): ProductFormState {
  return {
    skuPrefix: settings.skuPrefix ?? '',
    enableProductExpiry: settings.enableProductExpiry,
    expiryTrackingMethod: (settings.expiryTrackingMethod as ExpiryTrackingMethod) || initialForm.expiryTrackingMethod,
    expirySellingBehavior: (settings.expirySellingBehavior as ExpirySellingBehavior) || initialForm.expirySellingBehavior,
    stopSellingDaysBefore:
      typeof settings.stopSellingDaysBefore === 'number' ? String(settings.stopSellingDaysBefore) : '',
    enableBrands: settings.enableBrands,
    enableCategories: settings.enableCategories,
    enableSubCategories: settings.enableSubCategories,
    enablePriceTaxInfo: settings.enablePriceTaxInfo,
    defaultUnit: settings.defaultUnit || initialForm.defaultUnit,
    enableSubUnits: settings.enableSubUnits,
    enableSecondaryUnit: settings.enableSecondaryUnit,
    enableRacks: settings.enableRacks,
    enableRow: settings.enableRow,
    enablePosition: settings.enablePosition,
    enableWarranty: settings.enableWarranty,
  };
}

function mapApiErrorsToFormErrors(apiErrors: Record<string, string>): ErrorState {
  const mapped: ErrorState = {};

  const keyMap: Record<string, keyof ProductFormState> = {
    skuPrefix: 'skuPrefix',
    expiryTrackingMethod: 'expiryTrackingMethod',
    expirySellingBehavior: 'expirySellingBehavior',
    stopSellingDaysBefore: 'stopSellingDaysBefore',
    defaultUnit: 'defaultUnit',
  };

  for (const [apiKey, message] of Object.entries(apiErrors)) {
    const localKey = keyMap[apiKey];
    if (localKey) {
      mapped[localKey] = message;
    }
  }

  return mapped;
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
    <section className="rounded-xl bg-card p-3 sm:p-6">
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

function Field({
  label,
  placeholder,
  value,
  error,
  description,
  onChange,
  type = 'text',
  min,
}: {
  label: string;
  placeholder: string;
  value: string;
  error?: string;
  description?: string;
  onChange: (value: string) => void;
  type?: 'text' | 'number';
  min?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-foreground">{label}</span>
      {description && <span className="mb-2 block text-xs text-muted-foreground">{description}</span>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        min={min}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 ${
          error ? 'border-red-500' : 'border-border'
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </label>
  );
}

function SelectField({
  label,
  description,
  value,
  options,
  error,
  onChange,
}: {
  label: string;
  description?: string;
  value: SelectOption | null;
  options: SelectOption[];
  error?: string;
  onChange: (value: SelectOption | null) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-foreground">{label}</span>
      {description && <span className="mb-2 block text-xs text-muted-foreground">{description}</span>}
      <Select
        instanceId={label.toLowerCase().replace(/\s+/g, '-')}
        options={options}
        value={value}
        onChange={onChange}
        styles={selectStyles}
        isSearchable
        classNamePrefix="settings-select"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </label>
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
