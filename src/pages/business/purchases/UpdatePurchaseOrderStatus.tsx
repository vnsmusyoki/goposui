import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Select, { type StylesConfig } from 'react-select';
import { ArrowLeft, Bell, CheckCircle2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import DatePickerField from '@/components/forms/DatePickerField';
import { useBusinessSettings } from '@/hooks/business/settings/useBusinessSettings';
import { useProductSettings } from '@/hooks/business/settings/useProductSettings';
import { usePurchasesSettings } from '@/hooks/business/settings/usePurchasesSettings';
import { usePurchaseOrderDetails, type PurchaseOrderDetailItem } from '@/hooks/business/purchases/usePurchaseOrderDetails';
import { usePurchaseOrderStatuses, type PurchaseOrderStatusDefinition } from '@/hooks/business/purchases/usePurchaseOrderStatuses';
import { usePurchaseOrders, type PurchaseOrderStatus, type DeliveryStatus, type PaymentStatus } from '@/hooks/business/purchases/usePurchaseOrders';
import { ApiError } from '@/lib/api';

type SelectOption = {
  value: string;
  label: string;
};

type ApprovalChannel = 'notification' | 'sms' | 'whatsapp';
type ApprovalChannelState = Record<ApprovalChannel, boolean>;

type ReceivingRow = {
  id: string;
  productName: string;
  sku: string;
  unit: string;
  orderQuantity: number;
  balanceQuantity: number;
  receivedQuantity: number;
  manufactureDate: string;
  expiryDate: string;
  lotNumber: string;
  currentStock: number;
  unitCostBeforeDiscount: number;
  discountPercentage: number;
  unitCostBeforeTax: number;
  unitCostAfterTax: number;
};

function formatMoney(amount: number, currencyCode: string, precision: number, placement: 'before' | 'after') {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const currencySymbol = getCurrencySymbol(currencyCode);
  const numeric = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(safeAmount);

  return placement === 'after' ? `${numeric} ${currencySymbol}` : `${currencySymbol} ${numeric}`;
}

function getCurrencySymbol(currencyCode?: string) {
  if (!currencyCode) return '$';
  try {
    const formatter = new Intl.NumberFormat('en', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return formatter.formatToParts(1).find((part) => part.type === 'currency')?.value ?? '$';
  } catch {
    return '$';
  }
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700 border-gray-300',
    pending_approval: 'bg-amber-100 text-amber-700 border-amber-300',
    approved: 'bg-blue-100 text-blue-700 border-blue-300',
    ordered: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    received: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    partially_received: 'bg-cyan-100 text-cyan-700 border-cyan-300',
    closed: 'bg-slate-100 text-slate-700 border-slate-300',
    cancelled: 'bg-red-100 text-red-700 border-red-300',
    completed: 'bg-green-100 text-green-700 border-green-300',
  };
  return colors[status] || 'bg-gray-100 text-gray-700 border-gray-300';
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Draft',
    pending_approval: 'Pending Approval',
    approved: 'Approved',
    ordered: 'Ordered',
    received: 'Received',
    partially_received: 'Partially Received',
    closed: 'Closed',
    cancelled: 'Cancelled',
    completed: 'Completed',
  };
  return labels[status] || status;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(status)}`}>
      {getStatusLabel(status)}
    </span>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border p-0.5 transition-colors overflow-hidden ${
        checked ? 'border-primary bg-primary/15' : 'border-border bg-background'
      }`}
    >
      <span
        className={`h-5 w-5 rounded-full shadow-sm transition-transform duration-200 ${
          checked ? 'translate-x-5 bg-primary' : 'translate-x-0 bg-muted-foreground'
        }`}
      />
    </button>
  );
}

