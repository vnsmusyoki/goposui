import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Building2,
  CheckCircle2,
  Columns3,
  Download,
  Edit2,
  CreditCard,
  Eye,
  FileText,
  Loader2,
  Mail,
  MapPin,
  MoreVertical,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Save,
  Trash2,
  Users,
  UserRound,
  XCircle,
  MessageCircle,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart as RechartsLineChart,
  Line,
  ScatterChart as RechartsScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import toast from 'react-hot-toast';
import { ApiError } from '@/lib/api';
import { normalizePhoneNumber } from '@/lib/phone';
import PhoneNumberInput from '@/components/forms/PhoneNumberInput';
import { useBusinessCustomers, type BusinessCustomerRecord, type CreateBusinessCustomerInput } from '@/hooks/business/customers/useBusinessCustomers';

type CustomerFormState = {
  contactId: string;
  customerCode: string;
  firstName: string;
  middleName: string;
  lastName: string;
  companyName: string;
  phone: string;
  email: string;
  address: string;
  shippingAddress: string;
  taxNumber: string;
  openingBalance: string;
  payTermsType: string;
  payTermsValue: string;
  creditLimit: string;
  customerGroup: string;
  advanceBalance: string;
  totalSaleDue: string;
  totalSellReturnDue: string;
  customField1: string;
  customField2: string;
  customField3: string;
  customField4: string;
  customField5: string;
  notes: string;
  isActive: boolean;
};

function generateCustomerCode() {
  return `CUS-${Date.now().toString().slice(-6)}`;
}

function getInitialCustomerForm(customer?: BusinessCustomerRecord | null): CustomerFormState {
  if (!customer) {
    return {
      contactId: generateCustomerCode(),
      customerCode: generateCustomerCode(),
      firstName: '',
      middleName: '',
      lastName: '',
      companyName: '',
      phone: '',
      email: '',
      address: '',
      shippingAddress: '',
      taxNumber: '',
      openingBalance: '0',
      payTermsType: '',
      payTermsValue: '0',
      creditLimit: '0',
      customerGroup: '',
      advanceBalance: '0',
      totalSaleDue: '0',
      totalSellReturnDue: '0',
      customField1: '',
      customField2: '',
      customField3: '',
      customField4: '',
      customField5: '',
      notes: '',
      isActive: true,
    };
  }

  return {
    contactId: customer.contactId || customer.customerCode || generateCustomerCode(),
    customerCode: customer.customerCode || generateCustomerCode(),
    firstName: customer.firstName || '',
    middleName: customer.middleName || '',
    lastName: customer.lastName || '',
    companyName: customer.companyName || '',
    phone: customer.phone || '',
    email: customer.email || '',
    address: customer.address || '',
    shippingAddress: customer.shippingAddress || '',
    taxNumber: customer.taxNumber || '',
    openingBalance: String(customer.openingBalance ?? 0),
    payTermsType: customer.payTermsType || '',
    payTermsValue: String(customer.payTermsValue ?? 0),
    creditLimit: String(customer.creditLimit ?? 0),
    customerGroup: customer.customerGroup || '',
    advanceBalance: String(customer.advanceBalance ?? 0),
    totalSaleDue: String(customer.totalSaleDue ?? 0),
    totalSellReturnDue: String(customer.totalSellReturnDue ?? 0),
    customField1: customer.customField1 || '',
    customField2: customer.customField2 || '',
    customField3: customer.customField3 || '',
    customField4: customer.customField4 || '',
    customField5: customer.customField5 || '',
    notes: customer.notes || '',
    isActive: customer.isActive,
  };
}

function customerDisplayName(customer: BusinessCustomerRecord) {
  return customer.displayName || customer.name || customer.companyName || [customer.firstName, customer.middleName, customer.lastName].filter(Boolean).join(' ') || 'Customer';
}

function customerType(customer: BusinessCustomerRecord) {
  return customer.companyName.trim() ? 'Business' : 'Individual';
}

function formatDate(dateString: string) {
  if (!dateString) {
    return '—';
  }
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function SectionCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-sm font-medium text-foreground">{children}</label>;
}

function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      rows={4}
      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
    />
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
        active ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'
      }`}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

type VisibleCustomerColumns = {
  contactId: boolean;
  businessName: boolean;
  name: boolean;
  email: boolean;
  taxNumber: boolean;
  creditLimit: boolean;
  openingBalance: boolean;
  advanceBalance: boolean;
  addedOn: boolean;
  customerGroup: boolean;
  code: boolean;
  address: boolean;
  mobile: boolean;
  totalSaleDue: boolean;
  totalSellReturnDue: boolean;
  customField1: boolean;
  customField2: boolean;
  customField3: boolean;
  customField4: boolean;
  customField5: boolean;
  status: boolean;
  actions: boolean;
};

const DEFAULT_VISIBLE_CUSTOMER_COLUMNS: VisibleCustomerColumns = {
  contactId: true,
  businessName: true,
  name: true,
  email: true,
  taxNumber: true,
  creditLimit: true,
  openingBalance: true,
  advanceBalance: true,
  addedOn: true,
  customerGroup: true,
  code: true,
  address: true,
  mobile: true,
  totalSaleDue: true,
  totalSellReturnDue: true,
  customField1: true,
  customField2: true,
  customField3: true,
  customField4: true,
  customField5: true,
  status: true,
  actions: true,
};

const CUSTOMER_EXPORT_COLUMN_ORDER: Array<{ key: keyof VisibleCustomerColumns; label: string }> = [
  { key: 'contactId', label: 'Contact ID' },
  { key: 'businessName', label: 'Business Name' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'taxNumber', label: 'Tax Number' },
  { key: 'creditLimit', label: 'Credit Limit' },
  { key: 'openingBalance', label: 'Opening Balance' },
  { key: 'advanceBalance', label: 'Advance Balance' },
  { key: 'addedOn', label: 'Added On' },
  { key: 'customerGroup', label: 'Customer Group' },
  { key: 'code', label: 'Code' },
  { key: 'address', label: 'Address' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'totalSaleDue', label: 'Total Sale Due' },
  { key: 'totalSellReturnDue', label: 'Total Sell Return Due' },
  { key: 'customField1', label: 'Custom Field 1' },
  { key: 'customField2', label: 'Custom Field 2' },
  { key: 'customField3', label: 'Custom Field 3' },
  { key: 'customField4', label: 'Custom Field 4' },
  { key: 'customField5', label: 'Custom Field 5' },
  { key: 'status', label: 'Status' },
];

function escapeCsvValue(value: string) {
  const normalized = value.replace(/"/g, '""');
  return `"${normalized}"`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function MetricCard({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

function ActionMenuItem({
  label,
  onClick,
  destructive = false,
}: {
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  const iconMap: Record<string, React.ReactNode> = {
    Pay: <CreditCard className="h-4 w-4" />,
    View: <Eye className="h-4 w-4" />,
    Edit: <Edit2 className="h-4 w-4" />,
    Deactivate: <XCircle className="h-4 w-4" />,
    Ledger: <FileText className="h-4 w-4" />,
    Sales: <BarChart3 className="h-4 w-4" />,
    'Documents & notes': <MessageCircle className="h-4 w-4" />,
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
        destructive ? 'text-destructive hover:bg-destructive/10' : 'text-foreground hover:bg-surface-alt hover:text-primary'
      }`}
    >
      {iconMap[label] ?? <MoreVertical className="h-4 w-4" />}
      <span>{label}</span>
    </button>
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

