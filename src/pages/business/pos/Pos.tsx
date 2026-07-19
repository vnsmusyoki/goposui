import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  Check,
  ChevronDown,
  Clock,
  Copy,
  CreditCard,
  Filter,
  Grid,
  History,
  Coins,
  Loader2,
  MapPin,
  Minus,
  Package,
  Plus,
  Printer,
  QrCode,
  Receipt,
  Scan,
  Search,
  Shield,
  ShoppingCart,
  Tag,
  Trash2,
  User,
  Wallet,
  Zap,
} from "lucide-react";
import { useBusinessCustomers } from "@/hooks/business/customers/useBusinessCustomers";
import { useBusinessLocations } from "@/hooks/business/settings/useBusinessLocations";
import { usePosSettings } from "@/hooks/business/settings/usePosSettings";
import {
  type ProductListItem,
  useProducts,
} from "@/hooks/business/products/useProducts";

type CartLine = {
  product: ProductListItem;
  quantity: number;
};

const moneyFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const quickTenderAmounts = [1000, 2000, 5000, 10000];

function formatMoney(amount: number) {
  return moneyFormatter.format(Number.isFinite(amount) ? amount : 0);
}

function normalizeTaxRate(rate: number) {
  if (!Number.isFinite(rate) || rate <= 0) return 0;
  return rate > 1 ? rate / 100 : rate;
}

function getProductColor(name: string) {
  const palette = [
    "from-slate-900 via-slate-700 to-slate-500",
    "from-emerald-700 via-emerald-500 to-teal-400",
    "from-amber-700 via-orange-500 to-rose-400",
    "from-cyan-700 via-sky-500 to-blue-400",
    "from-violet-700 via-purple-500 to-fuchsia-400",
  ];
  const index =
    name.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) %
    palette.length;
  return palette[index];
}

function getInitials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function StatPill({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {label}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
        </div>
        <div className="rounded-xl bg-slate-900/5 p-2 text-slate-700">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-lg font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>
      <div className="rounded-2xl bg-slate-900 px-3 py-2 text-white shadow-lg shadow-slate-900/20">
        <Icon className="h-4 w-4" />
      </div>
    </div>
  );
}

function ChipButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-slate-900 bg-slate-900 text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}

