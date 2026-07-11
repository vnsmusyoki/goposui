import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import toast from 'react-hot-toast';
import Select, { type StylesConfig } from 'react-select';
import { BadgePercent, ClipboardList, Percent, UserRound } from 'lucide-react';
import { ApiError } from '@/lib/api';
import {
  type SaleSettingsRecord,
  useSaleSettings,
  type UpdateSaleSettingsInput,
} from '@/hooks/business/settings/useSaleSettings';
import SettingsTabShell from '../SettingsTabShell';

type SelectOption = {
  value: string;
  label: string;
};

type SaleItemAdditionMethod = 'new_row' | 'increase_quantity';
type CommissionCalculationType = 'percentage' | 'fixed_amount';

type SaleFormState = {
  defaultSaleDiscount: string;
  defaultSaleTax: string;
  saleItemAdditionMethod: SaleItemAdditionMethod;
  enableSaleOrder: boolean;
  isPayTermRequired: boolean;
  salePriceIsMinimumSellingPrice: boolean;
  enableSaleCommissionAgent: boolean;
  commissionCalculationType: CommissionCalculationType;
  isCommissionAgentRequired: boolean;
};

type ErrorState = Partial<Record<keyof SaleFormState, string>>;

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

const saleItemAdditionOptions: { value: SaleItemAdditionMethod; label: string }[] = [
  { value: 'new_row', label: 'Add Item in New Row' },
  { value: 'increase_quantity', label: 'Increase Item Quantity if Already Exists' },
];

const commissionCalculationOptions: { value: CommissionCalculationType; label: string }[] = [
  { value: 'percentage', label: 'Percentage of Sale' },
  { value: 'fixed_amount', label: 'Fixed Amount per Sale' },
];

const saleItemAdditionSelectOptions: SelectOption[] = saleItemAdditionOptions.map((option) => ({
  value: option.value,
  label: option.label,
}));

const commissionCalculationSelectOptions: SelectOption[] = commissionCalculationOptions.map((option) => ({
  value: option.value,
  label: option.label,
}));

const initialForm: SaleFormState = {
  defaultSaleDiscount: '0.00',
  defaultSaleTax: '0.00',
  saleItemAdditionMethod: 'new_row',
  enableSaleOrder: false,
  isPayTermRequired: false,
  salePriceIsMinimumSellingPrice: false,
  enableSaleCommissionAgent: false,
  commissionCalculationType: 'percentage',
  isCommissionAgentRequired: false,
};

const allowedSaleItemAdditionMethods = new Set<SaleItemAdditionMethod>(
  saleItemAdditionOptions.map((option) => option.value),
);
const allowedCommissionCalculationTypes = new Set<CommissionCalculationType>(
  commissionCalculationOptions.map((option) => option.value),
);

