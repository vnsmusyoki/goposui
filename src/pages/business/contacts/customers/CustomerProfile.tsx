import { useMemo, useState, type ReactNode } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  FileText,
  FileSpreadsheet,
  MoreHorizontal,
  Phone,
  Trash2,
  UserRound,
} from 'lucide-react';
import { useBusinessCurrency } from '@/business/businessStore';
import { useBusinessCustomers } from '@/hooks/business/customers/useBusinessCustomers';
import CustomerProfileActivitiesTab from './CustomerProfileActivitiesTab';
import CustomerProfileDocumentsNotesTab from './CustomerProfileDocumentsNotesTab';
import CustomerProfileLedgerTab from './CustomerProfileLedgerTab';
import CustomerProfilePaymentsTab from './CustomerProfilePaymentsTab';
import CustomerProfilePurchasesTab from './CustomerProfilePurchasesTab';
import type { CustomerProfileData, CustomerProfileTabKey } from './customerProfileTypes';

const tabItems: Array<{ key: CustomerProfileTabKey; label: string }> = [
  { key: 'ledger', label: 'Ledger' },
  { key: 'sales', label: 'Sales' },
  { key: 'documents-notes', label: 'Documents & Notes' },
  { key: 'payments', label: 'Payments' },
  { key: 'activities', label: 'Activities' },
];

