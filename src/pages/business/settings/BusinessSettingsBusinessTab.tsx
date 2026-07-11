import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ComponentType, type FormEvent, type ReactNode } from 'react';
import toast from 'react-hot-toast';
import Select, { type StylesConfig } from 'react-select';
import {
  Building2,
  Calendar,
  CircleDollarSign,
  Globe2,
  PackageSearch,
  Upload,
  X,
} from 'lucide-react';
import { ApiError } from '@/lib/api';
import {
  type BusinessSettingsRecord,
  useBusinessSettings,
  type UpdateBusinessSettingsInput,
} from '@/hooks/business/settings/useBusinessSettings';
import SettingsTabShell from './SettingsTabShell';

type SelectOption = {
  value: string;
  label: string;
};

type BusinessFormState = {
  businessName: string;
  startDate: string;
  defaultProfitPercentage: string;
  currency: string;
  currencySymbolPlacement: string;
  timezone: string;
  logoUrl: string;
  financialYearStartMonth: string;
  stockAccountingMethod: string;
  transactionEditDays: string;
  dateFormat: string;
  timeFormat: string;
  currencyPrecision: string;
  quantityPrecision: string;
};

type ErrorState = Partial<Record<keyof BusinessFormState, string>>;

const selectStyles: StylesConfig<SelectOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: 44,
    borderRadius: 10,
    borderColor: 'hsl(var(--border))',
    backgroundColor: 'hsl(var(--background))',
    boxShadow: state.isFocused ? '0 0 0 2px hsl(var(--primary) / 0.18)' : 'none',
    ':hover': {
      borderColor: 'hsl(var(--primary))',
    },
  }),
  valueContainer: (base) => ({
    ...base,
    paddingTop: 2,
    paddingBottom: 2,
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
    borderRadius: 8,
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

const currencyOptions: SelectOption[] = [
  { value: 'KES', label: 'KES' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
  { value: 'NGN', label: 'NGN' },
];

const symbolPlacementOptions: SelectOption[] = [
  { value: 'before', label: 'Before amount' },
  { value: 'after', label: 'After amount' },
];

const timezoneOptions: SelectOption[] = [
  { value: 'Africa/Nairobi', label: 'Africa/Nairobi' },
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/London', label: 'Europe/London' },
  { value: 'America/New_York', label: 'America/New_York' },
];

const monthOptions: SelectOption[] = [
  { value: 'January', label: 'January' },
  { value: 'February', label: 'February' },
  { value: 'March', label: 'March' },
  { value: 'April', label: 'April' },
  { value: 'May', label: 'May' },
  { value: 'June', label: 'June' },
  { value: 'July', label: 'July' },
  { value: 'August', label: 'August' },
  { value: 'September', label: 'September' },
  { value: 'October', label: 'October' },
  { value: 'November', label: 'November' },
  { value: 'December', label: 'December' },
];

const stockAccountingOptions: SelectOption[] = [
  { value: 'FIFO', label: 'FIFO' },
  { value: 'LIFO', label: 'LIFO' },
  { value: 'Average Cost', label: 'Average Cost' },
];

const dateFormatOptions: SelectOption[] = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
];

const timeFormatOptions: SelectOption[] = [
  { value: '12 Hour', label: '12 Hour' },
  { value: '24 Hour', label: '24 Hour' },
];

const initialForm: BusinessFormState = {
  businessName: '',
  startDate: '',
  defaultProfitPercentage: '',
  currency: 'KES',
  currencySymbolPlacement: 'before',
  timezone: 'Africa/Nairobi',
  logoUrl: '',
  financialYearStartMonth: 'January',
  stockAccountingMethod: 'FIFO',
  transactionEditDays: '',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '12 Hour',
  currencyPrecision: '2',
  quantityPrecision: '2',
};

const maxBusinessLogoBytes = 5 * 1024 * 1024;
const allowedLogoTypes = new Set(['image/png', 'image/jpeg']);

export default function BusinessSettingsBusinessTab() {
  const {
    settings,
    isLoading,
    isSaving,
    error: hookError,
    saveBusinessSettings,
    clearError,
  } = useBusinessSettings();
  const [form, setForm] = useState<BusinessFormState>(initialForm);
  const [baselineForm, setBaselineForm] = useState<BusinessFormState>(initialForm);
  const [errors, setErrors] = useState<ErrorState>({});
  const [logoName, setLogoName] = useState('');
  const [hasHydrated, setHasHydrated] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

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
    setLogoName(settings.logoUrl ? 'Stored logo' : '');
    setHasHydrated(true);
  }, [settings, hasHydrated]);

  const updateField = <K extends keyof BusinessFormState>(key: K, value: BusinessFormState[K]) => {
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

  const handleLogoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      if (!allowedLogoTypes.has(file.type)) {
        setErrors((current) => ({ ...current, logoUrl: 'Logo must be a PNG or JPEG image.' }));
        event.target.value = '';
        return;
      }

      if (file.size > maxBusinessLogoBytes) {
        setErrors((current) => ({ ...current, logoUrl: 'Logo must be smaller than 5MB before compression.' }));
        event.target.value = '';
        return;
      }

      const compressedLogo = await compressBusinessLogo(file);
      setLogoName(file.name);
      updateField('logoUrl', compressedLogo);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to process the selected logo.';
      setErrors((current) => ({ ...current, logoUrl: message }));
      event.target.value = '';
    }
  };

  const clearLogo = () => {
    setLogoName('');
    updateField('logoUrl', '');
  };

  const validate = () => {
    const nextErrors: ErrorState = {};

    if (!form.businessName.trim()) {
      nextErrors.businessName = 'Business name is required.';
    }

    if (!form.startDate.trim()) {
      nextErrors.startDate = 'Start date is required.';
    }

    const defaultProfit = Number(form.defaultProfitPercentage);
    if (form.defaultProfitPercentage === '' || Number.isNaN(defaultProfit)) {
      nextErrors.defaultProfitPercentage = 'Default profit percentage is required.';
    } else if (defaultProfit < 0 || defaultProfit > 100) {
      nextErrors.defaultProfitPercentage = 'Default profit percentage must be between 0 and 100.';
    }

    if (!form.currency) {
      nextErrors.currency = 'Currency is required.';
    }

    if (!form.currencySymbolPlacement) {
      nextErrors.currencySymbolPlacement = 'Currency symbol placement is required.';
    }

    if (!form.timezone) {
      nextErrors.timezone = 'Timezone is required.';
    }

    if (!form.financialYearStartMonth) {
      nextErrors.financialYearStartMonth = 'Financial year start month is required.';
    }

    if (!form.stockAccountingMethod) {
      nextErrors.stockAccountingMethod = 'Stock accounting method is required.';
    }

    const transactionEditDays = Number(form.transactionEditDays);
    if (form.transactionEditDays === '' || Number.isNaN(transactionEditDays) || !Number.isInteger(transactionEditDays) || transactionEditDays < 0) {
      nextErrors.transactionEditDays = 'Transaction edit days must be zero or more.';
    }

    if (!form.dateFormat) {
      nextErrors.dateFormat = 'Date format is required.';
    }

    if (!form.timeFormat) {
      nextErrors.timeFormat = 'Time format is required.';
    }

    const currencyPrecision = Number(form.currencyPrecision);
    if (form.currencyPrecision === '' || Number.isNaN(currencyPrecision) || !Number.isInteger(currencyPrecision) || currencyPrecision < 0) {
      nextErrors.currencyPrecision = 'Currency precision must be zero or more.';
    }

    const quantityPrecision = Number(form.quantityPrecision);
    if (form.quantityPrecision === '' || Number.isNaN(quantityPrecision) || !Number.isInteger(quantityPrecision) || quantityPrecision < 2) {
      nextErrors.quantityPrecision = 'Quantity precision must be two or more.';
    }

    if (form.logoUrl && !isValidBusinessLogoDataUrl(form.logoUrl)) {
      nextErrors.logoUrl = 'Please choose a valid PNG or JPEG logo under 5MB.';
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

    const payload: UpdateBusinessSettingsInput = {
      name: form.businessName.trim(),
      startDate: form.startDate.trim(),
      defaultProfitPercentage: Number(form.defaultProfitPercentage),
      currency: form.currency.trim(),
      currencySymbolPlacement: form.currencySymbolPlacement.trim(),
      timezone: form.timezone.trim(),
      logoUrl: form.logoUrl.trim(),
      financialYearStartMonth: form.financialYearStartMonth.trim(),
      stockAccountingMethod: form.stockAccountingMethod.trim(),
      transactionEditDays: Number(form.transactionEditDays),
      dateFormat: form.dateFormat.trim(),
      timeFormat: form.timeFormat.trim(),
      currencyPrecision: Number(form.currencyPrecision),
      quantityPrecision: Number(form.quantityPrecision),
    };

    try {
      const savedSettings = await saveBusinessSettings(payload);
      const nextForm = settingsToForm(savedSettings);
      setForm(nextForm);
      setBaselineForm(nextForm);
      setLogoName(savedSettings.logoUrl ? 'Stored logo' : '');
      setHasHydrated(true);
      setErrors({});
      toast.success('Business settings saved successfully.', { position: 'top-right' });
    } catch (error) {
      if (error instanceof ApiError && error.data && typeof error.data === 'object' && 'errors' in error.data) {
        const apiErrors = ((error.data as Record<string, unknown>).errors ?? {}) as Record<string, string>;
        setErrors(mapApiErrorsToFormErrors(apiErrors));
        setSubmitError(error.message);
      } else {
        setSubmitError(error instanceof Error ? error.message : 'Failed to save business settings.');
      }
      toast.error('Unable to save business settings.', { position: 'top-right' });
    }
  };

  const handleReset = () => {
    setForm(baselineForm);
    setErrors({});
    setSubmitError(null);
    setLogoName(baselineForm.logoUrl ? 'Stored logo' : '');
    clearError();
  };

  return (
    <SettingsTabShell
      title="Business Settings"
      description="Configure the business identity, finance defaults, and system preferences."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {errorItems.length > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
            <p className="mb-2 font-semibold">Please fix the following issues:</p>
            <ul className="list-disc space-y-1 pl-5">
              {errorItems.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {isLoading && !hasHydrated ? (
          <section className="bg-card p-6 text-sm text-muted-foreground">
            Loading business settings...
          </section>
        ) : (
          <>
            <Section
              icon={Building2}
              title="Business Identity"
              description="How your business is named and represented across the system."
            >
              <div className="grid gap-5 lg:grid-cols-2">
                <Field
                  label="Business Name"
                  placeholder="Enter business name"
                  value={form.businessName}
                  error={errors.businessName}
                  onChange={(value) => updateField('businessName', value)}
                  required
                />

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-foreground">Start date</span>
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(event) => updateField('startDate', event.target.value)}
                      className={`w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                        errors.startDate ? 'border-red-500' : 'border-border'
                      }`}
                    />
                  </div>
                  {errors.startDate && <p className="mt-1 text-xs text-red-600">{errors.startDate}</p>}
                </label>
              </div>
              <div className='grid grid-cols-1'> 
                  <p className="text-sm font-medium text-foreground">Logo</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    PNG or JPEG only. Keep the file under 5MB.
                  </p>
                  
                   
                  <div className="mt-4 grid gap-4 ">
                     
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Upload className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {logoName || (form.logoUrl ? 'Stored logo' : 'No file selected')}
                          </p>
                          
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/png,image/jpeg"
                          className="hidden"
                          onChange={(event) => {
                            void handleLogoChange(event);
                          }}
                        />
                        
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                          onClick={() => logoInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4" />
                          Select logo image
                        </button>
                        {form.logoUrl && (
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-alt"
                            onClick={clearLogo}
                          >
                            <X className="h-4 w-4" />
                            Remove image
                          </button>
                        )}
                        {form.logoUrl && (
                      <img
                        src={form.logoUrl}
                        alt="Business logo preview"
                        className="rounded-full border border-border object-cover"
                        style={{ width: '100px', height: '100px' }}
                      />
                    )}
                      </div>

                      {errors.logoUrl && <p className="text-xs text-red-600">{errors.logoUrl}</p>}
                    </div>
                  </div> 
              </div>
            </Section>

            <Section
              icon={CircleDollarSign}
              title="Financial & Currency"
              description="Defaults used for pricing, margins, and how money is displayed."
            >
              <div className="grid gap-5 md:grid-cols-3 xl:grid-cols-3">
                <Field
                  label="Default Profit Percentage"
                  placeholder="Enter default profit percentage"
                  value={form.defaultProfitPercentage}
                  error={errors.defaultProfitPercentage}
                  onChange={(value) => updateField('defaultProfitPercentage', value)}
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                />

                <SelectField
                  label="Currency"
                  value={currencyOptions.find((option) => option.value === form.currency) ?? null}
                  options={currencyOptions}
                  error={errors.currency}
                  onChange={(option) => option && updateField('currency', option.value)}
                  required
                />

                <SelectField
                  label="Currency Symbol Placement"
                  value={symbolPlacementOptions.find((option) => option.value === form.currencySymbolPlacement) ?? null}
                  options={symbolPlacementOptions}
                  error={errors.currencySymbolPlacement}
                  onChange={(option) => option && updateField('currencySymbolPlacement', option.value)}
                  required
                />

                <Field
                  label="Currency Precision"
                  placeholder="Enter currency precision"
                  value={form.currencyPrecision}
                  error={errors.currencyPrecision}
                  onChange={(value) => updateField('currencyPrecision', value)}
                  type="number"
                  step="1"
                  min="0"
                  required
                />

                <SelectField
                  label="Financial Year Start Month"
                  value={monthOptions.find((option) => option.value === form.financialYearStartMonth) ?? null}
                  options={monthOptions}
                  error={errors.financialYearStartMonth}
                  onChange={(option) => option && updateField('financialYearStartMonth', option.value)}
                  required
                />
              </div>
            </Section>

            <Section
              icon={PackageSearch}
              title="Inventory & Transactions"
              description="Stock valuation rules and how far back transactions can be edited."
            >
              <div className="grid gap-5 md:grid-cols-3 xl:grid-cols-3">
                <SelectField
                  label="Stock Accounting Method"
                  value={stockAccountingOptions.find((option) => option.value === form.stockAccountingMethod) ?? null}
                  options={stockAccountingOptions}
                  error={errors.stockAccountingMethod}
                  onChange={(option) => option && updateField('stockAccountingMethod', option.value)}
                  required
                />

                <Field
                  label="Quantity Precision"
                  placeholder="Enter quantity precision"
                  value={form.quantityPrecision}
                  error={errors.quantityPrecision}
                  onChange={(value) => updateField('quantityPrecision', value)}
                  type="number"
                  step="1"
                  min="2"
                  required
                />

                <Field
                  label="Transaction Edit Days"
                  placeholder="Enter transaction edit days"
                  value={form.transactionEditDays}
                  error={errors.transactionEditDays}
                  onChange={(value) => updateField('transactionEditDays', value)}
                  type="number"
                  step="1"
                  min="0"
                  required
                />
              </div>
            </Section>

            <Section
              icon={Globe2}
              title="Regional & Display Preferences"
              description="Timezone and how dates and times appear throughout the app."
            >
              <div className="grid gap-5 md:grid-cols-3 xl:grid-cols-3">
                <SelectField
                  label="Timezone"
                  value={timezoneOptions.find((option) => option.value === form.timezone) ?? null}
                  options={timezoneOptions}
                  error={errors.timezone}
                  onChange={(option) => option && updateField('timezone', option.value)}
                  required
                />

                <SelectField
                  label="Date Format"
                  value={dateFormatOptions.find((option) => option.value === form.dateFormat) ?? null}
                  options={dateFormatOptions}
                  error={errors.dateFormat}
                  onChange={(option) => option && updateField('dateFormat', option.value)}
                  required
                />

                <SelectField
                  label="Time Format"
                  value={timeFormatOptions.find((option) => option.value === form.timeFormat) ?? null}
                  options={timeFormatOptions}
                  error={errors.timeFormat}
                  onChange={(option) => option && updateField('timeFormat', option.value)}
                  required
                />
              </div>
            </Section>
          </>
        )}

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
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
            {isSaving ? 'Saving...' : 'Save Business Settings'}
          </button>
        </div>
      </form>
    </SettingsTabShell>
  );
}

function settingsToForm(settings: BusinessSettingsRecord): BusinessFormState {
  return {
    businessName: settings.name ?? '',
    startDate: settings.startDate ?? '',
    defaultProfitPercentage:
      typeof settings.defaultProfitPercentage === 'number' ? String(settings.defaultProfitPercentage) : '',
    currency: settings.currency || initialForm.currency,
    currencySymbolPlacement: settings.currencySymbolPlacement || initialForm.currencySymbolPlacement,
    timezone: settings.timezone || initialForm.timezone,
    logoUrl: settings.logoUrl || '',
    financialYearStartMonth: settings.financialYearStartMonth || initialForm.financialYearStartMonth,
    stockAccountingMethod: settings.stockAccountingMethod || initialForm.stockAccountingMethod,
    transactionEditDays:
      typeof settings.transactionEditDays === 'number' ? String(settings.transactionEditDays) : '',
    dateFormat: settings.dateFormat || initialForm.dateFormat,
    timeFormat: settings.timeFormat || initialForm.timeFormat,
    currencyPrecision:
      typeof settings.currencyPrecision === 'number' ? String(settings.currencyPrecision) : initialForm.currencyPrecision,
    quantityPrecision:
      typeof settings.quantityPrecision === 'number' ? String(settings.quantityPrecision) : initialForm.quantityPrecision,
  };
}

function mapApiErrorsToFormErrors(apiErrors: Record<string, string>): ErrorState {
  const mapped: ErrorState = {};

  const keyMap: Record<string, keyof BusinessFormState> = {
    name: 'businessName',
    startDate: 'startDate',
    defaultProfitPercentage: 'defaultProfitPercentage',
    currency: 'currency',
    currencySymbolPlacement: 'currencySymbolPlacement',
    timezone: 'timezone',
    logoUrl: 'logoUrl',
    financialYearStartMonth: 'financialYearStartMonth',
    stockAccountingMethod: 'stockAccountingMethod',
    transactionEditDays: 'transactionEditDays',
    dateFormat: 'dateFormat',
    timeFormat: 'timeFormat',
    currencyPrecision: 'currencyPrecision',
    quantityPrecision: 'quantityPrecision',
  };

  for (const [apiKey, message] of Object.entries(apiErrors)) {
    const localKey = keyMap[apiKey];
    if (localKey) {
      mapped[localKey] = message;
    }
  }

  return mapped;
}

function isValidBusinessLogoDataUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return true;
  }

  const parts = trimmed.split(',', 2);
  if (parts.length !== 2) {
    return false;
  }

  const meta = parts[0].toLowerCase();
  if (!meta.startsWith('data:image/') || !meta.endsWith(';base64')) {
    return false;
  }

  if (!meta.startsWith('data:image/png;base64') && !meta.startsWith('data:image/jpeg;base64') && !meta.startsWith('data:image/jpg;base64')) {
    return false;
  }

  return true;
}

