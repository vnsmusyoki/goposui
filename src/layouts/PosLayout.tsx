import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  CreditCard,
  User,
  Package,
  Plus,
  Minus,
  Trash2,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Printer,
  Receipt,
  Users,
  Clock,
  AlertCircle,
  Loader2,
  DollarSign,
  Percent,
  Gift,
  Tag,
  Truck,
  Phone,
  Mail,
  MapPin,
  Star,
  Heart,
  Filter,
  Grid,
  List,
  ArrowUpDown,
  Download,
  Share2,
  Copy,
  Calendar,
  Smile,
  Frown,
  Meh,
  Sparkles,
  Zap,
  Shield,
  Wallet,
  Banknote,
  Coins,
  QrCode,
  Scan,
  History,
  Settings,
  LogOut,
  Menu,
  Bell,
  Moon,
  Sun,
  ChevronDown,
  MoreVertical,
  Edit,
  Eye
} from 'lucide-react';
import { useAuthStore } from '../auth/authStore';
import { useBusinessCurrency } from '@/business/businessStore';

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
  status: 'active' | 'draft' | 'out_of_stock';
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
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
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
  payment_status: 'paid' | 'unpaid' | 'refunded';
  customer?: Customer;
  created_at: string;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
}

interface QueueItem {
  id: string;
  customer_name: string;
  order_id?: string;
  status: 'waiting' | 'serving' | 'completed' | 'cancelled';
  position: number;
  estimated_time: number;
  created_at: string;
}

// ============================================
// MOCK DATA
// ============================================

const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    name: 'Premium Wireless Headphones',
    sku: 'WH-1000XM4',
    price: 299.99,
    cost: 180.00,
    stock: 145,
    category: 'Electronics',
    brand: 'Sony',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150',
    status: 'active',
    barcode: '4905524424988',
    weight: 0.5,
    tax_rate: 0.08
  },
  {
    id: 'prod_2',
    name: 'Smart Fitness Tracker',
    sku: 'FT-2024',
    price: 149.99,
    cost: 85.00,
    stock: 89,
    category: 'Wearables',
    brand: 'Fitbit',
    image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=150',
    status: 'active',
    barcode: '4905524424989',
    weight: 0.2,
    tax_rate: 0.08
  },
  {
    id: 'prod_3',
    name: 'Organic Cotton T-Shirt',
    sku: 'OCT-001',
    price: 34.99,
    cost: 15.00,
    stock: 320,
    category: 'Clothing',
    brand: 'EcoWear',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=150',
    status: 'active',
    barcode: '4905524424990',
    tax_rate: 0.06
  },
  {
    id: 'prod_4',
    name: 'Gaming Mechanical Keyboard',
    sku: 'GMK-87',
    price: 89.99,
    cost: 45.00,
    stock: 56,
    category: 'Electronics',
    brand: 'Logitech',
    image: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=150',
    status: 'active',
    barcode: '4905524424991',
    tax_rate: 0.08
  },
  {
    id: 'prod_5',
    name: 'Leather Backpack',
    sku: 'LB-2024',
    price: 79.99,
    cost: 40.00,
    stock: 78,
    category: 'Accessories',
    brand: 'UrbanStyle',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=150',
    status: 'active',
    barcode: '4905524424992',
    tax_rate: 0.06
  },
  {
    id: 'prod_6',
    name: 'Smartphone 5G Pro',
    sku: 'SP5G-PRO',
    price: 799.99,
    cost: 550.00,
    stock: 34,
    category: 'Electronics',
    brand: 'OnePlus',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=150',
    status: 'active',
    barcode: '4905524424993',
    weight: 0.8,
    tax_rate: 0.08
  },
  {
    id: 'prod_7',
    name: 'Stainless Steel Water Bottle',
    sku: 'SSB-750',
    price: 24.99,
    cost: 10.00,
    stock: 234,
    category: 'Home & Kitchen',
    brand: 'HydroFlask',
    image: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=150',
    status: 'active',
    barcode: '4905524424994',
    tax_rate: 0.06
  },
  {
    id: 'prod_8',
    name: 'Wireless Charging Pad',
    sku: 'WCP-15W',
    price: 39.99,
    cost: 20.00,
    stock: 167,
    category: 'Electronics',
    brand: 'Anker',
    image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=150',
    status: 'active',
    barcode: '4905524424995',
    tax_rate: 0.08
  },
  {
    id: 'prod_9',
    name: 'Coffee Maker Deluxe',
    sku: 'CMD-1000',
    price: 129.99,
    cost: 70.00,
    stock: 45,
    category: 'Home & Kitchen',
    brand: 'BrewMaster',
    image: 'https://images.unsplash.com/photo-1510915361519-3bb5de2bb680?w=150',
    status: 'active',
    barcode: '4905524424996',
    weight: 3.5,
    tax_rate: 0.06
  },
  {
    id: 'prod_10',
    name: 'Smart Watch Series 8',
    sku: 'SW-8',
    price: 399.99,
    cost: 250.00,
    stock: 28,
    category: 'Wearables',
    brand: 'Apple',
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=150',
    status: 'active',
    barcode: '4905524424997',
    weight: 0.3,
    tax_rate: 0.08
  }
];

