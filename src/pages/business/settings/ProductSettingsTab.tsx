import { useMemo, useState } from 'react';
import Select, { type StylesConfig } from 'react-select';
import {
  CalendarClock,
  Hash,
  LayoutGrid,
  Ruler,
  ShieldCheck,
  Warehouse,
} from 'lucide-react';
import SettingsTabShell from './SettingsTabShell';

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

type ErrorState = Partial<Record<'skuPrefix' | 'stopSellingDaysBefore', string>>;

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

export default function ProductSettingsTab() {
  const [form, setForm] = useState<ProductFormState>(initialForm);
  const [errors, setErrors] = useState<ErrorState>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errorItems = useMemo(() => Object.values(errors).filter(Boolean) as string[], [errors]);

  const updateField = <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleField = (key: keyof ProductFormState) => {
    setForm((current) => {
      const nextValue = !current[key];
      const next: ProductFormState = { ...current, [key]: nextValue } as ProductFormState;

      // Sub categories only make sense when categories are enabled.
      if (key === 'enableCategories' && !nextValue) {
        next.enableSubCategories = false;
      }

      return next;
    });
  };

  const validate = () => {
    const nextErrors: ErrorState = {};

    if (!form.skuPrefix.trim()) {
      nextErrors.skuPrefix = 'SKU prefix is required.';
    }

    if (
      form.enableProductExpiry &&
      form.expirySellingBehavior === 'stop_selling_before' &&
      (form.stopSellingDaysBefore.trim() === '' || Number(form.stopSellingDaysBefore) <= 0)
    ) {
      nextErrors.stopSellingDaysBefore = 'Enter how many days before expiry selling should stop.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Product settings payload', form);
    } finally {
      setIsSubmitting(false);
    }
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

        {/* SKU & Identification */}
        <Section icon={Hash} title="SKU & Identification" description="How new products are coded and identified.">
          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="SKU Prefix"
              placeholder="e.g. PRD-"
              value={form.skuPrefix}
              error={errors.skuPrefix}
              onChange={(value) => updateField('skuPrefix', value)}
            />
          </div>
        </Section>

        {/* Expiry Tracking */}
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
              <div className="space-y-5 rounded-lg border border-border bg-background p-4">
                <RadioPillGroup
                  label="Expiry Tracking Method"
                  options={expiryTrackingOptions}
                  value={form.expiryTrackingMethod}
                  onChange={(value) => updateField('expiryTrackingMethod', value)}
                />

                <RadioPillGroup
                  label="Product Expiry Behavior"
                  options={expirySellingOptions}
                  value={form.expirySellingBehavior}
                  onChange={(value) => updateField('expirySellingBehavior', value)}
                />

                {form.expirySellingBehavior === 'stop_selling_before' && (
                  <div className="max-w-xs">
                    <Field
                      label="Days Before Expiry to Stop Selling"
                      placeholder="e.g. 7"
                      value={form.stopSellingDaysBefore}
                      error={errors.stopSellingDaysBefore}
                      onChange={(value) => updateField('stopSellingDaysBefore', value)}
                      type="number"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </Section>

        {/* Catalog Organization */}
        <Section
          icon={LayoutGrid}
          title="Catalog Organization"
          description="Choose which classification layers are available when creating products."
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <ToggleField
              label="Enable Brands"
              checked={form.enableBrands}
              onChange={() => toggleField('enableBrands')}
            />
            <ToggleField
              label="Enable Categories"
              checked={form.enableCategories}
              onChange={() => toggleField('enableCategories')}
            />
            <ToggleField
              label="Enable Sub Categories"
              description={!form.enableCategories ? 'Requires Categories to be enabled.' : undefined}
              checked={form.enableSubCategories}
              disabled={!form.enableCategories}
              onChange={() => toggleField('enableSubCategories')}
            />
          </div>
        </Section>

        {/* Pricing & Warranty */}
        <Section
          icon={ShieldCheck}
          title="Pricing & Warranty"
          description="Additional information collected when adding a product."
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <ToggleField
              label="Enable Price & Tax Info"
              checked={form.enablePriceTaxInfo}
              onChange={() => toggleField('enablePriceTaxInfo')}
            />
            <ToggleField
              label="Enable Warranty"
              checked={form.enableWarranty}
              onChange={() => toggleField('enableWarranty')}
            />
          </div>
        </Section>

        {/* Units of Measurement */}
        <Section icon={Ruler} title="Units of Measurement" description="Defaults for how product quantities are measured.">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <SelectField
              label="Default Unit"
              value={unitOptions.find((option) => option.value === form.defaultUnit) ?? null}
              options={unitOptions}
              onChange={(option) => option && updateField('defaultUnit', option.value)}
            />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <ToggleField
              label="Enable Sub Units"
              checked={form.enableSubUnits}
              onChange={() => toggleField('enableSubUnits')}
            />
            <ToggleField
              label="Enable Secondary Unit"
              checked={form.enableSecondaryUnit}
              onChange={() => toggleField('enableSecondaryUnit')}
            />
          </div>
        </Section>

        {/* Storage Location */}
        <Section
          icon={Warehouse}
          title="Storage Location"
          description="Track exactly where stock physically sits in your warehouse or store."
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <ToggleField label="Enable Racks" checked={form.enableRacks} onChange={() => toggleField('enableRacks')} />
            <ToggleField label="Enable Row" checked={form.enableRow} onChange={() => toggleField('enableRow')} />
            <ToggleField
              label="Enable Position"
              checked={form.enablePosition}
              onChange={() => toggleField('enablePosition')}
            />
          </div>
        </Section>

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <button
            type="button"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-alt"
            onClick={() => {
              setForm(initialForm);
              setErrors({});
            }}
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Saving...' : 'Save Product Settings'}
          </button>
        </div>
      </form>
    </SettingsTabShell>
  );
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
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
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
}: {
  label: string;
  placeholder: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  type?: 'text' | 'number';
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-foreground">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
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
        className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          checked ? 'bg-primary' : 'bg-muted'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </span>
    </button>
  );
}

function RadioPillGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      <div className="inline-flex flex-wrap gap-1.5 rounded-lg border border-border bg-card p-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              value === option.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-surface-alt'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}