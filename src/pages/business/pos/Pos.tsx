import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, Banknote, Loader2, Lock, LogOut, Printer, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PosLayout, {
  type PosCategoryFilter,
  type PosCustomer,
  type PosProduct,
} from "@/layouts/PosLayout";
import {
  type BusinessCustomerRecord,
  useBusinessCustomers,
} from "@/hooks/business/customers/useBusinessCustomers";
import {
  type ProductListItem,
  useProducts,
} from "@/hooks/business/products/useProducts";
import { useBusinessLocations } from "@/hooks/business/settings/useBusinessLocations";
import { usePosReadiness } from "@/hooks/business/pos/usePosReadiness";
import { useAuthStore } from "@/auth/authStore";

const FALLBACK_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200";

function mapProductForPos(product: ProductListItem): PosProduct {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku ?? "",
    price: Number(product.defaultSellingPrice || 0),
    priceRules: (product.productPrices ?? []).map((price) => ({
      id: price.id,
      priceType: price.priceType,
      minQuantity: Number(price.minQuantity || 1),
      price: Number(price.price || 0),
      locationId: price.locationId,
      customerGroup: price.customerGroup,
      startsAt: price.startsAt,
      endsAt: price.endsAt,
      active: price.active,
      priority: Number(price.priority || 100),
    })),
    cost: Number(product.defaultPurchasePrice || 0),
    stock: Number(product.currentStock || 0),
    category: product.categoryName || "Uncategorized",
    brand: product.brandName || "Unbranded",
    image: product.imageUrl || FALLBACK_PRODUCT_IMAGE,
    status: product.status,
    barcode: product.barcode || "",
    tax_rate: Number(product.taxRate || 0),
  };
}

function mapCustomerForPos(customer: BusinessCustomerRecord): PosCustomer {
  return {
    id: customer.id,
    name: customer.displayName || customer.name,
    email: customer.email || "",
    phone: customer.phone || "",
    address: customer.address || customer.shippingAddress || "",
    loyalty_points: 0,
    tier: "bronze",
    total_orders: 0,
    total_spent: Number(customer.totalSaleDue || 0),
  };
}

function buildCategoryFilters(products: PosProduct[]): PosCategoryFilter[] {
  const counts = new Map<string, number>();

  for (const product of products) {
    counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
  }

  return [
    { id: "All", label: "All", count: products.length },
    ...Array.from(counts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([category, count]) => ({
        id: category,
        label: category,
        count,
      })),
  ];
}