function purchaseOrderStatusSelectStyles(): StylesConfig<SelectOption, false> {
  return {
    control: (base, state) => ({
      ...base,
      minHeight: '42px',
      borderRadius: '0.125rem',
      borderColor: state.isFocused ? 'hsl(var(--primary))' : 'hsl(var(--border))',
      backgroundColor: 'hsl(var(--background))',
      boxShadow: state.isFocused ? '0 0 0 1px hsl(var(--primary))' : 'none',
      paddingLeft: '0.25rem',
      '&:hover': {
        borderColor: state.isFocused ? 'hsl(var(--primary))' : 'hsl(var(--border))',
      },
    }),
    valueContainer: (base) => ({
      ...base,
      padding: '0.25rem 0.5rem',
    }),
    input: (base) => ({
      ...base,
      margin: 0,
      padding: 0,
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
      borderRadius: '0.125rem',
      overflow: 'hidden',
      backgroundColor: 'hsl(var(--background))',
      border: '1px solid hsl(var(--border))',
      boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12)',
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 1000,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? 'hsl(var(--primary))'
        : state.isFocused
          ? 'hsl(var(--muted))'
          : 'hsl(var(--background))',
      color: state.isSelected ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
    }),
    indicatorSeparator: (base) => ({
      ...base,
      backgroundColor: 'hsl(var(--border))',
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: 'hsl(var(--muted-foreground))',
      ':hover': {
        color: 'hsl(var(--foreground))',
      },
    }),
  };
}

function getDefaultApprovalChannelState(): ApprovalChannelState {
  return {
    notification: true,
    sms: false,
    whatsapp: false,
  };
}

function approvalChannelLabel(channel: ApprovalChannel) {
  switch (channel) {
    case 'sms':
      return 'SMS';
    case 'whatsapp':
      return 'WhatsApp';
    default:
      return 'Notification';
  }
}

