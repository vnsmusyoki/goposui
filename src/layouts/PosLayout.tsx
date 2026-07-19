import {
  useState,
  useEffect,
  useRef,
  useMemo,
  type ComponentType,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ShoppingCart,
  CreditCard,
  Calculator,
  User,
  Package,
  Plus,
  Minus,
  Trash2,
  X,
  Check,
  ChevronRight,
  Printer,
  Users,
  Clock,
  Loader2,
  Coins,
  Banknote,
  History,
  Settings,
  LogOut,
  ChevronDown,
  LayoutGrid,
  BarChart3,
  UtensilsCrossed,
  HelpCircle,
  Crown,
  Soup,
  Salad,
  Beef,
  GlassWater,
  Sandwich,
  Table2,
  Edit3,
  Lock,
  Monitor,
  Sun,
  Moon,
} from "lucide-react";
import { useAuthStore } from "../auth/authStore";
import { useBusinessCurrency } from "@/business/businessStore";
import { usePosSettings } from "@/hooks/business/settings/usePosSettings";
import { useTheme } from "@/theme/ThemeProvider";

// ============================================
// TYPES
// ============================================

export interface PosProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  priceRules?: PosProductPriceRule[];
  cost: number;
  stock: number;
  category: string;
  brand: string;
  image: string;
  status: "active" | "inactive" | "draft";
  barcode: string;
  weight?: number;
  dimensions?: string;
  tax_rate?: number;
}

export interface PosProductPriceRule {
  id: string;
  priceType: "retail" | "wholesale" | "tier" | "location" | "promotion" | "customer_group";
  minQuantity: number;
  price: number;
  locationId?: string;
  customerGroup?: string;
  startsAt?: string;
  endsAt?: string;
  active: boolean;
  priority: number;
}

export type PosCategoryFilter = {
  id: string;
  label: string;
  count: number;
};

interface CartItem {
  id: string;
  product_id: string;
  name: string;
  sku: string;
  brand: string;
  quantity: number;
  price: number;
  total: number;
  image: string;
  tax_rate: number;
  stock: number;
}

export interface PosCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  loyalty_points: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
  total_orders: number;
  total_spent: number;
}

interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  payment_method: string;
  payment_status: "paid" | "unpaid" | "refunded";
  customer?: PosCustomer;
  created_at: string;
  status: "pending" | "completed" | "cancelled";
  notes?: string;
}

interface QueueItem {
  id: string;
  customer_name: string;
  order_id?: string;
  status: "waiting" | "serving" | "completed" | "cancelled";
  position: number;
  estimated_time: number;
  created_at: string;
}

const CATEGORY_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  All: LayoutGrid,
  "Main Course": Beef,
  Appetizer: Sandwich,
  Soups: Soup,
  Salads: Salad,
  Drinks: GlassWater,
};

type ChargeEditor = {
  label: string;
  value: number;
  setter: (next: number) => void;
} | null;

