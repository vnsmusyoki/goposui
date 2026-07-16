import { useCallback, useEffect, useState } from 'react';
import { apiRequestWithoutSessionInvalidation } from '@/lib/api';

export type BusinessCustomerRecord = {
  id: string;
  businessId: string;
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
  openingBalance: number;
  payTermsType: string;
  payTermsValue: number;
  creditLimit: number;
  customerGroup: string;
  advanceBalance: number;
  totalSaleDue: number;
  totalSellReturnDue: number;
  customField1: string;
  customField2: string;
  customField3: string;
  customField4: string;
  customField5: string;
  notes: string;
  isActive: boolean;
  createdBy: string;
  deleted: boolean;
  deletedAt: string;
  deletedBy: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  displayName: string;
  message?: string;
};

export type CreateBusinessCustomerInput = {
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
  openingBalance: number;
  payTermsType: string;
  payTermsValue: number;
  creditLimit: number;
  customerGroup: string;
  advanceBalance: number;
  totalSaleDue: number;
  totalSellReturnDue: number;
  customField1: string;
  customField2: string;
  customField3: string;
  customField4: string;
  customField5: string;
  notes: string;
  isActive: boolean;
};

export type UpdateBusinessCustomerInput = CreateBusinessCustomerInput;

type ListBusinessCustomersResponse = {
  customers: BusinessCustomerRecord[];
  message?: string;
};

type CustomerResponse = BusinessCustomerRecord;

type DeleteCustomerResponse = {
  id: string;
  message?: string;
};

type CustomerStore = {
  customers: BusinessCustomerRecord[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  loadCustomers: () => Promise<BusinessCustomerRecord[]>;
  createCustomer: (data: CreateBusinessCustomerInput) => Promise<CustomerResponse>;
  updateCustomer: (id: string, data: UpdateBusinessCustomerInput) => Promise<CustomerResponse>;
  deleteCustomer: (id: string) => Promise<DeleteCustomerResponse>;
  clearError: () => void;
};

function normalizeCustomer(record: BusinessCustomerRecord): BusinessCustomerRecord {
  const name = record.name || record.displayName || [record.firstName, record.middleName, record.lastName].filter(Boolean).join(' ').trim() || record.companyName || 'Customer';
  return {
    ...record,
    name,
    displayName: record.displayName || name,
    deletedAt: record.deletedAt ?? '',
    deletedBy: record.deletedBy ?? '',
    contactId: record.contactId ?? record.customerCode ?? '',
    shippingAddress: record.shippingAddress ?? '',
    taxNumber: record.taxNumber ?? '',
    openingBalance: record.openingBalance ?? 0,
    payTermsType: record.payTermsType ?? '',
    payTermsValue: record.payTermsValue ?? 0,
    creditLimit: record.creditLimit ?? 0,
    customerGroup: record.customerGroup ?? '',
    advanceBalance: record.advanceBalance ?? 0,
    totalSaleDue: record.totalSaleDue ?? 0,
    totalSellReturnDue: record.totalSellReturnDue ?? 0,
    customField1: record.customField1 ?? '',
    customField2: record.customField2 ?? '',
    customField3: record.customField3 ?? '',
    customField4: record.customField4 ?? '',
    customField5: record.customField5 ?? '',
  };
}

export function useBusinessCustomers() {
  const [customers, setCustomers] = useState<BusinessCustomerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequestWithoutSessionInvalidation<ListBusinessCustomersResponse>('/business/customers');
      const nextCustomers = (response.customers ?? []).map(normalizeCustomer);
      setCustomers(nextCustomers);
      return nextCustomers;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load customers.';
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createCustomer = useCallback(async (data: CreateBusinessCustomerInput) => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await apiRequestWithoutSessionInvalidation<CustomerResponse>('/business/customers', {
        method: 'POST',
        body: JSON.stringify({
          contact_id: data.contactId,
          customer_code: data.customerCode,
          first_name: data.firstName,
          middle_name: data.middleName,
          last_name: data.lastName,
          company_name: data.companyName,
          phone: data.phone,
          email: data.email,
          address: data.address,
          shipping_address: data.shippingAddress,
          tax_number: data.taxNumber,
          opening_balance: data.openingBalance,
          pay_terms_type: data.payTermsType,
          pay_terms_value: data.payTermsValue,
          credit_limit: data.creditLimit,
          customer_group: data.customerGroup,
          advance_balance: data.advanceBalance,
          total_sale_due: data.totalSaleDue,
          total_sell_return_due: data.totalSellReturnDue,
          custom_field_1: data.customField1,
          custom_field_2: data.customField2,
          custom_field_3: data.customField3,
          custom_field_4: data.customField4,
          custom_field_5: data.customField5,
          notes: data.notes,
          is_active: data.isActive,
        }),
      });
      const nextCustomer = normalizeCustomer(response);
      setCustomers((current) => [nextCustomer, ...current.filter((customer) => customer.id !== nextCustomer.id)]);
      return nextCustomer;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to save customer.';
      setError(message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const updateCustomer = useCallback(async (id: string, data: UpdateBusinessCustomerInput) => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await apiRequestWithoutSessionInvalidation<CustomerResponse>(`/business/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          contact_id: data.contactId,
          customer_code: data.customerCode,
          first_name: data.firstName,
          middle_name: data.middleName,
          last_name: data.lastName,
          company_name: data.companyName,
          phone: data.phone,
          email: data.email,
          address: data.address,
          shipping_address: data.shippingAddress,
          tax_number: data.taxNumber,
          opening_balance: data.openingBalance,
          pay_terms_type: data.payTermsType,
          pay_terms_value: data.payTermsValue,
          credit_limit: data.creditLimit,
          customer_group: data.customerGroup,
          advance_balance: data.advanceBalance,
          total_sale_due: data.totalSaleDue,
          total_sell_return_due: data.totalSellReturnDue,
          custom_field_1: data.customField1,
          custom_field_2: data.customField2,
          custom_field_3: data.customField3,
          custom_field_4: data.customField4,
          custom_field_5: data.customField5,
          notes: data.notes,
          is_active: data.isActive,
        }),
      });
      const nextCustomer = normalizeCustomer(response);
      setCustomers((current) => current.map((customer) => (customer.id === id ? nextCustomer : customer)));
      return nextCustomer;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update customer.';
      setError(message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const deleteCustomer = useCallback(async (id: string) => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await apiRequestWithoutSessionInvalidation<DeleteCustomerResponse>(`/business/customers/${id}`, {
        method: 'DELETE',
      });
      setCustomers((current) => current.filter((customer) => customer.id !== id));
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to delete customer.';
      setError(message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  return {
    customers,
    isLoading,
    isSaving,
    error,
    loadCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    clearError,
  } satisfies CustomerStore;
}