export default function Pos() {
  const navigate = useNavigate();
  const {
    products,
    fetchProducts,
    isLoading: productsLoading,
    error: productsError,
    clearError,
  } = useProducts();
  const {
    customers,
    loadCustomers,
    error: customersError,
    clearError: clearCustomersError,
  } = useBusinessCustomers();
  const {
    locations,
    loadBusinessLocations,
    error: locationsError,
    clearError: clearLocationsError,
  } = useBusinessLocations();
  const { settings, isLoading: settingsLoading } = usePosSettings();

  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [selectedCustomerId, setSelectedCustomerId] = useState("walk-in");
  const [selectedLocationId, setSelectedLocationId] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [tendered, setTendered] = useState("0");
  const [saleNote, setSaleNote] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);

  useEffect(() => {
    void fetchProducts({ showNotForSelling: false });
    void loadCustomers();
    void loadBusinessLocations();
  }, [fetchProducts, loadCustomers, loadBusinessLocations]);

  useEffect(() => {
    if (selectedLocationId !== "all") return;
    const defaultLocation = locations[0];
    if (defaultLocation) {
      setSelectedLocationId(defaultLocation.id);
    }
  }, [locations, selectedLocationId]);

  const selectedCustomer =
    selectedCustomerId === "walk-in"
      ? null
      : (customers.find((customer) => customer.id === selectedCustomerId) ??
        null);

  const selectedLocation =
    locations.find((location) => location.id === selectedLocationId) ??
    locations[0] ??
    null;

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      counts.set(
        product.categoryName || "Uncategorized",
        (counts.get(product.categoryName || "Uncategorized") ?? 0) + 1,
      );
    }

    return [
      { id: "all", label: "All products", count: products.length },
      ...Array.from(counts.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([label, count]) => ({
          id: label,
          label,
          count,
        })),
    ];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory =
        category === "all" || product.categoryName === category;
      const matchesQuery =
        !query ||
        [
          product.name,
          product.sku,
          product.barcode,
          product.brandName,
          product.categoryName,
        ]
          .filter(Boolean)
          .filter((value): value is string => Boolean(value))
          .some((value) => value.toLowerCase().includes(query));
      return matchesCategory && matchesQuery;
    });
  }, [category, products, searchQuery]);

  const cartSubtotal = useMemo(
    () =>
      cart.reduce(
        (sum, line) =>
          sum + Number(line.product.defaultSellingPrice || 0) * line.quantity,
        0,
      ),
    [cart],
  );

  const taxTotal = useMemo(() => {
    if (settings?.disableOrderTax) return 0;
    return cart.reduce((sum, line) => {
      const base =
        Number(line.product.defaultSellingPrice || 0) * line.quantity;
      const rate = normalizeTaxRate(Number(line.product.taxRate || 0));
      return sum + base * rate;
    }, 0);
  }, [cart, settings?.disableOrderTax]);

  const discountTotal = settings?.disableDiscount ? 0 : 0;
  const grandTotal = cartSubtotal + taxTotal - discountTotal;
  const amountPaid = Number(tendered || 0);
  const changeDue = Math.max(amountPaid - grandTotal, 0);
  const dueAmount = Math.max(grandTotal - amountPaid, 0);

  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const quickMethods = [
    { key: "cash", label: "Cash", icon: Banknote },
    { key: "card", label: "Card", icon: CreditCard },
    { key: "wallet", label: "Wallet", icon: Wallet },
    { key: "scan", label: "Scan", icon: Scan },
  ];

  const activeSettings = [
    { label: "Express", enabled: !settings?.disableExpressCheckout },
    { label: "Discount", enabled: !settings?.disableDiscount },
    { label: "Tax", enabled: !settings?.disableOrderTax },
    { label: "Draft", enabled: !settings?.disableDraft },
    { label: "Suspend", enabled: !settings?.disableSuspendSale },
    { label: "Multiple Pay", enabled: !settings?.disableMultiplePay },
  ];

  const addToCart = (product: ProductListItem) => {
    setCart((current) => {
      const existing = current.find((line) => line.product.id === product.id);
      if (existing) {
        return current.map((line) =>
          line.product.id === product.id
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        );
      }
      return [...current, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((current) =>
      current
        .map((line) =>
          line.product.id === productId
            ? { ...line, quantity: Math.max(line.quantity + delta, 0) }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  };

  const removeLine = (productId: string) => {
    setCart((current) =>
      current.filter((line) => line.product.id !== productId),
    );
  };

  const clearCart = () => setCart([]);

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast("Add at least one item before checkout.");
      return;
    }

    toast.success("Checkout prepared. Wire this screen to the sales API next.");
  };

  const handleSuspend = () => {
    if (settings?.disableSuspendSale) {
      toast("Suspend sale is disabled for this register.");
      return;
    }
    toast.success("Sale suspended locally.");
  };

  const handleCopySummary = async () => {
    try {
      const payload = [
        `Customer: ${selectedCustomer?.name ?? "Walk-in Customer"}`,
        `Location: ${selectedLocation?.locationName ?? "Default register"}`,
        `Items: ${cartCount}`,
        `Total: KSh ${formatMoney(grandTotal)}`,
      ].join("\n");
      await navigator.clipboard.writeText(payload);
      toast.success("Sale summary copied.");
    } catch {
      toast.error("Could not copy summary.");
    }
  };

  const now = new Date();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.12),_transparent_30%),linear-gradient(180deg,#f8fafc_0%,#f4efe6_100%)]">
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1800px] flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8">
        <header className="rounded-[2rem] border border-white/70 bg-white/80 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-start gap-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="mt-1 rounded-2xl border border-slate-200 bg-white p-3 text-slate-700 transition-colors hover:border-slate-900 hover:text-slate-950"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Point of Sale
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
                      Cash Register Workspace
                    </h1>
                  </div>
                  <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Live register
                  </div>
                </div>

                <p className="max-w-3xl text-sm text-slate-600">
                  A focused checkout layout for fast selling, product lookup,
                  and clean payment handling. Built for counters, cashiers, and
                  high-volume service.
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <StatPill
                    label="Register"
                    value={selectedLocation?.locationName ?? "Main counter"}
                    icon={MapPin}
                  />
                  <StatPill
                    label="Cashier"
                    value={selectedCustomer?.name ?? "Walk-in customer"}
                    icon={User}
                  />
                  <StatPill
                    label="Items"
                    value={`${cartCount} in cart`}
                    icon={ShoppingCart}
                  />
                  <StatPill
                    label="Time"
                    value={now.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    icon={Clock}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:w-[460px]">
              <div className="rounded-2xl border border-slate-200 bg-slate-950 px-4 py-3 text-white shadow-lg shadow-slate-950/20">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Current total
                    </p>
                    <p className="mt-1 text-2xl font-semibold">
                      KSh {formatMoney(grandTotal)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3">
                    <Receipt className="h-5 w-5" />
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={handleCheckout}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                >
                  <Zap className="h-4 w-4" />
                  Checkout
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSuspend}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-900 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={settings?.disableSuspendSale}
                  >
                    <History className="h-4 w-4" />
                    Suspend
                  </button>
                  <button
                    type="button"
                    onClick={clearCart}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-rose-300 hover:text-rose-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {(productsError || customersError || locationsError) && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">
                  Some POS data could not be loaded
                </p>
                <p className="mt-1">
                  {productsError || customersError || locationsError}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearError();
                  clearCustomersError();
                  clearLocationsError();
                }}
                className="ml-auto rounded-lg px-2 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div className="grid flex-1 gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)]">
          <section className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <SectionTitle
              eyebrow="Catalog"
              title="Find products fast"
              description="Search, filter, and add items in one motion."
              icon={Grid}
            />

            <div className="mt-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
                <label className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search products, SKU, barcode, or brand"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-900 focus:bg-white"
                  />
                </label>

                <button
                  type="button"
                  className="inline-flex h-12 items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-white"
                >
                  <span className="inline-flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Smart filter
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {categories.map((item) => (
                  <ChipButton
                    key={item.id}
                    active={category === item.id}
                    onClick={() => setCategory(item.id)}
                  >
                    {item.label}
                    <span className="ml-1.5 rounded-full bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold">
                      {item.count}
                    </span>
                  </ChipButton>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                {productsLoading && filteredProducts.length === 0 ? (
                  <div className="col-span-full flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50">
                    <div className="text-center text-sm text-slate-500">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400" />
                      <p className="mt-3 font-medium">Loading products...</p>
                    </div>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="col-span-full flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50">
                    <div className="text-center text-sm text-slate-500">
                      <Package className="mx-auto h-5 w-5 text-slate-400" />
                      <p className="mt-3 font-medium">No matching products.</p>
                      <p className="mt-1">
                        Try a different search or switch categories.
                      </p>
                    </div>
                  </div>
                ) : (
                  filteredProducts.slice(0, 18).map((product) => {
                    const isInCart = cart.some(
                      (line) => line.product.id === product.id,
                    );
                    return (
                      <article
                        key={product.id}
                        className="group overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl"
                      >
                        <div
                          className={`relative h-32 bg-gradient-to-br ${getProductColor(
                            product.name,
                          )}`}
                        >
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.34),transparent_40%)]" />
                          <div className="flex h-full items-end justify-between p-4 text-white">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/75">
                                {product.categoryName || "Uncategorized"}
                              </p>
                              <h3 className="mt-1 line-clamp-2 text-sm font-semibold">
                                {product.name}
                              </h3>
                            </div>
                            <div className="rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-lg font-semibold uppercase tracking-widest">
                              {getInitials(product.name) || "P"}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-medium text-slate-500">
                                SKU {product.sku || "N/A"}
                              </p>
                              <p className="mt-1 text-lg font-semibold text-slate-950">
                                KSh {formatMoney(product.defaultSellingPrice)}
                              </p>
                            </div>
                            <div className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                              Stock {product.currentStock}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <Tag className="h-3.5 w-3.5" />
                              {product.brandName || "No brand"}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Shield className="h-3.5 w-3.5" />
                              {product.taxType || "none"} tax
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => addToCart(product)}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                          >
                            {isInCart ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Plus className="h-4 w-4" />
                            )}
                            {isInCart ? "Added to ticket" : "Add to ticket"}
                          </button>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          </section>

          <section className="flex min-h-0 flex-col gap-5 rounded-[2rem] border border-slate-200/70 bg-white/90 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <SectionTitle
              eyebrow="Ticket"
              title="Active sale"
              description="Build the current sale and keep the cashier flow tight."
              icon={ShoppingCart}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Customer
                </span>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select
                    value={selectedCustomerId}
                    onChange={(event) =>
                      setSelectedCustomerId(event.target.value)
                    }
                    className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                  >
                    <option value="walk-in">Walk-in customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </label>

              <label className="space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Register
                </span>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select
                    value={selectedLocationId}
                    onChange={(event) =>
                      setSelectedLocationId(event.target.value)
                    }
                    className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                  >
                    <option value="all">Default register</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.locationName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </label>
            </div>

            <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
              {quickMethods.map((method) => {
                const Icon = method.icon;
                const active = paymentMethod === method.key;
                return (
                  <button
                    key={method.key}
                    type="button"
                    onClick={() => setPaymentMethod(method.key)}
                    className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-slate-950 text-white shadow-sm"
                        : "bg-transparent text-slate-600 hover:bg-white hover:text-slate-950"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {method.label}
                  </button>
                );
              })}
            </div>

            <div className="min-h-0 flex-1 overflow-hidden rounded-[1.5rem] border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Ticket lines
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {cart.length} items in the current sale
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-900 hover:text-slate-950"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy summary
                </button>
              </div>

              <div className="max-h-[450px] overflow-y-auto p-3">
                {cart.length === 0 ? (
                  <div className="flex min-h-[260px] items-center justify-center rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50">
                    <div className="text-center text-sm text-slate-500">
                      <ShoppingCart className="mx-auto h-6 w-6 text-slate-400" />
                      <p className="mt-3 font-medium">No items in the cart.</p>
                      <p className="mt-1">
                        Pick products from the catalog to begin.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((line) => (
                      <div
                        key={line.product.id}
                        className="rounded-[1.25rem] border border-slate-200 bg-white p-3 shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${getProductColor(
                              line.product.name,
                            )} text-lg font-semibold text-white`}
                          >
                            {getInitials(line.product.name) || "P"}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="truncate text-sm font-semibold text-slate-950">
                                  {line.product.name}
                                </h3>
                                <p className="mt-1 text-xs text-slate-500">
                                  {line.product.sku || "No SKU"} · Stock{" "}
                                  {line.product.currentStock}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeLine(line.product.id)}
                                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                              <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600">
                                KSh{" "}
                                {formatMoney(line.product.defaultSellingPrice)}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateQuantity(line.product.id, -1)
                                  }
                                  className="rounded-full border border-slate-200 p-2 text-slate-700 hover:border-slate-900 hover:text-slate-950"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                                <span className="min-w-10 rounded-full bg-slate-950 px-3 py-1.5 text-center text-sm font-semibold text-white">
                                  {line.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateQuantity(line.product.id, 1)
                                  }
                                  className="rounded-full border border-slate-200 p-2 text-slate-700 hover:border-slate-900 hover:text-slate-950"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-950 p-4 text-white shadow-lg shadow-slate-950/20">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Subtotal
                  </p>
                  <p className="mt-1 text-lg font-semibold">
                    KSh {formatMoney(cartSubtotal)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Tax
                  </p>
                  <p className="mt-1 text-lg font-semibold">
                    KSh {formatMoney(taxTotal)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Due
                  </p>
                  <p className="mt-1 text-lg font-semibold">
                    KSh {formatMoney(dueAmount)}
                  </p>
                </div>
              </div>
              <label className="mt-4 block space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Note
                </span>
                <textarea
                  value={saleNote}
                  onChange={(event) => setSaleNote(event.target.value)}
                  placeholder="Add a quick note for this sale..."
                  className="min-h-24 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-400 focus:border-white/30"
                />
              </label>
            </div>
          </section>

        </div>

        <footer className="pb-2 text-center text-xs text-slate-500">
          Fast checkout, accurate totals, and a register-first workflow.
        </footer>
      </div>
    </div>
  );
}