export default function CustomerProfile() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { customers, isLoading } = useBusinessCustomers();
  const { formatCurrency } = useBusinessCurrency();
  const [activeTab, setActiveTab] = useState<CustomerProfileTabKey>('ledger');

  const customer = useMemo<CustomerProfileData | null>(() => {
    if (!id) {
      return null;
    }

    const record = customers.find((item) => item.id === id);
    if (!record) {
      return null;
    }

    const fullName = [record.firstName, record.middleName, record.lastName].filter(Boolean).join(' ').trim();
    const displayName = record.displayName || record.name || fullName || record.companyName || 'Customer';
    const paymentTerms = record.payTermsValue > 0 && record.payTermsType ? `${record.payTermsValue} ${record.payTermsType}` : '—';

    return {
      id: record.id,
      name: displayName,
      displayName,
      companyName: record.companyName,
      email: record.email,
      phone: record.phone,
      alternatePhone: '',
      address: record.address,
      shippingAddress: record.shippingAddress,
      city: '',
      state: '',
      country: '',
      zipCode: '',
      website: '',
      taxNumber: record.taxNumber,
      contactId: record.contactId || record.customerCode,
      customerCode: record.customerCode,
      openingBalance: record.openingBalance,
      payTermsType: record.payTermsType,
      payTermsValue: record.payTermsValue,
      creditLimit: record.creditLimit,
      customerGroup: record.customerGroup,
      advanceBalance: record.advanceBalance,
      totalSaleDue: record.totalSaleDue,
      totalSellReturnDue: record.totalSellReturnDue,
      customField1: record.customField1,
      customField2: record.customField2,
      customField3: record.customField3,
      customField4: record.customField4,
      customField5: record.customField5,
      notes: record.notes,
      isActive: record.isActive,
      status: record.isActive ? 'active' : 'inactive',
      tier: 'standard',
      totalPurchases: 0,
      totalAmount: record.totalSaleDue + record.totalSellReturnDue,
      outstandingBalance: record.totalSaleDue,
      paymentTerms,
      leadTime: 0,
      categories: record.customerGroup ? [record.customerGroup] : [],
      paymentMethods: [],
      bankName: '',
      bankAccount: '',
      bankBranch: '',
      contactPerson: displayName,
      contactPersonPhone: record.phone,
      contactPersonEmail: record.email,
      isVerified: false,
      isFeatured: false,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      lastOrderDate: record.updatedAt ?? '',
      lastPaymentDate: '',
    };
  }, [customers, id]);

  const shellCard = 'rounded-2xl border border-border bg-card text-card-foreground shadow-sm';

  if (!id) {
    return <Navigate to="/contacts/customers" replace />;
  }

  if (isLoading && !customer) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading customer profile...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back 
        </button>
        <div className={`${shellCard} p-6`}>
          <p className="text-lg font-semibold text-foreground">Customer not found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            We could not find a customer for this profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('/contacts/customers')}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to customers
        </button>
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-alt px-3 py-1 text-xs font-medium text-muted-foreground">
          <MoreHorizontal className="h-3.5 w-3.5" />
          Customer profile
        </div>
      </div>

      <div className={`${shellCard} overflow-hidden`}>
        <div className="border-b border-border bg-gradient-to-r from-primary/10 via-transparent to-transparent px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <UserRound className="h-7 w-7" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold text-foreground">{customer.name}</h1>
                    {customer.isVerified && (
                      <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
                        Verified
                      </span>
                    )}
                    {customer.isFeatured && (
                      <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{customer.companyName || 'Individual customer'}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MiniStat label="Balance Due" value={formatCurrency(customer.totalSaleDue)} />
                <MiniStat label="Credit Limit" value={formatCurrency(customer.creditLimit)} />
                <MiniStat label="Opening Balance" value={formatCurrency(customer.openingBalance)} />
                <MiniStat label="Advance Balance" value={formatCurrency(customer.advanceBalance)} />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-alt">
                <Edit className="h-4 w-4" />
                Edit
              </button>
              <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-alt">
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
              <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                <Edit className="h-4 w-4" />
                Add Sale
              </button>
              <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-success px-3 py-2 text-sm font-medium text-white hover:bg-success/90">
                <FileText className="h-4 w-4" />
                Record Payment
              </button>
              <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-dashed border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-alt">
                <Trash2 className="h-4 w-4" />
                Add Discount
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 px-6 py-5 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-xl border border-border bg-background p-4">
            <div className="flex flex-wrap items-center gap-3">
              <DetailItem icon={<Phone className="h-4 w-4" />} label="Phone" value={customer.phone} />
              <DetailItem icon={<FileText className="h-4 w-4" />} label="Terms" value={customer.paymentTerms} />
              <DetailItem icon={<FileSpreadsheet className="h-4 w-4" />} label="Tax Number" value={customer.taxNumber || 'N/A'} />
              <DetailItem icon={<UserRound className="h-4 w-4" />} label="Group" value={customer.customerGroup || 'Unassigned'} />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Customer summary</p>
            <div className="mt-3 space-y-2 text-sm">
              <SummaryRow label="Status" value={customer.status} />
              <SummaryRow label="Location" value={customer.city || '—'} />
              <SummaryRow label="Joined" value={new Date(customer.createdAt).toLocaleDateString()} />
              <SummaryRow label="Code" value={customer.customerCode || customer.contactId || '—'} />
            </div>
          </div>
        </div>
      </div>

      <div className={`${shellCard} overflow-hidden`}>
        <div className="border-b border-border px-4">
          <div className="flex flex-wrap items-center gap-6 overflow-x-auto">
            {tabItems.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative whitespace-nowrap px-1 py-4 text-sm font-medium transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                  <span
                    className={`absolute inset-x-0 -bottom-[1px] h-[3px] rounded-full transition-colors ${
                      isActive ? 'bg-primary' : 'bg-transparent'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 md:p-6">
          {activeTab === 'ledger' && <CustomerProfileLedgerTab customer={customer} />}
          {activeTab === 'sales' && <CustomerProfilePurchasesTab supplier={customer} />}
          {activeTab === 'documents-notes' && <CustomerProfileDocumentsNotesTab supplier={customer} />}
          {activeTab === 'payments' && <CustomerProfilePaymentsTab supplier={customer} />}
          {activeTab === 'activities' && <CustomerProfileActivitiesTab supplier={customer} />}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
      <span className="text-primary">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
