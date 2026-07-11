import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import toast from 'react-hot-toast';
import Select, { type StylesConfig } from 'react-select';
import { FileText, MonitorSmartphone, ShoppingCart, Sparkles, UserCog } from 'lucide-react';
import { ApiError } from '@/lib/api';
import { type PosSettingsRecord, usePosSettings, type UpdatePosSettingsInput } from '@/hooks/business/settings/usePosSettings';
import SettingsTabShell from '../SettingsTabShell';

type SelectOption = {
  value: string;
  label: string;
};

type PosFormState = {
  disableMultiplePay: boolean;
  disableDraft: boolean;
  disableExpressCheckout: boolean;
  disableDiscount: boolean;
  disableOrderTax: boolean;
  disableCreditSaleButton: boolean;
  disableSuspendSale: boolean;
  subtotalEditable: boolean;
  hideProductSuggestion: boolean;
  showPricingOnProductSuggestionTooltip: boolean;
  hideRecentTransactions: boolean;
  enableTransactionDateOnPosScreen: boolean;
  enableWeighingScale: boolean;
  enableServiceStaffInProductLine: boolean;
  isServiceStaffRequired: boolean;
  invoiceScheme: 'default' | 'scheme_a' | 'scheme_b';
  invoiceLayout: 'default' | 'compact' | 'detailed';
  printInvoiceOnSuspend: boolean;
};

type ErrorState = Partial<Record<keyof PosFormState, string>>;

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

const invoiceSchemeOptions: SelectOption[] = [
  { value: 'default', label: 'Default Scheme' },
  { value: 'scheme_a', label: 'Scheme A' },
  { value: 'scheme_b', label: 'Scheme B' },
];

const invoiceLayoutOptions: SelectOption[] = [
  { value: 'default', label: 'Default Layout' },
  { value: 'compact', label: 'Compact Layout' },
  { value: 'detailed', label: 'Detailed Layout' },
];

const initialForm: PosFormState = {
  disableMultiplePay: false,
  disableDraft: false,
  disableExpressCheckout: false,
  disableDiscount: false,
  disableOrderTax: false,
  disableCreditSaleButton: false,
  disableSuspendSale: false,
  subtotalEditable: false,
  hideProductSuggestion: false,
  showPricingOnProductSuggestionTooltip: false,
  hideRecentTransactions: false,
  enableTransactionDateOnPosScreen: false,
  enableWeighingScale: false,
  enableServiceStaffInProductLine: false,
  isServiceStaffRequired: false,
  invoiceScheme: 'default',
  invoiceLayout: 'default',
  printInvoiceOnSuspend: false,
};