export default function SaleSettingsTab() {
  const { settings, isLoading, isSaving, error: hookError, saveSaleSettings, clearError } = useSaleSettings();
  const [form, setForm] = useState<SaleFormState>(initialForm);
  const [baselineForm, setBaselineForm] = useState<SaleFormState>(initialForm);
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

  const updateField = <K extends keyof SaleFormState>(key: K, value: SaleFormState[K]) => {
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
  };

  const toggleField = (key: keyof SaleFormState) => {
    setForm((current) => {
      const nextValue = !current[key];
      const next: SaleFormState = { ...current, [key]: nextValue } as SaleFormState;

      if (key === 'enableSaleCommissionAgent' && !nextValue) {
        next.isCommissionAgentRequired = false;
      }

      return next;
    });
    setSubmitError(null);
    clearError();
  };

  const validate = () => {
    const nextErrors: ErrorState = {};

    const discount = Number(form.defaultSaleDiscount);
    if (form.defaultSaleDiscount.trim() === '' || Number.isNaN(discount)) {
      nextErrors.defaultSaleDiscount = 'Default sale discount is required.';
    } else if (discount < 0 || discount > 100) {
      nextErrors.defaultSaleDiscount = 'Default sale discount must be between 0 and 100.';
    }

    const tax = Number(form.defaultSaleTax);
    if (form.defaultSaleTax.trim() === '' || Number.isNaN(tax)) {
      nextErrors.defaultSaleTax = 'Default sale tax is required.';
    } else if (tax < 0 || tax > 100) {
      nextErrors.defaultSaleTax = 'Default sale tax must be between 0 and 100.';
    }

    if (!allowedSaleItemAdditionMethods.has(form.saleItemAdditionMethod)) {
      nextErrors.saleItemAdditionMethod = 'Sale item addition method is required.';
    }

    if (!allowedCommissionCalculationTypes.has(form.commissionCalculationType)) {
      nextErrors.commissionCalculationType = 'Commission calculation type is required.';
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

    const payload: UpdateSaleSettingsInput = {
      defaultSaleDiscount: Number(form.defaultSaleDiscount),
      defaultSaleTax: Number(form.defaultSaleTax),
      saleItemAdditionMethod: form.saleItemAdditionMethod,
      enableSaleOrder: form.enableSaleOrder,
      isPayTermRequired: form.isPayTermRequired,
      salePriceIsMinimumSellingPrice: form.salePriceIsMinimumSellingPrice,
      enableSaleCommissionAgent: form.enableSaleCommissionAgent,
      commissionCalculationType: form.commissionCalculationType,
      isCommissionAgentRequired: form.isCommissionAgentRequired,
    };

    try {
      const savedSettings = await saveSaleSettings(payload);
      const nextForm = settingsToForm(savedSettings);
      setForm(nextForm);
      setBaselineForm(nextForm);
      setHasHydrated(true);
      setErrors({});
      toast.success('Sale settings saved successfully.', { position: 'top-right' });
    } catch (error) {
      if (error instanceof ApiError && error.data && typeof error.data === 'object' && 'errors' in error.data) {
        const apiErrors = ((error.data as Record<string, unknown>).errors ?? {}) as Record<string, string>;
        setErrors((current) => ({ ...current, ...apiErrors }));
        setSubmitError(error.message);
      } else {
        setSubmitError(error instanceof Error ? error.message : 'Failed to save sale settings.');
      }
      toast.error('Unable to save sale settings.', { position: 'top-right' });
    }
  };

  const handleReset = () => {
    setForm(baselineForm);
    setErrors({});
    setSubmitError(null);
    clearError();
  };

  return (
    <SettingsTabShell title="Sale Settings" description="Configure sales behavior and transaction defaults.">
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
            Loading sale settings...
          </section>
        ) : (
          <>
            <Section
              icon={Percent}
              title="Sale Defaults"
              description="Values applied automatically when a new sale is created."
            >
              <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
                <Field
                  label="Default Sale Discount"
                  placeholder="e.g. 5"
                  value={form.defaultSaleDiscount}
                  error={errors.defaultSaleDiscount}
                  onChange={(value) => updateField('defaultSaleDiscount', value)}
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                />
                <Field
                  label="Default Sale Tax"
                  placeholder="e.g. 16"
                  value={form.defaultSaleTax}
                  error={errors.defaultSaleTax}
                  onChange={(value) => updateField('defaultSaleTax', value)}
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                />
                <SelectField
                  label="Sale Item Addition Method"
                  value={saleItemAdditionSelectOptions.find((option) => option.value === form.saleItemAdditionMethod) ?? null}
                  options={saleItemAdditionSelectOptions}
                  error={errors.saleItemAdditionMethod}
                  onChange={(option) =>
                    option && updateField('saleItemAdditionMethod', option.value as SaleItemAdditionMethod)
                  }
                />
              </div>
            </Section>

            <Section
              icon={ClipboardList}
              title="Sale Orders & Pricing"
              description="Controls for order workflow, payment terms, and price floors."
            >
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                <ToggleField
                  label="Enable Sale Order"
                  description="Allow creating sale orders before an invoice."
                  checked={form.enableSaleOrder}
                  onChange={() => toggleField('enableSaleOrder')}
                />
                <ToggleField
                  label="Pay Term Required"
                  description="Require a payment term on every sale."
                  checked={form.isPayTermRequired}
                  onChange={() => toggleField('isPayTermRequired')}
                />
                <ToggleField
                  label="Sale Price is Minimum Selling Price"
                  description="Prevent selling below the set sale price."
                  checked={form.salePriceIsMinimumSellingPrice}
                  onChange={() => toggleField('salePriceIsMinimumSellingPrice')}
                />
              </div>
            </Section>

            <Section
              icon={BadgePercent}
              title="Commission Agent"
              description="Control sale commission settings and whether agents are required."
            >
              <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
                <ToggleField
                  label="Enable Sale Commission Agent"
                  description="Allow commission agents to be assigned on sale transactions."
                  checked={form.enableSaleCommissionAgent}
                  onChange={() => toggleField('enableSaleCommissionAgent')}
                />
                <SelectField
                  label="Commission Calculation Type"
                  value={
                    commissionCalculationSelectOptions.find(
                      (option) => option.value === form.commissionCalculationType,
                    ) ?? null
                  }
                  options={commissionCalculationSelectOptions}
                  error={errors.commissionCalculationType}
                  onChange={(option) =>
                    option && updateField('commissionCalculationType', option.value as CommissionCalculationType)
                  }
                />
                <ToggleField
                  label="Commission Agent Required"
                  description={
                    !form.enableSaleCommissionAgent
                      ? 'Requires sale commission agents to be enabled.'
                      : 'Require a commission agent for every sale.'
                  }
                  checked={form.isCommissionAgentRequired}
                  disabled={!form.enableSaleCommissionAgent}
                  onChange={() => toggleField('isCommissionAgentRequired')}
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
            {isSaving ? 'Saving...' : 'Save Sale Settings'}
          </button>
        </div>
      </form>
    </SettingsTabShell>
  );
}

function settingsToForm(settings: SaleSettingsRecord): SaleFormState {
  return {
    defaultSaleDiscount: settings.defaultSaleDiscount.toFixed(2),
    defaultSaleTax: settings.defaultSaleTax.toFixed(2),
    saleItemAdditionMethod: settings.saleItemAdditionMethod,
    enableSaleOrder: settings.enableSaleOrder,
    isPayTermRequired: settings.isPayTermRequired,
    salePriceIsMinimumSellingPrice: settings.salePriceIsMinimumSellingPrice,
    enableSaleCommissionAgent: settings.enableSaleCommissionAgent,
    commissionCalculationType: settings.commissionCalculationType,
    isCommissionAgentRequired: settings.isCommissionAgentRequired,
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
    <section className="rounded-xl bg-card p-5 sm:p-6">
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
  onChange,
  type = 'text',
  step,
  min,
  max,
}: {
  label: string;
  placeholder: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  type?: 'text' | 'number';
  step?: string;
  min?: string;
  max?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-foreground">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        step={step}
        min={min}
        max={max}
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
  value,
  options,
  error,
  onChange,
}: {
  label: string;
  value: SelectOption | null;
  options: SelectOption[];
  error?: string;
  onChange: (value: SelectOption | null) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-foreground">{label}</span>
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
