import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { ArrowLeft, Eye, ImagePlus, LayoutTemplate, Save, Sparkles, Trash2, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  Autoformat,
  Bold,
  ClassicEditor,
  Essentials,
  Italic,
  Heading,
  Link,
  List,
  Paragraph,
  RemoveFormat,
  Strikethrough,
  Underline,
} from 'ckeditor5';
import SettingsTabShell from '../SettingsTabShell';
import 'ckeditor5/ckeditor5.css';

type EditorMode = 'create' | 'edit';
type EditorTab = 'format' | 'preview';
type LayoutDesign = 'classic' | 'modern' | 'minimal' | 'compact';
type PaperSize = 'a4' | 'thermal';
type HeaderAlignment = 'left' | 'center' | 'right';

export type InvoiceLayoutForm = {
  name: string;
  code: string;
  subheadingLine1: string;
  subheadingLine2: string;
  subheadingLine3: string;
  subheadingLine4: string;
  subheadingLine5: string;
  design: LayoutDesign;
  paperSize: PaperSize;
  isDefault: boolean;
  showLogo: boolean;
  showBusinessDetails: boolean;
  showCustomerDetails: boolean;
  showItemsSku: boolean;
  showQrCode: boolean;
  showTaxBreakdown: boolean;
  showDiscounts: boolean;
  headerAlignment: HeaderAlignment;
  logoUrl: string;
  headerText: string;
  footerText: string;
  invoiceNote: string;
};

type InvoiceLayoutEditorProps = {
  mode: EditorMode;
  title: string;
  subtitle: string;
  initialValues?: Partial<InvoiceLayoutForm>;
  submitLabel?: string;
};

const designLabels: Record<LayoutDesign, string> = {
  classic: 'Classic',
  modern: 'Modern',
  minimal: 'Minimal',
  compact: 'Compact',
};

const paperLabels: Record<PaperSize, string> = {
  a4: 'A4',
  thermal: 'Thermal Roll',
};

const headerAlignmentLabels: Record<HeaderAlignment, string> = {
  left: 'Left',
  center: 'Center',
  right: 'Right',
};

const initialForm = (initialValues?: Partial<InvoiceLayoutForm>): InvoiceLayoutForm => ({
  name: initialValues?.name ?? '',
  code: initialValues?.code ?? '',
  subheadingLine1: initialValues?.subheadingLine1 ?? '',
  subheadingLine2: initialValues?.subheadingLine2 ?? '',
  subheadingLine3: initialValues?.subheadingLine3 ?? '',
  subheadingLine4: initialValues?.subheadingLine4 ?? '',
  subheadingLine5: initialValues?.subheadingLine5 ?? '',
  design: initialValues?.design ?? 'classic',
  paperSize: initialValues?.paperSize ?? 'a4',
  isDefault: initialValues?.isDefault ?? false,
  showLogo: initialValues?.showLogo ?? true,
  showBusinessDetails: initialValues?.showBusinessDetails ?? true,
  showCustomerDetails: initialValues?.showCustomerDetails ?? true,
  showItemsSku: initialValues?.showItemsSku ?? true,
  showQrCode: initialValues?.showQrCode ?? false,
  showTaxBreakdown: initialValues?.showTaxBreakdown ?? true,
  showDiscounts: initialValues?.showDiscounts ?? true,
  headerAlignment: initialValues?.headerAlignment ?? 'center',
  logoUrl: initialValues?.logoUrl ?? '',
  headerText: initialValues?.headerText ?? '<p><strong>INVOICE</strong></p>',
  footerText: initialValues?.footerText ?? '<p>Thank you for your business.</p>',
  invoiceNote: initialValues?.invoiceNote ?? 'Payment is due upon receipt unless otherwise agreed.',
});

