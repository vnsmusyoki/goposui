import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

export type BusinessLocationRecord = {
  id: string;
  businessId: string;
  locationId: string;
  locationName: string;
  landmark: string;
  exactAddress: string;
  city: string;
  zipCode: string;
  state: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  mobile: string;
  alternateContactNumber: string;
  email: string;
  website: string;
  invoiceScheme: string;
  posInvoiceLayout: string;
  saleInvoiceLayout: string;
  defaultSellingPriceGroup: string;
  paymentMethods: string[];
  kraPin: string;
  taxJurisdiction: string;
  isVatRegistered: boolean;
  vatNumber: string;
  defaultTaxType: string;
  pricesIncludeTax: boolean;
  issueTaxInvoices: boolean;
  taxNote: string;
  etimsEnabled: boolean;
  environment: 'sandbox' | 'production';
  integrationType: 'OSCU' | 'VSCU';
  isHeadOfficeBranch: boolean;
  kraBranchId: string;
  deviceSerialNumber: string;
  cmcKey: string;
  autoSubmitInvoices: boolean;
  allowOfflineSales: boolean;
  retryFailedInvoices: boolean;
  printQrCode: boolean;
  printFiscalDetails: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateBusinessLocationInput = {
  locationId: string;
  locationName: string;
  landmark: string;
  exactAddress: string;
  city: string;
  zipCode: string;
  state: string;
  country: string;
  latitude: string;
  longitude: string;
  mobile: string;
  alternateContactNumber: string;
  email: string;
  website: string;
  invoiceScheme: string;
  posInvoiceLayout: string;
  saleInvoiceLayout: string;
  defaultSellingPriceGroup: string;
  paymentMethods: string[];
  kraPin: string;
  taxJurisdiction: string;
  isVatRegistered: boolean;
  vatNumber: string;
  defaultTaxType: string;
  pricesIncludeTax: boolean;
  issueTaxInvoices: boolean;
  taxNote: string;
  etimsEnabled: boolean;
  environment: 'sandbox' | 'production';
  integrationType: 'OSCU' | 'VSCU';
  isHeadOfficeBranch: boolean;
  kraBranchId: string;
  deviceSerialNumber: string;
  cmcKey: string;
  autoSubmitInvoices: boolean;
  allowOfflineSales: boolean;
  retryFailedInvoices: boolean;
  printQrCode: boolean;
  printFiscalDetails: boolean;
};

type BusinessLocationApiItem = {
  id: string;
  business_id: string;
  location_id: string;
  location_name: string;
  landmark: string;
  exact_address: string;
  city: string;
  zip_code: string;
  state: string;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
  mobile: string;
  alternate_contact_number: string;
  email: string;
  website: string;
  invoice_scheme: string;
  pos_invoice_layout: string;
  sale_invoice_layout: string;
  default_selling_price_group: string;
  payment_methods: string[];
  kra_pin: string;
  tax_jurisdiction: string;
  is_vat_registered: boolean;
  vat_number: string;
  default_tax_type: string;
  prices_include_tax: boolean;
  issue_tax_invoices: boolean;
  tax_note: string;
  etims_enabled: boolean;
  environment: 'sandbox' | 'production';
  integration_type: 'OSCU' | 'VSCU';
  is_head_office_branch: boolean;
  kra_branch_id: string;
  device_serial_number: string;
  cmc_key: string;
  auto_submit_invoices: boolean;
  allow_offline_sales: boolean;
  retry_failed_invoices: boolean;
  print_qr_code: boolean;
  print_fiscal_details: boolean;
  created_at: string;
  updated_at: string;
};

type BusinessLocationsApiResponse = {
  locations: BusinessLocationApiItem[];
  message?: string;
};

type BusinessLocationApiCreateResponse = BusinessLocationApiItem & {
  message?: string;
};

type BusinessLocationsStore = {
  locations: BusinessLocationRecord[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  fetchLocations: () => Promise<BusinessLocationRecord[]>;
  loadBusinessLocations: () => Promise<BusinessLocationRecord[]>;
  saveBusinessLocation: (data: CreateBusinessLocationInput) => Promise<BusinessLocationRecord>;
  deleteLocation: (locationId: string) => Promise<void>;
  clearError: () => void;
};

function normalizeLocation(response: BusinessLocationApiItem): BusinessLocationRecord {
  return {
    id: response.id,
    businessId: response.business_id,
    locationId: response.location_id,
    locationName: response.location_name,
    landmark: response.landmark ?? '',
    exactAddress: response.exact_address ?? '',
    city: response.city ?? '',
    zipCode: response.zip_code ?? '',
    state: response.state ?? '',
    country: response.country ?? 'Kenya',
    latitude: typeof response.latitude === 'number' ? response.latitude : null,
    longitude: typeof response.longitude === 'number' ? response.longitude : null,
    mobile: response.mobile ?? '',
    alternateContactNumber: response.alternate_contact_number ?? '',
    email: response.email ?? '',
    website: response.website ?? '',
    invoiceScheme: response.invoice_scheme ?? 'default',
    posInvoiceLayout: response.pos_invoice_layout ?? 'default',
    saleInvoiceLayout: response.sale_invoice_layout ?? 'default',
    defaultSellingPriceGroup: response.default_selling_price_group ?? 'retail',
    paymentMethods: Array.isArray(response.payment_methods) ? response.payment_methods : [],
    kraPin: response.kra_pin ?? '',
    taxJurisdiction: response.tax_jurisdiction ?? 'Kenya',
    isVatRegistered: Boolean(response.is_vat_registered),
    vatNumber: response.vat_number ?? '',
    defaultTaxType: response.default_tax_type ?? '',
    pricesIncludeTax: Boolean(response.prices_include_tax),
    issueTaxInvoices: Boolean(response.issue_tax_invoices),
    taxNote: response.tax_note ?? '',
    etimsEnabled: Boolean(response.etims_enabled),
    environment: response.environment ?? 'sandbox',
    integrationType: response.integration_type ?? 'OSCU',
    isHeadOfficeBranch: Boolean(response.is_head_office_branch),
    kraBranchId: response.kra_branch_id ?? '',
    deviceSerialNumber: response.device_serial_number ?? '',
    cmcKey: response.cmc_key ?? '',
    autoSubmitInvoices: Boolean(response.auto_submit_invoices),
    allowOfflineSales: Boolean(response.allow_offline_sales),
    retryFailedInvoices: Boolean(response.retry_failed_invoices),
    printQrCode: Boolean(response.print_qr_code),
    printFiscalDetails: Boolean(response.print_fiscal_details),
    createdAt: response.created_at,
    updatedAt: response.updated_at,
  };
}

export function useBusinessLocations() {
  const [locations, setLocations] = useState<BusinessLocationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBusinessLocations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest<BusinessLocationsApiResponse>('/business/locations');
      const nextLocations = (response.locations ?? []).map(normalizeLocation);
      setLocations(nextLocations);
      return nextLocations;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load business locations.';
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveBusinessLocation = useCallback(async (data: CreateBusinessLocationInput) => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await apiRequest<BusinessLocationApiCreateResponse>('/business/locations', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      const nextLocation = normalizeLocation(response);
      setLocations((current) => [nextLocation, ...current.filter((location) => location.id !== nextLocation.id)]);
      return nextLocation;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to save business location.';
      setError(message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const deleteLocation = useCallback(async (locationId: string) => {
    setIsSaving(true);
    setError(null);

    try {
      await apiRequest<{ id: string; message?: string }>(`/business/locations/${locationId}`, {
        method: 'DELETE',
      });
      setLocations((current) => current.filter((location) => location.id !== locationId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to delete business location.';
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
    void loadBusinessLocations();
  }, [loadBusinessLocations]);

  return {
    locations,
    isLoading,
    isSaving,
    error,
    fetchLocations: loadBusinessLocations,
    loadBusinessLocations,
    saveBusinessLocation,
    deleteLocation,
    clearError,
  } satisfies BusinessLocationsStore;
}