export default function Pos() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const {
    products,
    fetchProducts,
    isLoading: productsLoading,
    error: productsError,
  } = useProducts();
  const { customers, loadCustomers } = useBusinessCustomers();
  const { locations, isLoading: locationsLoading } = useBusinessLocations();
  const {
    readiness,
    isLoading: readinessLoading,
    error: readinessError,
    loadReadiness,
    openRegister,
  } = usePosReadiness();
  const [openingCashAmount, setOpeningCashAmount] = useState("");
  const [openingNote, setOpeningNote] = useState("");
  const [openRegisterError, setOpenRegisterError] = useState<string | null>(null);
  const [isOpeningRegister, setIsOpeningRegister] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const selectedLocation = locations[0] ?? null;

  useEffect(() => {
    void loadCustomers().catch(() => undefined);
  }, [loadCustomers]);

  useEffect(() => {
    if (!selectedLocation) return;
    void loadReadiness(selectedLocation.id).catch(() => undefined);
    void fetchProducts({ showNotForSelling: false, locationId: selectedLocation.id }).catch(() => undefined);
  }, [fetchProducts, loadReadiness, selectedLocation]);

  const posProducts = useMemo(
    () => products.filter((product) => product.isForSelling).map(mapProductForPos),
    [products],
  );

  const categories = useMemo(
    () => buildCategoryFilters(posProducts),
    [posProducts],
  );

  const posCustomers = useMemo(
    () => customers.filter((customer) => customer.isActive).map(mapCustomerForPos),
    [customers],
  );

  const pageLoading = locationsLoading || readinessLoading || (!readiness && !readinessError);

  if (pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm font-semibold">Checking POS readiness...</p>
          <p className="mt-1 text-xs text-muted-foreground">Cash register, printer, and payment checks are loading.</p>
        </div>
      </div>
    );
  }

  if (!selectedLocation || readinessError || !readiness?.hasActiveCashRegister) {
    const reasons = readiness?.blockingReasons?.length
      ? readiness.blockingReasons
      : [readinessError || "Open an active cash register before using POS."];
    const handleOpenRegister = async () => {
      if (!selectedLocation) return;
      const amount = Number.parseFloat(openingCashAmount || "0");
      if (Number.isNaN(amount) || amount < 0) {
        setOpenRegisterError("Enter a valid opening cash amount.");
        return;
      }

      setIsOpeningRegister(true);
      setOpenRegisterError(null);
      try {
        await openRegister({
          businessLocationId: selectedLocation.id,
          openingCashAmount: amount,
          notes: openingNote,
        });
      } catch (err) {
        setOpenRegisterError(err instanceof Error ? err.message : "Unable to open cash register.");
      } finally {
        setIsOpeningRegister(false);
      }
    };
    const handleLogout = async () => {
      setIsLoggingOut(true);
      try {
        await logout();
      } finally {
        setIsLoggingOut(false);
      }
    };

    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.18),transparent_34%),linear-gradient(135deg,hsl(var(--background)),hsl(var(--surface-alt)))] p-6 text-foreground">
        <div className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-12 h-80 w-80 rounded-full bg-success/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-success to-info" />

        <div className="absolute right-5 top-5 z-10 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card/85 px-4 text-xs font-semibold text-foreground shadow-sm backdrop-blur hover:bg-card"
          >
            <ArrowLeft className="h-4 w-4" />
            Exit
          </button>
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={isLoggingOut}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-destructive/20 bg-destructive/10 px-4 text-xs font-semibold text-destructive shadow-sm backdrop-blur hover:bg-destructive/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" />
            {isLoggingOut ? "Logging out..." : "Log out"}
          </button>
        </div>

        <div className="relative z-0 grid w-full max-w-5xl gap-5 lg:grid-cols-[0.9fr_1.2fr]">
          <aside className="rounded-[2rem] border border-border bg-card/80 p-6 shadow-xl shadow-foreground/5 backdrop-blur">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Lock className="h-7 w-7" />
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-primary">POS checkpoint</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Open a register to start selling</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              We need an active cash register for this user and location before the POS workspace can accept orders.
            </p>

            <div className="mt-6 rounded-2xl border border-border bg-background/70 p-4">
              <p className="text-xs font-semibold text-muted-foreground">Selected location</p>
              <p className="mt-1 text-base font-bold">
                {selectedLocation?.locationName || "No business location available"}
              </p>
              {selectedLocation?.locationId ? (
                <p className="mt-1 text-xs text-muted-foreground">Code: {selectedLocation.locationId}</p>
              ) : null}
            </div>

            <div className="mt-4 grid gap-3">
              {reasons.map((reason) => (
                <div key={reason} className="flex gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </aside>

          <main className="rounded-[2rem] border border-border bg-card/90 p-6 shadow-xl shadow-foreground/5 backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Register opening</h2>
                <p className="mt-1 text-sm text-muted-foreground">Confirm readiness checks and enter the starting cash float.</p>
              </div>
              <span className="rounded-full bg-warning/10 px-3 py-1 text-xs font-semibold text-warning">Action required</span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-background p-4">
              <Printer className="h-5 w-5 text-muted-foreground" />
              <p className="mt-2 text-sm font-semibold">Printer check</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {readiness?.printerTestRequired ? "Test print is still required for this POS session." : "Printer check passed."}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-4">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <p className="mt-2 text-sm font-semibold">MPesa STK Push</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {readiness?.mpesaStkPushEnabled ? "Enabled for this location." : "Not configured. MPesa will be disabled."}
              </p>
            </div>
          </div>

          {selectedLocation ? (
            <div className="mt-6 rounded-2xl border border-border bg-background p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Banknote className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">Open cash register</h2>
                  <p className="text-xs text-muted-foreground">
                    Enter the cash float in the drawer to start selling at this location.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Opening cash amount</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={openingCashAmount}
                    onChange={(event) => setOpeningCashAmount(event.target.value)}
                    placeholder="0.00"
                    className="mt-1 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Opening note</label>
                  <input
                    type="text"
                    value={openingNote}
                    onChange={(event) => setOpeningNote(event.target.value)}
                    placeholder="Optional note"
                    className="mt-1 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>

              {openRegisterError ? (
                <p className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                  {openRegisterError}
                </p>
              ) : null}

              <button
                type="button"
                onClick={() => void handleOpenRegister()}
                disabled={isOpeningRegister}
                className="mt-4 w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isOpeningRegister ? "Opening register..." : "Open register and enter POS"}
              </button>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => selectedLocation && void loadReadiness(selectedLocation.id).catch(() => undefined)}
            className="mt-4 w-full rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-foreground hover:bg-surface-alt"
          >
            Recheck POS readiness
          </button>
          </main>
        </div>
      </div>
    );
  }

  return (
    <PosLayout
      products={posProducts}
      categories={categories}
      customers={posCustomers}
      productsLoading={productsLoading}
      productsError={productsError}
      mpesaStkPushEnabled={readiness.mpesaStkPushEnabled}
      activeRegister={readiness.activeRegister}
      businessLocationName={readiness.businessLocationName}
    />
  );
}
