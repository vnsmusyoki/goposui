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

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost: number;
  stock: number;
  category: string;
  brand: string;
  image: string;
  status: "active" | "draft" | "out_of_stock";
  barcode: string;
  weight?: number;
  dimensions?: string;
  tax_rate?: number;
}

interface CartItem {
  id: string;
  product_id: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  total: number;
  image: string;
  tax_rate: number;
}

interface Customer {
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
  customer?: Customer;
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

// ============================================
// MOCK DATA
// ============================================

const BASE_PRODUCTS: Product[] = [
  {
    id: "prod_1",
    name: "Calamari Rings",
    sku: "APP-001",
    price: 8.5,
    cost: 4.0,
    stock: 145,
    category: "Appetizer",
    brand: "Kitchen",
    image:
      "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=200",
    status: "active",
    barcode: "4905524424988",
    tax_rate: 0.08,
  },
  {
    id: "prod_2",
    name: "Mozzarella Sticks",
    sku: "APP-002",
    price: 10.25,
    cost: 5.0,
    stock: 89,
    category: "Appetizer",
    brand: "Kitchen",
    image:
      "https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=200",
    status: "active",
    barcode: "4905524424989",
    tax_rate: 0.08,
  },
  {
    id: "prod_3",
    name: "Cream of Mushroom",
    sku: "SOUP-001",
    price: 10.99,
    cost: 4.5,
    stock: 320,
    category: "Soups",
    brand: "Kitchen",
    image:
      "https://images.unsplash.com/photo-1547592180-85f173990554?w=200",
    status: "active",
    barcode: "4905524424990",
    tax_rate: 0.06,
  },
  {
    id: "prod_4",
    name: "Chicken Alfredo",
    sku: "MAIN-001",
    price: 15.99,
    cost: 8.0,
    stock: 56,
    category: "Main Course",
    brand: "Kitchen",
    image:
      "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=200",
    status: "active",
    barcode: "4905524424991",
    tax_rate: 0.08,
  },
  {
    id: "prod_5",
    name: "Filet Mignon",
    sku: "MAIN-002",
    price: 26.49,
    cost: 15.0,
    stock: 78,
    category: "Main Course",
    brand: "Kitchen",
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?w=200",
    status: "active",
    barcode: "4905524424992",
    tax_rate: 0.06,
  },
  {
    id: "prod_6",
    name: "Caesar Salad",
    sku: "SAL-001",
    price: 8.49,
    cost: 3.5,
    stock: 34,
    category: "Salads",
    brand: "Kitchen",
    image:
      "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=200",
    status: "active",
    barcode: "4905524424993",
    tax_rate: 0.08,
  },
  {
    id: "prod_7",
    name: "Chicken Noodle Soup",
    sku: "SOUP-002",
    price: 10.49,
    cost: 4.0,
    stock: 234,
    category: "Soups",
    brand: "Kitchen",
    image:
      "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=200",
    status: "active",
    barcode: "4905524424994",
    tax_rate: 0.06,
  },
  {
    id: "prod_8",
    name: "Spinach Artichoke Dip",
    sku: "APP-003",
    price: 8.85,
    cost: 4.0,
    stock: 167,
    category: "Appetizer",
    brand: "Kitchen",
    image:
      "https://images.unsplash.com/photo-1626200758562-3a55dcae23f4?w=200",
    status: "active",
    barcode: "4905524424995",
    tax_rate: 0.08,
  },
  {
    id: "prod_9",
    name: "Chef Salad",
    sku: "SAL-002",
    price: 10.49,
    cost: 5.0,
    stock: 45,
    category: "Salads",
    brand: "Kitchen",
    image:
      "https://images.unsplash.com/photo-1512852939750-1305098529bf?w=200",
    status: "active",
    barcode: "4905524424996",
    tax_rate: 0.06,
  },
  {
    id: "prod_10",
    name: "Minestrone Soup",
    sku: "SOUP-003",
    price: 8.0,
    cost: 3.0,
    stock: 28,
    category: "Soups",
    brand: "Kitchen",
    image:
      "https://images.unsplash.com/photo-1547592180-85f173990554?w=200",
    status: "active",
    barcode: "4905524424997",
    tax_rate: 0.08,
  },
  {
    id: "prod_11",
    name: "Clam Chowder",
    sku: "SOUP-004",
    price: 9.75,
    cost: 4.0,
    stock: 60,
    category: "Soups",
    brand: "Kitchen",
    image:
      "https://images.unsplash.com/photo-1607330288784-7dad86e0e2ba?w=200",
    status: "active",
    barcode: "4905524424998",
    tax_rate: 0.06,
  },
  {
    id: "prod_12",
    name: "Caprese Salad",
    sku: "SAL-003",
    price: 9.5,
    cost: 4.5,
    stock: 40,
    category: "Salads",
    brand: "Kitchen",
    image:
      "https://images.unsplash.com/photo-1595587870672-c79b47875c6a?w=200",
    status: "active",
    barcode: "4905524424999",
    tax_rate: 0.06,
  },
];

const DEMO_PRODUCT_NAMES = [
  "Grilled Chicken Bowl",
  "Beef Burger",
  "Loaded Fries",
  "Fish Tacos",
  "Veggie Wrap",
  "Pesto Pasta",
  "BBQ Ribs",
  "Greek Salad",
  "Tomato Bisque",
  "Garlic Bread",
  "Shrimp Skewers",
  "Turkey Club",
  "Margherita Pizza",
  "Chicken Wings",
  "Steak Sandwich",
  "Quinoa Bowl",
  "Cobb Salad",
  "French Onion Soup",
  "Buffalo Cauliflower",
  "Lamb Kofta",
  "Seafood Pasta",
  "Garden Sandwich",
  "Tuna Melt",
  "Crispy Chicken",
  "Avocado Toast",
  "Roast Beef Plate",
  "Mango Smoothie",
  "Iced Latte",
  "Lemonade",
  "Chocolate Mousse",
];

const MOCK_PRODUCTS: Product[] = [
  ...BASE_PRODUCTS,
  ...DEMO_PRODUCT_NAMES.map((name, index) => {
    const source = BASE_PRODUCTS[index % BASE_PRODUCTS.length];
    const demoIndex = index + 13;

    return {
      ...source,
      id: `prod_${demoIndex}`,
      name,
      sku: `DEMO-${String(index + 1).padStart(3, "0")}`,
      price: Number((source.price + 1.25 + index * 0.35).toFixed(2)),
      cost: Number((source.cost + 0.75 + index * 0.15).toFixed(2)),
      stock: 30 + index * 7,
      barcode: `49055244250${String(index).padStart(2, "0")}`,
    };
  }),
];

const MOCK_CUSTOMERS: Customer[] = [
  {
    id: "cust_1",
    name: "John Doe",
    email: "john@example.com",
    phone: "+1 (555) 123-4567",
    address: "123 Main St, New York, NY 10001",
    loyalty_points: 2450,
    tier: "gold",
    total_orders: 12,
    total_spent: 2450.5,
  },
  {
    id: "cust_2",
    name: "Jane Smith",
    email: "jane@example.com",
    phone: "+1 (555) 234-5678",
    address: "456 Oak Ave, Los Angeles, CA 90001",
    loyalty_points: 1890,
    tier: "silver",
    total_orders: 8,
    total_spent: 1890.75,
  },
];

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

const PosLayout = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const { formatCurrency } = useBusinessCurrency();
  const { settings } = usePosSettings();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([
    {
      id: "q1",
      customer_name: "Table 4",
      status: "waiting",
      position: 1,
      estimated_time: 12,
      created_at: new Date().toISOString(),
    },
    {
      id: "q2",
      customer_name: "Table 7",
      status: "serving",
      position: 2,
      estimated_time: 3,
      created_at: new Date().toISOString(),
    },
  ]);
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
  const [manageDishOpen, setManageDishOpen] = useState(true);
  const [barcodeInput, setBarcodeInput] = useState("");