type PosLayoutProps = {
  products?: PosProduct[];
  categories?: PosCategoryFilter[];
  customers?: PosCustomer[];
  productsLoading?: boolean;
  productsError?: string | null;
  mpesaStkPushEnabled?: boolean;
  activeRegister?: {
    id: string;
    registerNumber?: string;
    openedAt?: string;
    openingCashAmount?: number;
    expectedClosingCashAmount?: number;
  } | null;
  businessLocationName?: string;
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

const getTierColor = (tier: string): string => {
  const colors: Record<string, string> = {
    bronze: "bg-warning",
    silver: "bg-muted",
    gold: "bg-primary",
    platinum: "bg-info",
  };
  return colors[tier] || "bg-muted";
};

// ============================================
// MAIN POS COMPONENT
// ============================================

const PosLayout = ({
  products = [],
  categories = [{ id: "All", label: "All", count: 0 }],
  customers = [],
  productsLoading = false,
  productsError = null,
  mpesaStkPushEnabled = false,
  activeRegister = null,
  businessLocationName = "",
}: PosLayoutProps) => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const { formatCurrency } = useBusinessCurrency();
  const { settings } = usePosSettings();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id ?? "All");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [pricingMode, setPricingMode] = useState<"retail" | "wholesale">("retail");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<PosCustomer | null>(
    null,
  );
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showClearCartModal, setShowClearCartModal] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "card" | "mobile" | "gift"
  >("card");
  const [cashAmount, setCashAmount] = useState<number | null>(null);
  const [orderNotes, setOrderNotes] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxOverride, setTaxOverride] = useState<number | null>(null);
  const [shippingCharge, setShippingCharge] = useState(0);
  const [packingCharge, setPackingCharge] = useState(0);
  const [chargeEditor, setChargeEditor] = useState<ChargeEditor>(null);
  const [chargeEditValue, setChargeEditValue] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [showRegisterDetails, setShowRegisterDetails] = useState(false);
  const [manageDishOpen, setManageDishOpen] = useState(true);
  const [barcodeInput, setBarcodeInput] = useState("");

  const cartRef = useRef<HTMLDivElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!mpesaStkPushEnabled && paymentMethod === "mobile") {
      setPaymentMethod("cash");
    }
  }, [mpesaStkPushEnabled, paymentMethod]);

  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.total, 0),
    [cart],
  );
  const cartTax = useMemo(
    () =>
      cart.reduce((sum, item) => sum + item.total * (item.tax_rate || 0.08), 0),
    [cart],
  );
  const effectiveTax = taxOverride ?? cartTax;
  const cartDiscount = useMemo(
    () =>
      Math.min(
        discountAmount,
        cartSubtotal + effectiveTax + shippingCharge + packingCharge,
      ),
    [cartSubtotal, effectiveTax, discountAmount, shippingCharge, packingCharge],
  );
  const cartTotal = useMemo(
    () =>
      Math.max(
        0,
        cartSubtotal + effectiveTax + shippingCharge + packingCharge - cartDiscount,
      ),
    [cartSubtotal, cartDiscount, effectiveTax, shippingCharge, packingCharge],
  );

  const filteredCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) {
      return customers;
    }

    const query = customerSearchQuery.toLowerCase();
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        customer.phone.toLowerCase().includes(query),
    );
  }, [customerSearchQuery, customers]);

  const filteredProducts = useMemo(() => {
    let visibleProducts = products;
    if (selectedCategory !== "All") {
      visibleProducts = visibleProducts.filter((p) => p.category === selectedCategory);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      visibleProducts = visibleProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query) ||
          p.barcode.includes(query) ||
          p.brand.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query),
      );
    }
    return visibleProducts;
  }, [products, searchQuery, selectedCategory]);

  const getProductPrice = (product: PosProduct, quantity = 1) => {
    const now = Date.now();
    const activeRules = (product.priceRules ?? []).filter((rule) => {
      if (!rule.active || rule.price <= 0 || rule.minQuantity > quantity) {
        return false;
      }
      if (rule.startsAt && new Date(rule.startsAt).getTime() > now) {
        return false;
      }
      if (rule.endsAt && new Date(rule.endsAt).getTime() < now) {
        return false;
      }
      return true;
    });

    const automaticQuantityRule = activeRules
      .filter((rule) => ["wholesale", "tier"].includes(rule.priceType))
      .sort((a, b) => b.minQuantity - a.minQuantity || a.priority - b.priority)[0];

    if (automaticQuantityRule) {
      return automaticQuantityRule.price;
    }

    const selectedModeRule = activeRules
      .filter((rule) => {
        if (pricingMode === "retail" && rule.priceType !== "retail") {
          return false;
        }
        if (pricingMode === "wholesale" && !["wholesale", "tier"].includes(rule.priceType)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.priority - b.priority || b.minQuantity - a.minQuantity);

    return selectedModeRule[0]?.price ?? product.price;
  };

  useEffect(() => {
    setCart((currentCart) =>
      currentCart.map((item) => {
        const product = products.find((candidate) => candidate.id === item.product_id);
        if (!product) {
          return item;
        }
        const nextPrice = getProductPrice(product, item.quantity);
        return {
          ...item,
          price: nextPrice,
          total: nextPrice * item.quantity,
        };
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pricingMode, products]);

  const toast = {
    success: (message: string) => console.log("✅", message),
    info: (message: string) => console.log("ℹ️", message),
    error: (message: string) => console.log("❌", message),
  };

  const handleOpenChargeEditor = (
    label: string,
    value: number,
    setter: (next: number) => void,
  ) => {
    setChargeEditor({ label, value, setter });
    setChargeEditValue(value.toFixed(2));
  };

  const handleSaveCharge = () => {
    if (!chargeEditor) {
      return;
    }

    const nextValue = Number.parseFloat(chargeEditValue);
    if (Number.isNaN(nextValue) || nextValue < 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    chargeEditor.setter(nextValue);
    setChargeEditor(null);
    setChargeEditValue("");
  };

  useEffect(() => {
    if (categories.some((category) => category.id === selectedCategory)) {
      return;
    }

    setSelectedCategory(categories[0]?.id ?? "All");
  }, [categories, selectedCategory]);

  const handleAddToCart = (product: PosProduct) => {
    const availableQuantity = Math.max(0, product.stock);
    if (availableQuantity <= 0) {
      toast.error("This product has no available quantity.");
      return;
    }

    const existingItem = cart.find((item) => item.product_id === product.id);
    if (existingItem) {
      if (existingItem.quantity >= availableQuantity) {
        toast.error("Cannot add more than the available quantity.");
        return;
      }

      setCart(
        cart.map((item) =>
          item.product_id === product.id
            ? (() => {
                const nextQuantity = item.quantity + 1;
                const nextPrice = getProductPrice(product, nextQuantity);
                return {
                  ...item,
                  quantity: nextQuantity,
                  price: nextPrice,
                  total: nextQuantity * nextPrice,
                };
              })()
            : item,
        ),
      );
    } else {
      const productPrice = getProductPrice(product, 1);
      setCart([
        ...cart,
        {
          id: `cart_${Date.now()}`,
          product_id: product.id,
          name: product.name,
          sku: product.sku,
          brand: product.brand,
          quantity: 1,
          price: productPrice,
          total: productPrice,
          image: product.image,
          tax_rate: product.tax_rate || 0.08,
          stock: availableQuantity,
        },
      ]);
    }
    setTimeout(() => {
      cartRef.current?.scrollTo({
        top: cartRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 100);
  };

  const handleUpdateQuantity = (itemId: string, change: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.id === itemId) {
            const newQuantity = Math.max(0, item.quantity + change);
            if (newQuantity === 0) return null;
            if (newQuantity > item.stock) {
              toast.error("Cannot add more than the available quantity.");
              return item;
            }
            const product = products.find((candidate) => candidate.id === item.product_id);
            const nextPrice = product ? getProductPrice(product, newQuantity) : item.price;
            return {
              ...item,
              quantity: newQuantity,
              price: nextPrice,
              total: newQuantity * nextPrice,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[],
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setCart(cart.filter((item) => item.id !== itemId));
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    setShowClearCartModal(true);
  };

  const handleConfirmClearCart = () => {
    setCart([]);
    setOrderNotes("");
    setDiscountAmount(0);
    setTaxOverride(null);
    setShippingCharge(0);
    setPackingCharge(0);
    setCashAmount(null);
    setShowPaymentModal(false);
    setShowClearCartModal(false);
  };

  const handleBarcodeScan = (barcode: string) => {
    const product = products.find((p) => p.barcode === barcode);
    if (product) {
      handleAddToCart(product);
      setBarcodeInput("");
    } else {
      toast.error("Product not found with this barcode.");
    }
  };

  const handleProcessPayment = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty. Add items before processing payment.");
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = () => {
    setIsLoading(true);
    const order: Order = {
      id: `ORD-${Date.now()}`,
      items: cart,
      subtotal: cartSubtotal,
      tax: effectiveTax,
      discount: cartDiscount,
      total: cartTotal,
      payment_method: paymentMethod,
      payment_status: "paid",
      customer: selectedCustomer || undefined,
      created_at: new Date().toISOString(),
      status: "completed",
      notes: orderNotes || undefined,
    };
    setCurrentOrder(order);
    setCompletedOrders((orders) => [order, ...orders]);

    setTimeout(() => {
      setIsLoading(false);
      setShowPaymentModal(false);
      setShowReceipt(true);
      setCart([]);
      setOrderNotes("");
      setSelectedCustomer(null);
    }, 1200);
  };

  const handleServeNext = () => {
    const nextWaiting = queueItems.find((item) => item.status === "waiting");
    if (nextWaiting) {
      setQueueItems(
        queueItems.map((item) =>
          item.id === nextWaiting.id ? { ...item, status: "serving" } : item,
        ),
      );
      toast.success(`Now serving ${nextWaiting.customer_name}`);
    } else {
      toast.info("No customers waiting in queue");
    }
  };

  const handleCompleteQueueItem = (itemId: string) => {
    setQueueItems(
      queueItems.map((item) =>
        item.id === itemId ? { ...item, status: "completed" } : item,
      ),
    );
  };

  const handleCancelQueueItem = (itemId: string) => {
    if (window.confirm("Cancel this queue item?")) {
      setQueueItems(queueItems.filter((item) => item.id !== itemId));
    }
  };

  const handleSelectCustomer = (customer: PosCustomer) => {
    setSelectedCustomer(customer);
    setShowCustomerSearch(false);
    setCustomerSearchQuery("");
  };

  const handleHoldSale = () => {
    toast.info("Sale held. Hook this to the backend next.");
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      toast.error("Unable to log out right now.");
    } finally {
      navigate("/login", { replace: true });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "b") {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      }
      if (e.ctrlKey && e.key === "q") {
        e.preventDefault();
        setShowQueue((v) => !v);
      }
      if (e.key === "Escape") {
        setSearchQuery("");
        barcodeInputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (barcodeInput.length > 5) {
      handleBarcodeScan(barcodeInput);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barcodeInput]);

  const queueStats = {
    waiting: queueItems.filter((i) => i.status === "waiting").length,
    serving: queueItems.filter((i) => i.status === "serving").length,
    completed: queueItems.filter((i) => i.status === "completed").length,
  };

  
  const registerOpenedAt = activeRegister?.openedAt ?? new Date().toISOString();
  const formatRegisterDate = (value?: string) =>
    new Intl.DateTimeFormat(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(value ? new Date(value) : new Date());
  const registerLineItems = useMemo(() => {
    const rows = new Map<
      string,
      { sku: string; product: string; brand: string; quantity: number; total: number }
    >();

    for (const order of completedOrders) {
      for (const item of order.items) {
        const existing = rows.get(item.product_id);
        if (existing) {
          existing.quantity += item.quantity;
          existing.total += item.total;
        } else {
          rows.set(item.product_id, {
            sku: item.sku || "--",
            product: item.name,
            brand: item.brand || "Unbranded",
            quantity: item.quantity,
            total: item.total,
          });
        }
      }
    }

    return Array.from(rows.values());
  }, [completedOrders]);
  const registerBrandRows = useMemo(() => {
    const rows = new Map<string, { brand: string; quantity: number; total: number }>();

    for (const item of registerLineItems) {
      const existing = rows.get(item.brand);
      if (existing) {
        existing.quantity += item.quantity;
        existing.total += item.total;
      } else {
        rows.set(item.brand, {
          brand: item.brand,
          quantity: item.quantity,
          total: item.total,
        });
      }
    }

    return Array.from(rows.values());
  }, [registerLineItems]);
  const registerPaymentTotals = useMemo(() => {
    return completedOrders.reduce(
      (totals, order) => {
        if (order.payment_status !== "paid") {
          return totals;
        }
        const key =
          order.payment_method === "mobile"
            ? "mpesa"
            : order.payment_method === "gift"
              ? "other"
              : order.payment_method;
        totals[key as keyof typeof totals] += order.total;
        return totals;
      },
      {
        cash: 0,
        card: 0,
        mpesa: 0,
        other: 0,
      },
    );
  }, [completedOrders]);
  const openingCashAmount = Number(activeRegister?.openingCashAmount ?? 0);
  const registerTotalSales = completedOrders.reduce(
    (sum, order) => sum + (order.payment_status === "paid" ? order.total : 0),
    0,
  );
  const registerTotalRefund = completedOrders.reduce(
    (sum, order) => sum + (order.payment_status === "refunded" ? order.total : 0),
    0,
  );
  const registerTotalExpense = 0;
  const registerTotalQuantity = registerLineItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const registerTotalPayments =
    openingCashAmount +
    registerPaymentTotals.cash +
    registerPaymentTotals.card +
    registerPaymentTotals.mpesa +
    registerPaymentTotals.other;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <header className="shrink-0 border-b border-border bg-surface/95 text-foreground backdrop-blur">
        <div className="mx-auto w-full px-4 py-2 lg:px-6">
          <div className="flex w-full items-center justify-end">
            <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5">
              <div className="inline-flex h-10 shrink-0 items-center rounded-full border border-primary/25 bg-primary/10 p-1">
                {(["retail", "wholesale"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPricingMode(mode)}
                    className={`h-8 rounded-full px-3 text-[11px] font-semibold capitalize transition-colors ${
                      pricingMode === mode
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowQueue(true)}
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-[11px] font-medium text-muted-foreground shadow-none transition-colors hover:border-primary/30 hover:bg-surface-alt hover:text-foreground"
              >
                <History className="h-3.5 w-3.5" />
                Sale Return
              </button>
              <button
                type="button"
                onClick={() => setShowQueue(true)}
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-[11px] font-medium text-muted-foreground shadow-none transition-colors hover:border-primary/30 hover:bg-surface-alt hover:text-foreground"
              >
                <History className="h-3.5 w-3.5" />
                Recent Order
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-[11px] font-medium text-muted-foreground shadow-none transition-colors hover:border-primary/30 hover:bg-surface-alt hover:text-foreground"
              >
                <LogOut className="h-3.5 w-3.5" />
                Exit POS
              </button>
              <button
                type="button"
                onClick={() => setShowRegisterDetails(true)}
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-[11px] font-medium text-muted-foreground shadow-none transition-colors hover:border-primary/30 hover:bg-surface-alt hover:text-foreground"
              >
                <Lock className="h-3.5 w-3.5" />
                Cash Register
              </button>
              <button
                type="button"
                onClick={() => toast.info("Calculator will be wired next.")}
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-[11px] font-medium text-muted-foreground shadow-none transition-colors hover:border-primary/30 hover:bg-surface-alt hover:text-foreground"
              >
                <Calculator className="h-3.5 w-3.5" />
                Calculator
              </button>
              <button
                type="button"
                onClick={() => toast.info("Monitor will be wired next.")}
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-[11px] font-medium text-muted-foreground shadow-none transition-colors hover:border-primary/30 hover:bg-surface-alt hover:text-foreground"
              >
                <Monitor className="h-3.5 w-3.5" />
                Monitor
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-[11px] font-medium text-muted-foreground shadow-none transition-colors hover:border-primary/30 hover:bg-surface-alt hover:text-foreground"
              >
                {resolvedTheme === "dark" ? (
                  <Sun className="h-3.5 w-3.5" />
                ) : (
                  <Moon className="h-3.5 w-3.5" />
                )}
                Theme
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-[11px] font-medium text-muted-foreground shadow-none transition-colors hover:border-primary/30 hover:bg-surface-alt hover:text-foreground"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 overflow-hidden">
        {/* ================= CENTER: ORDER LINE + MENU ================= */}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col px-5 py-4 lg:px-8">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Look for the menu you're looking for"
              className="h-11 w-full rounded-full border border-border bg-surface pl-11 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <input
              ref={barcodeInputRef}
              type="text"
              className="sr-only"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              aria-label="Scan barcode"
            />
          </div>

          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
            {categories.map((category) => {
              const Icon = CATEGORY_ICONS[category.label] ?? LayoutGrid;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category.id)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface text-muted-foreground border border-border hover:border-primary/30"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {category.label}
                  <span className="rounded-full bg-current/10 px-1.5 py-0.5 text-[10px] font-semibold">
                    {category.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1 pb-4">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6">
              {productsLoading && filteredProducts.length === 0 ? (
                <div className="col-span-full rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    Loading products
                  </p>
                </div>
              ) : productsError ? (
                <div className="col-span-full rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
                  <Package className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    Unable to load products
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {productsError}
                  </p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="col-span-full rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
                  <Package className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    No products found
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Try a different search or category.
                  </p>
                </div>
              ) : (
                filteredProducts.map((product) => {
                  const cartLine = cart.find(
                    (item) => item.product_id === product.id,
                  );
                  const inCart = Boolean(cartLine);
                  const availableQuantity = Math.max(0, product.stock);
                  const quantityReached =
                    availableQuantity <= 0 ||
                    (cartLine?.quantity ?? 0) >= availableQuantity;
                  const displayPrice = getProductPrice(product, Math.max(1, cartLine?.quantity ?? 1));
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleAddToCart(product)}
                      disabled={quantityReached}
                      title={
                        quantityReached
                          ? "Available quantity reached"
                          : `Add ${product.name}`
                      }
                      className={`group overflow-hidden rounded-[1.25rem] border bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-sm ${
                        inCart
                      ? "border-primary ring-1 ring-primary/20"
                      : "border-border hover:border-primary/30"
                      }`}
                    >
                      <div className="relative h-16 overflow-hidden bg-surface-alt sm:h-20">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-foreground/15 to-transparent" />
                      </div>
                      <div className="space-y-1.5 p-2.5 sm:p-3">
                        <p className="truncate text-[13px] font-semibold text-foreground">
                          {product.name}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {product.brand || "Unbranded"} · {product.category}
                        </p>
                        <p
                          className={`text-[11px] font-medium ${
                            availableQuantity > 0
                              ? "text-muted-foreground"
                              : "text-destructive"
                          }`}
                        >
                          Stock available: {availableQuantity}
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-primary">
                            {formatCurrency(displayPrice)}
                          </span>
                          <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full shadow-sm ${
                            quantityReached
                              ? "bg-muted text-muted-foreground"
                              : "bg-success text-success-foreground shadow-success/20"
                          }`}>
                            <Plus className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          ) : (
            <div className="overflow-hidden rounded-[1.5rem] border border-border bg-surface shadow-sm">
              <div className="grid grid-cols-[minmax(0,1.4fr)_120px_110px_110px_92px] gap-3 border-b border-border bg-surface px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <span>Product</span>
                <span>Brand</span>
                <span>Price</span>
                <span>Stock</span>
                <span className="text-right">Action</span>
              </div>
              <div className="max-h-[520px] overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <div className="p-10 text-center">
                    <Package className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-3 text-sm font-semibold text-foreground">
                      No products found
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Try a different search or category.
                    </p>
                  </div>
                ) : (
                  filteredProducts.map((product) => {
                    const cartLine = cart.find(
                      (item) => item.product_id === product.id,
                    );
                    const inCart = Boolean(cartLine);
                    const availableQuantity = Math.max(0, product.stock);
                    const quantityReached =
                      availableQuantity <= 0 ||
                      (cartLine?.quantity ?? 0) >= availableQuantity;
                    const displayPrice = getProductPrice(product, Math.max(1, cartLine?.quantity ?? 1));
                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        disabled={quantityReached}
                        title={
                          quantityReached
                            ? "Available quantity reached"
                            : `Add ${product.name}`
                        }
                        className={`grid w-full grid-cols-[minmax(0,1.4fr)_120px_110px_110px_92px] items-center gap-3 border-t border-border px-4 py-3 text-left transition-colors hover:bg-surface-alt/40 disabled:cursor-not-allowed disabled:opacity-60 ${
                          inCart ? "bg-primary/10" : "bg-surface"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-surface-alt">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {product.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {product.category}
                            </p>
                          </div>
                        </div>
                        <span className="truncate text-sm text-muted-foreground">
                          {product.brand || "Unbranded"}
                        </span>
                        <span className="text-sm font-semibold text-primary">
                          {formatCurrency(displayPrice)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {product.stock}
                        </span>
                        <span className="flex justify-end">
                          <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full shadow-sm ${
                            quantityReached
                              ? "bg-muted text-muted-foreground"
                              : "bg-success text-success-foreground shadow-success/20"
                          }`}>
                            <Plus className="h-3.5 w-3.5" />
                          </span>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
          </div>
        </main>

        {/* ================= RIGHT: PREPARED ORDER ================= */}
        <aside className="flex w-[320px] shrink-0 flex-col border-l border-border bg-surface px-4 py-4 sm:w-[360px] lg:px-5 lg:py-6">
          <div className="shrink-0">
            <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
                Customer
              </p>
              <h2 className="mt-1 text-lg font-bold text-foreground">
                Walk in customer
              </h2>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowCustomerSearch((current) => !current)}
                className="rounded-full border border-border p-2 text-muted-foreground hover:border-primary/30 hover:text-primary"
                title="Search customer"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
            </div>

            {selectedCustomer ? (
              <div className="mt-3 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${getTierColor(selectedCustomer.tier)}`}
                  >
                    {selectedCustomer.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {selectedCustomer.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Linked customer
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              null
            )}
          </div>

          <div
            ref={cartRef}
            className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1"
          >
            {cart.length === 0 ? (
              <div className="flex h-full min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-border text-center">
                <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-semibold text-foreground">
                  No items yet
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Tap a item from the list to add it here.
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-2xl border border-border p-3"
                >
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-surface-alt">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(item.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(item.id, -1)}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-4 text-center text-sm font-semibold text-foreground">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(item.id, 1)}
                      disabled={item.quantity >= item.stock}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-success text-success-foreground disabled:cursor-not-allowed disabled:opacity-40"
                      title={
                        item.quantity >= item.stock
                          ? "Available quantity reached"
                          : "Increase quantity"
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="shrink-0">
          <div className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold text-foreground">
                {formatCurrency(cartSubtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span className="font-semibold text-foreground">
                {formatCurrency(effectiveTax)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Shipping</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">
                  {formatCurrency(shippingCharge)}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleOpenChargeEditor(
                      "Shipping",
                      shippingCharge,
                      setShippingCharge,
                    )
                  }
                  className="text-muted-foreground transition-colors hover:text-primary"
                  title="Edit shipping"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Packing Charge</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">
                  {formatCurrency(packingCharge)}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleOpenChargeEditor(
                      "Packing charge",
                      packingCharge,
                      setPackingCharge,
                    )
                  }
                  className="text-muted-foreground transition-colors hover:text-primary"
                  title="Edit packing charge"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Discount</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-destructive">
                  -{formatCurrency(cartDiscount)}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleOpenChargeEditor(
                      "Discount",
                      discountAmount,
                      setDiscountAmount,
                    )
                  }
                  className="text-muted-foreground transition-colors hover:text-primary"
                  title="Edit discount"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-2 text-base">
              <span className="font-bold text-foreground">Total</span>
              <span className="font-bold text-foreground">
                {formatCurrency(cartTotal)}
              </span>
            </div>
          </div>

          <input
            placeholder="Add a note for the kitchen..."
            className="mt-3 h-10 w-full rounded-xl border border-border bg-surface px-3 text-xs text-foreground outline-none focus:border-primary"
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
          />

          <button
            type="button"
            onClick={handleProcessPayment}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
          >
            <CreditCard className="h-4 w-4" />
            Complete & Print Receipt
          </button>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleClearCart}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border px-4 py-3 text-sm font-medium text-muted-foreground hover:border-destructive/30 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Clear Cart
            </button>
            <button
              type="button"
              onClick={handleHoldSale}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border px-4 py-3 text-sm font-medium text-muted-foreground hover:border-primary/30 hover:text-primary"
            >
              <Clock className="h-4 w-4" />
              Hold Sale
            </button>
          </div>
          </div>
        </aside>
      </div>

      {showCustomerSearch ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm"
          onClick={() => setShowCustomerSearch(false)}
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-border bg-surface p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
                  Customer search
                </p>
                <h3 className="mt-1 text-lg font-bold text-foreground">
                  Link a customer to this sale
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomerSearch(false)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-surface-alt hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={customerSearchQuery}
                onChange={(event) => setCustomerSearchQuery(event.target.value)}
                placeholder="Search customers..."
                className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
                autoFocus
              />
            </div>

            <div className="mt-4 max-h-[55vh] space-y-2 overflow-y-auto pr-1">
              {filteredCustomers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-3 py-10 text-center text-sm text-muted-foreground">
                  No customers found.
                </div>
              ) : (
                filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => handleSelectCustomer(customer)}
                    className="flex w-full items-center gap-3 rounded-xl border border-border px-3 py-3 text-left transition-colors hover:bg-surface-alt"
                  >
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white ${getTierColor(customer.tier)}`}
                    >
                      {customer.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">
                        {customer.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {customer.email}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}

      {showClearCartModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm"
          onClick={() => setShowClearCartModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-foreground">
                  Clear cart?
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  This will remove all cart items and reset the current order
                  charges.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-border bg-background px-3 py-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Items</span>
                <span className="font-semibold text-foreground">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-muted-foreground">Current total</span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(cartTotal)}
                </span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowClearCartModal(false)}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-surface-alt hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearCart}
                className="rounded-xl bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {chargeEditor ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm"
          onClick={() => setChargeEditor(null)}
        >
          <form
            className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              handleSaveCharge();
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
                  Order amount
                </p>
                <h3 className="mt-1 text-lg font-bold text-foreground">
                  Edit {chargeEditor.label}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setChargeEditor(null)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-surface-alt hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <label className="mt-5 block text-sm font-medium text-foreground">
              Amount
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={chargeEditValue}
              onChange={(event) => setChargeEditValue(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
              autoFocus
            />

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setChargeEditor(null)}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-surface-alt hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {showRegisterDetails ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 p-0 backdrop-blur-sm sm:p-4"
          onClick={() => setShowRegisterDetails(false)}
        >
          <section
            className="flex h-[100dvh] w-full flex-col overflow-hidden border border-border bg-card text-card-foreground shadow-2xl sm:h-[92vh] sm:rounded-xl lg:w-[80vw]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border bg-surface-alt/40 px-5 py-4 sm:px-7">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                  Register details
                </p>
                <h2 className="mt-1 text-base font-semibold tracking-tight text-foreground sm:text-lg">
                  Cash register from {formatRegisterDate(registerOpenedAt)} -{" "}
                  {formatRegisterDate()} by {user?.fullName ?? "Current user"}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  {activeRegister?.registerNumber
                    ? `Register ${activeRegister.registerNumber}`
                    : "Active register"}{" "}
                  {businessLocationName ? `at ${businessLocationName}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRegisterDetails(false)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-surface-alt hover:text-foreground"
                aria-label="Close register details"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] overflow-hidden rounded-xl border border-border text-left text-sm text-muted-foreground">
                  <thead className="bg-surface-alt/60">
                    <tr className="border-b border-border text-[11px] uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-3 font-semibold">Payment Method</th>
                      <th className="px-4 py-3 font-semibold">Sell</th>
                      <th className="px-4 py-3 font-semibold">Expense</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Cash in hand:", openingCashAmount, null],
                      ["Cash Payment:", registerPaymentTotals.cash, registerTotalExpense],
                      ["Cheque Payment:", 0, 0],
                      ["Card Payment:", registerPaymentTotals.card, 0],
                      ["Bank Transfer:", 0, 0],
                      ["Advance payment:", 0, 0],
                      ["MPESA:", registerPaymentTotals.mpesa, 0],
                      ["Other Payments:", registerPaymentTotals.other, 0],
                    ].map(([label, sell, expense]) => (
                      <tr key={label as string} className="border-b border-border last:border-b-0">
                        <td className="px-4 py-2.5 font-medium text-foreground">{label}</td>
                        <td className="px-4 py-2.5">{formatCurrency(sell as number)}</td>
                        <td className="px-4 py-2.5">
                          {expense === null ? "--" : formatCurrency(expense as number)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-5">
                <div className="grid overflow-hidden rounded-xl border border-border bg-surface text-sm sm:grid-cols-2">
                  {[
                    ["Total Sales:", registerTotalSales, "border-primary/40"],
                    ["Total Refund", registerTotalRefund, "border-destructive/40"],
                    ["Total Payment", registerTotalPayments, "border-success/40"],
                    ["Credit Sales:", 0, "border-warning/40"],
                    ["Net Sales:", registerTotalSales, "border-success/40"],
                    ["Total Expense:", registerTotalExpense, "border-destructive/40"],
                  ].map(([label, amount, rowClass]) => (
                    <div
                      key={label as string}
                      className={`flex items-center justify-between gap-4 border-b border-l-4 border-border px-4 py-3 even:sm:border-l sm:[&:nth-last-child(-n+2)]:border-b-0 ${rowClass}`}
                    >
                      <span className="text-xs font-medium text-muted-foreground">{label}</span>
                      <span className="text-sm font-semibold text-foreground">
                        {formatCurrency(amount as number)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-7 border-t border-border pt-5">
                <h3 className="text-base font-semibold text-foreground">
                  Details of products sold
                </h3>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[720px] rounded-xl border border-border text-left text-sm text-muted-foreground">
                    <thead className="bg-surface-alt/60">
                      <tr className="border-b border-border text-[11px] uppercase tracking-wide text-muted-foreground">
                        <th className="px-4 py-3 font-semibold">#</th>
                        <th className="px-4 py-3 font-semibold">SKU</th>
                        <th className="px-4 py-3 font-semibold">Product</th>
                        <th className="px-4 py-3 font-semibold">Quantity</th>
                        <th className="px-4 py-3 font-semibold">Total amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registerLineItems.length === 0 ? (
                        <tr className="border-b border-border">
                          <td className="px-4 py-5 text-center" colSpan={5}>
                            No completed sales yet for this POS session.
                          </td>
                        </tr>
                      ) : (
                        registerLineItems.map((item, index) => (
                          <tr key={item.product} className="border-b border-border">
                            <td className="px-4 py-2.5">{index + 1}.</td>
                            <td className="px-4 py-2.5">{item.sku}</td>
                            <td className="px-4 py-2.5 font-medium text-foreground">{item.product}</td>
                            <td className="px-4 py-2.5 font-semibold text-foreground">{item.quantity}</td>
                            <td className="px-4 py-2.5">{formatCurrency(item.total)}</td>
                          </tr>
                        ))
                      )}
                      <tr className="bg-primary/10 font-semibold text-foreground">
                        <td className="px-4 py-2.5">#</td>
                        <td className="px-4 py-2.5" />
                        <td className="px-4 py-2.5" />
                        <td className="px-4 py-2.5">{registerTotalQuantity}</td>
                        <td className="px-4 py-2.5">
                          Grand Total: {formatCurrency(registerTotalSales)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-7 border-t border-border pt-5">
                <h3 className="text-base font-semibold text-foreground">
                  Details of products sold (By Brand)
                </h3>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[620px] rounded-xl border border-border text-left text-sm text-muted-foreground">
                    <thead className="bg-surface-alt/60">
                      <tr className="border-b border-border text-[11px] uppercase tracking-wide text-muted-foreground">
                        <th className="px-4 py-3 font-semibold">#</th>
                        <th className="px-4 py-3 font-semibold">Brands</th>
                        <th className="px-4 py-3 font-semibold">Quantity</th>
                        <th className="px-4 py-3 font-semibold">Total amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registerBrandRows.length === 0 ? (
                        <tr className="border-b border-border">
                          <td className="px-4 py-5 text-center" colSpan={4}>
                            No brand sales to show yet.
                          </td>
                        </tr>
                      ) : (
                        registerBrandRows.map((item, index) => (
                          <tr key={item.brand} className="border-b border-border">
                            <td className="px-4 py-2.5">{index + 1}.</td>
                            <td className="px-4 py-2.5 font-medium text-foreground">{item.brand}</td>
                            <td className="px-4 py-2.5 font-semibold text-foreground">{item.quantity}</td>
                            <td className="px-4 py-2.5">{formatCurrency(item.total)}</td>
                          </tr>
                        ))
                      )}
                      <tr className="bg-primary/10 font-semibold text-foreground">
                        <td className="px-4 py-2.5">#</td>
                        <td className="px-4 py-2.5" />
                        <td className="px-4 py-2.5">{registerTotalQuantity}</td>
                        <td className="px-4 py-2.5">
                          Grand Total: {formatCurrency(registerTotalSales)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-7 border-t border-border pt-5">
                <h3 className="text-base font-semibold text-foreground">
                  Types of service details
                </h3>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[560px] rounded-xl border border-border text-left text-sm text-muted-foreground">
                    <thead className="bg-surface-alt/60">
                      <tr className="border-b border-border text-[11px] uppercase tracking-wide text-muted-foreground">
                        <th className="px-4 py-3 font-semibold">#</th>
                        <th className="px-4 py-3 font-semibold">Types of service</th>
                        <th className="px-4 py-3 font-semibold">Total amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border">
                        <td className="px-4 py-2.5">1</td>
                        <td className="px-4 py-2.5">--</td>
                        <td className="px-4 py-2.5">{formatCurrency(registerTotalSales)}</td>
                      </tr>
                      <tr className="bg-primary/10 font-semibold text-foreground">
                        <td className="px-4 py-2.5">#</td>
                        <td className="px-4 py-2.5" />
                        <td className="px-4 py-2.5">
                          Grand Total: {formatCurrency(registerTotalSales)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-7 rounded-xl border border-border bg-surface-alt/35 p-4 text-sm text-muted-foreground">
                <p>
                  <span className="font-semibold text-foreground">User:</span>{" "}
                  {user?.fullName ?? "Current user"}
                </p>
                <p>
                  <span className="font-semibold text-foreground">Email:</span>{" "}
                  {user?.email ?? "--"}
                </p>
                <p>
                  <span className="font-semibold text-foreground">
                    Business Location:
                  </span>{" "}
                  {businessLocationName || "--"}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-border bg-surface-alt/40 px-5 py-4 sm:px-7">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
              <button
                type="button"
                onClick={() => toast.info("Close register will be wired to the backend next.")}
                className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90"
              >
                <Lock className="h-4 w-4" />
                Close Register
              </button>
              <button
                type="button"
                onClick={() => setShowRegisterDetails(false)}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-alt"
              >
                Cancel
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {/* ===== PAYMENT MODAL ===== */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-border bg-surface-alt/40 px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                  Checkout
                </p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">
                  Complete & Print Receipt
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Confirm payment details before completing this sale.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-surface-alt hover:text-foreground"
                aria-label="Close payment modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Payment Method
                </label>
                <div className="grid gap-2 sm:grid-cols-4">
                  {[
                    { value: "card", label: "Card", description: "Terminal", icon: CreditCard },
                    { value: "cash", label: "Cash", description: "Drawer", icon: Banknote },
                    { value: "mobile", label: "MPesa", description: "STK Push", icon: Coins, disabled: !mpesaStkPushEnabled },
                    { value: "gift", label: "Gift", description: "Voucher", icon: Package },
                  ].map((method) => {
                    const Icon = method.icon;
                    const active = paymentMethod === method.value;

                    return (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => {
                          if (method.disabled) {
                            toast.info("MPesa STK Push is not configured for this location.");
                            return;
                          }
                          setPaymentMethod(method.value as any);
                        }}
                        disabled={method.disabled}
                        title={method.disabled ? "MPesa STK Push is not configured for this location." : undefined}
                        className={`rounded-xl border p-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                          active
                            ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/10"
                            : "border-border bg-surface text-muted-foreground hover:border-primary/30 hover:bg-surface-alt hover:text-foreground"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                              active ? "bg-primary text-primary-foreground" : "bg-surface-alt"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold">{method.label}</span>
                            <span className="block text-[11px] text-muted-foreground">
                              {method.description}
                            </span>
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {paymentMethod === "cash" && (
                <div className="rounded-xl border border-border bg-surface p-4">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Cash Amount
                  </label>
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5">
                    <Banknote className="h-4 w-4 text-primary" />
                    <input
                      type="number"
                      placeholder="Enter cash amount..."
                      className="w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground"
                      value={cashAmount || ""}
                      onChange={(e) =>
                        setCashAmount(parseFloat(e.target.value) || 0)
                      }
                      min={cartTotal}
                    />
                  </div>
                  {cashAmount && cashAmount > 0 && (
                    <div className="mt-3 flex items-center justify-between rounded-lg bg-success/10 px-3 py-2 text-sm">
                      <span className="flex items-center gap-1.5 text-success">
                      <Coins className="h-3.5 w-3.5" />
                        Change due
                      </span>
                      <span className="font-semibold text-foreground">
                        {formatCurrency(Math.max(cashAmount - cartTotal, 0))}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="overflow-hidden rounded-xl border border-border bg-surface text-sm">
                <div className="flex justify-between border-b border-border px-4 py-3">
                  <span className="text-muted-foreground">Items</span>
                  <span className="font-semibold text-foreground">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border px-4 py-3">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(cartSubtotal)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border px-4 py-3">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(effectiveTax)}
                  </span>
                </div>
                <div className="flex justify-between bg-primary/10 px-4 py-3">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="text-base font-semibold text-primary">
                    {formatCurrency(cartTotal)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground hover:bg-surface-alt"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePaymentComplete}
                  disabled={
                    isLoading ||
                    (paymentMethod === "cash" &&
                      (!cashAmount || cashAmount < cartTotal))
                  }
                  className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    "Complete Sale"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== RECEIPT MODAL ===== */}
      {showReceipt && currentOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl">
            <div className="border-b border-border bg-surface-alt/40 px-6 py-5 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success">
                <Check className="h-6 w-6" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-success">
                Payment successful
              </p>
              <h3 className="mt-1 text-lg font-semibold text-foreground">
                Receipt is ready
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Order #{currentOrder.id} completed
              </p>
            </div>

            <div className="p-6">
            <div className="overflow-hidden rounded-xl border border-border bg-surface text-sm">
              <div className="flex justify-between border-b border-border px-4 py-3">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(currentOrder.subtotal)}
                </span>
              </div>
              <div className="flex justify-between border-b border-border px-4 py-3">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(currentOrder.tax)}
                </span>
              </div>
              <div className="flex justify-between border-b border-border px-4 py-3">
                <span className="text-muted-foreground">Discount</span>
                <span className="font-medium text-destructive">
                  -{formatCurrency(currentOrder.discount)}
                </span>
              </div>
              <div className="flex justify-between bg-primary/10 px-4 py-3">
                <span className="text-foreground">Total</span>
                <span className="text-base font-semibold text-primary">
                  {formatCurrency(currentOrder.total)}
                </span>
              </div>
              <div className="flex justify-between px-4 py-3 text-xs text-muted-foreground">
                <span>Payment: {currentOrder.payment_method.toUpperCase()}</span>
                <span>Status: {currentOrder.payment_status}</span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowReceipt(false);
                  setCurrentOrder(null);
                }}
                className="rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground hover:bg-surface-alt"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowReceipt(false);
                  setCurrentOrder(null);
                  window.print();
                }}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Printer className="h-4 w-4" />
                Print Receipt
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== QUEUE / MANAGE TABLE PANEL ===== */}
      {showQueue && (
        <div className="fixed inset-y-0 right-0 z-40 w-full overflow-hidden bg-surface shadow-2xl sm:w-96">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-foreground" />
              <h3 className="font-semibold text-foreground">Manage Table</h3>
              <span className="rounded-full bg-warning/20 px-2 py-0.5 text-xs font-semibold text-warning">
                {queueStats.waiting} waiting
              </span>
            </div>
            <button
              onClick={() => setShowQueue(false)}
              className="rounded-lg p-2 hover:bg-surface-alt"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4">
            <div className="mb-4 grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-surface-alt p-2 text-center">
                <div className="text-sm font-bold text-foreground">
                  {queueStats.waiting}
                </div>
                <div className="text-xs text-muted-foreground">Waiting</div>
              </div>
              <div className="rounded-lg bg-primary/10 p-2 text-center">
                <div className="text-sm font-bold text-primary">
                  {queueStats.serving}
                </div>
                <div className="text-xs text-muted-foreground">Serving</div>
              </div>
              <div className="rounded-lg bg-success/15 p-2 text-center">
                <div className="text-sm font-bold text-success">
                  {queueStats.completed}
                </div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
            </div>

            <div className="mb-4 flex gap-2">
              <button
                onClick={handleServeNext}
                disabled={queueStats.waiting === 0}
                className="flex-1 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Serve Next
              </button>
              <button
                onClick={() => {
                  const name = prompt("Enter table / customer name:");
                  if (name) {
                    setQueueItems((prev) => [
                      ...prev,
                      {
                        id: `queue_${Date.now()}`,
                        customer_name: name,
                        status: "waiting",
                        position: prev.length + 1,
                        estimated_time: 8,
                        created_at: new Date().toISOString(),
                      },
                    ]);
                  }
                }}
                className="flex-1 rounded-lg border border-border px-4 py-2 font-medium hover:bg-surface-alt"
              >
                Add Table
              </button>
            </div>

            <div className="max-h-[calc(100vh-320px)] space-y-2 overflow-y-auto">
              {queueItems.length === 0 ? (
                <div className="py-8 text-center">
                  <Clock className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">No tables in queue</p>
                </div>
              ) : (
                queueItems.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-3 transition-all ${
                      item.status === "waiting"
                        ? "border-warning/30 bg-warning/10"
                        : item.status === "serving"
                          ? "border-primary/30 bg-primary/10"
                          : "border-success/30 bg-success/10"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ${
                            item.status === "waiting"
                              ? "bg-warning"
                              : item.status === "serving"
                                ? "bg-primary"
                                : "bg-success"
                          }`}
                        >
                          {item.position}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">
                            {item.customer_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.status === "waiting" &&
                              `Est. ${item.estimated_time} min`}
                            {item.status === "serving" && "Currently serving"}
                            {item.status === "completed" && "Completed"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {item.status === "waiting" && (
                          <>
                            <button
                              onClick={() =>
                                setQueueItems(
                                  queueItems.map((q) =>
                                    q.id === item.id
                                      ? { ...q, status: "serving" }
                                      : q,
                                  ),
                                )
                              }
                              className="rounded-lg p-1.5 text-primary hover:bg-primary/10"
                              title="Start serving"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleCancelQueueItem(item.id)}
                              className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10"
                              title="Cancel"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {item.status === "serving" && (
                          <button
                            onClick={() => handleCompleteQueueItem(item.id)}
                            className="rounded-lg p-1.5 text-success hover:bg-success/10"
                            title="Complete"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PosLayout;
