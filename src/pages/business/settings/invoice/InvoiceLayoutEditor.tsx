import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { ArrowLeft, Eye, ImagePlus, LayoutTemplate, Save, Sparkles, Trash2, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import Barcode from 'react-barcode';
import { toWords } from 'number-to-words';
import toast from 'react-hot-toast';
import SettingsTabShell from '../SettingsTabShell';

type EditorMode = 'create' | 'edit';
type EditorTab = 'format' | 'preview';
type LayoutDesign = 'classic' | 'modern' | 'minimal' | 'compact';
type PaperSize = 'a4' | 'thermal';
type HeaderAlignment = 'left' | 'center' | 'right';

export type InvoiceLayoutForm = {
  name: string;
  code: string;
  productLabel: string;
  quantityLabel: string;
  unitPriceLabel: string;
  subTotalLabel: string;
  categoryHsnCodeLabel: string;
  totalQuantityLabel: string;
  itemDiscountLabel: string;
  discountedUnitPriceLabel: string;
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
  showBrand: boolean;
  showSaleDescription: boolean;
  showQrCode: boolean;
  showProductExpiry: boolean;
  showLotNumber: boolean;
  showProductImage: boolean;
  showWarrantyName: boolean;
  showWarrantyExpiryDate: boolean;
  showWarrantyDescription: boolean;
  showTaxBreakdown: boolean;
  showDiscounts: boolean;
  showBarcode: boolean;
  barcodeTotalDueLabel: string;
  showTotalBalanceDue: boolean;
  barcodeChangeReturnLabel: string;
  hideAllPrices: boolean;
  showTotalInWords: boolean;
  barcodeWordFormat: 'international' | 'indian';
  barcodeTaxSummaryLabel: string;
  headerAlignment: HeaderAlignment;
  logoUrl: string;
  qrShowLabels: boolean;
  qrShowBusinessName: boolean;
  qrShowBusinessLocationAddress: boolean;
  qrShowInvoiceNo: boolean;
  qrShowSubtotal: boolean;
  qrShowTotalAmountWithTax: boolean;
  qrShowTotalTax: boolean;
  qrShowCustomerName: boolean;
  qrShowInvoiceUrl: boolean;
  qrShowInvoiceDateTime: boolean;
  qrShowBusinessTax1: boolean;
  invoiceNote: string;
};

type InvoiceLayoutEditorProps = {
  mode: EditorMode;
  title: string;
  subtitle: string;
  initialValues?: Partial<InvoiceLayoutForm>;
  initialTab?: EditorTab;
  submitLabel?: string;
  isSaving?: boolean;
  onSubmit?: (values: InvoiceLayoutForm) => Promise<unknown> | void;
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
  productLabel: initialValues?.productLabel ?? 'Product',
  quantityLabel: initialValues?.quantityLabel ?? 'Qty',
  unitPriceLabel: initialValues?.unitPriceLabel ?? 'Unit Price',
  subTotalLabel: initialValues?.subTotalLabel ?? 'Subtotal',
  categoryHsnCodeLabel: initialValues?.categoryHsnCodeLabel ?? 'Category / HSN Code',
  totalQuantityLabel: initialValues?.totalQuantityLabel ?? 'Total Quantity',
  itemDiscountLabel: initialValues?.itemDiscountLabel ?? 'Item Discount',
  discountedUnitPriceLabel: initialValues?.discountedUnitPriceLabel ?? 'Discounted Unit Price',
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
  showBrand: initialValues?.showBrand ?? true,
  showSaleDescription: initialValues?.showSaleDescription ?? true,
  showQrCode: initialValues?.showQrCode ?? false,
  showProductExpiry: initialValues?.showProductExpiry ?? true,
  showLotNumber: initialValues?.showLotNumber ?? true,
  showProductImage: initialValues?.showProductImage ?? true,
  showWarrantyName: initialValues?.showWarrantyName ?? true,
  showWarrantyExpiryDate: initialValues?.showWarrantyExpiryDate ?? true,
  showWarrantyDescription: initialValues?.showWarrantyDescription ?? true,
  showTaxBreakdown: initialValues?.showTaxBreakdown ?? true,
  showDiscounts: initialValues?.showDiscounts ?? true,
  showBarcode: initialValues?.showBarcode ?? true,
  barcodeTotalDueLabel: initialValues?.barcodeTotalDueLabel ?? 'Due',
  showTotalBalanceDue: initialValues?.showTotalBalanceDue ?? true,
  barcodeChangeReturnLabel: initialValues?.barcodeChangeReturnLabel ?? 'Change return label',
  hideAllPrices: initialValues?.hideAllPrices ?? false,
  showTotalInWords: initialValues?.showTotalInWords ?? true,
  barcodeWordFormat: initialValues?.barcodeWordFormat ?? 'international',
  barcodeTaxSummaryLabel: initialValues?.barcodeTaxSummaryLabel ?? 'Tax summary label',
  headerAlignment: initialValues?.headerAlignment ?? 'center',
  logoUrl: initialValues?.logoUrl ?? '',
  qrShowLabels: initialValues?.qrShowLabels ?? true,
  qrShowBusinessName: initialValues?.qrShowBusinessName ?? true,
  qrShowBusinessLocationAddress: initialValues?.qrShowBusinessLocationAddress ?? true,
  qrShowInvoiceNo: initialValues?.qrShowInvoiceNo ?? true,
  qrShowSubtotal: initialValues?.qrShowSubtotal ?? true,
  qrShowTotalAmountWithTax: initialValues?.qrShowTotalAmountWithTax ?? true,
  qrShowTotalTax: initialValues?.qrShowTotalTax ?? true,
  qrShowCustomerName: initialValues?.qrShowCustomerName ?? true,
  qrShowInvoiceUrl: initialValues?.qrShowInvoiceUrl ?? true,
  qrShowInvoiceDateTime: initialValues?.qrShowInvoiceDateTime ?? true,
  qrShowBusinessTax1: initialValues?.qrShowBusinessTax1 ?? true,
  invoiceNote: initialValues?.invoiceNote ?? 'Payment is due upon receipt unless otherwise agreed.',
});