const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'cust_1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main St, New York, NY 10001',
    loyalty_points: 2450,
    tier: 'gold',
    total_orders: 12,
    total_spent: 2450.50
  },
  {
    id: 'cust_2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+1 (555) 234-5678',
    address: '456 Oak Ave, Los Angeles, CA 90001',
    loyalty_points: 1890,
    tier: 'silver',
    total_orders: 8,
    total_spent: 1890.75
  },
  {
    id: 'cust_3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    phone: '+1 (555) 345-6789',
    address: '789 Pine St, Chicago, IL 60601',
    loyalty_points: 876,
    tier: 'bronze',
    total_orders: 5,
    total_spent: 876.25
  }
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getTierColor = (tier: string): string => {
  const colors: Record<string, string> = {
    'bronze': 'bg-amber-600',
    'silver': 'bg-gray-400',
    'gold': 'bg-yellow-500',
    'platinum': 'bg-indigo-500'
  };
  return colors[tier] || 'bg-gray-400';
};

const getTierIcon = (tier: string) => {
  switch(tier) {
    case 'platinum': return '👑';
    case 'gold': return '⭐';
    case 'silver': return '💎';
    default: return '🥉';
  }
};

// ============================================
// MAIN POS COMPONENT
// ============================================

const PosLayout = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const { formatCurrency } = useBusinessCurrency();
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'cart' | 'queue'>('products');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile' | 'gift'>('card');
  const [cashAmount, setCashAmount] = useState<number | null>(null);
  const [orderNotes, setOrderNotes] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [barcodeInput, setBarcodeInput] = useState('');

  // Refs
  const cartRef = useRef<HTMLDivElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Calculate cart totals
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  }, [cart]);

  const cartTax = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.total * (item.tax_rate || 0.08)), 0);
  }, [cart]);

  const cartDiscount = useMemo(() => {
    if (discountType === 'percentage') {
      return (cartSubtotal + cartTax) * (discountValue / 100);
    }
    return Math.min(discountValue, cartSubtotal + cartTax);
  }, [cartSubtotal, cartTax, discountType, discountValue]);

  const cartTotal = useMemo(() => {
    return cartSubtotal + cartTax - cartDiscount;
  }, [cartSubtotal, cartTax, cartDiscount]);

  // Filter products
  const filteredProducts = useMemo(() => {
    let products = MOCK_PRODUCTS;
    
    if (selectedCategory !== 'All') {
      products = products.filter(p => p.category === selectedCategory);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        p.barcode.includes(query)
      );
    }
    
    return products;
  }, [searchQuery, selectedCategory]);

  // Categories
  const categories = ['All', ...new Set(MOCK_PRODUCTS.map(p => p.category))];

  // Handlers
  const handleAddToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product_id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.product_id === product.id 
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      setCart([...cart, {
        id: `cart_${Date.now()}`,
        product_id: product.id,
        name: product.name,
        sku: product.sku,
        quantity: 1,
        price: product.price,
        total: product.price,
        image: product.image,
        tax_rate: product.tax_rate || 0.08
      }]);
    }
    
    // Scroll to cart
    setTimeout(() => {
      cartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
  };

  const handleUpdateQuantity = (itemId: string, change: number) => {
    setCart(cart.map(item => {
      if (item.id === itemId) {
        const newQuantity = Math.max(0, item.quantity + change);
        if (newQuantity === 0) return null;
        return { ...item, quantity: newQuantity, total: newQuantity * item.price };
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const handleRemoveItem = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Clear all items from cart?')) {
      setCart([]);
      setDiscountValue(0);
      setOrderNotes('');
    }
  };

  const handleApplyDiscount = (value: number) => {
    setDiscountValue(Math.max(0, value));
  };

  const handleBarcodeScan = (barcode: string) => {
    const product = MOCK_PRODUCTS.find(p => p.barcode === barcode);
    if (product) {
      handleAddToCart(product);
      setBarcodeInput('');
    } else {
      // Show error or product not found
      alert('Product not found with this barcode.');
    }
  };

  const handleProcessPayment = () => {
    if (cart.length === 0) {
      alert('Cart is empty. Add items before processing payment.');
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = () => {
    setIsLoading(true);
    
    // Create order
    const order: Order = {
      id: `ORD-${Date.now()}`,
      items: cart,
      subtotal: cartSubtotal,
      tax: cartTax,
      discount: cartDiscount,
      total: cartTotal,
      payment_method: paymentMethod,
      payment_status: 'paid',
      customer: selectedCustomer || undefined,
      created_at: new Date().toISOString(),
      status: 'completed',
      notes: orderNotes || undefined
    };
    
    setCurrentOrder(order);
    
    // Add to queue if customer is waiting
    if (selectedCustomer) {
      setQueueItems(prev => [...prev, {
        id: `queue_${Date.now()}`,
        customer_name: selectedCustomer.name,
        order_id: order.id,
        status: 'completed',
        position: prev.length + 1,
        estimated_time: 5,
        created_at: new Date().toISOString()
      }]);
    }
    
    setTimeout(() => {
      setIsLoading(false);
      setShowPaymentModal(false);
      setShowReceipt(true);
      setCart([]);
      setDiscountValue(0);
      setOrderNotes('');
      setSelectedCustomer(null);
    }, 1500);
  };

  const handleAddToQueue = (customerName: string) => {
    const newQueueItem: QueueItem = {
      id: `queue_${Date.now()}`,
      customer_name: customerName || 'Guest',
      status: 'waiting',
      position: queueItems.length + 1,
      estimated_time: Math.ceil(queueItems.length * 2) + 3,
      created_at: new Date().toISOString()
    };
    setQueueItems([...queueItems, newQueueItem]);
    toast.success(`${customerName || 'Guest'} added to queue`);
  };

  const handleServeNext = () => {
    const nextWaiting = queueItems.find(item => item.status === 'waiting');
    if (nextWaiting) {
      setQueueItems(queueItems.map(item => 
        item.id === nextWaiting.id 
          ? { ...item, status: 'serving' }
          : item
      ));
      toast.success(`Now serving ${nextWaiting.customer_name}`);
    } else {
      toast.info('No customers waiting in queue');
    }
  };

  const handleCompleteQueueItem = (itemId: string) => {
    setQueueItems(queueItems.map(item => 
      item.id === itemId 
        ? { ...item, status: 'completed' }
        : item
    ));
  };

  const handleCancelQueueItem = (itemId: string) => {
    if (window.confirm('Cancel this queue item?')) {
      setQueueItems(queueItems.filter(item => item.id !== itemId));
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerSearch(false);
  };

  const getQueueStats = () => {
    const waiting = queueItems.filter(item => item.status === 'waiting').length;
    const serving = queueItems.filter(item => item.status === 'serving').length;
    const completed = queueItems.filter(item => item.status === 'completed').length;
    return { waiting, serving, completed, total: queueItems.length };
  };

  const queueStats = getQueueStats();

  // Toast notification helper
  const toast = {
    success: (message: string) => {
      // Simple alert for demo
      console.log('✅', message);
    },
    info: (message: string) => {
      console.log('ℹ️', message);
    },
    error: (message: string) => {
      console.log('❌', message);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch {
      toast.error('Unable to log out right now.');
    } finally {
      navigate('/login', { replace: true });
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+B for barcode scan
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      }
      // Ctrl+Q for queue
      if (e.ctrlKey && e.key === 'q') {
        e.preventDefault();
        setShowQueue(!showQueue);
      }
      // Escape to clear search
      if (e.key === 'Escape') {
        setSearchQuery('');
        barcodeInputRef.current?.blur();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showQueue]);

  // Auto-advance barcode input
  useEffect(() => {
    if (barcodeInput.length > 5) {
      handleBarcodeScan(barcodeInput);
    }
  }, [barcodeInput]);

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300 ${theme === 'dark' ? 'dark' : ''}`}>
      
      {/* ===== TOP NAVBAR ===== */}
      <nav className="sticky top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          {/* Left - Brand & Tabs */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <span className="text-white font-bold">P</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white hidden sm:block">POS</span>
            </div>
            
            <div className="hidden md:flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('products')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'products' 
                    ? 'bg-white dark:bg-gray-700 shadow-sm' 
                    : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Products
              </button>
              <button
                onClick={() => setActiveTab('cart')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1 ${
                  activeTab === 'cart' 
                    ? 'bg-white dark:bg-gray-700 shadow-sm' 
                    : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Cart
                {cart.length > 0 && (
                  <span className="ml-1 bg-cyan-500 text-white text-xs rounded-full px-2 py-0.5">
                    {cart.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('queue')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1 ${
                  activeTab === 'queue' 
                    ? 'bg-white dark:bg-gray-700 shadow-sm' 
                    : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Queue
                {queueStats.waiting > 0 && (
                  <span className="ml-1 bg-orange-500 text-white text-xs rounded-full px-2 py-0.5">
                    {queueStats.waiting}
                  </span>
                )}
              </button>
            </div>
          </div>
          
          {/* Center - Search */}
          <div className="flex-1 max-w-2xl relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search products by name, SKU, or barcode... (Ctrl+B to scan)"
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:ring-2 focus:ring-cyan-400/50 text-sm outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">
              Ctrl+B
            </kbd>
          </div>
          
          {/* Right - Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            
            <button
              onClick={() => setShowQueue(!showQueue)}
              className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Users className="w-5 h-5" />
              {queueStats.waiting > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {queueStats.waiting}
                </span>
              )}
            </button>
            
            <button
              onClick={() => navigate('/settings')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors hidden sm:block"
            >
              <Settings className="w-5 h-5" />
            </button>
            
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex h-[calc(100vh-73px)] overflow-hidden">
        
        {/* ===== SIDEBAR (Desktop) ===== */}
        <aside className={`hidden lg:block w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto flex-shrink-0`}>
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Categories
            </h3>
            <div className="space-y-1">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    selectedCategory === category
                      ? 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 font-medium'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Quick Stats
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Today's Sales</span>
                <span className="font-semibold text-gray-900 dark:text-white">$1,248.50</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Transactions</span>
                <span className="font-semibold text-gray-900 dark:text-white">24</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Queue</span>
                <span className="font-semibold text-orange-500">{queueStats.waiting} waiting</span>
              </div>
            </div>
          </div>
        </aside>

        {/* ===== MOBILE SIDEBAR ===== */}
        {sidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidebarOpen(false)}
          >
            <div 
              className="w-64 bg-white dark:bg-gray-900 h-full overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <span className="font-bold">Categories</span>
                <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-1">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category);
                      setSidebarOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      selectedCategory === category
                        ? 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 font-medium'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== PRODUCTS / CART / QUEUE SECTION ===== */}
        <div className="flex-1 overflow-hidden flex">
          
          {/* Products Grid (Desktop) */}
          <div className={`flex-1 overflow-y-auto p-4 ${activeTab === 'cart' || activeTab === 'queue' ? 'hidden lg:block' : ''}`}>
            {/* Mobile Tab Controls */}
            <div className="flex lg:hidden gap-2 mb-4">
              <button
                onClick={() => setActiveTab('products')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'products' 
                    ? 'bg-cyan-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                Products
              </button>
              <button
                onClick={() => setActiveTab('cart')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                  activeTab === 'cart' 
                    ? 'bg-cyan-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                Cart
                {cart.length > 0 && (
                  <span className="bg-white text-cyan-500 text-xs rounded-full px-2 py-0.5">
                    {cart.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('queue')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                  activeTab === 'queue' 
                    ? 'bg-cyan-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                Queue
                {queueStats.waiting > 0 && (
                  <span className="bg-orange-500 text-white text-xs rounded-full px-2 py-0.5">
                    {queueStats.waiting}
                  </span>
                )}
              </button>
            </div>

            {/* Products */}
            {(activeTab === 'products' || window.innerWidth >= 1024) && (
              <>
                {/* Barcode Scanner Input */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 max-w-md">
                    <div className="flex-1 relative">
                      <input
                        ref={barcodeInputRef}
                        type="text"
                        placeholder="Scan barcode (Ctrl+B to focus)"
                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-400/50 outline-none bg-white dark:bg-gray-800 text-sm"
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                      />
                      <Scan className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    </div>
                    <button
                      onClick={() => setBarcodeInput('')}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* View Controls */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === 'grid' ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === 'list' ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                      {filteredProducts.length} products
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                      {selectedCategory}
                    </span>
                  </div>
                </div>

                {/* Product Grid */}
                <div className={`grid gap-3 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4' 
                    : 'grid-cols-1'
                }`}>
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all hover:border-cyan-400/50 ${
                        viewMode === 'list' ? 'flex items-center gap-4 p-4' : ''
                      }`}
                    >
                      {viewMode === 'grid' ? (
                        <>
                          <div className="relative h-40 bg-gray-100 dark:bg-gray-700">
                            <img 
                              src={product.image} 
                              alt={product.name} 
                              className="w-full h-full object-cover"
                            />
                            <span className={`absolute top-2 right-2 px-2 py-0.5 text-xs rounded-full ${
                              product.stock > 20 
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                : product.stock > 5
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                            }`}>
                              {product.stock > 20 ? 'In Stock' : product.stock > 5 ? 'Low Stock' : 'Out of Stock'}
                            </span>
                          </div>
                          <div className="p-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                  {product.name}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{product.sku}</p>
                              </div>
                              <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                                {product.category}
                              </span>
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                              <div>
                                <span className="text-lg font-bold text-gray-900 dark:text-white">
                                  {formatCurrency(product.price)}
                                </span>
                                {product.tax_rate && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                                    +{product.tax_rate * 100}% tax
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => handleAddToCart(product)}
                                disabled={product.stock === 0}
                                className="px-3 py-1.5 bg-cyan-500 text-white rounded-lg text-sm font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        // List View
                        <>
                          <div className="w-16 h-16 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {product.name}
                              </h4>
                              <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded flex-shrink-0">
                                {product.category}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{product.sku} • Stock: {product.stock}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                              {formatCurrency(product.price)}
                            </span>
                            <button
                              onClick={() => handleAddToCart(product)}
                              disabled={product.stock === 0}
                              className="px-3 py-1.5 bg-cyan-500 text-white rounded-lg text-sm font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Add
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {filteredProducts.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No products found</h3>
                    <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or category filter</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ===== CART SIDEBAR ===== */}
          <div className={`w-full lg:w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col ${
            activeTab === 'cart' || window.innerWidth >= 1024 ? 'flex' : 'hidden'
          }`}>
            {/* Cart Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Cart</h3>
                {cart.length > 0 && (
                  <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                    {cart.length} items
                  </span>
                )}
              </div>
              {cart.length > 0 && (
                <button
                  onClick={handleClearCart}
                  className="text-sm text-red-500 hover:text-red-600 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Customer Selection */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              {selectedCustomer ? (
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${getTierColor(selectedCustomer.tier)} flex items-center justify-center text-white font-bold`}>
                    {selectedCustomer.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white truncate">
                        {selectedCustomer.name}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                        {selectedCustomer.tier}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedCustomer.loyalty_points} pts • {selectedCustomer.total_orders} orders
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCustomerSearch(!showCustomerSearch)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-cyan-400 transition-colors text-sm text-gray-500 dark:text-gray-400"
                >
                  <User className="w-4 h-4" />
                  Add Customer
                </button>
              )}
              
              {showCustomerSearch && (
                <div className="mt-3 space-y-2">
                  <input
                    type="text"
                    placeholder="Search customer..."
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-400/50 outline-none bg-gray-50 dark:bg-gray-800 text-sm"
                    onFocus={(e) => e.target.select()}
                  />
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {MOCK_CUSTOMERS.map(customer => (
                      <button
                        key={customer.id}
                        onClick={() => handleSelectCustomer(customer)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-3"
                      >
                        <div className={`w-8 h-8 rounded-full ${getTierColor(customer.tier)} flex items-center justify-center text-white text-xs font-bold`}>
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{customer.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{customer.email}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cart Items */}
            <div ref={cartRef} className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cart is empty</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Add products to start building an order</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <div className="w-12 h-12 flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatCurrency(item.price)} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, -1)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, 1)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors ml-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Summary */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
                {/* Discount Input */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="number"
                      placeholder="Discount"
                      className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-400/50 outline-none bg-gray-50 dark:bg-gray-800 text-sm"
                      value={discountValue || ''}
                      onChange={(e) => handleApplyDiscount(parseFloat(e.target.value) || 0)}
                      min="0"
                    />
                  </div>
                  <select
                    className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm outline-none"
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                  >
                    <option value="percentage">%</option>
                    <option value="fixed">$</option>
                  </select>
                </div>

                {/* Order Notes */}
                <div className="relative">
                  <textarea
                    placeholder="Order notes..."
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-400/50 outline-none bg-gray-50 dark:bg-gray-800 text-sm resize-none"
                    rows={1}
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                  />
                </div>

                {/* Totals */}
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span className="font-medium">{formatCurrency(cartSubtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tax</span>
                    <span className="font-medium">{formatCurrency(cartTax)}</span>
                  </div>
                  {discountValue > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>Discount</span>
                      <span>-{formatCurrency(cartDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="font-semibold text-gray-900 dark:text-white">Total</span>
                    <span className="text-xl font-bold text-cyan-600 dark:text-cyan-400">
                      {formatCurrency(cartTotal)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleAddToQueue.bind(null, selectedCustomer?.name || 'Guest')}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    Add to Queue
                  </button>
                  <button
                    onClick={handleProcessPayment}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
                  >
                    <CreditCard className="w-4 h-4" />
                    Pay Now
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== PAYMENT MODAL ===== */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Process Payment</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Payment Method */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: 'card', label: '💳 Card' },
                    { value: 'cash', label: '💵 Cash' },
                    { value: 'mobile', label: '📱 Mobile' },
                    { value: 'gift', label: '🎁 Gift' },
                  ].map((method) => (
                    <button
                      key={method.value}
                      onClick={() => setPaymentMethod(method.value as any)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        paymentMethod === method.value
                          ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 border-2 border-cyan-400'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash Amount (if cash payment) */}
              {paymentMethod === 'cash' && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                    Cash Amount
                  </label>
                  <input
                    type="number"
                    placeholder="Enter cash amount..."
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-400/50 outline-none bg-gray-50 dark:bg-gray-800 text-sm"
                    value={cashAmount || ''}
                    onChange={(e) => setCashAmount(parseFloat(e.target.value) || 0)}
                    min={cartTotal}
                  />
                  {cashAmount && cashAmount > 0 && (
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Change: {formatCurrency(cashAmount - cartTotal)}
                    </div>
                  )}
                </div>
              )}

              {/* Payment Summary */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Total Amount</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {formatCurrency(cartTotal)}
                  </span>
                </div>
                {paymentMethod === 'cash' && cashAmount && cashAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Change</span>
                    <span className="font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(cashAmount - cartTotal)}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePaymentComplete}
                  disabled={isLoading || (paymentMethod === 'cash' && (!cashAmount || cashAmount < cartTotal))}
                  className="px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-cyan-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    'Pay Now'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== RECEIPT MODAL ===== */}
      {showReceipt && currentOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fade-in">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Payment Successful!</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Order #{currentOrder.id} completed</p>
            </div>

            <div className="mt-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span>{formatCurrency(currentOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Tax</span>
                <span>{formatCurrency(currentOrder.tax)}</span>
              </div>
              {currentOrder.discount > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>Discount</span>
                  <span>-{formatCurrency(currentOrder.discount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700 font-bold">
                <span className="text-gray-900 dark:text-white">Total</span>
                <span className="text-cyan-600 dark:text-cyan-400">{formatCurrency(currentOrder.total)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
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
                className="px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowReceipt(false);
                  setCurrentOrder(null);
                  window.print();
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== QUEUE PANEL (Slide-in) ===== */}
      {showQueue && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white dark:bg-gray-900 shadow-2xl z-40 overflow-hidden animate-slide-in">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Queue Management</h3>
              <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full">
                {queueStats.waiting} waiting
              </span>
            </div>
            <button
              onClick={() => setShowQueue(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4">
            {/* Queue Stats */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-sm font-bold text-gray-900 dark:text-white">{queueStats.waiting}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Waiting</div>
              </div>
              <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-sm font-bold text-blue-600 dark:text-blue-400">{queueStats.serving}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Serving</div>
              </div>
              <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-sm font-bold text-green-600 dark:text-green-400">{queueStats.completed}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
              </div>
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-sm font-bold text-gray-900 dark:text-white">{queueStats.total}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={handleServeNext}
                disabled={queueStats.waiting === 0}
                className="flex-1 px-4 py-2 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Serve Next
              </button>
              <button
                onClick={() => {
                  const name = prompt('Enter customer name:');
                  if (name) handleAddToQueue(name);
                }}
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Add Customer
              </button>
            </div>

            {/* Queue List */}
            <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto">
              {queueItems.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No customers in queue</p>
                </div>
              ) : (
                queueItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border transition-all ${
                      item.status === 'waiting'
                        ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800'
                        : item.status === 'serving'
                        ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                        : 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                          item.status === 'waiting'
                            ? 'bg-yellow-500'
                            : item.status === 'serving'
                            ? 'bg-blue-500'
                            : 'bg-green-500'
                        }`}>
                          {item.position}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{item.customer_name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {item.status === 'waiting' && `Est. ${item.estimated_time} min`}
                            {item.status === 'serving' && 'Currently serving'}
                            {item.status === 'completed' && 'Completed'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {item.status === 'waiting' && (
                          <>
                            <button
                              onClick={() => {
                                setQueueItems(queueItems.map(q => 
                                  q.id === item.id ? { ...q, status: 'serving' } : q
                                ));
                              }}
                              className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="Start serving"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleCancelQueueItem(item.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {item.status === 'serving' && (
                          <button
                            onClick={() => handleCompleteQueueItem(item.id)}
                            className="p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            title="Complete"
                          >
                            <Check className="w-4 h-4" />
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

      {/* ===== ANIMATIONS ===== */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default PosLayout;