function CustomerFormModal({
  open,
  title,
  isSaving,
  initialValue,
  errorMessage,
  fieldErrors,
  onClose,
  onSave,
}: {
  open: boolean;
  title: string;
  isSaving: boolean;
  initialValue: CustomerFormState;
  errorMessage: string | null;
  fieldErrors: string[];
  onClose: () => void;
  onSave: (data: CustomerFormState) => void;
}) {
  const [form, setForm] = useState<CustomerFormState>(initialValue);

  useEffect(() => {
    if (open) {
      setForm(initialValue);
    }
  }, [initialValue, open]);

  if (!open) {
    return null;
  }

  const displayErrors = fieldErrors.length > 0 ? fieldErrors : errorMessage ? [errorMessage] : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 max-h-[90vh] w-[80vw] max-w-[80vw] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-sm max-md:w-full max-md:max-w-[calc(100vw-2rem)]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <UserRound className="h-5 w-5 text-primary" />
            {title}
          </h3>
          <button type="button" onClick={onClose} className="rounded p-1 transition-colors hover:bg-muted/60" aria-label="Close">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {displayErrors.length > 0 ? (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p className="mb-2 font-semibold">Please fix the following errors:</p>
            <ul className="space-y-1">
              {displayErrors.map((error) => (
                <li key={error}>• {error}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SectionCard icon={UserRound} title="Customer Identity" description="Use the code, name, and company fields to onboard the customer.">
              <div className="space-y-4">
                <div>
                  <FieldLabel>Customer Code</FieldLabel>
                  <Input value={form.customerCode} onChange={(value) => setForm((current) => ({ ...current, customerCode: value }))} />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <FieldLabel>First Name</FieldLabel>
                    <Input value={form.firstName} onChange={(value) => setForm((current) => ({ ...current, firstName: value }))} />
                  </div>
                  <div>
                    <FieldLabel>Middle Name</FieldLabel>
                    <Input value={form.middleName} onChange={(value) => setForm((current) => ({ ...current, middleName: value }))} />
                  </div>
                  <div>
                    <FieldLabel>Last Name</FieldLabel>
                    <Input value={form.lastName} onChange={(value) => setForm((current) => ({ ...current, lastName: value }))} />
                  </div>
                </div>
                <div>
                  <FieldLabel>Company Name</FieldLabel>
                  <Input
                    value={form.companyName}
                    onChange={(value) => setForm((current) => ({ ...current, companyName: value }))}
                    placeholder="Optional for personal customers"
                  />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Active</p>
                    <p className="text-xs text-muted-foreground">Inactive customers remain in history but are hidden from active operations.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, isActive: !current.isActive }))}
                    className={`inline-flex h-8 w-14 items-center rounded-full px-1 transition ${
                      form.isActive ? 'bg-primary justify-end' : 'bg-muted justify-start'
                    }`}
                    aria-pressed={form.isActive}
                  >
                    <span className="h-6 w-6 rounded-full bg-white shadow" />
                  </button>
                </div>
              </div>
            </SectionCard>

            <SectionCard icon={Phone} title="Contact & Notes" description="Keep the customer phone, email, and location details handy.">
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <PhoneNumberInput
                    label="Phone"
                    required
                    value={form.phone}
                    onChange={(value) => setForm((current) => ({ ...current, phone: value }))}
                    helperText="Starts with 0 and must contain 10 digits."
                  />
                  <div>
                    <FieldLabel>Email</FieldLabel>
                    <Input value={form.email} onChange={(value) => setForm((current) => ({ ...current, email: value }))} />
                  </div>
                </div>

                <div>
                  <FieldLabel>Address</FieldLabel>
                  <TextArea value={form.address} onChange={(value) => setForm((current) => ({ ...current, address: value }))} />
                </div>

                <div>
                  <FieldLabel>Shipping Address</FieldLabel>
                  <TextArea
                    value={form.shippingAddress}
                    onChange={(value) => setForm((current) => ({ ...current, shippingAddress: value }))}
                    placeholder="Optional shipping destination"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <FieldLabel>Tax Number</FieldLabel>
                    <Input value={form.taxNumber} onChange={(value) => setForm((current) => ({ ...current, taxNumber: value }))} />
                  </div>
                  <div>
                    <FieldLabel>Customer Group</FieldLabel>
                    <Input value={form.customerGroup} onChange={(value) => setForm((current) => ({ ...current, customerGroup: value }))} />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <FieldLabel>Opening Balance</FieldLabel>
                    <Input
                      type="number"
                      value={form.openingBalance}
                      onChange={(value) => setForm((current) => ({ ...current, openingBalance: value }))}
                    />
                  </div>
                  <div>
                    <FieldLabel>Credit Limit</FieldLabel>
                    <Input
                      type="number"
                      value={form.creditLimit}
                      onChange={(value) => setForm((current) => ({ ...current, creditLimit: value }))}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <FieldLabel>Advance Balance</FieldLabel>
                    <Input
                      type="number"
                      value={form.advanceBalance}
                      onChange={(value) => setForm((current) => ({ ...current, advanceBalance: value }))}
                    />
                  </div>
                  <div>
                    <FieldLabel>Pay Terms Type</FieldLabel>
                    <select
                      value={form.payTermsType}
                      onChange={(event) => setForm((current) => ({ ...current, payTermsType: event.target.value }))}
                      className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                    >
                      <option value="">Select</option>
                      <option value="days">Days</option>
                      <option value="months">Months</option>
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Pay Terms Value</FieldLabel>
                    <Input
                      type="number"
                      value={form.payTermsValue}
                      onChange={(value) => setForm((current) => ({ ...current, payTermsValue: value }))}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <FieldLabel>Custom Field 1</FieldLabel>
                    <Input value={form.customField1} onChange={(value) => setForm((current) => ({ ...current, customField1: value }))} />
                  </div>
                  <div>
                    <FieldLabel>Custom Field 2</FieldLabel>
                    <Input value={form.customField2} onChange={(value) => setForm((current) => ({ ...current, customField2: value }))} />
                  </div>
                  <div>
                    <FieldLabel>Custom Field 3</FieldLabel>
                    <Input value={form.customField3} onChange={(value) => setForm((current) => ({ ...current, customField3: value }))} />
                  </div>
                  <div>
                    <FieldLabel>Custom Field 4</FieldLabel>
                    <Input value={form.customField4} onChange={(value) => setForm((current) => ({ ...current, customField4: value }))} />
                  </div>
                  <div className="md:col-span-2">
                    <FieldLabel>Custom Field 5</FieldLabel>
                    <Input value={form.customField5} onChange={(value) => setForm((current) => ({ ...current, customField5: value }))} />
                  </div>
                </div>

                <div>
                  <FieldLabel>Notes</FieldLabel>
                  <TextArea value={form.notes} onChange={(value) => setForm((current) => ({ ...current, notes: value }))} />
                </div>
              </div>
            </SectionCard>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-foreground transition-colors hover:bg-muted/60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(form)}
            disabled={isSaving}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 ${isSaving ? 'opacity-70' : ''} bg-primary text-primary-foreground`}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Customer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Customers() {
  const navigate = useNavigate();
  const {
    customers,
    isLoading,
    isSaving,
    error,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    clearError,
    loadCustomers,
  } =
    useBusinessCustomers();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'code' | 'createdAt'>('name');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<BusinessCustomerRecord | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<BusinessCustomerRecord | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'analytics' | 'list'>('analytics');
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState<VisibleCustomerColumns>(DEFAULT_VISIBLE_CUSTOMER_COLUMNS);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [openActionMenuPosition, setOpenActionMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);

  const createInitialForm = useMemo(() => getInitialCustomerForm(), [showCreateModal]);
  const editInitialForm = useMemo(() => getInitialCustomerForm(editingCustomer), [editingCustomer]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setOpenActionMenuId(null);
        setOpenActionMenuPosition(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenActionMenuId(null);
        setOpenActionMenuPosition(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const stats = useMemo(() => {
    const active = customers.filter((customer) => customer.isActive && !customer.deleted).length;
    const inactive = customers.filter((customer) => !customer.isActive && !customer.deleted).length;
    const businesses = customers.filter((customer) => customer.companyName.trim() && !customer.deleted).length;
    const individuals = customers.filter((customer) => !customer.companyName.trim() && !customer.deleted).length;
    return {
      total: customers.filter((customer) => !customer.deleted).length,
      active,
      inactive,
      businesses,
      individuals,
    };
  }, [customers]);

  const visibleCustomers = useMemo(() => {
    let result = customers.filter((customer) => !customer.deleted);

    if (statusFilter !== 'all') {
      result = result.filter((customer) => (statusFilter === 'active' ? customer.isActive : !customer.isActive));
    }

    if (searchTerm.trim()) {
      const query = searchTerm.trim().toLowerCase();
      result = result.filter((customer) => {
        const name = customerDisplayName(customer).toLowerCase();
        return (
          customer.customerCode.toLowerCase().includes(query) ||
          name.includes(query) ||
          customer.companyName.toLowerCase().includes(query) ||
          customer.phone.toLowerCase().includes(query) ||
          customer.email.toLowerCase().includes(query) ||
          customer.address.toLowerCase().includes(query)
        );
      });
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'code':
          return a.customerCode.localeCompare(b.customerCode);
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'name':
        default:
          return customerDisplayName(a).localeCompare(customerDisplayName(b));
      }
    });

    return result;
  }, [customers, searchTerm, sortBy, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(visibleCustomers.length / rowsPerPage));
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return visibleCustomers.slice(start, start + rowsPerPage);
  }, [currentPage, rowsPerPage, visibleCustomers]);

  const recentCustomers = useMemo(() => {
    return [...customers]
      .filter((customer) => !customer.deleted)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [customers]);

  const activeRate = stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0;
  const businessRate = stats.total > 0 ? Math.round((stats.businesses / stats.total) * 100) : 0;
  const completenessRate = stats.total > 0 ? Math.round(((stats.businesses + stats.individuals) / stats.total) * 100) : 0;

  const formatAmount = (value: number) =>
    new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
    }).format(value);

  const chartColors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];

  const chartTooltipStyle = {
    backgroundColor: 'hsl(var(--background))',
    border: '1px solid hsl(var(--border))',
    borderRadius: 12,
    color: 'hsl(var(--foreground))',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12)',
  } as const;

  const renderChartCardTitle = (title: string, subtitle: string, icon: ReactNode) => (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {icon}
          {title}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );

  const analyticsBars = [
    { label: 'Active', value: stats.active, total: stats.total, color: 'bg-emerald-500' },
    { label: 'Inactive', value: stats.inactive, total: stats.total, color: 'bg-amber-500' },
    { label: 'Businesses', value: stats.businesses, total: stats.total, color: 'bg-sky-500' },
    { label: 'Individuals', value: stats.individuals, total: stats.total, color: 'bg-violet-500' },
  ];

  const statusChartData = useMemo(
    () => [
      { name: 'Active', value: stats.active },
      { name: 'Inactive', value: stats.inactive },
    ],
    [stats.active, stats.inactive],
  );

  const typeChartData = useMemo(
    () => [
      { name: 'Business', value: stats.businesses },
      { name: 'Individual', value: stats.individuals },
    ],
    [stats.businesses, stats.individuals],
  );

  const customerGroupChartData = useMemo(() => {
    const groupCounts = new Map<string, number>();
    customers
      .filter((customer) => !customer.deleted)
      .forEach((customer) => {
        const key = customer.customerGroup.trim() || 'Ungrouped';
        groupCounts.set(key, (groupCounts.get(key) ?? 0) + 1);
      });

    return Array.from(groupCounts.entries())
      .map(([name, value]) => ({ name: name.length > 16 ? `${name.slice(0, 16)}...` : name, fullName: name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [customers]);

  const monthlyOnboardingChartData = useMemo(() => {
    const monthBuckets = Array.from({ length: 12 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (11 - index));
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: date.toLocaleDateString('en-US', { month: 'short' }),
        count: 0,
      };
    });

    const monthMap = new Map(monthBuckets.map((bucket) => [bucket.key, bucket]));

    customers
      .filter((customer) => !customer.deleted)
      .forEach((customer) => {
        const createdDate = new Date(customer.createdAt);
        if (Number.isNaN(createdDate.getTime())) {
          return;
        }

        const key = `${createdDate.getFullYear()}-${createdDate.getMonth()}`;
        const bucket = monthMap.get(key);
        if (bucket) {
          bucket.count += 1;
        }
      });

    return monthBuckets;
  }, [customers]);

  const financialExposureChartData = useMemo(
    () => [
      {
        name: 'Opening Balance',
        value: customers.filter((customer) => !customer.deleted).reduce((sum, customer) => sum + (Number(customer.openingBalance) || 0), 0),
      },
      {
        name: 'Advance Balance',
        value: customers.filter((customer) => !customer.deleted).reduce((sum, customer) => sum + (Number(customer.advanceBalance) || 0), 0),
      },
      {
        name: 'Sale Due',
        value: customers.filter((customer) => !customer.deleted).reduce((sum, customer) => sum + (Number(customer.totalSaleDue) || 0), 0),
      },
      {
        name: 'Return Due',
        value: customers.filter((customer) => !customer.deleted).reduce((sum, customer) => sum + (Number(customer.totalSellReturnDue) || 0), 0),
      },
    ],
    [customers],
  );

  const topCreditCustomersChartData = useMemo(
    () =>
      customers
        .filter((customer) => !customer.deleted)
        .slice()
        .sort((a, b) => Number(b.creditLimit || 0) - Number(a.creditLimit || 0))
        .slice(0, 6)
        .map((customer) => ({
          name: customerDisplayName(customer).length > 18 ? `${customerDisplayName(customer).slice(0, 18)}...` : customerDisplayName(customer),
          fullName: customerDisplayName(customer),
          value: Number(customer.creditLimit || 0),
        })),
    [customers],
  );

  const visibleExportColumns = useMemo(
    () => CUSTOMER_EXPORT_COLUMN_ORDER.filter((column) => visibleColumns[column.key]),
    [visibleColumns],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [rowsPerPage, searchTerm, statusFilter, sortBy]);

  const handleResetColumns = () => {
    setVisibleColumns(DEFAULT_VISIBLE_CUSTOMER_COLUMNS);
  };

  const downloadCustomersCsv = () => {
    const header = visibleExportColumns.map((column) => column.label);
    const rows = visibleCustomers.map((customer) => {
      return visibleExportColumns
        .map((column) => {
          switch (column.key) {
            case 'contactId':
              return customer.contactId || customer.customerCode || '';
            case 'businessName':
              return customer.companyName || '';
            case 'name':
              return customerDisplayName(customer);
            case 'email':
              return customer.email || '';
            case 'taxNumber':
              return customer.taxNumber || '';
            case 'creditLimit':
              return String(customer.creditLimit ?? 0);
            case 'openingBalance':
              return String(customer.openingBalance ?? 0);
            case 'advanceBalance':
              return String(customer.advanceBalance ?? 0);
            case 'addedOn':
              return formatDate(customer.createdAt);
            case 'customerGroup':
              return customer.customerGroup || '';
            case 'code':
              return customer.customerCode || '';
            case 'address':
              return customer.address || '';
            case 'mobile':
              return customer.phone || '';
            case 'totalSaleDue':
              return String(customer.totalSaleDue ?? 0);
            case 'totalSellReturnDue':
              return String(customer.totalSellReturnDue ?? 0);
            case 'customField1':
              return customer.customField1 || '';
            case 'customField2':
              return customer.customField2 || '';
            case 'customField3':
              return customer.customField3 || '';
            case 'customField4':
              return customer.customField4 || '';
            case 'customField5':
              return customer.customField5 || '';
            case 'status':
              return customer.isActive ? 'Active' : 'Inactive';
            default:
              return '';
          }
        })
        .map(escapeCsvValue)
        .join(',');
    });

    const csv = [header.map(escapeCsvValue).join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `customers_${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success('CSV export downloaded successfully');
  };

  const downloadCustomersPdf = () => {
    const rows = visibleCustomers
      .map(
        (customer) => `
          <tr>
            ${visibleColumns.contactId ? `<td>${customer.contactId || customer.customerCode || ''}</td>` : ''}
            ${visibleColumns.businessName ? `<td>${customer.companyName || ''}</td>` : ''}
            ${visibleColumns.name ? `<td>${customerDisplayName(customer)}</td>` : ''}
            ${visibleColumns.email ? `<td>${customer.email || ''}</td>` : ''}
            ${visibleColumns.taxNumber ? `<td>${customer.taxNumber || ''}</td>` : ''}
            ${visibleColumns.creditLimit ? `<td>${customer.creditLimit ?? 0}</td>` : ''}
            ${visibleColumns.openingBalance ? `<td>${customer.openingBalance ?? 0}</td>` : ''}
            ${visibleColumns.advanceBalance ? `<td>${customer.advanceBalance ?? 0}</td>` : ''}
            ${visibleColumns.addedOn ? `<td>${formatDate(customer.createdAt)}</td>` : ''}
            ${visibleColumns.customerGroup ? `<td>${customer.customerGroup || ''}</td>` : ''}
            ${visibleColumns.code ? `<td>${customer.customerCode || ''}</td>` : ''}
            ${visibleColumns.address ? `<td>${customer.address || ''}</td>` : ''}
            ${visibleColumns.mobile ? `<td>${customer.phone || ''}</td>` : ''}
            ${visibleColumns.totalSaleDue ? `<td>${customer.totalSaleDue ?? 0}</td>` : ''}
            ${visibleColumns.totalSellReturnDue ? `<td>${customer.totalSellReturnDue ?? 0}</td>` : ''}
            ${visibleColumns.customField1 ? `<td>${customer.customField1 || ''}</td>` : ''}
            ${visibleColumns.customField2 ? `<td>${customer.customField2 || ''}</td>` : ''}
            ${visibleColumns.customField3 ? `<td>${customer.customField3 || ''}</td>` : ''}
            ${visibleColumns.customField4 ? `<td>${customer.customField4 || ''}</td>` : ''}
            ${visibleColumns.customField5 ? `<td>${customer.customField5 || ''}</td>` : ''}
            ${visibleColumns.status ? `<td>${customer.isActive ? 'Active' : 'Inactive'}</td>` : ''}
          </tr>`,
      )
      .join('');

    const headers = visibleExportColumns.map((column) => `<th>${column.label}</th>`).join('');
    const html = `
      <html>
        <head>
          <title>Customers Export</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
            h1 { font-size: 20px; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #d1d5db; padding: 8px 10px; text-align: left; font-size: 12px; }
            th { background: #f3f4f6; }
          </style>
        </head>
        <body>
          <h1>Customers Export</h1>
          <table>
            <thead><tr>${headers}</tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `;

    const popup = window.open('', '_blank', 'noopener,noreferrer,width=1200,height=900');
    if (!popup) {
      toast.error('Unable to open print preview.');
      return;
    }
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    popup.print();
    toast.success('PDF export opened successfully');
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreateError(null);
    setFormErrors([]);
    clearError();
  };

  const closeEditModal = () => {
    setEditingCustomer(null);
    setEditError(null);
    setFormErrors([]);
    clearError();
  };

  const validateForm = (form: CustomerFormState) => {
    const errors: string[] = [];
    if (!form.customerCode.trim()) {
      errors.push('Customer code is required.');
    }
    if (!form.firstName.trim() && !form.lastName.trim() && !form.companyName.trim()) {
      errors.push('Provide a customer or company name.');
    }
    if (!form.phone.trim()) {
      errors.push('Phone number is required.');
    } else if (normalizePhoneNumber(form.phone).length !== 10) {
      errors.push('Phone number must start with 0 and contain 10 digits.');
    }
    if (form.email.trim() && !form.email.includes('@')) {
      errors.push('Email must be a valid email address.');
    }
    const openingBalance = Number(form.openingBalance || 0);
    const creditLimit = Number(form.creditLimit || 0);
    const advanceBalance = Number(form.advanceBalance || 0);
    const payTermsValue = Number(form.payTermsValue || 0);

    if (Number.isNaN(openingBalance) || openingBalance < 0) {
      errors.push('Opening balance must be a valid non-negative number.');
    }
    if (Number.isNaN(creditLimit) || creditLimit < 0) {
      errors.push('Credit limit must be a valid non-negative number.');
    }
    if (Number.isNaN(advanceBalance) || advanceBalance < 0) {
      errors.push('Advance balance must be a valid non-negative number.');
    }
    if (Number.isNaN(payTermsValue) || payTermsValue < 0) {
      errors.push('Pay terms value must be a valid non-negative number.');
    }
    if (form.payTermsType.trim() && !['days', 'months'].includes(form.payTermsType.trim())) {
      errors.push('Pay terms type must be days or months.');
    }
    return errors;
  };

  const submitCustomer = async (form: CustomerFormState, customerId?: string) => {
    const errors = validateForm(form);
    if (errors.length > 0) {
      setFormErrors(errors);
      toast.error('Please fix the validation errors before saving.');
      return;
    }

    const payload: CreateBusinessCustomerInput = {
      contactId: form.contactId.trim() || form.customerCode.trim(),
      customerCode: form.customerCode.trim(),
      firstName: form.firstName.trim(),
      middleName: form.middleName.trim(),
      lastName: form.lastName.trim(),
      companyName: form.companyName.trim(),
      phone: normalizePhoneNumber(form.phone),
      email: form.email.trim(),
      address: form.address.trim(),
      shippingAddress: form.shippingAddress.trim(),
      taxNumber: form.taxNumber.trim(),
      openingBalance: Number(form.openingBalance || 0),
      payTermsType: form.payTermsType.trim(),
      payTermsValue: Number(form.payTermsValue || 0),
      creditLimit: Number(form.creditLimit || 0),
      customerGroup: form.customerGroup.trim(),
      advanceBalance: Number(form.advanceBalance || 0),
      totalSaleDue: Number(form.totalSaleDue || 0),
      totalSellReturnDue: Number(form.totalSellReturnDue || 0),
      customField1: form.customField1.trim(),
      customField2: form.customField2.trim(),
      customField3: form.customField3.trim(),
      customField4: form.customField4.trim(),
      customField5: form.customField5.trim(),
      notes: form.notes.trim(),
      isActive: form.isActive,
    };

    try {
      if (customerId) {
        await updateCustomer(customerId, payload);
        toast.success('Customer updated successfully.');
        closeEditModal();
      } else {
        await createCustomer(payload);
        toast.success('Customer created successfully.');
        closeCreateModal();
      }
    } catch (err) {
      if (err instanceof ApiError && err.data && typeof err.data === 'object' && 'errors' in err.data) {
        const apiErrors = ((err.data as Record<string, unknown>).errors ?? {}) as Record<string, string>;
        setFormErrors(Object.values(apiErrors).filter(Boolean));
        return;
      }

      const message = err instanceof ApiError ? err.message : 'Unable to save customer.';
      if (customerId) {
        setEditError(message);
      } else {
        setCreateError(message);
      }
      setFormErrors([message]);
    }
  };

  const handleCustomerQuickAction = async (action: 'pay' | 'view' | 'edit' | 'deactivate' | 'ledger' | 'sales' | 'documents-notes', customer: BusinessCustomerRecord) => {
    setOpenActionMenuId(null);
    setOpenActionMenuPosition(null);

    switch (action) {
      case 'edit':
        setEditingCustomer(customer);
        setEditError(null);
        setFormErrors([]);
        return;
      case 'deactivate':
        await submitCustomer(getInitialCustomerForm({ ...customer, isActive: false }), customer.id);
        return;
      case 'pay':
      case 'ledger':
      case 'sales':
      case 'documents-notes':
      case 'view':
        toast(`Customer ${action.replace('-', ' ')} action is available in the next step.`);
        return;
      default:
        return;
    }
  };

  const toggleCustomerActionMenu = (customerId: string, target: HTMLButtonElement) => {
    if (openActionMenuId === customerId) {
      setOpenActionMenuId(null);
      setOpenActionMenuPosition(null);
      return;
    }

    const rect = target.getBoundingClientRect();
    const menuHeight = 320;
    const menuWidth = 260;
    const gap = 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const top = spaceBelow < menuHeight && spaceAbove > spaceBelow ? Math.max(rect.top - menuHeight - gap, gap) : rect.bottom + gap;
    const left = Math.min(Math.max(rect.right - menuWidth, gap), window.innerWidth - menuWidth - gap);

    setOpenActionMenuId(customerId);
    setOpenActionMenuPosition({ top, left });
  };

  const confirmDeleteCustomer = async () => {
    if (!customerToDelete) {
      return;
    }

    setDeleteSaving(true);
    try {
      await deleteCustomer(customerToDelete.id);
      toast.success('Customer deleted successfully.');
      setCustomerToDelete(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to delete customer.';
      toast.error(message);
    } finally {
      setDeleteSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="sticky top-0 z-20 border-b border-border bg-background/95 py-4 backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-lg p-2 hover:bg-muted/60"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">Customers</h1>
              <p className="text-sm text-muted-foreground">
                Capture customer records, keep contact data current, and onboard new buyers.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add Customer
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Users} label="Total Customers" value={`${stats.total}`} note="All customer contacts currently on file." />
        <MetricCard icon={CheckCircle2} label="Active Customers" value={`${stats.active}`} note={`${activeRate}% of your customer book is active.`} />
        <MetricCard icon={Building2} label="Business Accounts" value={`${stats.businesses}`} note={`${businessRate}% of records are companies.`} />
        <MetricCard icon={UserRound} label="Individuals" value={`${stats.individuals}`} note={`${completenessRate}% of records have a usable identity.`} />
      </div>

      <div className="border-b border-border">
        <div className="flex gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === 'analytics'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === 'list'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Customer List
            <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">{visibleCustomers.length}</span>
          </button>
        </div>
      </div>

      {activeTab === 'analytics' ? (
        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
            <SectionCard
              icon={FileSpreadsheet}
              title="Customer Analytics"
              description="A concise view of your customer base, grouped by type and account status."
            >
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {analyticsBars.map((item) => (
                  <div key={item.label} className="rounded-xl border border-border bg-background p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-sm font-semibold text-foreground">{item.value}</p>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-muted">
                      <div
                        className={`h-2 rounded-full ${item.color}`}
                        style={{ width: `${item.total > 0 ? Math.max(8, Math.round((item.value / item.total) * 100)) : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-border bg-background p-4">
                  <p className="text-sm font-medium text-muted-foreground">Status Health</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{activeRate}%</p>
                  <p className="mt-1 text-xs text-muted-foreground">Active customers are ready for follow-up and sales.</p>
                </div>
                <div className="rounded-2xl border border-border bg-background p-4">
                  <p className="text-sm font-medium text-muted-foreground">Business Share</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{businessRate}%</p>
                  <p className="mt-1 text-xs text-muted-foreground">Business accounts with a company profile on record.</p>
                </div>
                <div className="rounded-2xl border border-border bg-background p-4">
                  <p className="text-sm font-medium text-muted-foreground">Record Coverage</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{completenessRate}%</p>
                  <p className="mt-1 text-xs text-muted-foreground">Profiles with enough detail to support operations.</p>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              icon={Users}
              title="Recent Customers"
              description="The latest customer onboarding activity in your account."
            >
              <div className="space-y-3">
                {recentCustomers.length > 0 ? (
                  recentCustomers.map((customer) => (
                    <div key={customer.id} className="rounded-xl border border-border bg-background p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">{customerDisplayName(customer)}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {customer.customerCode || '—'} · {customerType(customer)}
                          </p>
                        </div>
                        <StatusBadge active={customer.isActive} />
                      </div>
                      <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5" />
                          <span>{customer.phone || '—'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5" />
                          <span>{customer.email || '—'}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
                    No customers have been added yet.
                  </div>
                )}
              </div>
            </SectionCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            <SectionCard icon={CheckCircle2} title="Status Mix" description="Active and inactive customer split.">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Tooltip contentStyle={chartTooltipStyle} formatter={(value: any) => [value ?? 0, 'Customers']} />
                    <Pie data={statusChartData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={86} paddingAngle={3}>
                      {statusChartData.map((entry, index) => (
                        <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard icon={Building2} title="Customer Type Mix" description="Business versus individual customer share.">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Tooltip contentStyle={chartTooltipStyle} formatter={(value: any) => [value ?? 0, 'Customers']} />
                    <Pie data={typeChartData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={86} paddingAngle={3}>
                      {typeChartData.map((entry, index) => (
                        <Cell key={entry.name} fill={chartColors[(index + 2) % chartColors.length]} />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard icon={BarChart3} title="Customer Groups" description="Top groups by customer count.">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={customerGroupChartData} layout="vertical" margin={{ left: 12, right: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" width={90} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={chartTooltipStyle} formatter={(value: any) => [value ?? 0, 'Customers']} />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} fill={chartColors[0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard icon={RefreshCw} title="Onboarding Trend" description="New customers added over the last 12 months.">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={monthlyOnboardingChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={chartTooltipStyle} formatter={(value: any) => [value ?? 0, 'New customers']} />
                    <Line type="monotone" dataKey="count" stroke={chartColors[1]} strokeWidth={3} dot={{ r: 4, fill: chartColors[1] }} activeDot={{ r: 6 }} />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard icon={CreditCard} title="Financial Exposure" description="Total customer balances and dues across the book.">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={financialExposureChartData} layout="vertical" margin={{ left: 12, right: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(value) => formatAmount(Number(value))} />
                    <YAxis type="category" dataKey="name" width={100} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={chartTooltipStyle} formatter={(value: any) => [formatAmount(Number(value ?? 0)), 'Amount']} />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} fill={chartColors[2]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard icon={BarChart3} title="Top Credit Limits" description="Customers with the highest available credit.">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={topCreditCustomersChartData} layout="vertical" margin={{ left: 12, right: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(value) => formatAmount(Number(value))} />
                    <YAxis type="category" dataKey="name" width={100} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={chartTooltipStyle} formatter={(value: any) => [formatAmount(Number(value ?? 0)), 'Credit limit']} />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} fill={chartColors[3]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
          </div>
        </div>
      ) : (
        <SectionCard
          icon={FileSpreadsheet}
          title="Customer Directory"
          description="Review customer records, search by code or name, and keep the onboarding data tidy."
        >
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs font-medium text-muted-foreground">
                Entries
                <select
                  value={rowsPerPage}
                  onChange={(event) => setRowsPerPage(Number(event.target.value))}
                  className="ml-2 rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                >
                  {[10, 25, 50, 100].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => void loadCustomers()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/60"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={downloadCustomersCsv}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/60"
              >
                <Download className="h-3.5 w-3.5" />
                CSV
              </button>
              <button
                type="button"
                onClick={downloadCustomersPdf}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/60"
              >
                <FileText className="h-3.5 w-3.5" />
                PDF
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 xl:grid-cols-[1.8fr_0.8fr_0.8fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={searchTerm} onChange={setSearchTerm} placeholder="Search by customer code, name, phone, or email..." />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            >
              <option value="name">Sort by Name</option>
              <option value="code">Sort by Code</option>
              <option value="createdAt">Sort by Newest</option>
            </select>
            <div className="relative">
              <button
                type="button"
                onClick={() => setColumnsOpen((current) => !current)}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted/60"
              >
                <Columns3 className="h-4 w-4" />
                Columns
              </button>
              {columnsOpen ? (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm sm:p-6"
                  onClick={() => setColumnsOpen(false)}
                >
                  <div
                    className="flex h-full w-full max-h-[100dvh] flex-col overflow-hidden rounded-none border border-border bg-card shadow-2xl sm:h-auto sm:max-h-[80vh] sm:w-[80vw] sm:max-w-6xl sm:rounded-sm"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Show columns</p>
                        <p className="text-xs text-muted-foreground">Turn columns on or off for this table.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setColumnsOpen(false)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-surface-alt hover:text-foreground"
                        aria-label="Close column picker"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {CUSTOMER_EXPORT_COLUMN_ORDER.map((column) => (
                          <div
                            key={column.key}
                            className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background px-3 py-3 text-sm text-foreground"
                          >
                            <span className="font-medium">{column.label}</span>
                            <ToggleSwitch
                              checked={visibleColumns[column.key]}
                              onChange={() =>
                                setVisibleColumns((current) => ({
                                  ...current,
                                  [column.key]: !current[column.key],
                                }))
                              }
                              ariaLabel={`Toggle ${column.label} column`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                      <p className="text-xs text-muted-foreground">Reset brings all columns back on.</p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            handleResetColumns();
                            setColumnsOpen(false);
                          }}
                          className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-surface-alt"
                        >
                          Turn all on
                        </button>
                        <button
                          type="button"
                          onClick={() => setColumnsOpen(false)}
                          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border">
            <div className="overflow-x-auto">
              <table className="min-w-[2200px] divide-y divide-border text-sm">
                <thead className="bg-muted/40">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {visibleColumns.contactId ? <th className="px-4 py-3">Contact ID</th> : null}
                    {visibleColumns.businessName ? <th className="px-4 py-3">Business Name</th> : null}
                    {visibleColumns.name ? <th className="px-4 py-3">Name</th> : null}
                    {visibleColumns.email ? <th className="px-4 py-3">Email</th> : null}
                    {visibleColumns.taxNumber ? <th className="px-4 py-3">Tax Number</th> : null}
                    {visibleColumns.creditLimit ? <th className="px-4 py-3 text-right">Credit Limit</th> : null}
                    {visibleColumns.openingBalance ? <th className="px-4 py-3 text-right">Opening Balance</th> : null}
                    {visibleColumns.advanceBalance ? <th className="px-4 py-3 text-right">Advance Balance</th> : null}
                    {visibleColumns.addedOn ? <th className="px-4 py-3">Added On</th> : null}
                    {visibleColumns.customerGroup ? <th className="px-4 py-3">Customer Group</th> : null}
                    {visibleColumns.code ? <th className="px-4 py-3">Code</th> : null}
                    {visibleColumns.address ? <th className="px-4 py-3">Address</th> : null}
                    {visibleColumns.mobile ? <th className="px-4 py-3">Mobile</th> : null}
                    {visibleColumns.totalSaleDue ? <th className="px-4 py-3 text-right">Total Sale Due</th> : null}
                    {visibleColumns.totalSellReturnDue ? <th className="px-4 py-3 text-right">Total Sell Return Due</th> : null}
                    {visibleColumns.customField1 ? <th className="px-4 py-3">Custom Field 1</th> : null}
                    {visibleColumns.customField2 ? <th className="px-4 py-3">Custom Field 2</th> : null}
                    {visibleColumns.customField3 ? <th className="px-4 py-3">Custom Field 3</th> : null}
                    {visibleColumns.customField4 ? <th className="px-4 py-3">Custom Field 4</th> : null}
                    {visibleColumns.customField5 ? <th className="px-4 py-3">Custom Field 5</th> : null}
                    {visibleColumns.status ? <th className="px-4 py-3">Status</th> : null}
                    {visibleColumns.actions ? <th className="px-4 py-3">Action</th> : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-background">
                  {isLoading ? (
                    <tr>
                      <td className="px-4 py-8 text-center text-muted-foreground" colSpan={Math.max(1, Object.values(visibleColumns).filter(Boolean).length)}>
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading customers...
                        </div>
                      </td>
                    </tr>
                  ) : paginatedCustomers.length > 0 ? (
                    paginatedCustomers.map((customer) => (
                      <tr key={customer.id} className="transition-colors hover:bg-muted/20">
                        {visibleColumns.contactId ? <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">{customer.contactId || customer.customerCode || '—'}</td> : null}
                        {visibleColumns.businessName ? <td className="whitespace-nowrap px-4 py-3 text-foreground">{customer.companyName || '—'}</td> : null}
                        {visibleColumns.name ? (
                          <td className="whitespace-nowrap px-4 py-3">
                            <div>
                              <p className="font-medium text-foreground">{customerDisplayName(customer)}</p>
                              <p className="text-xs text-muted-foreground">{customerType(customer)}</p>
                            </div>
                          </td>
                        ) : null}
                        {visibleColumns.email ? <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{customer.email || '—'}</td> : null}
                        {visibleColumns.taxNumber ? <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{customer.taxNumber || '—'}</td> : null}
                        {visibleColumns.creditLimit ? <td className="whitespace-nowrap px-4 py-3 text-right text-muted-foreground">{customer.creditLimit ?? 0}</td> : null}
                        {visibleColumns.openingBalance ? <td className="whitespace-nowrap px-4 py-3 text-right text-muted-foreground">{customer.openingBalance ?? 0}</td> : null}
                        {visibleColumns.advanceBalance ? <td className="whitespace-nowrap px-4 py-3 text-right text-muted-foreground">{customer.advanceBalance ?? 0}</td> : null}
                        {visibleColumns.addedOn ? <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDate(customer.createdAt)}</td> : null}
                        {visibleColumns.customerGroup ? <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{customer.customerGroup || '—'}</td> : null}
                        {visibleColumns.code ? <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">{customer.customerCode || '—'}</td> : null}
                        {visibleColumns.address ? <td className="max-w-[260px] px-4 py-3 text-muted-foreground">{customer.address || '—'}</td> : null}
                        {visibleColumns.mobile ? <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{customer.phone || '—'}</td> : null}
                        {visibleColumns.totalSaleDue ? <td className="whitespace-nowrap px-4 py-3 text-right text-muted-foreground">{customer.totalSaleDue ?? 0}</td> : null}
                        {visibleColumns.totalSellReturnDue ? <td className="whitespace-nowrap px-4 py-3 text-right text-muted-foreground">{customer.totalSellReturnDue ?? 0}</td> : null}
                        {visibleColumns.customField1 ? <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{customer.customField1 || '—'}</td> : null}
                        {visibleColumns.customField2 ? <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{customer.customField2 || '—'}</td> : null}
                        {visibleColumns.customField3 ? <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{customer.customField3 || '—'}</td> : null}
                        {visibleColumns.customField4 ? <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{customer.customField4 || '—'}</td> : null}
                        {visibleColumns.customField5 ? <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{customer.customField5 || '—'}</td> : null}
                        {visibleColumns.status ? (
                          <td className="whitespace-nowrap px-4 py-3">
                            <StatusBadge active={customer.isActive} />
                          </td>
                        ) : null}
                        {visibleColumns.actions ? (
                          <td className="px-4 py-3 text-right">
                            <div className="relative flex items-center justify-end" onClick={(event) => event.stopPropagation()}>
                              <button
                                type="button"
                                onClick={(event) => toggleCustomerActionMenu(customer.id, event.currentTarget)}
                                className="rounded p-1.5 transition-colors hover:bg-muted/60 hover:text-foreground"
                                aria-label="Open customer actions"
                              >
                                <MoreVertical className="h-4 w-4 text-muted-foreground" />
                              </button>
                              {openActionMenuId === customer.id && openActionMenuPosition ? (
                                <div
                                  ref={actionMenuRef}
                                  className="fixed z-50 w-72 overflow-hidden rounded-xl border border-border bg-background shadow-2xl shadow-black/10"
                                  style={{
                                    top: openActionMenuPosition.top,
                                    left: openActionMenuPosition.left,
                                  }}
                                >
                                  <div className="border-b border-border px-4 py-3">
                                    <p className="text-sm font-semibold text-foreground">{customerDisplayName(customer)}</p>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                      {customer.contactId || customer.customerCode || 'Customer'} · Actions
                                    </p>
                                  </div>
                                  <div className="p-2">
                                    <ActionMenuItem label="Pay" onClick={() => void handleCustomerQuickAction('pay', customer)} />
                                    <ActionMenuItem label="View" onClick={() => void handleCustomerQuickAction('view', customer)} />
                                    <ActionMenuItem label="Edit" onClick={() => void handleCustomerQuickAction('edit', customer)} />
                                    <ActionMenuItem label="Deactivate" onClick={() => void handleCustomerQuickAction('deactivate', customer)} />
                                    <ActionMenuItem label="Ledger" onClick={() => void handleCustomerQuickAction('ledger', customer)} />
                                    <ActionMenuItem label="Sales" onClick={() => void handleCustomerQuickAction('sales', customer)} />
                                    <ActionMenuItem label="Documents & notes" onClick={() => void handleCustomerQuickAction('documents-notes', customer)} />
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </td>
                        ) : null}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-4 py-8 text-center text-muted-foreground" colSpan={Math.max(1, Object.values(visibleColumns).filter(Boolean).length)}>
                        No customers match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm text-muted-foreground">
            <p>
              Showing{' '}
              <span className="font-medium text-foreground">
                {visibleCustomers.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}
              </span>{' '}
              to{' '}
              <span className="font-medium text-foreground">
                {Math.min(currentPage * rowsPerPage, visibleCustomers.length)}
              </span>{' '}
              of <span className="font-medium text-foreground">{visibleCustomers.length}</span> customers
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage <= 1}
                className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-xs text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage >= totalPages}
                className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </SectionCard>
      )}

      <CustomerFormModal
        open={showCreateModal}
        title="Add Customer"
        isSaving={isSaving}
        initialValue={createInitialForm}
        errorMessage={createError}
        fieldErrors={formErrors}
        onClose={closeCreateModal}
        onSave={(form) => {
          setCreateError(null);
          void submitCustomer(form);
        }}
      />

      <CustomerFormModal
        open={Boolean(editingCustomer)}
        title="Edit Customer"
        isSaving={isSaving}
        initialValue={editInitialForm}
        errorMessage={editError}
        fieldErrors={formErrors}
        onClose={closeEditModal}
        onSave={(form) => {
          if (!editingCustomer) {
            return;
          }
          setEditError(null);
          void submitCustomer(form, editingCustomer.id);
        }}
      />

      {customerToDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-background shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Delete Customer</h3>
                <p className="mt-1 text-sm text-muted-foreground">This will archive the customer record.</p>
              </div>
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                className="rounded-lg p-2 hover:bg-muted/60"
                aria-label="Close delete confirmation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete <span className="font-medium text-foreground">{customerDisplayName(customerToDelete)}</span>?
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCustomerToDelete(null)}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted/60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void confirmDeleteCustomer()}
                  disabled={deleteSaving}
                  className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {deleteSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