export default function InvoiceLayoutEditor({
  mode,
  title,
  subtitle,
  initialValues,
  initialTab = 'format',
  submitLabel,
  isSaving = false,
  onSubmit,
}: InvoiceLayoutEditorProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<EditorTab>(initialTab);
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
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!form.code && form.name.trim()) {
      setForm((current) => ({ ...current, code: slugify(current.name) }));
    }
  }, [form.name, form.code]);

  const preview = useMemo(
    () => ({
      invoiceNo: form.code || 'INV-0001',
      date: '11 Jul 2026',
      customer: 'Jane Doe',
      businessName: 'Your Business Name',
      businessLocationAddress: '123 Market Street, Nairobi',
      businessTax1: 'TAX-001',
      invoiceUrl: `example.com/invoice/${form.code || 'INV-0001'}`,
      items: [
        {
          name: 'Product One',
          brand: 'Acme',
          sku: 'SKU-001',
          saleDescription: 'IMEI: 123456789012345',
          qty: 2,
          price: '1,250.00',
          total: '2,500.00',
        },
        {
          name: 'Product Two',
          brand: 'Acme',
          sku: 'SKU-002',
          saleDescription: 'Serial Number: SN-0002',
          qty: 1,
          price: '850.00',
          total: '850.00',
        },
      ],
      subtotal: '3,350.00',
      tax: '335.00',
      discount: '0.00',
      total: '3,685.00',
    }),
    [form.code],
  );

  const qrPayload = useMemo(() => {
    const fields: string[] = [];

    if (form.qrShowBusinessName) fields.push(`Business Name: ${preview.businessName}`);
    if (form.qrShowBusinessLocationAddress) fields.push(`Business location address: ${preview.businessLocationAddress}`);
    if (form.qrShowBusinessTax1) fields.push(`Business tax 1: ${preview.businessTax1}`);
    if (form.qrShowInvoiceNo) fields.push(`Invoice No.: ${preview.invoiceNo}`);
    if (form.qrShowInvoiceDateTime) fields.push(`Invoice Datetime: ${preview.date}`);
    if (form.qrShowSubtotal) fields.push(`Subtotal: ${preview.subtotal}`);
    if (form.qrShowTotalAmountWithTax) fields.push(`Total amount with tax: ${preview.total}`);
    if (form.qrShowTotalTax) fields.push(`Total Tax: ${preview.tax}`);
    if (form.qrShowCustomerName) fields.push(`Customer name: ${preview.customer}`);
    if (form.qrShowInvoiceUrl) fields.push(`Invoice URL: ${preview.invoiceUrl}`);

    return fields.length > 0 ? fields.join('\n') : `Invoice: ${preview.invoiceNo}`;
  }, [
    form.qrShowBusinessName,
    form.qrShowBusinessLocationAddress,
    form.qrShowBusinessTax1,
    form.qrShowInvoiceNo,
    form.qrShowInvoiceDateTime,
    form.qrShowSubtotal,
    form.qrShowTotalAmountWithTax,
    form.qrShowTotalTax,
    form.qrShowCustomerName,
    form.qrShowInvoiceUrl,
    preview,
  ]);

  const barcodeTotalInWords = useMemo(
    () => formatAmountInWords(preview.total, form.barcodeWordFormat),
    [form.barcodeWordFormat, preview.total],
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
        setLogoPreviewUrl(reader.result);
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
    setErrors(nextErrors);
    return nextErrors.length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error('Please fix the highlighted errors before saving.');
      return;
    }

    try {
      if (onSubmit) {
        await onSubmit(form);
      }

      toast.success(mode === 'edit' ? 'Invoice layout updated successfully.' : 'Invoice layout created successfully.');
      navigate('/business/invoice-settings');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to save invoice layout.';
      setErrors([message]);
      toast.error(message);
    }
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
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : submitLabel ?? (mode === 'edit' ? 'Update Layout' : 'Save Layout')}
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
        <div className="space-y-6">
          <div className="space-y-6">
            <SectionCard title="Layout Information" description="Set the invoice layout identity and how it should render.">
              <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
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
                  <p className="text-xs text-muted-foreground">Optional lines that appear below the invoice title in the layout preview.</p>
                </div>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
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

            <SectionCard title="Invoice Labels" description="Customize the wording used across the invoice preview and print layout.">
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Product Label">
                  <input
                    value={form.productLabel}
                    onChange={(event) => handleFieldChange('productLabel', event.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Product"
                  />
                </Field>
                <Field label="Quantity Label">
                  <input
                    value={form.quantityLabel}
                    onChange={(event) => handleFieldChange('quantityLabel', event.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Qty"
                  />
                </Field>
                <Field label="Unit Price Label">
                  <input
                    value={form.unitPriceLabel}
                    onChange={(event) => handleFieldChange('unitPriceLabel', event.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Unit Price"
                  />
                </Field>
                <Field label="Sub Total Label">
                  <input
                    value={form.subTotalLabel}
                    onChange={(event) => handleFieldChange('subTotalLabel', event.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Subtotal"
                  />
                </Field>
                <Field label="Category / HSN Code Label">
                  <input
                    value={form.categoryHsnCodeLabel}
                    onChange={(event) => handleFieldChange('categoryHsnCodeLabel', event.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Category / HSN Code"
                  />
                </Field>
                <Field label="Total Quantity Label">
                  <input
                    value={form.totalQuantityLabel}
                    onChange={(event) => handleFieldChange('totalQuantityLabel', event.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Total Quantity"
                  />
                </Field>
                <Field label="Item Discount Label">
                  <input
                    value={form.itemDiscountLabel}
                    onChange={(event) => handleFieldChange('itemDiscountLabel', event.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Item Discount"
                  />
                </Field>
                <Field label="Discounted Unit Price Label">
                  <input
                    value={form.discountedUnitPriceLabel}
                    onChange={(event) => handleFieldChange('discountedUnitPriceLabel', event.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Discounted Unit Price"
                  />
                </Field>
              </div>
            </SectionCard>

            <SectionCard title="Display Options" description="Toggle what should appear on the invoice printout.">
              <div className="grid gap-3 md:grid-cols-3">
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
                  label="Show Brand"
                  checked={form.showBrand}
                  onChange={(checked) => handleFieldChange('showBrand', checked)}
                />
                <ToggleField
                  label="Show Category Code / HSN Code"
                  checked={form.showItemsSku}
                  onChange={(checked) => handleFieldChange('showItemsSku', checked)}
                />
                <ToggleField
                  label="Show Sale Description"
                  checked={form.showSaleDescription}
                  onChange={(checked) => handleFieldChange('showSaleDescription', checked)}
                />
                <ToggleField
                  label="Show Product Expiry"
                  checked={form.showProductExpiry}
                  onChange={(checked) => handleFieldChange('showProductExpiry', checked)}
                />
                <ToggleField
                  label="Show Lot Number"
                  checked={form.showLotNumber}
                  onChange={(checked) => handleFieldChange('showLotNumber', checked)}
                />
                <ToggleField
                  label="Show Product Image"
                  checked={form.showProductImage}
                  onChange={(checked) => handleFieldChange('showProductImage', checked)}
                />
                <ToggleField
                  label="Show Warranty Name"
                  checked={form.showWarrantyName}
                  onChange={(checked) => handleFieldChange('showWarrantyName', checked)}
                />
                <ToggleField
                  label="Show Warranty Expiry Date"
                  checked={form.showWarrantyExpiryDate}
                  onChange={(checked) => handleFieldChange('showWarrantyExpiryDate', checked)}
                />
                <ToggleField
                  label="Show Warranty Description"
                  checked={form.showWarrantyDescription}
                  onChange={(checked) => handleFieldChange('showWarrantyDescription', checked)}
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

            <SectionCard title="QR Code" description="Configure the QR code details and the labels that should appear with it.">
              <div className="grid gap-4 md:grid-cols-3">
                <ToggleField
                  label="Show QR Code"
                  checked={form.showQrCode}
                  onChange={(checked) => handleFieldChange('showQrCode', checked)}
                />
                <ToggleField
                  label="Show Labels"
                  checked={form.qrShowLabels}
                  onChange={(checked) => handleFieldChange('qrShowLabels', checked)}
                />
              </div>
              <div className="mt-6">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Fields to be shown</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <ToggleField
                    label="Business Name"
                    checked={form.qrShowBusinessName}
                    onChange={(checked) => handleFieldChange('qrShowBusinessName', checked)}
                  />
                  <ToggleField
                    label="Business location address"
                    checked={form.qrShowBusinessLocationAddress}
                    onChange={(checked) => handleFieldChange('qrShowBusinessLocationAddress', checked)}
                  />
                  <ToggleField
                    label="Business tax 1"
                    checked={form.qrShowBusinessTax1}
                    onChange={(checked) => handleFieldChange('qrShowBusinessTax1', checked)}
                  />
                  <ToggleField
                    label="Invoice No."
                    checked={form.qrShowInvoiceNo}
                    onChange={(checked) => handleFieldChange('qrShowInvoiceNo', checked)}
                  />
                  <ToggleField
                    label="Invoice Datetime"
                    checked={form.qrShowInvoiceDateTime}
                    onChange={(checked) => handleFieldChange('qrShowInvoiceDateTime', checked)}
                  />
                  <ToggleField
                    label="Subtotal"
                    checked={form.qrShowSubtotal}
                    onChange={(checked) => handleFieldChange('qrShowSubtotal', checked)}
                  />
                  <ToggleField
                    label="Total amount with tax"
                    checked={form.qrShowTotalAmountWithTax}
                    onChange={(checked) => handleFieldChange('qrShowTotalAmountWithTax', checked)}
                  />
                  <ToggleField
                    label="Total Tax"
                    checked={form.qrShowTotalTax}
                    onChange={(checked) => handleFieldChange('qrShowTotalTax', checked)}
                  />
                  <ToggleField
                    label="Customer name"
                    checked={form.qrShowCustomerName}
                    onChange={(checked) => handleFieldChange('qrShowCustomerName', checked)}
                  />
                  <ToggleField
                    label="Invoice URL"
                    checked={form.qrShowInvoiceUrl}
                    onChange={(checked) => handleFieldChange('qrShowInvoiceUrl', checked)}
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Barcode" description="Configure barcode display, balance and pricing details for the invoice layout.">
              <div className="grid gap-4 md:grid-cols-3">
                <ToggleField
                  label="Show Barcode"
                  checked={form.showBarcode}
                  onChange={(checked) => handleFieldChange('showBarcode', checked)}
                />
                <Field
                  label="Total Due Label (All sales)"
                  helperText="Used for the total due caption shown alongside the barcode."
                >
                  <input
                    value={form.barcodeTotalDueLabel}
                    onChange={(event) => handleFieldChange('barcodeTotalDueLabel', event.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Due"
                  />
                </Field>
                <ToggleField
                  label="Show total balance due (All sales)"
                  checked={form.showTotalBalanceDue}
                  onChange={(checked) => handleFieldChange('showTotalBalanceDue', checked)}
                />
                <Field label="Change return label">
                  <input
                    value={form.barcodeChangeReturnLabel}
                    onChange={(event) => handleFieldChange('barcodeChangeReturnLabel', event.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Change return label"
                  />
                </Field>
                <ToggleField
                  label="Hide all prices"
                  checked={form.hideAllPrices}
                  onChange={(checked) => handleFieldChange('hideAllPrices', checked)}
                />
                <div className="space-y-2">
                  <ToggleField
                    label="Show total in words"
                    checked={form.showTotalInWords}
                    onChange={(checked) => handleFieldChange('showTotalInWords', checked)}
                  />
                  <p className="text-xs text-muted-foreground">Enable php-intl extension in PHP INI settings.</p>
                </div>
                <Field label="Word Format">
                  <select
                    value={form.barcodeWordFormat}
                    onChange={(event) => handleFieldChange('barcodeWordFormat', event.target.value as 'international' | 'indian')}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="international">International</option> 
                    <option value="indian">Indian</option>
                  </select>
                </Field>
                <Field label="Tax summary label">
                  <input
                    value={form.barcodeTaxSummaryLabel}
                    onChange={(event) => handleFieldChange('barcodeTaxSummaryLabel', event.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Tax summary label"
                  />
                </Field>
              </div>
            </SectionCard>

            <SectionCard title="Logo" description="Optional. Upload an image or paste a public image URL for the invoice header logo.">
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
                      <p className="truncate text-xs text-muted-foreground">{logoFileName || form.logoUrl}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-surface-alt p-3 text-sm text-muted-foreground">
                    <ImagePlus className="h-4 w-4" />
                    No logo selected yet.
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard title="Invoice Note" description="Add a short note that appears with the layout settings preview.">
              <textarea
                value={form.invoiceNote}
                onChange={(event) => handleFieldChange('invoiceNote', event.target.value)}
                rows={4}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Payment instructions or extra note..."
              />
            </SectionCard>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div> 
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
                    {form.showBusinessDetails && <p className="text-xs text-slate-600">123 Market Street, Nairobi</p>}
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
                  INVOICE
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
                    <th className="py-2">{form.productLabel}</th>
                    {form.showBrand && <th className="py-2">Brand</th>}
                    {form.showItemsSku && <th className="py-2">{form.categoryHsnCodeLabel}</th>}
                    <th className="py-2 text-right">{form.quantityLabel}</th>
                    <th className="py-2 text-right">{form.unitPriceLabel}</th>
                    <th className="py-2 text-right">{form.subTotalLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.items.map((item) => (
                    <tr key={item.name} className="border-b border-slate-200">
                      <td className="py-3 font-medium text-slate-900">
                        <div>{item.name}</div>
                        {form.showSaleDescription && <div className="mt-1 text-xs font-normal text-slate-500">{item.saleDescription}</div>}
                      </td>
                      {form.showBrand && <td className="py-3 text-slate-600">{item.brand}</td>}
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
                  <SummaryLine label={form.subTotalLabel} value={preview.subtotal} />
                  {form.showTaxBreakdown && <SummaryLine label="Tax" value={preview.tax} />}
                  {form.showDiscounts && <SummaryLine label="Discount" value={preview.discount} />}
                  <SummaryLine label="Total" value={preview.total} emphasized />
                </div>
              </div>

              <div className="mt-5 grid gap-2 border-t border-dashed border-slate-300 pt-4 text-xs text-slate-600 sm:grid-cols-2">
                <p>{form.totalQuantityLabel}: {preview.items.reduce((sum, item) => sum + item.qty, 0)}</p>
                <p>{form.itemDiscountLabel}: {preview.discount}</p>
              </div>

              {(form.showQrCode || form.showBarcode) && (
                <div className="mt-6 border-t border-dashed border-slate-300 pt-6">
                  <div className="flex w-full flex-wrap items-center justify-start gap-10">
                    {form.showQrCode && <QRCode value={qrPayload} size={144} className="h-32 w-32" />}
                    {form.showBarcode && (
                      <div className="flex flex-col items-start gap-2 overflow-hidden">
                        <Barcode
                          value={preview.invoiceNo}
                          format="CODE128"
                          width={1.8}
                          height={68}
                          fontSize={14}
                          displayValue={false}
                          background="transparent"
                          lineColor="#111827"
                        />
                        {form.showTotalInWords && <p className="w-full text-left text-xs text-slate-600">{capitalizeFirstLetter(barcodeTotalInWords)}</p>}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-5 border-t border-dashed border-slate-300 pt-4 text-sm text-slate-700">
                Thank you for your business.
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <SectionCard title="Preview Controls" description="What you see here reflects the format tab.">
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Logo: {form.showLogo ? 'Shown' : 'Hidden'}</p>
                <p>Business details: {form.showBusinessDetails ? 'Shown' : 'Hidden'}</p>
                <p>Customer details: {form.showCustomerDetails ? 'Shown' : 'Hidden'}</p>
                <p>Brand: {form.showBrand ? 'Shown' : 'Hidden'}</p>
                <p>Category / HSN code: {form.showItemsSku ? 'Shown' : 'Hidden'}</p>
                <p>Sale description: {form.showSaleDescription ? 'Shown' : 'Hidden'}</p>
                <p>Product expiry: {form.showProductExpiry ? 'Shown' : 'Hidden'}</p>
                <p>Lot number: {form.showLotNumber ? 'Shown' : 'Hidden'}</p>
                <p>Product image: {form.showProductImage ? 'Shown' : 'Hidden'}</p>
                <p>Warranty name: {form.showWarrantyName ? 'Shown' : 'Hidden'}</p>
                <p>Warranty expiry date: {form.showWarrantyExpiryDate ? 'Shown' : 'Hidden'}</p>
                <p>Warranty description: {form.showWarrantyDescription ? 'Shown' : 'Hidden'}</p>
                <p>Barcode: {form.showBarcode ? 'Shown' : 'Hidden'}</p>
              </div>
            </SectionCard>

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
                <p>Toggle the display options to control what your customers see on the invoice.</p>
                <p>The preview tab updates from the same data you are editing here.</p>
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
        active ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
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
    <section className="bg-card p-5 shadow-sm">
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
    <div className="block space-y-2">
      <div className="flex items-center gap-1 text-sm font-medium text-foreground">
        <span>{label}</span>
        {required && <span className="text-red-500">*</span>}
      </div>
      {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
      {children}
    </div>
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

function formatAmountInWords(amount: string, format: 'international' | 'indian') {
  const numericAmount = Number.parseFloat(amount.replace(/,/g, ''));
  if (Number.isNaN(numericAmount)) {
    return '';
  }

  const whole = Math.floor(numericAmount);
  const fraction = Math.round((numericAmount - whole) * 100);
  const wholeWords = toWords(whole);
  const fractionWords = fraction > 0 ? ` and ${toWords(fraction)} ${format === 'indian' ? 'paise' : 'cents'}` : '';

  return `${wholeWords}${fractionWords}`;
}

function capitalizeFirstLetter(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}
