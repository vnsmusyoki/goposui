import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Select, { type StylesConfig } from 'react-select';
import toast from 'react-hot-toast';
import {
  Building2,
  FileText,
  MapPin,
  Navigation,
  Search,
  Phone,
  Receipt,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { useBusinessLocations, type BusinessLocationRecord, type CreateBusinessLocationInput } from '@/hooks/business/settings/useBusinessLocations';
import { ApiError } from '@/lib/api';
import SettingsTabShell from '../SettingsTabShell';

type SelectOption = {
  value: string;
  label: string;
};

type TabKey = 'details' | 'tax';

type BusinessLocationForm = {
  // Location details
  locationName: string;
  locationId: string;
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

  // Business tax details
  kraPin: string;
  taxJurisdiction: string;
  isVatRegistered: boolean;
  vatNumber: string;
  defaultTaxType: string;
  pricesIncludeTax: boolean;
  issueTaxInvoices: boolean;
  taxNote: string;

  // eTIMS integration
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

type ErrorState = Partial<Record<keyof BusinessLocationForm, string>>;

interface LeafletDragEvent {
  target: {
    getLatLng(): {
      lat: number;
      lng: number;
    };
  };
}

interface LeafletClickEvent {
  latlng: {
    lat: number;
    lng: number;
  };
}

declare global {
  interface Window {
    L?: any;
  }
}

const selectStyles: StylesConfig<SelectOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: 42,
    borderRadius: 8,
    borderColor: 'hsl(var(--border))',
    backgroundColor: 'hsl(var(--background))',
    boxShadow: state.isFocused ? '0 0 0 2px hsl(var(--primary) / 0.2)' : 'none',
    ':hover': {
      borderColor: 'hsl(var(--primary))',
    },
  }),
  valueContainer: (base) => ({
    ...base,
    paddingTop: 0,
    paddingBottom: 0,
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
    borderRadius: 6,
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

const countryOptions: SelectOption[] = [
  { value: 'Kenya', label: 'Kenya' },
  { value: 'Uganda', label: 'Uganda' },
  { value: 'Tanzania', label: 'Tanzania' },
  { value: 'Rwanda', label: 'Rwanda' },
  { value: 'Other', label: 'Other' },
];

const invoiceSchemeOptions: SelectOption[] = [
  { value: 'default', label: 'Default Scheme' },
  { value: 'scheme_a', label: 'Scheme A' },
  { value: 'scheme_b', label: 'Scheme B' },
];

const invoiceLayoutOptions: SelectOption[] = [
  { value: 'default', label: 'Default Layout' },
  { value: 'compact', label: 'Compact Layout' },
  { value: 'detailed', label: 'Detailed Layout' },
];

const sellingPriceGroupOptions: SelectOption[] = [
  { value: 'retail', label: 'Retail Price' },
  { value: 'wholesale', label: 'Wholesale Price' },
  { value: 'vip', label: 'VIP Price' },
];

const taxTypeOptions: SelectOption[] = [
  { value: 'standard', label: 'Standard Rated' },
  { value: 'zero-rated', label: 'Zero Rated' },
  { value: 'exempt', label: 'Exempt' },
  { value: 'non-vat', label: 'Non-VAT' },
];

const paymentMethodOptions: SelectOption[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'mobile_money', label: 'Mobile Money (M-Pesa)' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'credit', label: 'Credit / On Account' },
];

const initialForm: BusinessLocationForm = {
  locationName: '',
  locationId: '',
  landmark: '',
  exactAddress: '',
  city: '',
  zipCode: '',
  state: '',
  country: 'Kenya',
  latitude: '',
  longitude: '',
  mobile: '',
  alternateContactNumber: '',
  email: '',
  website: '',
  invoiceScheme: 'default',
  posInvoiceLayout: 'default',
  saleInvoiceLayout: 'default',
  defaultSellingPriceGroup: 'retail',
  paymentMethods: ['cash'],

  kraPin: '',
  taxJurisdiction: 'Kenya',
  isVatRegistered: false,
  vatNumber: '',
  defaultTaxType: '',
  pricesIncludeTax: true,
  issueTaxInvoices: true,
  taxNote: '',

  etimsEnabled: false,
  environment: 'sandbox',
  integrationType: 'OSCU',
  isHeadOfficeBranch: false,
  kraBranchId: '',
  deviceSerialNumber: '',
  cmcKey: '',
  autoSubmitInvoices: true,
  allowOfflineSales: true,
  retryFailedInvoices: true,
  printQrCode: true,
  printFiscalDetails: true,
};

function mapBusinessLocationToForm(location: BusinessLocationRecord): BusinessLocationForm {
  return {
    locationName: location.locationName,
    locationId: location.locationId,
    landmark: location.landmark,
    exactAddress: location.exactAddress,
    city: location.city,
    zipCode: location.zipCode,
    state: location.state,
    country: location.country,
    latitude: location.latitude === null ? '' : location.latitude.toString(),
    longitude: location.longitude === null ? '' : location.longitude.toString(),
    mobile: location.mobile,
    alternateContactNumber: location.alternateContactNumber,
    email: location.email,
    website: location.website,
    invoiceScheme: location.invoiceScheme,
    posInvoiceLayout: location.posInvoiceLayout,
    saleInvoiceLayout: location.saleInvoiceLayout,
    defaultSellingPriceGroup: location.defaultSellingPriceGroup,
    paymentMethods: location.paymentMethods.length > 0 ? location.paymentMethods : ['cash'],
    kraPin: location.kraPin,
    taxJurisdiction: location.taxJurisdiction,
    isVatRegistered: location.isVatRegistered,
    vatNumber: location.vatNumber,
    defaultTaxType: location.defaultTaxType,
    pricesIncludeTax: location.pricesIncludeTax,
    issueTaxInvoices: location.issueTaxInvoices,
    taxNote: location.taxNote,
    etimsEnabled: location.etimsEnabled,
    environment: location.environment,
    integrationType: location.integrationType,
    isHeadOfficeBranch: location.isHeadOfficeBranch,
    kraBranchId: location.kraBranchId,
    deviceSerialNumber: location.deviceSerialNumber,
    cmcKey: location.cmcKey,
    autoSubmitInvoices: location.autoSubmitInvoices,
    allowOfflineSales: location.allowOfflineSales,
    retryFailedInvoices: location.retryFailedInvoices,
    printQrCode: location.printQrCode,
    printFiscalDetails: location.printFiscalDetails,
  };
}

function mapFormToCreateBusinessLocationInput(form: BusinessLocationForm): CreateBusinessLocationInput {
  return {
    locationId: form.locationId.trim(),
    locationName: form.locationName.trim(),
    landmark: form.landmark.trim(),
    exactAddress: form.exactAddress.trim(),
    city: form.city.trim(),
    zipCode: form.zipCode.trim(),
    state: form.state.trim(),
    country: form.country.trim() || 'Kenya',
    latitude: form.latitude.trim(),
    longitude: form.longitude.trim(),
    mobile: form.mobile.trim(),
    alternateContactNumber: form.alternateContactNumber.trim(),
    email: form.email.trim(),
    website: form.website.trim(),
    invoiceScheme: form.invoiceScheme,
    posInvoiceLayout: form.posInvoiceLayout,
    saleInvoiceLayout: form.saleInvoiceLayout,
    defaultSellingPriceGroup: form.defaultSellingPriceGroup,
    paymentMethods: form.paymentMethods,
    kraPin: form.kraPin.trim(),
    taxJurisdiction: form.taxJurisdiction.trim() || 'Kenya',
    isVatRegistered: form.isVatRegistered,
    vatNumber: form.vatNumber.trim(),
    defaultTaxType: form.defaultTaxType.trim(),
    pricesIncludeTax: form.pricesIncludeTax,
    issueTaxInvoices: form.issueTaxInvoices,
    taxNote: form.taxNote.trim(),
    etimsEnabled: form.etimsEnabled,
    environment: form.environment,
    integrationType: form.integrationType,
    isHeadOfficeBranch: form.isHeadOfficeBranch,
    kraBranchId: form.kraBranchId.trim(),
    deviceSerialNumber: form.deviceSerialNumber.trim(),
    cmcKey: form.cmcKey.trim(),
    autoSubmitInvoices: form.autoSubmitInvoices,
    allowOfflineSales: form.allowOfflineSales,
    retryFailedInvoices: form.retryFailedInvoices,
    printQrCode: form.printQrCode,
    printFiscalDetails: form.printFiscalDetails,
  };
}

export default function CreateBusinessLocation() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('details');
  const [isTaxTabUnlocked, setIsTaxTabUnlocked] = useState(false);
  const [form, setForm] = useState<BusinessLocationForm>(initialForm);
  const [errors, setErrors] = useState<ErrorState>({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const { locations, error: locationsError, isSaving, saveBusinessLocation } = useBusinessLocations();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const markerRef = useRef<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const leafletLoadedRef = useRef(false);
  const hydratedLocationRef = useRef(false);

  const errorItems = useMemo(
    () => [...Object.values(errors).filter(Boolean), locationsError].filter(Boolean) as string[],
    [errors, locationsError],
  );

  useEffect(() => {
    if (locationsError) {
      toast.error(locationsError, { position: 'top-right' });
    }
  }, [locationsError]);

  const updateField = <K extends keyof BusinessLocationForm>(key: K, value: BusinessLocationForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const toggleField = (key: keyof BusinessLocationForm) => {
    setForm((current) => {
      const nextValue = !current[key as keyof BusinessLocationForm];
      const next: BusinessLocationForm = { ...current, [key]: nextValue } as BusinessLocationForm;

      // VAT number only matters once the business is marked as VAT registered.
      if (key === 'isVatRegistered' && !nextValue) {
        next.vatNumber = '';
      }

      return next;
    });
  };

  const togglePaymentMethod = (value: string) => {
    setForm((current) => {
      const exists = current.paymentMethods.includes(value);
      return {
        ...current,
        paymentMethods: exists
          ? current.paymentMethods.filter((method) => method !== value)
          : [...current.paymentMethods, value],
      };
    });
  };

  const reverseGeocode = useCallback(async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            Accept: 'application/json',
          },
        },
      );

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as {
        display_name?: string;
        address?: {
          city?: string;
          town?: string;
          village?: string;
        };
      };

      if (data.display_name) {
        setForm((current) => ({
          ...current,
          exactAddress: data.display_name ?? current.exactAddress,
          city: data.address?.city || data.address?.town || data.address?.village || current.city,
        }));
        return data.display_name;
      }
    } catch {
      // Ignore reverse-geocode errors.
    }

    return null;
  }, []);

  const initMap = useCallback(() => {
    if (!mapContainerRef.current || !window.L || mapRef.current) {
      return;
    }

    const L = window.L as any;
    const startLatitude = Number(form.latitude) || -1.286389;
    const startLongitude = Number(form.longitude) || 36.817223;
    const map = L.map(mapContainerRef.current).setView([startLatitude, startLongitude], 13);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const marker = L.marker([startLatitude, startLongitude], { draggable: true }).addTo(map);
    markerRef.current = marker;

    marker.on('dragend', (event: LeafletDragEvent) => {
      const { lat, lng } = event.target.getLatLng();
      setForm((current) => ({
        ...current,
        latitude: lat.toString(),
        longitude: lng.toString(),
      }));
      void reverseGeocode(lat, lng);
    });

    map.on('click', (event: LeafletClickEvent) => {
      const { lat, lng } = event.latlng;
      marker.setLatLng([lat, lng]);
      setForm((current) => ({
        ...current,
        latitude: lat.toString(),
        longitude: lng.toString(),
      }));
      void reverseGeocode(lat, lng);
    });

    setMapLoaded(true);
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [form.latitude, form.longitude, reverseGeocode]);

  const destroyMap = useCallback(() => {
    if (mapRef.current) {
      (mapRef.current as any).remove?.();
      mapRef.current = null;
      markerRef.current = null;
      setMapLoaded(false);
    }
  }, []);

  const searchLocation = useCallback(async () => {
    const query = searchInputRef.current?.value?.trim();
    if (!query) {
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=1`,
        {
          headers: {
            Accept: 'application/json',
          },
        },
      );

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as Array<{ lat: string; lon: string; display_name?: string }>;
      const first = data[0];
      if (!first || !mapRef.current || !markerRef.current) {
        return;
      }

      const latitude = Number.parseFloat(first.lat);
      const longitude = Number.parseFloat(first.lon);

      (mapRef.current as any).setView([latitude, longitude], 15);
      (markerRef.current as any).setLatLng([latitude, longitude]);
      setForm((current) => ({
        ...current,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        exactAddress: first.display_name ?? current.exactAddress,
      }));
      void reverseGeocode(latitude, longitude);
    } catch {
      // Ignore search errors.
    }
  }, [reverseGeocode]);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const { latitude, longitude } = coords;
      (mapRef.current as any)?.setView?.([latitude, longitude], 15);
      (markerRef.current as any)?.setLatLng?.([latitude, longitude]);
      setForm((current) => ({
        ...current,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
      }));
      void reverseGeocode(latitude, longitude);
    });
  }, [reverseGeocode]);

  useEffect(() => {
    if (activeTab !== 'details') {
      destroyMap();
      return;
    }

    if (leafletLoadedRef.current) {
      initMap();
      setTimeout(() => (mapRef.current as any)?.invalidateSize?.(), 150);
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      leafletLoadedRef.current = true;
      initMap();
    };
    document.head.appendChild(script);

    return () => {
      // Leave the loaded assets in place; the map instance is what we destroy.
    };
  }, [activeTab, destroyMap, initMap]);

  useEffect(() => () => destroyMap(), [destroyMap]);

  const validateAll = () => {
    const detailsErrors = getDetailsErrors();
    const taxErrors = getTaxErrors();
    const nextErrors = { ...detailsErrors, ...taxErrors };
    setErrors(nextErrors);
    const detailsOk = Object.keys(detailsErrors).length === 0;
    const taxOk = Object.keys(taxErrors).length === 0;
    return detailsOk && taxOk;
  };

  const getDetailsErrors = () => {
    const nextErrors: ErrorState = {};

    if (!form.locationName.trim()) nextErrors.locationName = 'Location name is required.';
    if (!form.locationId.trim()) nextErrors.locationId = 'Location ID is required.';
    if (!form.mobile.trim()) nextErrors.mobile = 'Mobile number is required.';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = 'Enter a valid email address.';
    if (form.paymentMethods.length === 0) nextErrors.paymentMethods = 'Select at least one payment method.';
    if (form.latitude.trim() && Number.isNaN(Number(form.latitude))) {
      nextErrors.latitude = 'Latitude must be a valid number.';
    }
    if (form.longitude.trim() && Number.isNaN(Number(form.longitude))) {
      nextErrors.longitude = 'Longitude must be a valid number.';
    }

    return nextErrors;
  };

  const getTaxErrors = () => {
    const nextErrors: ErrorState = {};

    if (!form.kraPin.trim()) nextErrors.kraPin = 'KRA PIN is required.';
    if (form.isVatRegistered && !form.vatNumber.trim()) {
      nextErrors.vatNumber = 'VAT number is required for VAT registered businesses.';
    }

    if (form.etimsEnabled) {
      if (!form.kraBranchId.trim()) nextErrors.kraBranchId = 'KRA branch ID is required when eTIMS is enabled.';
      if (form.integrationType === 'OSCU' && !form.cmcKey.trim()) {
        nextErrors.cmcKey = 'CMC key is required for OSCU integration.';
      }
      if (form.integrationType === 'VSCU' && !form.deviceSerialNumber.trim()) {
        nextErrors.deviceSerialNumber = 'Device serial number is required for VSCU integration.';
      }
    }

    return nextErrors;
  };

  useEffect(() => {
    const primaryLocation = locations[0];
    if (!primaryLocation || hydratedLocationRef.current) {
      return;
    }

    setForm(mapBusinessLocationToForm(primaryLocation));
    setIsTaxTabUnlocked(true);
    hydratedLocationRef.current = true;
  }, [locations]);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) {
      return;
    }

    if (!form.latitude.trim() || !form.longitude.trim()) {
      return;
    }

    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return;
    }

    (mapRef.current as any).setView?.([latitude, longitude], 15);
    (markerRef.current as any).setLatLng?.([latitude, longitude]);
  }, [form.latitude, form.longitude]);

  const handleResolveFromAddress = async () => {
    if (!form.exactAddress.trim()) {
      return;
    }

    setIsResolvingAddress(true);
    try {
      const result = await geocodeAddress(form.exactAddress.trim(), form.country.trim());
      if (result) {
        setForm((current) => ({
          ...current,
          latitude: result.latitude.toFixed(6),
          longitude: result.longitude.toFixed(6),
          exactAddress: result.displayName ?? current.exactAddress,
        }));
      }
    } finally {
      setIsResolvingAddress(false);
    }
  };

  const handleNext = () => {
    const detailsErrors = getDetailsErrors();
    setErrors(detailsErrors);

    if (Object.keys(detailsErrors).length > 0) {
      return;
    }

    setIsTaxTabUnlocked(true);
    setActiveTab('tax');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (activeTab === 'details') {
      handleNext();
      return;
    }

    if (!validateAll()) {
      return;
    }

    try {
      const savedLocation = await saveBusinessLocation(mapFormToCreateBusinessLocationInput(form));
      setForm(mapBusinessLocationToForm(savedLocation));
      setErrors({});
      hydratedLocationRef.current = true;
      toast.success('Business location saved successfully.', { position: 'top-right' });
      navigate('/business/locations');
    } catch (err) {
      if (err instanceof ApiError && typeof err.data === 'object' && err.data !== null) {
        const payloadErrors = (err.data as { errors?: Record<string, string> }).errors;
        if (payloadErrors) {
          setErrors((current) => ({
            ...current,
            ...payloadErrors,
          }));
        }
      }
      toast.error(err instanceof ApiError ? err.message : 'Unable to save business location.', {
        position: 'top-right',
      });
    }
  };

  return (
    <SettingsTabShell
      title="Add Business Location"
      description="Set up a new business location, its invoicing defaults, and KRA eTIMS integration."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {errorItems.length > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
            <p className="mb-2 font-semibold">Please fix the following errors:</p>
            <ul className="list-disc space-y-1 pl-5">
              {errorItems.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-xs font-medium text-muted-foreground">
          Fields marked with <RequiredMark /> are required.
        </p>

        <div className="inline-flex w-full gap-6 border-b border-border sm:w-auto">
          <TabButton active={activeTab === 'details'} onClick={() => setActiveTab('details')}>
            Location Details
          </TabButton>
          <TabButton
            active={activeTab === 'tax'}
            disabled={!isTaxTabUnlocked}
            onClick={() => isTaxTabUnlocked && setActiveTab('tax')}
          >
            Tax & eTIMS
          </TabButton>
        </div>

        {activeTab === 'details' && (
          <div className="space-y-6">
            {/* Basic Info */}
            <Section icon={Building2} title="Basic Information" description="Identify this location within your business.">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Location Name"
                  required
                  placeholder="e.g. Westlands Branch"
                  value={form.locationName}
                  error={errors.locationName}
                  onChange={(value) => updateField('locationName', value)}
                />
                <Field
                  label="Location ID"
                  required
                  placeholder="e.g. LOC-001"
                  value={form.locationId}
                  error={errors.locationId}
                  onChange={(value) => updateField('locationId', value)}
                />
              </div>
            </Section>

            {/* Address */}
            <Section icon={MapPin} title="Address" description="Where this location is physically situated.">
              <div className="space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="flex flex-1 gap-2">
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search address..."
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            searchLocation();
                          }
                        }}
                        className="w-full rounded-lg border border-border bg-transparent py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={searchLocation}
                      className="whitespace-nowrap rounded-lg bg-muted px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted/80"
                    >
                      Search
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-primary px-4 py-2.5 text-sm text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    <Navigation className="h-4 w-4" />
                    My Location
                  </button>
                </div>

                <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
                  <Field
                    label="Landmark"
                    placeholder="e.g. Near Sarit Centre"
                    value={form.landmark}
                    onChange={(value) => updateField('landmark', value)}
                  />
                  <Field
                    label="Exact Address"
                    placeholder="e.g. Westlands, Nairobi, Kenya"
                    value={form.exactAddress}
                    onChange={(value) => updateField('exactAddress', value)}
                  />
                  <Field
                    label="City"
                    placeholder="e.g. Nairobi"
                    value={form.city}
                    onChange={(value) => updateField('city', value)}
                  />
                  <Field
                    label="Zip / Postal Code"
                    placeholder="e.g. 00100"
                    value={form.zipCode}
                    onChange={(value) => updateField('zipCode', value)}
                  />
                  <Field
                    label="State / County"
                    placeholder="e.g. Nairobi County"
                    value={form.state}
                    onChange={(value) => updateField('state', value)}
                  />
                  <SelectField
                    label="Country"
                    value={countryOptions.find((option) => option.value === form.country) ?? null}
                    options={countryOptions}
                    onChange={(option) => option && updateField('country', option.value)}
                  />
                  <Field
                    label="Latitude"
                    placeholder="e.g. -1.286389"
                    value={form.latitude}
                    error={errors.latitude}
                    onChange={(value) => updateField('latitude', value)}
                  />
                  <Field
                    label="Longitude"
                    placeholder="e.g. 36.817223"
                    value={form.longitude}
                    error={errors.longitude}
                    onChange={(value) => updateField('longitude', value)}
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    Click the map to set coordinates. The exact address will be reverse-geocoded when possible.
                  </p>
                  <button
                    type="button"
                    onClick={handleResolveFromAddress}
                    disabled={isResolvingAddress || !form.exactAddress.trim()}
                    className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isResolvingAddress ? 'Resolving...' : 'Pin from Address'}
                  </button>
                </div>

                <div className="rounded-xl border border-border bg-background p-2">
                  <OpenStreetMapPicker
                    containerRef={mapContainerRef}
                    mapLoaded={mapLoaded}
                  />
                </div>
              </div>
            </Section>

            {/* Contact */}
            <Section icon={Phone} title="Contact Information" description="How customers and staff can reach this location.">
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                <Field
                  label="Mobile"
                  required
                  placeholder="e.g. 0712 345 678"
                  value={form.mobile}
                  error={errors.mobile}
                  onChange={(value) => updateField('mobile', value)}
                />
                <Field
                  label="Alternate Contact Number"
                  placeholder="Optional second number"
                  value={form.alternateContactNumber}
                  onChange={(value) => updateField('alternateContactNumber', value)}
                />
                <Field
                  label="Email"
                  placeholder="e.g. branch@business.com"
                  value={form.email}
                  error={errors.email}
                  onChange={(value) => updateField('email', value)}
                />
                <Field
                  label="Website"
                  placeholder="e.g. https://business.com"
                  value={form.website}
                  onChange={(value) => updateField('website', value)}
                />
              </div>
            </Section>

            {/* Invoicing Defaults */}
            <Section
              icon={FileText}
              title="Invoicing Defaults"
              description="Default invoice format and pricing used at this location."
            >
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                <SelectField
                  label="Invoice Scheme"
                  value={invoiceSchemeOptions.find((option) => option.value === form.invoiceScheme) ?? null}
                  options={invoiceSchemeOptions}
                  onChange={(option) => option && updateField('invoiceScheme', option.value)}
                />
                <SelectField
                  label="Invoice Layout for POS"
                  value={invoiceLayoutOptions.find((option) => option.value === form.posInvoiceLayout) ?? null}
                  options={invoiceLayoutOptions}
                  onChange={(option) => option && updateField('posInvoiceLayout', option.value)}
                />
                <SelectField
                  label="Invoice Layout for Sale"
                  value={invoiceLayoutOptions.find((option) => option.value === form.saleInvoiceLayout) ?? null}
                  options={invoiceLayoutOptions}
                  onChange={(option) => option && updateField('saleInvoiceLayout', option.value)}
                />
                <SelectField
                  label="Default Selling Price Group"
                  value={
                    sellingPriceGroupOptions.find((option) => option.value === form.defaultSellingPriceGroup) ?? null
                  }
                  options={sellingPriceGroupOptions}
                  onChange={(option) => option && updateField('defaultSellingPriceGroup', option.value)}
                />
              </div>
            </Section>

            {/* Payment Methods */}
            <Section
              icon={Wallet}
              title="Payment Methods"
              description="Which payment options are accepted at this location."
            >
              <p className="mb-2 text-sm font-medium text-foreground">
                Payment Methods <RequiredMark />
              </p>
              <CheckboxPillGroup
                options={paymentMethodOptions}
                value={form.paymentMethods}
                onChange={togglePaymentMethod}
              />
              {errors.paymentMethods && <p className="mt-2 text-xs text-red-600">{errors.paymentMethods}</p>}
            </Section>
          </div>
        )}

        {activeTab === 'tax' && (
          <div className="space-y-6">
            {/* Business Tax Details */}
            <Section
              icon={Receipt}
              title="Business Tax Details"
              description="Configure the business tax identity and default tax behaviour."
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="KRA PIN"
                  required
                  placeholder="For example, P051234567A"
                  value={form.kraPin}
                  error={errors.kraPin}
                  onChange={(value) => updateField('kraPin', value.toUpperCase())}
                />
                <Field
                  label="Tax Jurisdiction"
                  placeholder="For example, Kenya"
                  value={form.taxJurisdiction}
                  onChange={(value) => updateField('taxJurisdiction', value)}
                />
                <Field
                  label="VAT Number"
                  placeholder="Enter VAT registration number"
                  value={form.vatNumber}
                  error={errors.vatNumber}
                  disabled={!form.isVatRegistered}
                  onChange={(value) => updateField('vatNumber', value)}
                />
                <SelectField
                  label="Default Tax Type"
                  value={taxTypeOptions.find((option) => option.value === form.defaultTaxType) ?? null}
                  options={taxTypeOptions}
                  onChange={(option) => option && updateField('defaultTaxType', option.value)}
                />
              </div>

              <div className="mt-5">
                <TextAreaField
                  label="Tax Invoice Note"
                  placeholder="Enter a note to appear on tax invoices"
                  value={form.taxNote}
                  onChange={(value) => updateField('taxNote', value)}
                />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <ToggleField
                  label="VAT Registered"
                  description="Enable VAT-related fields and reporting."
                  checked={form.isVatRegistered}
                  onChange={() => toggleField('isVatRegistered')}
                />
                <ToggleField
                  label="Prices Include Tax"
                  description="Treat product selling prices as tax inclusive."
                  checked={form.pricesIncludeTax}
                  onChange={() => toggleField('pricesIncludeTax')}
                />
                <ToggleField
                  label="Issue Tax Invoices"
                  description="Generate tax invoices for completed sales."
                  checked={form.issueTaxInvoices}
                  onChange={() => toggleField('issueTaxInvoices')}
                />
              </div>
            </Section>

            {/* eTIMS Integration */}
            <Section
              icon={ShieldCheck}
              title="eTIMS Integration"
              description="Configure electronic tax invoicing with KRA eTIMS for this location."
            >
              <ToggleField
                label="Enable eTIMS Integration"
                description="Submit eligible sales invoices to KRA eTIMS."
                checked={form.etimsEnabled}
                onChange={() => toggleField('etimsEnabled')}
              />

              {form.etimsEnabled && (
                <div className="mt-5 space-y-5 rounded-lg border border-border bg-background p-4">
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    <SelectField
                      label="Environment"
                      value={{ value: form.environment, label: form.environment === 'sandbox' ? 'Sandbox' : 'Production' }}
                      options={[
                        { value: 'sandbox', label: 'Sandbox' },
                        { value: 'production', label: 'Production' },
                      ]}
                      onChange={(option) =>
                        option && updateField('environment', option.value as BusinessLocationForm['environment'])
                      }
                    />
                    <SelectField
                      label="Integration Type"
                      value={{ value: form.integrationType, label: form.integrationType }}
                      options={[
                        { value: 'OSCU', label: 'OSCU' },
                        { value: 'VSCU', label: 'VSCU' },
                      ]}
                      onChange={(option) =>
                        option && updateField('integrationType', option.value as BusinessLocationForm['integrationType'])
                      }
                    />
                    <Field
                      label="KRA Branch ID"
                      placeholder="Enter the registered branch ID"
                      value={form.kraBranchId}
                      error={errors.kraBranchId}
                      onChange={(value) => updateField('kraBranchId', value)}
                    />

                    {form.integrationType === 'OSCU' && (
                      <Field
                        label="CMC Key"
                        placeholder="Enter the CMC / API key issued by KRA"
                        value={form.cmcKey}
                        error={errors.cmcKey}
                        onChange={(value) => updateField('cmcKey', value)}
                      />
                    )}

                    {form.integrationType === 'VSCU' && (
                      <Field
                        label="Device Serial Number"
                        placeholder="Enter the registered device serial number"
                        value={form.deviceSerialNumber}
                        error={errors.deviceSerialNumber}
                        onChange={(value) => updateField('deviceSerialNumber', value)}
                      />
                    )}
                  </div>

                  <ToggleField
                    label="Set as Head Office / Default Branch"
                    description="Mark this location as the primary branch for eTIMS reporting."
                    checked={form.isHeadOfficeBranch}
                    onChange={() => toggleField('isHeadOfficeBranch')}
                  />

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <ToggleField
                      label="Auto-Submit Completed Sales"
                      description="Send invoices to eTIMS after a sale is completed."
                      checked={form.autoSubmitInvoices}
                      onChange={() => toggleField('autoSubmitInvoices')}
                    />
                    <ToggleField
                      label="Allow Offline Sales"
                      description="Queue invoices when eTIMS or the internet is unavailable."
                      checked={form.allowOfflineSales}
                      onChange={() => toggleField('allowOfflineSales')}
                    />
                    <ToggleField
                      label="Retry Failed Submissions"
                      description="Automatically retry failed invoice submissions."
                      checked={form.retryFailedInvoices}
                      onChange={() => toggleField('retryFailedInvoices')}
                    />
                    <ToggleField
                      label="Print eTIMS QR Code"
                      description="Include the eTIMS QR code on receipts."
                      checked={form.printQrCode}
                      onChange={() => toggleField('printQrCode')}
                    />
                    <ToggleField
                      label="Print Fiscal Details"
                      description="Show eTIMS fiscal details on printed receipts."
                      checked={form.printFiscalDetails}
                      onChange={() => toggleField('printFiscalDetails')}
                    />
                  </div>
                </div>
              )}
            </Section>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          {activeTab === 'tax' ? (
            <button
              type="button"
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-alt"
              onClick={() => setActiveTab('details')}
            >
              Back
            </button>
          ) : (
            <button
              type="button"
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-alt"
              onClick={() => {
                setForm(initialForm);
                setErrors({});
                setActiveTab('details');
                setIsTaxTabUnlocked(false);
              }}
            >
              Reset
            </button>
          )}

          {activeTab === 'details' ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Next
            </button>
          ) : (
            <>
              <button
                type="button"
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-alt"
                onClick={() => {
                  setForm(initialForm);
                  setErrors({});
                  setActiveTab('details');
                  setIsTaxTabUnlocked(false);
                }}
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving ? 'Saving...' : 'Save Business Location'}
              </button>
            </>
          )}
        </div>
      </form>
    </SettingsTabShell>
  );
}

function TabButton({
  active,
  disabled = false,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 border-b-2 px-4 py-3 text-sm font-medium transition-colors sm:flex-none ${
        active
          ? 'border-primary text-primary'
          : disabled
            ? 'border-transparent text-muted-foreground/50'
            : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card p-5 sm:p-6">
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

function RequiredMark() {
  return <span className="ml-1 inline-block align-middle text-sm font-bold leading-none text-red-600">*</span>;
}

function Field({
  label,
  required = false,
  placeholder,
  value,
  error,
  disabled = false,
  onChange,
  type = 'text',
}: {
  label: string;
  required?: boolean;
  placeholder?: string;
  value: string;
  error?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  type?: 'text' | 'number' | 'email';
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-foreground">
        {label} {required && <RequiredMark />}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 ${
          error ? 'border-red-500' : 'border-border'
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </label>
  );
}

function OpenStreetMapPicker({
  containerRef,
  mapLoaded,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  mapLoaded: boolean;
}) {
  return (
    <div ref={containerRef} className="relative h-80 w-full overflow-hidden rounded-xl bg-muted">
      {!mapLoaded && (
        <div className="flex h-full w-full items-center justify-center">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            Loading map...
          </p>
        </div>
      )}
    </div>
  );
}

async function geocodeAddress(address: string, country: string) {
  try {
    const query = `${address}${country ? `, ${country}` : ''}`;
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
      {
        headers: {
          Accept: 'application/json',
        },
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as Array<{ lat: string; lon: string; display_name?: string }>;
    const first = data[0];
    if (!first) {
      return null;
    }

    return {
      latitude: Number(first.lat),
      longitude: Number(first.lon),
      displayName: first.display_name,
    };
  } catch {
    return null;
  }
}

function TextAreaField({
  label,
  required = false,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  required?: boolean;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-foreground">
        {label} {required && <RequiredMark />}
      </span>
      <textarea
        value={value}
        placeholder={placeholder}
        rows={4}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

function SelectField({
  label,
  required = false,
  value,
  options,
  onChange,
}: {
  label: string;
  required?: boolean;
  value: SelectOption | null;
  options: SelectOption[];
  onChange: (value: SelectOption | null) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-foreground">
        {label} {required && <RequiredMark />}
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
    </label>
  );
}

function ToggleField({
  label,
  description,
  checked,
  disabled = false,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`flex w-full items-start justify-between gap-4 rounded-lg border p-3 text-left transition-colors ${
        disabled
          ? 'cursor-not-allowed border-border bg-muted/40 opacity-60'
          : 'border-border bg-background hover:border-primary/40'
      }`}
    >
      <div>
        <span className="block text-sm font-medium text-foreground">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>}
      </div>
      <span
        aria-hidden
        className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          checked ? 'bg-primary' : 'bg-muted'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </span>
    </button>
  );
}

function CheckboxPillGroup({
  options,
  value,
  onChange,
}: {
  options: SelectOption[];
  value: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = value.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background text-muted-foreground hover:border-primary/40'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
