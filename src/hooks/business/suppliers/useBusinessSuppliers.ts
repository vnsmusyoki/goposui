import { useCallback, useEffect, useState } from 'react';
import { apiRequestWithoutSessionInvalidation } from '@/lib/api';

export type BusinessSupplierRecord = {
  id: string;
  businessId: string;
  supplierType: 'individual' | 'business';
  contactId: string;
  prefix: string;
  firstName: string;
  middleName: string;
  lastName: string;
  businessName: string;
  mobile: string;
  alternateContactNumber: string;
  landline: string;
  email: string;
  taxNumber: string;
  openingBalance: number;
  payTermsType: 'days' | 'months';
  payTermsValue: number;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  website: string;
  notes: string;
  name: string;
  companyName: string;
  phone: string;
  alternatePhone: string;
  address: string;
  registrationNumber: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  tier: 'preferred' | 'standard' | 'vip' | 'new';
  rating: number;
  totalPurchases: number;
  totalAmount: number;
  outstandingBalance: number;
  paymentTerms: string;
  leadTime: number;
  categories: string[];
  paymentMethods: string[];
  bankName: string;
  bankAccount: string;
  bankBranch: string;
  contactPerson: string;
  contactPersonPhone: string;
  contactPersonEmail: string;
  isVerified: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  message?: string;
};

export type CreateBusinessSupplierInput = {
  supplierType: 'individual' | 'business';
  contactId: string;
  prefix: string;
  firstName: string;
  middleName: string;
  lastName: string;
  businessName: string;
  mobile: string;
  alternateContactNumber: string;
  landline: string;
  email: string;
  taxNumber: string;
  openingBalance: number;
  payTermsType: 'days' | 'months';
  payTermsValue: number;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  website: string;
  notes: string;
};

type ListBusinessSuppliersResponse = {
  suppliers: BusinessSupplierRecord[];
  message?: string;
};

type BusinessSuppliersStore = {
  suppliers: BusinessSupplierRecord[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  loadSuppliers: () => Promise<BusinessSupplierRecord[]>;
  createSupplier: (data: CreateBusinessSupplierInput) => Promise<BusinessSupplierRecord>;
  removeSupplierLocally: (id: string) => void;
  clearError: () => void;
};

function normalizeSupplier(record: BusinessSupplierRecord): BusinessSupplierRecord {
  return {
    ...record,
    message: record.message,
    categories: record.categories ?? [],
    paymentMethods: record.paymentMethods ?? [],
    bankName: record.bankName ?? '',
    bankAccount: record.bankAccount ?? '',
    bankBranch: record.bankBranch ?? '',
    contactPerson: record.contactPerson ?? record.name ?? '',
    contactPersonPhone: record.contactPersonPhone ?? record.mobile ?? '',
    contactPersonEmail: record.contactPersonEmail ?? record.email ?? '',
  };
}

export function useBusinessSuppliers() {
  const [suppliers, setSuppliers] = useState<BusinessSupplierRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSuppliers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequestWithoutSessionInvalidation<ListBusinessSuppliersResponse>('/business/suppliers');
      const nextSuppliers = (response.suppliers ?? []).map(normalizeSupplier);
      setSuppliers(nextSuppliers);
      return nextSuppliers;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load suppliers.';
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createSupplier = useCallback(async (data: CreateBusinessSupplierInput) => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await apiRequestWithoutSessionInvalidation<BusinessSupplierRecord>('/business/suppliers', {
        method: 'POST',
        body: JSON.stringify({
          supplier_type: data.supplierType,
          contact_id: data.contactId,
          prefix: data.prefix,
          first_name: data.firstName,
          middle_name: data.middleName,
          last_name: data.lastName,
          business_name: data.businessName,
          mobile: data.mobile,
          alternate_contact_number: data.alternateContactNumber,
          landline: data.landline,
          email: data.email,
          tax_number: data.taxNumber,
          opening_balance: data.openingBalance,
          pay_terms_type: data.payTermsType,
          pay_terms_value: data.payTermsValue,
          address_line_1: data.addressLine1,
          address_line_2: data.addressLine2,
          city: data.city,
          state: data.state,
          country: data.country,
          zip_code: data.zipCode,
          website: data.website,
          notes: data.notes,
        }),
      });
      const nextSupplier = normalizeSupplier(response);
      setSuppliers((current) => [nextSupplier, ...current.filter((supplier) => supplier.id !== nextSupplier.id)]);
      return nextSupplier;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to save supplier.';
      setError(message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const removeSupplierLocally = useCallback((id: string) => {
    setSuppliers((current) => current.filter((supplier) => supplier.id !== id));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    void loadSuppliers();
  }, [loadSuppliers]);

  return {
    suppliers,
    isLoading,
    isSaving,
    error,
    loadSuppliers,
    createSupplier,
    removeSupplierLocally,
    clearError,
  } satisfies BusinessSuppliersStore;
}