  const cartRef = useRef<HTMLDivElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

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
      return MOCK_CUSTOMERS;
    }

    const query = customerSearchQuery.toLowerCase();
    return MOCK_CUSTOMERS.filter(
      (customer) =>
        customer.name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        customer.phone.toLowerCase().includes(query),
    );
  }, [customerSearchQuery]);

  const filteredProducts = useMemo(() => {
    let products = MOCK_PRODUCTS;
    if (selectedCategory !== "All") {
      products = products.filter((p) => p.category === selectedCategory);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query) ||
          p.barcode.includes(query),
      );
    }
    return products;
  }, [searchQuery, selectedCategory]);

  const categories = ["All", ...new Set(MOCK_PRODUCTS.map((p) => p.category))];

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

  const handleAddToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product_id === product.id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.product_id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * item.price,
              }
            : item,
        ),
      );
    } else {
      setCart([
        ...cart,
        {
          id: `cart_${Date.now()}`,
          product_id: product.id,
          name: product.name,
          sku: product.sku,
          quantity: 1,
          price: product.price,
          total: product.price,
          image: product.image,
          tax_rate: product.tax_rate || 0.08,
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
            return {
              ...item,
              quantity: newQuantity,
              total: newQuantity * item.price,
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
    if (window.confirm("Clear all items from this order?")) {
      setCart([]);
      setOrderNotes("");
    }
  };

  const handleBarcodeScan = (barcode: string) => {
    const product = MOCK_PRODUCTS.find((p) => p.barcode === barcode);
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
      tax: cartTax,
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

  const handleSelectCustomer = (customer: Customer) => {
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

  const navItems = [
    { label: "Dashboard", icon: LayoutGrid },
    { label: "Order Process", icon: Package, active: true },
    { label: "Revenue Stat", icon: BarChart3 },
  ];
  const dishSubItems = ["Main Course", "Appetizer", "Soups", "Salads", "Drinks"];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <header className="shrink-0 border-b border-border bg-surface/95 text-foreground backdrop-blur">
        <div className="mx-auto w-full px-4 py-2 lg:px-6">
          <div className="flex w-full items-center justify-end">
            <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5">
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
                onClick={() => toast.info("Close register will be wired next.")}
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-[11px] font-medium text-muted-foreground shadow-none transition-colors hover:border-primary/30 hover:bg-surface-alt hover:text-foreground"
              >
                <Lock className="h-3.5 w-3.5" />
                Close Register
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
              const Icon = CATEGORY_ICONS[category] ?? LayoutGrid;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface text-muted-foreground border border-border hover:border-primary/30"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {category}
                </button>
              );
            })}
          </div>

          <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1 pb-4">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6">
              {filteredProducts.length === 0 ? (
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
                  const inCart = cart.some(
                    (item) => item.product_id === product.id,
                  );
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleAddToCart(product)}
                      className={`group overflow-hidden rounded-[1.25rem] border bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
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
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-primary">
                            {formatCurrency(product.price)}
                          </span>
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-success text-success-foreground shadow-sm shadow-success/20">
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
                    const inCart = cart.some(
                      (item) => item.product_id === product.id,
                    );
                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        className={`grid w-full grid-cols-[minmax(0,1.4fr)_120px_110px_110px_92px] items-center gap-3 border-t border-border px-4 py-3 text-left transition-colors hover:bg-surface-alt/40 ${
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
                          {formatCurrency(product.price)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {product.stock}
                        </span>
                        <span className="flex justify-end">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-success text-success-foreground shadow-sm shadow-success/20">
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
                  Tap a dish from the menu to add it here.
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
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-success text-success-foreground"
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

      {/* ===== PAYMENT MODAL ===== */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl border border-border">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-foreground">
                Process Payment
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="rounded-lg p-2 hover:bg-surface-alt"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Payment Method
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: "card", label: "💳 Card" },
                    { value: "cash", label: "💵 Cash" },
                    { value: "mobile", label: "📱 Mobile" },
                    { value: "gift", label: "🎁 Gift" },
                  ].map((method) => (
                    <button
                      key={method.value}
                      onClick={() => setPaymentMethod(method.value as any)}
                      className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                        paymentMethod === method.value
                          ? "border-2 border-primary bg-primary/10 text-primary"
                          : "bg-surface-alt text-muted-foreground hover:bg-surface"
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === "cash" && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Cash Amount
                  </label>
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-alt px-3 py-2.5">
                    <Banknote className="h-4 w-4 text-muted-foreground" />
                    <input
                      type="number"
                      placeholder="Enter cash amount..."
                      className="w-full bg-transparent text-sm outline-none"
                      value={cashAmount || ""}
                      onChange={(e) =>
                        setCashAmount(parseFloat(e.target.value) || 0)
                      }
                      min={cartTotal}
                    />
                  </div>
                  {cashAmount && cashAmount > 0 && (
                    <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Coins className="h-3.5 w-3.5" />
                      Change: {formatCurrency(Math.max(cashAmount - cartTotal, 0))}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2 rounded-xl bg-surface-alt p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-bold text-foreground">
                    {formatCurrency(cartTotal)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="rounded-lg border border-border px-4 py-3 font-medium hover:bg-surface-alt"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePaymentComplete}
                  disabled={
                    isLoading ||
                    (paymentMethod === "cash" &&
                      (!cashAmount || cashAmount < cartTotal))
                  }
                  className="rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    "Pay Now"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== RECEIPT MODAL ===== */}
      {showReceipt && currentOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
                <Check className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                Payment Successful!
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Order #{currentOrder.id} completed
              </p>
            </div>

            <div className="mt-6 space-y-2 rounded-xl bg-surface-alt p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(currentOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(currentOrder.tax)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-bold">
                <span className="text-foreground">Total</span>
                <span className="text-primary">
                  {formatCurrency(currentOrder.total)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Payment: {currentOrder.payment_method.toUpperCase()}</span>
                <span>Status: {currentOrder.payment_status}</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setShowReceipt(false);
                  setCurrentOrder(null);
                }}
                className="rounded-lg border border-border px-4 py-3 font-medium hover:bg-surface-alt"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowReceipt(false);
                  setCurrentOrder(null);
                  window.print();
                }}
                className="flex items-center justify-center gap-2 rounded-lg bg-surface-alt px-4 py-3 font-medium hover:bg-surface"
              >
                <Printer className="h-4 w-4" />
                Print Receipt
              </button>
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
