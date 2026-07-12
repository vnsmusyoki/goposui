import { useMemo, useState, type ReactNode } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeDollarSign,
  Edit,
  FileText,
  FileSpreadsheet,
  HandCoins,
  MoreHorizontal,
  PackagePlus,
  Phone,
  Trash2,
  UserRound,
} from 'lucide-react';
import { useBusinessCurrency } from '@/business/businessStore';
import { useBusinessSuppliers } from '@/hooks/business/suppliers/useBusinessSuppliers';
import SupplierProfileActivitiesTab from './SupplierProfileActivitiesTab';
import SupplierProfileDocumentsNotesTab from './SupplierProfileDocumentsNotesTab';
import SupplierProfileLedgerTab from './SupplierProfileLedgerTab';
import SupplierProfilePaymentsTab from './SupplierProfilePaymentsTab';
import SupplierProfilePurchasesTab from './SupplierProfilePurchasesTab';
import SupplierProfileStockReportTab from './SupplierProfileStockReportTab';
import type { SupplierProfileData, SupplierProfileTabKey } from './supplierProfileTypes';

const tabItems: Array<{ key: SupplierProfileTabKey; label: string }> = [
  { key: 'ledger', label: 'Ledger' },
  { key: 'purchases', label: 'Purchases' },
  { key: 'stock-report', label: 'Stock Report' },
  { key: 'documents-notes', label: 'Documents & Note' },
  { key: 'payments', label: 'Payments' },
  { key: 'activities', label: 'Activities' },
];

export default function SupplierProfile() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { suppliers, isLoading } = useBusinessSuppliers();
  const { formatCurrency } = useBusinessCurrency();
  const [activeTab, setActiveTab] = useState<SupplierProfileTabKey>('ledger');

  const supplier = useMemo<SupplierProfileData | null>(() => {
    if (!id) {
      return null;
    }

    const record = suppliers.find((item) => item.id === id);
    if (!record) {
      return null;
    }

    return {
      id: record.id,
      name: record.name,
      companyName: record.companyName,
      email: record.email,
      phone: record.phone,
      alternatePhone: record.alternatePhone,
      address: record.address,
      city: record.city,
      state: record.state,
      country: record.country,
      zipCode: record.zipCode,
      website: record.website,
      taxNumber: record.taxNumber,
      registrationNumber: record.registrationNumber,
      status: record.status,
      tier: record.tier,
      rating: record.rating,
      totalPurchases: record.totalPurchases,
      totalAmount: record.totalAmount,
      outstandingBalance: record.outstandingBalance,
      paymentTerms: record.paymentTerms,
      leadTime: record.leadTime,
      notes: record.notes,
      categories: record.categories ?? [],
      paymentMethods: record.paymentMethods ?? [],
      bankName: record.bankName ?? '',
      bankAccount: record.bankAccount ?? '',
      bankBranch: record.bankBranch ?? '',
      contactPerson: record.contactPerson ?? record.name,
      contactPersonPhone: record.contactPersonPhone ?? record.phone,
      contactPersonEmail: record.contactPersonEmail ?? record.email,
      isVerified: record.isVerified,
      isFeatured: record.isFeatured,
      createdAt: record.createdAt,
      lastOrderDate: record.updatedAt ?? '',
      lastPaymentDate: '',
    };
  }, [id, suppliers]);

  const shellCard = 'rounded-2xl border border-border bg-card text-card-foreground shadow-sm';

  if (!id) {
    return <Navigate to="/contacts/suppliers" replace />;
  }

  if (isLoading && !supplier) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading supplier profile...</p>
      </div>
    );
  }

  if (!supplier) {
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
          <p className="text-lg font-semibold text-foreground">Supplier not found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            We could not find a supplier for this profile.
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
          onClick={() => navigate('/contacts/suppliers')}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to suppliers
        </button>
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-alt px-3 py-1 text-xs font-medium text-muted-foreground">
          <MoreHorizontal className="h-3.5 w-3.5" />
          Supplier profile
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
                    <h1 className="text-2xl font-bold text-foreground">{supplier.name}</h1>
                    {supplier.isVerified && (
                      <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
                        Verified
                      </span>
                    )}
                    {supplier.isFeatured && (
                      <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{supplier.companyName}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MiniStat label="Outstanding" value={formatCurrency(supplier.outstandingBalance)} />
                <MiniStat label="Total Purchases" value={supplier.totalPurchases.toString()} />
                <MiniStat label="Total Spend" value={formatCurrency(supplier.totalAmount)} />
                <MiniStat label="Lead Time" value={`${supplier.leadTime} days`} />
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
                <PackagePlus className="h-4 w-4" />
                Add Purchase Order
              </button>
              <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-success px-3 py-2 text-sm font-medium text-white hover:bg-success/90">
                <HandCoins className="h-4 w-4" />
                Pay Due Amount
              </button>
              <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-dashed border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-alt">
                <BadgeDollarSign className="h-4 w-4" />
                Add Discount
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 px-6 py-5 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-xl border border-border bg-background p-4">
            <div className="flex flex-wrap items-center gap-3">
              <DetailItem icon={<Phone className="h-4 w-4" />} label="Phone" value={supplier.phone} />
              <DetailItem icon={<FileText className="h-4 w-4" />} label="Terms" value={supplier.paymentTerms} />
              <DetailItem icon={<FileSpreadsheet className="h-4 w-4" />} label="Tax Number" value={supplier.taxNumber || 'N/A'} />
              <DetailItem icon={<UserRound className="h-4 w-4" />} label="Contact Person" value={supplier.contactPerson} />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Supplier summary</p>
            <div className="mt-3 space-y-2 text-sm">
              <SummaryRow label="Status" value={supplier.status} />
              <SummaryRow label="Tier" value={supplier.tier} />
              <SummaryRow label="Location" value={`${supplier.city}, ${supplier.country}`} />
              <SummaryRow label="Joined" value={new Date(supplier.createdAt).toLocaleDateString()} />
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
          {activeTab === 'ledger' && <SupplierProfileLedgerTab supplier={supplier} />}
          {activeTab === 'purchases' && <SupplierProfilePurchasesTab supplier={supplier} />}
          {activeTab === 'stock-report' && <SupplierProfileStockReportTab supplier={supplier} />}
          {activeTab === 'documents-notes' && <SupplierProfileDocumentsNotesTab supplier={supplier} />}
          {activeTab === 'payments' && <SupplierProfilePaymentsTab supplier={supplier} />}
          {activeTab === 'activities' && <SupplierProfileActivitiesTab supplier={supplier} />}
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