export default function InvoiceLayoutEditor({
  mode,
  title,
  subtitle,
  initialValues,
  submitLabel,
}: InvoiceLayoutEditorProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<EditorTab>('format');
  const [form, setForm] = useState(() => initialForm(initialValues));
  const [errors, setErrors] = useState<string[]>([]);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState('');
  const [logoFileName, setLogoFileName] = useState('');

  useEffect(() => {
    setForm(initialForm(initialValues));
    setLogoPreviewUrl(initialValues?.logoUrl ?? '');
    setLogoFileName('');
  }, [initialValues]);

  useEffect(() => {
    if (!form.code && form.name.trim()) {
      setForm((current) => ({ ...current, code: slugify(current.name) }));
    }
  }, [form.name, form.code]);

  const preview = useMemo(
    () => ({
      company: 'Your Business Name',
      address: '123 Market Street, Nairobi',
      phone: '+254 700 000 000',
      email: 'accounts@example.com',
      customer: 'Jane Doe',
      invoiceNo: form.code || 'INV-0001',
      date: '11 Jul 2026',
      items: [
        { name: 'Product One', sku: 'SKU-001', qty: 2, price: '1,250.00', total: '2,500.00' },
        { name: 'Product Two', sku: 'SKU-002', qty: 1, price: '850.00', total: '850.00' },
      ],
      subtotal: '3,350.00',
      tax: '335.00',
      discount: '0.00',
      total: '3,685.00',
    }),
    [form.code],
  );

  const handleFieldChange = <K extends keyof InvoiceLayoutForm>(key: K, value: InvoiceLayoutForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleLogoSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please choose a PNG, JPEG, or WEBP image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo image must be 5MB or smaller.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoPreviewUrl(reader.result as string);
        setLogoFileName(file.name);
      }
    };
    reader.onerror = () => toast.error('Could not read the selected image.');
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setForm((current) => ({ ...current, logoUrl: '' }));
    setLogoPreviewUrl('');
    setLogoFileName('');
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const validate = () => {
    const nextErrors: string[] = [];

    if (!form.name.trim()) nextErrors.push('Layout name is required.');
    if (!form.headerText.trim()) nextErrors.push('Header text cannot be empty.');
    if (!form.footerText.trim()) nextErrors.push('Footer text cannot be empty.');

    setErrors(nextErrors);
    return nextErrors.length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      toast.error('Please fix the highlighted errors before saving.');
      return;
    }

    toast.success(mode === 'edit' ? 'Invoice layout updated successfully.' : 'Invoice layout created successfully.');
    navigate('/business/invoice-settings');
  };

  return (
    <SettingsTabShell title={title} description={subtitle}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/business/invoice-settings')}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-alt"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <LayoutTemplate className="h-6 w-6 text-primary" />
              {title}
            </h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Save className="h-4 w-4" />
          {submitLabel ?? (mode === 'edit' ? 'Update Layout' : 'Save Layout')}
        </button>
      </div>

      {errors.length > 0 && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="mb-2 font-semibold">Please resolve the following:</p>
          <ul className="space-y-1">
            {errors.map((error) => (
              <li key={error}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-6 flex gap-6 border-b border-border">
        <TabButton active={activeTab === 'format'} onClick={() => setActiveTab('format')}>
          <Sparkles className="h-4 w-4" />
          Customize Format
        </TabButton>
        <TabButton active={activeTab === 'preview'} onClick={() => setActiveTab('preview')}>
          <Eye className="h-4 w-4" />
          Preview
        </TabButton>
      </div>

      {activeTab === 'format' ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
          <div className="space-y-6">
            <SectionCard
              title="Layout Information"
              description="Set the invoice layout identity and how it should render."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Layout Name" required>
                  <input
                    value={form.name}
                    onChange={(event) => handleFieldChange('name', event.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Standard Invoice"
                  />
                </Field>
                <Field label="Layout Code">
                  <input
                    value={form.code}
                    onChange={(event) => handleFieldChange('code', slugify(event.target.value))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="standard-invoice"
                  />
                </Field>
                <Field label="Template Style">
                  <select
                    value={form.design}
                    onChange={(event) => handleFieldChange('design', event.target.value as LayoutDesign)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {Object.entries(designLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Paper Size">
                  <select
                    value={form.paperSize}
                    onChange={(event) => handleFieldChange('paperSize', event.target.value as PaperSize)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {Object.entries(paperLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Header Alignment">
                  <select
                    value={form.headerAlignment}
                    onChange={(event) => handleFieldChange('headerAlignment', event.target.value as HeaderAlignment)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {Object.entries(headerAlignmentLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Default Layout">
                  <label className="inline-flex items-center gap-2 pt-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={form.isDefault}
                      onChange={(event) => handleFieldChange('isDefault', event.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    Make this the default layout
                  </label>
                </Field>
              </div>

              <div className="mt-6 border-t border-border pt-5">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-foreground">Subheading Lines</h3>
                  <p className="text-xs text-muted-foreground">
                    Optional lines that appear below the invoice title in the layout preview.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Subheading Line 1">
                    <input
                      value={form.subheadingLine1}
                      onChange={(event) => handleFieldChange('subheadingLine1', event.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Example: Tax Invoice"
                    />
                  </Field>
                  <Field label="Subheading Line 2">
                    <input
                      value={form.subheadingLine2}
                      onChange={(event) => handleFieldChange('subheadingLine2', event.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Optional subtitle line"
                    />
                  </Field>
                  <Field label="Subheading Line 3">
                    <input
                      value={form.subheadingLine3}
                      onChange={(event) => handleFieldChange('subheadingLine3', event.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Optional subtitle line"
                    />
                  </Field>
                  <Field label="Subheading Line 4">
                    <input
                      value={form.subheadingLine4}
                      onChange={(event) => handleFieldChange('subheadingLine4', event.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Optional subtitle line"
                    />
                  </Field>
                  <Field label="Subheading Line 5">
                    <input
                      value={form.subheadingLine5}
                      onChange={(event) => handleFieldChange('subheadingLine5', event.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Optional subtitle line"
                    />
                  </Field>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Display Options"
              description="Toggle what should appear on the invoice printout."
            >
              <div className="grid gap-3 md:grid-cols-2">
                <ToggleField label="Show Logo" checked={form.showLogo} onChange={(checked) => handleFieldChange('showLogo', checked)} />
                <ToggleField
                  label="Show Business Details"
                  checked={form.showBusinessDetails}
                  onChange={(checked) => handleFieldChange('showBusinessDetails', checked)}
                />
                <ToggleField
                  label="Show Customer Details"
                  checked={form.showCustomerDetails}
                  onChange={(checked) => handleFieldChange('showCustomerDetails', checked)}
                />
                <ToggleField
                  label="Show SKU"
                  checked={form.showItemsSku}
                  onChange={(checked) => handleFieldChange('showItemsSku', checked)}
                />
                <ToggleField
                  label="Show QR Code"
                  checked={form.showQrCode}
                  onChange={(checked) => handleFieldChange('showQrCode', checked)}
                />
                <ToggleField
                  label="Show Tax Breakdown"
                  checked={form.showTaxBreakdown}
                  onChange={(checked) => handleFieldChange('showTaxBreakdown', checked)}
                />
                <ToggleField
                  label="Show Discounts"
                  checked={form.showDiscounts}
                  onChange={(checked) => handleFieldChange('showDiscounts', checked)}
                />
              </div>
            </SectionCard>

            <SectionCard
              title="Header and Footer"
              description="Use the editor to style your header and footer text."
            >
              <div className="grid gap-6">
                <Field
                  label="Logo"
                  helperText="Optional. Upload an image or paste a public image URL for the invoice header logo."
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-3">
                      <input
                        value={form.logoUrl}
                        onChange={(event) => handleFieldChange('logoUrl', event.target.value)}
                        className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="https://example.com/logo.png"
                      />
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleLogoSelect}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                      >
                        <Upload className="h-4 w-4" />
                        Choose Image
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        disabled={!form.logoUrl}
                        className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      You can paste a URL or upload an image file. PNG, JPEG and WEBP up to 5MB are supported.
                    </p>
                    {logoPreviewUrl || form.logoUrl ? (
                      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-alt p-3">
                        <img
                          src={logoPreviewUrl || form.logoUrl}
                          alt="Logo preview"
                          className="h-16 w-16 rounded-lg border border-border object-cover"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">Logo preview</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {logoFileName || form.logoUrl}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-surface-alt p-3 text-sm text-muted-foreground">
                        <ImagePlus className="h-4 w-4" />
                        No logo selected yet.
                      </div>
                    )}
                  </div>
                </Field>

                <Field label="Header Text" required>
                  <RichTextEditor
                    label="Header Text Editor"
                    value={form.headerText}
                    onChange={(value) => handleFieldChange('headerText', value)}
                  />
                </Field>

                <Field label="Footer Text" required>
                  <RichTextEditor
                    label="Footer Text Editor"
                    value={form.footerText}
                    onChange={(value) => handleFieldChange('footerText', value)}
                  />
                </Field>

                <Field label="Invoice Note">
                  <textarea
                    value={form.invoiceNote}
                    onChange={(event) => handleFieldChange('invoiceNote', event.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Payment instructions or extra note..."
                  />
                </Field>
              </div>
            </SectionCard>
          </div>

          <div className="space-y-6">
            <SectionCard title="Quick Summary" description="This is what will be applied to your invoice layout.">
              <dl className="space-y-4 text-sm">
                <SummaryRow label="Layout Name" value={form.name || 'Untitled layout'} />
                <SummaryRow label="Layout Code" value={form.code || 'auto-generated'} />
                <SummaryRow label="Template" value={designLabels[form.design]} />
                <SummaryRow label="Paper Size" value={paperLabels[form.paperSize]} />
                <SummaryRow label="Header Alignment" value={headerAlignmentLabels[form.headerAlignment]} />
                <SummaryRow label="Default" value={form.isDefault ? 'Yes' : 'No'} />
              </dl>
            </SectionCard>

            <SectionCard title="Need a quick reminder?" description="We keep the format flexible, but the preview shows the final result.">
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Header and footer use CKEditor so you can apply bold text, lists, links, and spacing.</p>
                <p>Toggle the display options to control what your customers see on the invoice.</p>
                <p>The preview tab updates from the same data you are editing here.</p>
              </div>
            </SectionCard>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Invoice Preview</p>
                <h2 className="text-xl font-bold text-foreground">{form.name || 'Untitled layout'}</h2>
              </div>
              <div className="rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                {designLabels[form.design]}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-white p-6 text-sm text-slate-900 shadow-sm">
              <div className="mb-6 flex items-start justify-between gap-4 border-b border-dashed border-slate-300 pb-5">
                <div className="space-y-2">
                  {form.showLogo && (logoPreviewUrl || form.logoUrl ? (
                    <img
                      src={logoPreviewUrl || form.logoUrl}
                      alt="Invoice logo"
                      className="h-16 w-16 rounded-xl border border-slate-200 object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 text-xs font-semibold text-slate-600">
                      LOGO
                    </div>
                  ))}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Your Business Name</h3>
                    {form.showBusinessDetails && (
                      <p className="text-xs text-slate-600">123 Market Street, Nairobi</p>
                    )}
                  </div>
                </div>
                <div className="text-right text-xs text-slate-600">
                  <p className="font-semibold text-slate-900">Invoice #{preview.invoiceNo}</p>
                  <p>Date: {preview.date}</p>
                  <p>Customer: {preview.customer}</p>
                </div>
              </div>

              <div className="mb-5">
                <div className={`mb-3 ${headerAlignmentClass(form.headerAlignment)} text-2xl font-extrabold tracking-wide`}>
                  <div dangerouslySetInnerHTML={{ __html: form.headerText }} />
                </div>
                {(form.subheadingLine1 || form.subheadingLine2 || form.subheadingLine3 || form.subheadingLine4 || form.subheadingLine5) && (
                  <div className="mb-3 space-y-1 text-sm text-slate-600">
                    {[
                      form.subheadingLine1,
                      form.subheadingLine2,
                      form.subheadingLine3,
                      form.subheadingLine4,
                      form.subheadingLine5,
                    ]
                      .filter(Boolean)
                      .map((line, index) => (
                        <p key={`${line}-${index}`}>{line}</p>
                      ))}
                  </div>
                )}
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Invoice Preview</p>
              </div>

              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-300 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-2">Item</th>
                    {form.showItemsSku && <th className="py-2">SKU</th>}
                    <th className="py-2 text-right">Qty</th>
                    <th className="py-2 text-right">Price</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.items.map((item) => (
                    <tr key={item.name} className="border-b border-slate-200">
                      <td className="py-3 font-medium text-slate-900">{item.name}</td>
                      {form.showItemsSku && <td className="py-3 text-slate-600">{item.sku}</td>}
                      <td className="py-3 text-right text-slate-600">{item.qty}</td>
                      <td className="py-3 text-right text-slate-600">{item.price}</td>
                      <td className="py-3 text-right font-medium text-slate-900">{item.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-5 flex justify-end">
                <div className="w-full max-w-xs space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
                  <SummaryLine label="Subtotal" value={preview.subtotal} />
                  {form.showTaxBreakdown && <SummaryLine label="Tax" value={preview.tax} />}
                  {form.showDiscounts && <SummaryLine label="Discount" value={preview.discount} />}
                  <SummaryLine label="Total" value={preview.total} emphasized />
                </div>
              </div>

              <div className="mt-5 border-t border-dashed border-slate-300 pt-4">
                <div className="prose prose-sm max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: form.footerText }} />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <SectionCard title="Preview Controls" description="What you see here reflects the format tab.">
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Logo: {form.showLogo ? 'Shown' : 'Hidden'}</p>
                <p>Business details: {form.showBusinessDetails ? 'Shown' : 'Hidden'}</p>
                <p>Customer details: {form.showCustomerDetails ? 'Shown' : 'Hidden'}</p>
                <p>SKUs: {form.showItemsSku ? 'Shown' : 'Hidden'}</p>
                <p>QR code: {form.showQrCode ? 'Shown' : 'Hidden'}</p>
              </div>
            </SectionCard>
            <SectionCard title="Footer text" description="The preview below uses your live CKEditor content.">
              <div className="rounded-lg border border-border bg-surface-alt p-4 text-sm text-foreground">
                <div dangerouslySetInnerHTML={{ __html: form.footerText }} />
              </div>
            </SectionCard>
          </div>
        </div>
      )}
    </SettingsTabShell>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px inline-flex items-center gap-2 border-b-2 px-1 py-2 text-sm font-medium transition-colors ${
        active
          ? 'border-primary text-primary'
          : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  required,
  helperText,
  children,
}: {
  label: string;
  required?: boolean;
  helperText?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <div className="flex items-center gap-1 text-sm font-medium text-foreground">
        <span>{label}</span>
        {required && <span className="text-red-500">*</span>}
      </div>
      {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
      {children}
    </label>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center justify-between gap-4 rounded-xl border px-4 py-3 text-sm text-foreground transition-colors ${
        checked ? 'border-primary/40 bg-primary/5' : 'border-border bg-background hover:border-primary/25 hover:bg-surface-alt'
      }`}
    >
      <span className="font-medium leading-5">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
          checked ? 'border-primary bg-primary' : 'border-border bg-muted'
        }`}
        aria-pressed={checked}
        aria-label={label}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-dashed border-border pb-2 last:border-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}

function SummaryLine({ label, value, emphasized = false }: { label: string; value: string; emphasized?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${emphasized ? 'text-base font-bold text-slate-900' : 'text-slate-700'}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function headerAlignmentClass(align: HeaderAlignment) {
  switch (align) {
    case 'left':
      return 'text-left';
    case 'right':
      return 'text-right';
    default:
      return 'text-center';
  }
}

function RichTextEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const editorRef = useRef<ClassicEditor | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.getData() !== value) {
      editorRef.current.setData(value);
    }
  }, [value]);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
      <div className="border-b border-border bg-surface-alt px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="ck-editor-host">
        <CKEditor
          editor={ClassicEditor}
          data={value}
          config={{
            plugins: [
              Essentials,
              Autoformat,
              Paragraph,
              Heading,
              Bold,
              Italic,
              Underline,
              Strikethrough,
              Link,
              List,
              RemoveFormat,
            ],
            toolbar: [
              'undo',
              'redo',
              '|',
              'heading',
              '|',
              'bold',
              'italic',
              'underline',
              'strikethrough',
              'removeFormat',
              '|',
              'link',
              'bulletedList',
              'numberedList',
            ],
            heading: {
              options: [
                { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
                { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
                { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
              ],
            },
            link: {
              addTargetToExternalLinks: true,
              defaultProtocol: 'https://',
            },
          }}
          onReady={(editor) => {
            editorRef.current = editor as ClassicEditor;
          }}
          onChange={(_, editor) => {
            onChange(editor.getData());
          }}
        />
      </div>
    </div>
  );
}