async function compressBusinessLogo(file: File): Promise<string> {
  const image = await loadImage(file);
  let width = image.naturalWidth || image.width;
  let height = image.naturalHeight || image.height;

  if (width <= 0 || height <= 0) {
    throw new Error('Unable to read the selected image.');
  }

  const maxDimension = 1600;
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  width = Math.max(1, Math.round(width * scale));
  height = Math.max(1, Math.round(height * scale));

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Unable to process the selected image.');
    }

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    for (const quality of [0.88, 0.8, 0.7, 0.6, 0.5]) {
      const blob = await canvasToBlob(canvas, quality);
      if (blob.size <= maxBusinessLogoBytes) {
        return readBlobAsDataURL(blob);
      }
    }

    width = Math.max(1, Math.floor(width * 0.85));
    height = Math.max(1, Math.floor(height * 0.85));
  }

  throw new Error('Image must be smaller than 5MB after compression.');
}

function readBlobAsDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('Unable to process the selected image.'));
    };
    reader.onerror = () => reject(new Error('Unable to process the selected image.'));
    reader.readAsDataURL(blob);
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Unable to read the selected image.'));
    };

    image.src = objectUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Unable to process the selected image.'));
          return;
        }
        resolve(blob);
      },
      'image/jpeg',
      quality,
    );
  });
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl  bg-card p-5 sm:p-6">
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
  required = false,
  min,
  max,
  step,
}: {
  label: string;
  placeholder: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  type?: 'text' | 'number';
  required?: boolean;
  min?: string;
  max?: string;
  step?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-1 text-red-600">*</span>}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        min={min}
        max={max}
        step={step}
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
  required = false,
}: {
  label: string;
  value: SelectOption | null;
  options: SelectOption[];
  error?: string;
  onChange: (value: SelectOption | null) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-1 text-red-600">*</span>}
      </span>
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