export default function PosSettingsTab() {
  const { settings, isLoading, isSaving, error: hookError, savePosSettings, clearError } = usePosSettings();
  const [form, setForm] = useState<PosFormState>(initialForm);
  const [baselineForm, setBaselineForm] = useState<PosFormState>(initialForm);
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

  const updateField = <K extends keyof PosFormState>(key: K, value: PosFormState[K]) => {
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

  const toggleField = (key: keyof PosFormState) => {
    setForm((current) => {
      const nextValue = !current[key];
      const next: PosFormState = { ...current, [key]: nextValue } as PosFormState;

      if (key === 'hideProductSuggestion' && nextValue) {
        next.showPricingOnProductSuggestionTooltip = false;
      }
      if (key === 'enableServiceStaffInProductLine' && !nextValue) {
        next.isServiceStaffRequired = false;
      }

      return next;
    });
    setSubmitError(null);
    clearError();
  };

  const validate = () => {
    const nextErrors: ErrorState = {};

    if (!invoiceSchemeOptions.some((option) => option.value === form.invoiceScheme)) {
      nextErrors.invoiceScheme = 'Invoice scheme is required.';
    }

    if (!invoiceLayoutOptions.some((option) => option.value === form.invoiceLayout)) {
      nextErrors.invoiceLayout = 'Invoice layout is required.';
    }

    if (form.hideProductSuggestion && form.showPricingOnProductSuggestionTooltip) {
      nextErrors.showPricingOnProductSuggestionTooltip =
        'Pricing tooltip cannot be enabled when product suggestions are hidden.';
    }

    if (!form.enableServiceStaffInProductLine && form.isServiceStaffRequired) {
      nextErrors.isServiceStaffRequired = 'Service staff cannot be required when service staff is disabled.';
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

    const payload: UpdatePosSettingsInput = {
      disableMultiplePay: form.disableMultiplePay,
      disableDraft: form.disableDraft,
      disableExpressCheckout: form.disableExpressCheckout,
      disableDiscount: form.disableDiscount,
      disableOrderTax: form.disableOrderTax,
      disableCreditSaleButton: form.disableCreditSaleButton,
      disableSuspendSale: form.disableSuspendSale,
      subtotalEditable: form.subtotalEditable,
      hideProductSuggestion: form.hideProductSuggestion,
      showPricingOnProductSuggestionTooltip: form.showPricingOnProductSuggestionTooltip,
      hideRecentTransactions: form.hideRecentTransactions,
      enableTransactionDateOnPosScreen: form.enableTransactionDateOnPosScreen,
      enableWeighingScale: form.enableWeighingScale,
      enableServiceStaffInProductLine: form.enableServiceStaffInProductLine,
      isServiceStaffRequired: form.isServiceStaffRequired,
      invoiceScheme: form.invoiceScheme,
      invoiceLayout: form.invoiceLayout,
      printInvoiceOnSuspend: form.printInvoiceOnSuspend,
    };

    try {
      const savedSettings = await savePosSettings(payload);
      const nextForm = settingsToForm(savedSettings);
      setForm(nextForm);
      setBaselineForm(nextForm);
      setHasHydrated(true);
      setErrors({});
      toast.success('POS settings saved successfully.', { position: 'top-right' });
    } catch (error) {
      if (error instanceof ApiError && error.data && typeof error.data === 'object' && 'errors' in error.data) {
        const apiErrors = ((error.data as Record<string, unknown>).errors ?? {}) as Record<string, string>;
        setErrors((current) => ({ ...current, ...apiErrors }));
        setSubmitError(error.message);
      } else {
        setSubmitError(error instanceof Error ? error.message : 'Failed to save POS settings.');
      }
      toast.error('Unable to save POS settings.', { position: 'top-right' });
    }
  };

  const handleReset = () => {
    setForm(baselineForm);
    setErrors({});
    setSubmitError(null);
    clearError();
  };

  return (
    <SettingsTabShell title="POS Settings" description="Manage register behavior and cashier defaults.">
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
            Loading POS settings...
          </section>
        ) : (
          <>
            <Section
              icon={ShoppingCart}
              title="Checkout Controls"
              description="Restrict what cashiers can do at checkout on the POS screen."
            >
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <ToggleField
                  label="Disable Multiple Pay"
                  description="Prevents splitting a sale across multiple payment methods."
                  checked={form.disableMultiplePay}
                  onChange={() => toggleField('disableMultiplePay')}
                />
                <ToggleField
                  label="Disable Draft"
                  description="Stops cashiers from saving a sale as a draft."
                  checked={form.disableDraft}
                  onChange={() => toggleField('disableDraft')}
                />
                <ToggleField
                  label="Disable Express Checkout"
                  description="Hides the fast checkout flow from the POS screen."
                  checked={form.disableExpressCheckout}
                  onChange={() => toggleField('disableExpressCheckout')}
                />
                <ToggleField
                  label="Disable Discount"
                  description="Prevents discounts from being applied at checkout."
                  checked={form.disableDiscount}
                  onChange={() => toggleField('disableDiscount')}
                />
                <ToggleField
                  label="Disable Order Tax"
                  description="Blocks manual order tax entry during checkout."
                  checked={form.disableOrderTax}
                  onChange={() => toggleField('disableOrderTax')}
                />
                <ToggleField
                  label="Disable Credit Sale Button"
                  description="Removes the credit sale action from checkout."
                  checked={form.disableCreditSaleButton}
                  onChange={() => toggleField('disableCreditSaleButton')}
                />
                <ToggleField
                  label="Disable Suspend Sale"
                  description="Stops sales from being parked or suspended."
                  checked={form.disableSuspendSale}
                  onChange={() => toggleField('disableSuspendSale')}
                />
                <ToggleField
                  label="Subtotal Editable"
                  description="Allow cashiers to manually edit the subtotal."
                  checked={form.subtotalEditable}
                  onChange={() => toggleField('subtotalEditable')}
                />
              </div>
            </Section>

            <Section
              icon={Sparkles}
              title="Product Suggestions"
              description="Control the suggestion list that appears while searching for products."
            >
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <ToggleField
                  label="Don't Show Product Suggestion"
                  description="Hides suggested products while searching at checkout."
                  checked={form.hideProductSuggestion}
                  onChange={() => toggleField('hideProductSuggestion')}
                />
                <ToggleField
                  label="Show Pricing on Product Suggestion Tooltip"
                  description={
                    form.hideProductSuggestion ? 'Requires product suggestions to be shown.' : undefined
                  }
                  checked={form.showPricingOnProductSuggestionTooltip}
                  disabled={form.hideProductSuggestion}
                  onChange={() => toggleField('showPricingOnProductSuggestionTooltip')}
                />
              </div>
            </Section>

            <Section
              icon={MonitorSmartphone}
              title="Screen & Transaction Display"
              description="What's visible on the POS screen while cashiers work."
            >
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <ToggleField
                  label="Don't Show Recent Transactions"
                  description="Removes the recent transaction panel from the POS screen."
                  checked={form.hideRecentTransactions}
                  onChange={() => toggleField('hideRecentTransactions')}
                />
                <ToggleField
                  label="Enable Transaction Date on POS Screen"
                  description="Shows the transaction date while processing a sale."
                  checked={form.enableTransactionDateOnPosScreen}
                  onChange={() => toggleField('enableTransactionDateOnPosScreen')}
                />
                <ToggleField
                  label="Enable Weighing Scale"
                  description="Allows weighing scale input to be used in POS sales."
                  checked={form.enableWeighingScale}
                  onChange={() => toggleField('enableWeighingScale')}
                />
              </div>
            </Section>

            <Section
              icon={UserCog}
              title="Service Staff"
              description="Assign staff to individual product lines on a sale."
            >
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <ToggleField
                  label="Enable Service Staff in Product Line"
                  description="Lets cashiers assign staff to individual product lines."
                  checked={form.enableServiceStaffInProductLine}
                  onChange={() => toggleField('enableServiceStaffInProductLine')}
                />
                <ToggleField
                  label="Service Staff Required"
                  description={
                    !form.enableServiceStaffInProductLine
                      ? 'Requires service staff on product lines to be enabled.'
                      : 'Require service staff on every product line.'
                  }
                  checked={form.isServiceStaffRequired}
                  disabled={!form.enableServiceStaffInProductLine}
                  onChange={() => toggleField('isServiceStaffRequired')}
                />
              </div>
            </Section>

            <Section
              icon={FileText}
              title="Invoice"
              description="Choose how invoices are numbered, laid out, and printed from the POS."
            >
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                <SelectField
                  label="Show Invoice Scheme"
                  description="Choose the numbering scheme used for new invoices."
                  value={invoiceSchemeOptions.find((option) => option.value === form.invoiceScheme) ?? null}
                  options={invoiceSchemeOptions}
                  error={errors.invoiceScheme}
                  onChange={(option) => option && updateField('invoiceScheme', option.value as PosFormState['invoiceScheme'])}
                />
                <SelectField
                  label="Show Invoice Layout"
                  description="Choose the layout style for printed or displayed invoices."
                  value={invoiceLayoutOptions.find((option) => option.value === form.invoiceLayout) ?? null}
                  options={invoiceLayoutOptions}
                  error={errors.invoiceLayout}
                  onChange={(option) => option && updateField('invoiceLayout', option.value as PosFormState['invoiceLayout'])}
                />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <ToggleField
                  label="Print Invoice on Suspend"
                  description="Automatically prints an invoice when a sale is suspended."
                  checked={form.printInvoiceOnSuspend}
                  onChange={() => toggleField('printInvoiceOnSuspend')}
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
            {isSaving ? 'Saving...' : 'Save POS Settings'}
          </button>
        </div>
      </form>
    </SettingsTabShell>
  );
}

function settingsToForm(settings: PosSettingsRecord): PosFormState {
  return {
    disableMultiplePay: settings.disableMultiplePay,
    disableDraft: settings.disableDraft,
    disableExpressCheckout: settings.disableExpressCheckout,
    disableDiscount: settings.disableDiscount,
    disableOrderTax: settings.disableOrderTax,
    disableCreditSaleButton: settings.disableCreditSaleButton,
    disableSuspendSale: settings.disableSuspendSale,
    subtotalEditable: settings.subtotalEditable,
    hideProductSuggestion: settings.hideProductSuggestion,
    showPricingOnProductSuggestionTooltip: settings.showPricingOnProductSuggestionTooltip,
    hideRecentTransactions: settings.hideRecentTransactions,
    enableTransactionDateOnPosScreen: settings.enableTransactionDateOnPosScreen,
    enableWeighingScale: settings.enableWeighingScale,
    enableServiceStaffInProductLine: settings.enableServiceStaffInProductLine,
    isServiceStaffRequired: settings.isServiceStaffRequired,
    invoiceScheme: settings.invoiceScheme,
    invoiceLayout: settings.invoiceLayout,
    printInvoiceOnSuspend: settings.printInvoiceOnSuspend,
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