function splitReceiverInput(value: string): string[] {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseEditableNumberInput(raw: string, options: { min?: number; max?: number } = {}) {
  const trimmed = raw.trim();
  if (trimmed === '' || trimmed === '-' || trimmed === '.') {
    return Math.max(options.min ?? 0, 0);
  }

  const cleaned = trimmed.replace(/[^0-9.]/g, '');
  const [integerPartRaw = '', ...decimalParts] = cleaned.split('.');
  const decimalPart = decimalParts.join('').replace(/[^0-9]/g, '');
  const integerPart = integerPartRaw.replace(/^0+(?=\d)/, '') || '0';
  const normalized = cleaned.includes('.') ? `${integerPart}.${decimalPart}` : integerPart;
  let value = Number(normalized);

  if (!Number.isFinite(value)) {
    value = Math.max(options.min ?? 0, 0);
  }

  if (typeof options.min === 'number') {
    value = Math.max(options.min, value);
  } else {
    value = Math.max(0, value);
  }

  if (typeof options.max === 'number') {
    value = Math.min(options.max, value);
  }

  return value;
}

function formatEditableNumberInput(value: number) {
  return value === 0 ? '' : String(value);
}

function getLocalDateStart(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseLocalDateInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = new Date(`${trimmed}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizePhoneNumbers(values: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const value of values) {
    const candidate = value.trim();
    if (!candidate || !candidate.startsWith('0') || candidate.length !== 10) {
      continue;
    }
    if (!/^\d{10}$/.test(candidate)) {
      continue;
    }
    if (seen.has(candidate)) {
      continue;
    }
    seen.add(candidate);
    normalized.push(candidate);
  }

  return normalized;
}

function isReceivingStatus(status: string) {
  return status === 'received' || status === 'partially_received';
}

function buildReceivingRows(items: PurchaseOrderDetailItem[]): ReceivingRow[] {
  return items.map((item) => {
    const receivedQuantity = Number(item.receivedQuantity ?? 0);
    const orderQuantity = Number(item.orderQuantity ?? 0);
    const balanceQuantity = Math.max(Number(item.balanceQuantity ?? orderQuantity - receivedQuantity), 0);
    const unitCostBeforeDiscount = Number(item.unitCostBeforeDiscount ?? 0);
    const discountPercentage = Number(item.discountPercentage ?? 0);
    const unitCostBeforeTax = Number(item.unitCostBeforeTax ?? 0);
    const unitCostAfterTax = Number(item.netCost ?? unitCostBeforeTax);

    return {
      id: item.id,
      productName: item.productName,
      sku: item.sku,
      unit: item.unit,
      orderQuantity,
      balanceQuantity,
      receivedQuantity: Math.max(Math.min(receivedQuantity, orderQuantity), 0),
      manufactureDate: item.manufactureDate || '',
      expiryDate: item.expiryDate || '',
      lotNumber: item.lotNumber || '',
      currentStock: Number(item.currentStock ?? 0),
      unitCostBeforeDiscount,
      discountPercentage,
      unitCostBeforeTax,
      unitCostAfterTax,
    };
  });
}

function getDiscountAmount(row: ReceivingRow) {
  return Math.max(0, row.unitCostBeforeDiscount - row.unitCostBeforeTax);
}

function getSubtotalBeforeTax(row: ReceivingRow) {
  return Math.max(0, row.unitCostBeforeTax * row.orderQuantity);
}

function getTaxAmount(row: ReceivingRow) {
  return Math.max(0, row.unitCostAfterTax - row.unitCostBeforeTax);
}

function getSubtotalAfterTax(row: ReceivingRow) {
  return Math.max(0, row.unitCostAfterTax * row.orderQuantity);
}

function getStatusDefinition(statuses: PurchaseOrderStatusDefinition[], selectedStatus: string) {
  return statuses.find((entry) => entry.code === selectedStatus);
}

export default function UpdatePurchaseOrderStatus() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { settings: businessSettings } = useBusinessSettings();
  const { settings: productSettings } = useProductSettings();
  const { settings: purchasesSettings } = usePurchasesSettings();
  const { statuses: purchaseOrderStatuses, loading: statusesLoading } = usePurchaseOrderStatuses();
  const { purchaseOrder: purchaseOrderDetail, loading: purchaseOrderDetailLoading, fetchPurchaseOrder } = usePurchaseOrderDetails();
  const { updatePurchaseOrder, loading: saving } = usePurchaseOrders();

  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [approvalReminderChannels, setApprovalReminderChannels] = useState<ApprovalChannelState>(getDefaultApprovalChannelState());
  const [approvalReminderMessage, setApprovalReminderMessage] = useState('');
  const [approvalReminderReceiversText, setApprovalReminderReceiversText] = useState('');
  const [receivingRows, setReceivingRows] = useState<ReceivingRow[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const currencyCode = businessSettings?.currency || 'USD';
  const currencyPrecision = typeof businessSettings?.currencyPrecision === 'number' ? businessSettings.currencyPrecision : 2;
  const currencyPlacement = businessSettings?.currencySymbolPlacement === 'after' ? 'after' : 'before';

  const detail = purchaseOrderDetail?.purchaseOrder;
  const statusDefinition = useMemo(() => getStatusDefinition(purchaseOrderStatuses, selectedStatus), [purchaseOrderStatuses, selectedStatus]);
  const approvalChannelsSelected = useMemo(
    () =>
      (Object.entries(approvalReminderChannels) as Array<[ApprovalChannel, boolean]>)
        .filter(([, enabled]) => enabled)
        .map(([channel]) => channel),
    [approvalReminderChannels],
  );
  const showReceiverInput = approvalChannelsSelected.includes('sms') || approvalChannelsSelected.includes('whatsapp');

  const showManufactureDate = Boolean(productSettings?.enableProductExpiry && productSettings.expiryTrackingMethod === 'manufacturing_and_period');
  const showExpiryDate = Boolean(productSettings?.enableProductExpiry);
  const showLotNumber = Boolean(purchasesSettings?.enableLotNumber);
  const showReceivingGrid = isReceivingStatus(selectedStatus);
  const today = useMemo(() => getLocalDateStart(), []);

  useEffect(() => {
    if (!id) return;
    void fetchPurchaseOrder(id)
      .then((response) => {
        setSelectedStatus(response.purchaseOrder.status || '');
        setApprovalReminderMessage(`Please review and approve purchase order ${response.purchaseOrder.referenceNumber}.`);
        setReceivingRows(buildReceivingRows(response.items ?? []));
      })
      .catch(() => {
        toast.error('Failed to load purchase order details.');
      });
  }, [fetchPurchaseOrder, id]);

  useEffect(() => {
    if (!purchaseOrderDetail?.items?.length) return;
    setReceivingRows(buildReceivingRows(purchaseOrderDetail.items));
  }, [purchaseOrderDetail?.items]);

  const toggleApprovalReminderChannel = (channel: ApprovalChannel) => {
    setApprovalReminderChannels((current) => {
      const next = { ...current, [channel]: !current[channel] };
      if (!next.notification && !next.sms && !next.whatsapp) {
        next.notification = true;
      }
      return next;
    });
  };

  const updateReceivingRow = (id: string, field: keyof ReceivingRow, value: string | number) => {
    setReceivingRows((current) =>
      current.map((row) => {
        if (row.id !== id) return row;
        if (field === 'receivedQuantity') {
          const nextQuantity = Math.max(Number(value) || 0, 0);
          return {
            ...row,
            receivedQuantity: Math.min(nextQuantity, row.orderQuantity),
          };
        }
        if (field === 'manufactureDate' || field === 'expiryDate' || field === 'lotNumber') {
          return {
            ...row,
            [field]: String(value),
          } as ReceivingRow;
        }
        if (field === 'unitCostBeforeDiscount') {
          const nextUnitCostBeforeDiscount = Math.max(0, Number(value) || 0);
          const nextUnitCostBeforeTax = Math.min(nextUnitCostBeforeDiscount, row.unitCostBeforeTax > 0 ? row.unitCostBeforeTax : nextUnitCostBeforeDiscount);
          const nextUnitCostAfterTax = Math.max(nextUnitCostBeforeTax, row.unitCostAfterTax);
          return {
            ...row,
            unitCostBeforeDiscount: nextUnitCostBeforeDiscount,
            unitCostBeforeTax: nextUnitCostBeforeTax,
            unitCostAfterTax: nextUnitCostAfterTax,
          };
        }
        if (field === 'discountPercentage') {
          const nextDiscountPercentage = Math.max(0, Math.min(100, Number(value) || 0));
          const nextDiscountAmount = (row.unitCostBeforeDiscount * nextDiscountPercentage) / 100;
          const nextUnitCostBeforeTax = Math.max(0, row.unitCostBeforeDiscount - nextDiscountAmount);
          const nextUnitCostAfterTax = Math.max(nextUnitCostBeforeTax, row.unitCostAfterTax);
          return {
            ...row,
            discountPercentage: nextDiscountPercentage,
            unitCostBeforeTax: nextUnitCostBeforeTax,
            unitCostAfterTax: nextUnitCostAfterTax,
          };
        }
        if (field === 'unitCostBeforeTax') {
          const nextUnitCostBeforeTax = Math.max(0, Number(value) || 0);
          const nextDiscountAmount = Math.max(0, row.unitCostBeforeDiscount - nextUnitCostBeforeTax);
          const nextDiscountPercentage = row.unitCostBeforeDiscount > 0 ? Math.min(100, (nextDiscountAmount / row.unitCostBeforeDiscount) * 100) : 0;
          const nextUnitCostAfterTax = Math.max(nextUnitCostBeforeTax, row.unitCostAfterTax);
          return {
            ...row,
            discountPercentage: nextDiscountPercentage,
            unitCostBeforeTax: nextUnitCostBeforeTax,
            unitCostAfterTax: nextUnitCostAfterTax,
          };
        }
        if (field === 'unitCostAfterTax') {
          const nextUnitCostAfterTax = Math.max(0, Number(value) || 0);
          return {
            ...row,
            unitCostAfterTax: Math.max(nextUnitCostAfterTax, row.unitCostBeforeTax),
          };
        }
        return row;
      }),
    );
  };

  const validateForm = () => {
    if (!selectedStatus) {
      return 'Please choose a status.';
    }

    const selectedChannels = approvalChannelsSelected;
    const receiverList = normalizePhoneNumbers(splitReceiverInput(approvalReminderReceiversText));
    if (selectedStatus === 'pending_approval') {
      if (selectedChannels.length === 0) {
        return 'Please choose at least one approval reminder channel.';
      }
      if ((selectedChannels.includes('sms') || selectedChannels.includes('whatsapp')) && receiverList.length === 0) {
        return 'Enter valid phone numbers for SMS or WhatsApp reminders.';
      }
      if (splitReceiverInput(approvalReminderReceiversText).length > 0 && receiverList.length === 0) {
        return 'Phone numbers must start with 0 and be exactly 10 digits.';
      }
    }

    if (showReceivingGrid) {
      const invalidRow = receivingRows.find((row) => row.receivedQuantity < 0 || row.receivedQuantity > row.orderQuantity);
      if (invalidRow) {
        return `Received quantity for ${invalidRow.productName} must be between 0 and the ordered quantity.`;
      }

      const invalidDateRow = receivingRows.find((row) => {
        if (!row.manufactureDate || !row.expiryDate) return false;
        const manufactureDate = parseLocalDateInput(row.manufactureDate);
        const expiryDate = parseLocalDateInput(row.expiryDate);
        if (!manufactureDate || !expiryDate) return false;
        return manufactureDate.getTime() >= expiryDate.getTime();
      });

      if (invalidDateRow) {
        return `Manufacture date for ${invalidDateRow.productName} must be earlier than the expiry date.`;
      }
    }

    return null;
  };

  const handleSaveStatus = async () => {
    if (!id || !purchaseOrderDetail?.purchaseOrder) {
      toast.error('Unable to load the selected purchase order.');
      return;
    }

    const validationMessage = validateForm();
    if (validationMessage) {
      setFormError(validationMessage);
      toast.error(validationMessage);
      return;
    }

    const selectedChannels = approvalChannelsSelected;
    const receiverList = normalizePhoneNumbers(splitReceiverInput(approvalReminderReceiversText));
    const detailItems = purchaseOrderDetail?.items ?? [];

    try {
      const response = await updatePurchaseOrder(id, {
        supplierId: detail?.supplierId ?? '',
        referenceNumber: detail?.referenceNumber ?? '',
        orderDate: detail?.orderDate ?? '',
        deliveryDate: detail?.deliveryDate ?? '',
        locationId: detail?.locationId ?? '',
        deliveryAddress: detail?.deliveryAddress ?? '',
        deliveryCharges: Number(detail?.deliveryCharges ?? 0),
        deliveryDocument: detail?.deliveryDocumentName || '',
        orderDiscountAmount: Number(detail?.orderDiscountAmount ?? 0),
        paymentTerm: {
          value: Number(detail?.paymentTermValue ?? 0),
          unit: (detail?.paymentTermUnit as 'days' | 'months' | 'years') || 'days',
        },
        attachment: detail?.attachmentName || '',
        notes: detail?.notes ?? '',
        status: selectedStatus as PurchaseOrderStatus,
        deliveryStatus: (detail?.deliveryStatus as DeliveryStatus) ?? 'pending_delivery',
        paymentStatus: (detail?.paymentStatus as PaymentStatus) ?? 'unpaid',
        items: receivingRows.map((row) => ({
          productId: detailItems.find((item) => item.id === row.id)?.productId ?? '',
          orderQuantity: Number(row.orderQuantity ?? 0),
          unitCostBeforeDiscount: Number(row.unitCostBeforeDiscount ?? 0),
          discountPercentage: Number(row.discountPercentage ?? 0),
          discountAmount: Number(getDiscountAmount(row)),
          unitCostBeforeTax: Number(row.unitCostBeforeTax ?? 0),
          productTaxRate: Number(
            row.unitCostAfterTax > row.unitCostBeforeTax && row.unitCostBeforeTax > 0
              ? ((row.unitCostAfterTax - row.unitCostBeforeTax) / row.unitCostBeforeTax) * 100
              : 0,
          ),
          taxAmount: Number(getTaxAmount(row)),
          netCost: Number(row.unitCostAfterTax ?? 0),
          sellingPrice: Number(row.unitCostAfterTax ?? 0),
          lineCost: Number(getSubtotalAfterTax(row)),
          manufactureDate: row.manufactureDate || '',
          expiryDate: row.expiryDate || '',
          lotNumber: row.lotNumber || '',
          receivedQuantity: row.receivedQuantity,
        })),
        additionalExpenses: (detail?.additionalExpenses ?? []).map((expense, index) => ({
          name: expense.name,
          amount: Number(expense.amount ?? 0),
          sortOrder: expense.sortOrder ?? index,
        })),
        grandTotal: Number(detail?.totalAmount ?? 0),
        totals: {
          subtotal: Number(detail?.subtotal ?? 0),
          totalDiscount: Number(detail?.totalDiscount ?? 0),
          totalTax: Number(detail?.totalTax ?? 0),
          total: Number(detail?.totalAmount ?? 0),
          itemCount: Number(detail?.itemsCount ?? 0),
          totalQuantity: Number(detail?.totalQuantity ?? 0),
        },
        approvalReminderChannels: selectedStatus === 'pending_approval' ? selectedChannels : undefined,
        approvalReminderMessage: selectedStatus === 'pending_approval' ? approvalReminderMessage : undefined,
        approvalReminderReceivers: selectedStatus === 'pending_approval' ? receiverList : undefined,
      });
      toast.success(response.message || 'Purchase order status updated successfully');
      navigate('/purchases/order');
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message || 'Failed to update purchase order status');
      } else {
        toast.error('Failed to update purchase order status');
      }
    }
  };

  const statusOptions = useMemo(
    () =>
      purchaseOrderStatuses.map((status) => ({
        value: status.code,
        label: status.name,
      })),
    [purchaseOrderStatuses],
  );

  const currentTotalLabel = `${detail?.itemsCount ?? 0} item${(detail?.itemsCount ?? 0) === 1 ? '' : 's'} · ${formatMoney(
    Number(detail?.totalAmount ?? 0),
    currencyCode,
    currencyPrecision,
    currencyPlacement,
  )}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full  py-5 pb-10 lg:pb-12">
        <div className="overflow-hidden border border-border bg-card shadow-sm">
          <div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <button
                type="button"
                onClick={() => navigate('/purchases/order')}
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to orders
              </button>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Update order status
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-foreground">
                {detail?.referenceNumber ?? 'Purchase Order'}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Change the order status, queue approval reminders, and record received quantities when goods arrive.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <Bell className="h-3.5 w-3.5" />
              Approval ready
            </div>
          </div>

          <div className="px-5 py-5">
            <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
              <div className="space-y-4">
                <div className="bg-background p-4">
                  <label className="mb-2 block text-sm font-medium text-foreground">Order Status</label>
                  <Select
                    instanceId="purchase-order-status"
                    value={statusOptions.find((option) => option.value === selectedStatus) ?? null}
                    onChange={(option) => setSelectedStatus(option?.value ?? '')}
                    options={statusOptions}
                    placeholder={statusesLoading ? 'Loading statuses...' : 'Select status'}
                    isSearchable
                    menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                    menuPosition="fixed"
                    menuShouldScrollIntoView={false}
                    styles={purchaseOrderStatusSelectStyles()}
                    classNamePrefix="react-select"
                  />

                  {selectedStatus ? (
                    <div className="mt-3 border border-border bg-background p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">What this status does</p>
                      <p className="mt-1 text-sm text-foreground">
                        {statusDefinition?.whatHappens || 'Status information not available.'}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-background p-4">
                  <p className="text-sm font-semibold text-foreground">Current Order Snapshot</p>
                  {purchaseOrderDetailLoading && !purchaseOrderDetail ? (
                    <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Loading purchase order details...
                    </div>
                  ) : (
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Reference</span>
                        <span className="font-medium text-foreground">{detail?.referenceNumber ?? '-'}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Supplier</span>
                        <span className="font-medium text-foreground">{purchaseOrderDetail?.purchaseOrder.supplierName ?? '-'}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Current Status</span>
                        <StatusBadge status={detail?.status ?? 'draft'} />
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">Total</span>
                        <span className="text-right font-medium text-foreground">{currentTotalLabel}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {showReceivingGrid ? (
            <div className="border-t border-border px-5 py-5">
              <div className="border border-border bg-background p-4 shadow-sm">
                <div className="flex flex-col gap-1 border-b border-border pb-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Received Items</p>
                    <p className="text-xs text-muted-foreground">
                      Enter what arrived for each product. Remaining quantity is calculated automatically and never goes below zero.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-alt px-3 py-1 text-xs font-medium text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    {receivingRows.length} product{receivingRows.length === 1 ? '' : 's'}
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  {receivingRows.map((row) => {
                    const balance = Math.min(Math.max(row.orderQuantity - row.receivedQuantity, 0), row.orderQuantity);
                    const subtotalBeforeTax = getSubtotalBeforeTax(row);
                    const taxAmount = getTaxAmount(row);
                    const subtotalAfterTax = getSubtotalAfterTax(row);
                    return (
                      <div key={row.id} className="border border-border bg-background p-4 shadow-sm">
                        <div className="border-b border-border pb-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-foreground">{row.productName}</p>
                              {showLotNumber ? (
                                <span className="rounded-full border border-border bg-surface-alt px-2 py-0.5 text-xs text-muted-foreground">
                                  Lot: {row.lotNumber || 'Not set'}
                                </span>
                              ) : null}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span>{row.unit || 'Unit not set'}</span>
                              <span>SKU: {row.sku || '—'}</span>
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground md:grid-cols-3 lg:grid-cols-4">
                              <span>
                                Ordered: <span className="font-medium text-foreground">{row.orderQuantity}</span>
                              </span>
                              <span>
                                Current Stock: <span className="font-medium text-foreground">{Math.max(0, row.currentStock)}</span>
                              </span>
                              <span>
                                Balance: <span className="font-medium text-foreground">{balance}</span>
                              </span>
                              <span>
                                Subtotal Before Tax:{' '}
                                <span className="font-medium text-foreground">
                                  {formatMoney(subtotalBeforeTax, currencyCode, currencyPrecision, currencyPlacement)}
                                </span>
                              </span>
                              <span>
                                Tax:{' '}
                                <span className="font-medium text-foreground">
                                  {formatMoney(taxAmount, currencyCode, currencyPrecision, currencyPlacement)}
                                </span>
                              </span>
                              <span>
                                Subtotal:{' '}
                                <span className="font-medium text-foreground">
                                  {formatMoney(subtotalAfterTax, currencyCode, currencyPrecision, currencyPlacement)}
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                          <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Received Count
                            </label>
                              <input
                                type="number"
                                min={0}
                                max={row.orderQuantity}
                                step="0.01"
                                value={formatEditableNumberInput(row.receivedQuantity)}
                                onChange={(event) =>
                                  updateReceivingRow(
                                    row.id,
                                    'receivedQuantity',
                                    parseEditableNumberInput(event.target.value, { min: 0, max: row.orderQuantity }),
                                  )
                                }
                                inputMode="decimal"
                                className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                              />
                            </div>

                          <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Unit Cost Before Discount
                            </label>
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={formatEditableNumberInput(row.unitCostBeforeDiscount)}
                                onChange={(event) =>
                                  updateReceivingRow(
                                    row.id,
                                    'unitCostBeforeDiscount',
                                    parseEditableNumberInput(event.target.value, { min: 0 }),
                                  )
                                }
                                inputMode="decimal"
                                className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                              />
                            </div>

                          <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Discount Percentage
                            </label>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                step="0.01"
                                value={formatEditableNumberInput(row.discountPercentage)}
                                onChange={(event) =>
                                  updateReceivingRow(
                                    row.id,
                                    'discountPercentage',
                                    parseEditableNumberInput(event.target.value, { min: 0, max: 100 }),
                                  )
                                }
                                inputMode="decimal"
                                className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                              />
                            </div>

                          <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Unit Cost Before Tax
                            </label>
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={formatEditableNumberInput(row.unitCostBeforeTax)}
                                onChange={(event) =>
                                  updateReceivingRow(row.id, 'unitCostBeforeTax', parseEditableNumberInput(event.target.value, { min: 0 }))
                                }
                                inputMode="decimal"
                                className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                              />
                            </div>

                          <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Unit Cost After Tax
                            </label>
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={formatEditableNumberInput(row.unitCostAfterTax)}
                                onChange={(event) =>
                                  updateReceivingRow(row.id, 'unitCostAfterTax', parseEditableNumberInput(event.target.value, { min: 0 }))
                                }
                                inputMode="decimal"
                                className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                              />
                            </div>

                          {showManufactureDate ? (
                            <div>
                              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Manufacture Date
                              </label>
                              <DatePickerField
                                value={row.manufactureDate}
                                onChange={(value) => updateReceivingRow(row.id, 'manufactureDate', value)}
                                placeholder="Select date"
                                maxDate={today}
                              />
                            </div>
                          ) : null}

                          {showExpiryDate ? (
                            <div>
                              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Expiry Date
                              </label>
                              <DatePickerField
                                value={row.expiryDate}
                                onChange={(value) => updateReceivingRow(row.id, 'expiryDate', value)}
                                placeholder="Select date"
                                minDate={today}
                              />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          {selectedStatus === 'pending_approval' ? (
            <div className="border-t border-border px-5 py-5">
              <div className="bg-background p-4 ">
                <div className="flex flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground">Approval Reminder</p>
                    <h4 className="mt-1 text-base font-semibold text-foreground">
                      Choose the channels you want to use for this approval request.
                    </h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      In-app reminders go to the notifications table. SMS and WhatsApp also store the recipient numbers and message.
                    </p>
                  </div>
                  <div className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                    {approvalChannelsSelected.length} channel{approvalChannelsSelected.length === 1 ? '' : 's'} selected
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {(['notification', 'sms', 'whatsapp'] as ApprovalChannel[]).map((channel) => {
                    const checked = approvalReminderChannels[channel];
                    return (
                      <div
                        key={channel}
                        className={`flex items-center justify-between gap-4 border px-4 py-3 transition-all duration-200 ${
                          checked ? 'border-border bg-background shadow-sm' : 'border-border bg-transparent'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-semibold text-foreground">{approvalChannelLabel(channel)}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {channel === 'notification' ? 'In-app alert' : channel === 'sms' ? 'Text message' : 'WhatsApp message'}
                          </p>
                        </div>
                        <ToggleSwitch
                          checked={checked}
                          onChange={() => toggleApprovalReminderChannel(channel)}
                          ariaLabel={`${approvalChannelLabel(channel)} approval reminder`}
                        />
                      </div>
                    );
                  })}
                </div>

                {showReceiverInput ? (
                  <div className="mt-4">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground">
                      Receiver Phone Numbers
                    </label>
                    <input
                      value={approvalReminderReceiversText}
                      onChange={(event) => setApprovalReminderReceiversText(event.target.value)}
                      className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-shadow duration-200 focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="e.g. 0712345678, 0798765432"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Use commas to separate multiple phone numbers. Each number must start with 0 and be exactly 10 digits.
                    </p>
                  </div>
                ) : null}

                <div className="mt-4">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground">Reminder Message</label>
                  <textarea
                    value={approvalReminderMessage}
                    onChange={(event) => setApprovalReminderMessage(event.target.value)}
                    rows={4}
                    className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-shadow duration-200 focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Type the message that should be sent with this approval reminder..."
                  />
                </div>
              </div>
            </div>
          ) : null}

          {selectedStatus === 'pending_approval' ? (
            <div className="border-t border-border px-5 py-5">
              <div className="border border-border bg-background p-4 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Approval Reminder Summary</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      This will be saved to the notifications table and linked to the purchase order status change.
                    </p>
                  </div>
                  <div className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                    {approvalChannelsSelected.join(', ') || 'No channels selected'}
                  </div>
                </div>
                <div className={`mt-4 grid gap-3 ${showReceiverInput ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
                  {showReceiverInput ? (
                    <div className="border border-border bg-surface-alt p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recipients</p>
                      <p className="mt-1 text-sm text-foreground">
                        {approvalReminderReceiversText.trim() || 'No recipients entered yet'}
                      </p>
                    </div>
                  ) : null}
                  <div className="border border-border bg-surface-alt p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Message</p>
                    <p className="mt-1 text-sm text-foreground">{approvalReminderMessage.trim() || 'No reminder message entered yet'}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-2 border-t border-border px-5 py-4 pb-8">
            {formError ? (
              <div className="mb-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Changing the order status can affect stock movement, supplier billing, approval steps, and invoice preparation.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/purchases/order')}
                  className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-alt"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleSaveStatus()}
                  disabled={saving || purchaseOrderDetailLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Status'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
