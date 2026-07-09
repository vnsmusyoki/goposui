import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import * as Icons from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../theme/ThemeProvider';
import { useAuthStore } from '../auth/authStore';
import { getWorkspaceLabel, getWorkspaceSlug } from '../auth/workspace';
import type { ModuleResponse } from '../auth/types';
import {
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Home,
  LogOut,
  Loader2,
  RefreshCw,
  BarChart3,
  BellRing,
  Clock,
  Sun,
  Moon,
  Monitor,
  ShoppingBag,
  ShoppingCart,
  Users,
  DollarSign,
  Star,
  Filter,
  Plus,
  Edit,
  Download,
  Printer,
  MoreVertical,
  TrendingUp,
  Grid,
  List,
} from 'lucide-react';

// ============================================
// TYPES & CONSTANTS
// ============================================

type Theme = 'light' | 'dark' | 'system';

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
  rating: number;
  reviews: number;
  created_at: string;
}

interface Order {
  id: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  items: {
    product_id: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  total: number;
  subtotal: number;
  tax: number;
  discount: number;
  shipping: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'paid' | 'unpaid' | 'refunded' | 'partial';
  payment_method: string;
  shipping_address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  notes: string;
  created_at: string;
  updated_at: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  total_orders: number;
  total_spent: number;
  joined_at: string;
  loyalty_points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
  read: boolean;
  data?: {
    order_id?: string;
    product_id?: string;
  };
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
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200',
    status: 'active',
    rating: 4.8,
    reviews: 234,
    created_at: '2024-01-15T10:30:00Z'
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
    image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=200',
    status: 'active',
    rating: 4.6,
    reviews: 189,
    created_at: '2024-01-20T14:20:00Z'
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
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200',
    status: 'active',
    rating: 4.3,
    reviews: 67,
    created_at: '2024-02-01T09:15:00Z'
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
    image: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=200',
    status: 'active',
    rating: 4.7,
    reviews: 312,
    created_at: '2024-02-10T16:45:00Z'
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
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200',
    status: 'active',
    rating: 4.5,
    reviews: 145,
    created_at: '2024-02-20T11:00:00Z'
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
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200',
    status: 'active',
    rating: 4.9,
    reviews: 567,
    created_at: '2024-03-01T08:30:00Z'
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
    image: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=200',
    status: 'active',
    rating: 4.4,
    reviews: 98,
    created_at: '2024-03-10T13:45:00Z'
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
    image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=200',
    status: 'active',
    rating: 4.2,
    reviews: 156,
    created_at: '2024-03-20T15:00:00Z'
  }
];

const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-2024-001',
    customer: {
      id: 'cust_1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1 (555) 123-4567'
    },
    items: [
      { product_id: 'prod_1', name: 'Premium Wireless Headphones', quantity: 1, price: 299.99, total: 299.99 },
      { product_id: 'prod_2', name: 'Smart Fitness Tracker', quantity: 2, price: 149.99, total: 299.98 }
    ],
    total: 599.97,
    subtotal: 559.97,
    tax: 40.00,
    discount: 20.00,
    shipping: 20.00,
    status: 'delivered',
    payment_status: 'paid',
    payment_method: 'credit_card',
    shipping_address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'USA'
    },
    notes: 'Leave at front door',
    created_at: '2024-03-15T10:00:00Z',
    updated_at: '2024-03-16T14:30:00Z'
  },
  {
    id: 'ORD-2024-002',
    customer: {
      id: 'cust_2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+1 (555) 234-5678'
    },
    items: [
      { product_id: 'prod_4', name: 'Gaming Mechanical Keyboard', quantity: 1, price: 89.99, total: 89.99 },
      { product_id: 'prod_6', name: 'Smartphone 5G Pro', quantity: 1, price: 799.99, total: 799.99 }
    ],
    total: 889.98,
    subtotal: 889.98,
    tax: 0,
    discount: 0,
    shipping: 0,
    status: 'processing',
    payment_status: 'paid',
    payment_method: 'paypal',
    shipping_address: {
      street: '456 Oak Ave',
      city: 'Los Angeles',
      state: 'CA',
      zip: '90001',
      country: 'USA'
    },
    notes: '',
    created_at: '2024-03-18T15:30:00Z',
    updated_at: '2024-03-18T16:00:00Z'
  },
  {
    id: 'ORD-2024-003',
    customer: {
      id: 'cust_3',
      name: 'Bob Johnson',
      email: 'bob@example.com',
      phone: '+1 (555) 345-6789'
    },
    items: [
      { product_id: 'prod_3', name: 'Organic Cotton T-Shirt', quantity: 3, price: 34.99, total: 104.97 },
      { product_id: 'prod_5', name: 'Leather Backpack', quantity: 1, price: 79.99, total: 79.99 }
    ],
    total: 184.96,
    subtotal: 184.96,
    tax: 0,
    discount: 0,
    shipping: 0,
    status: 'pending',
    payment_status: 'unpaid',
    payment_method: 'bank_transfer',
    shipping_address: {
      street: '789 Pine St',
      city: 'Chicago',
      state: 'IL',
      zip: '60601',
      country: 'USA'
    },
    notes: 'Need gift wrapping',
    created_at: '2024-03-20T09:00:00Z',
    updated_at: '2024-03-20T09:00:00Z'
  }
];

const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'cust_1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main St, New York, NY 10001',
    total_orders: 12,
    total_spent: 2450.50,
    joined_at: '2023-01-15T10:30:00Z',
    loyalty_points: 2450,
    tier: 'gold'
  },
  {
    id: 'cust_2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+1 (555) 234-5678',
    address: '456 Oak Ave, Los Angeles, CA 90001',
    total_orders: 8,
    total_spent: 1890.75,
    joined_at: '2023-03-20T14:20:00Z',
    loyalty_points: 1890,
    tier: 'silver'
  },
  {
    id: 'cust_3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    phone: '+1 (555) 345-6789',
    address: '789 Pine St, Chicago, IL 60601',
    total_orders: 5,
    total_spent: 876.25,
    joined_at: '2023-06-10T09:15:00Z',
    loyalty_points: 876,
    tier: 'bronze'
  }
];

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif_1',
    title: 'New Order Received',
    message: 'Order #ORD-2024-003 has been placed by Bob Johnson',
    type: 'order',
    created_at: '2024-03-20T09:00:00Z',
    read: false,
    data: { order_id: 'ORD-2024-003' }
  },
  {
    id: 'notif_2',
    title: 'Low Stock Alert',
    message: 'Product "Smartphone 5G Pro" is running low on stock (34 units)',
    type: 'inventory',
    created_at: '2024-03-19T16:45:00Z',
    read: false,
    data: { product_id: 'prod_6' }
  },
  {
    id: 'notif_3',
    title: 'Payment Received',
    message: 'Payment of $889.98 received for order #ORD-2024-002',
    type: 'payment',
    created_at: '2024-03-18T16:00:00Z',
    read: true
  }
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

const toTitle = (value: string): string => {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

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

const formatNotificationTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    active: 'bg-success-100 text-success-500',
    draft: 'bg-neutral-100 text-neutral-600',
    out_of_stock: 'bg-danger-100 text-danger-500',
    pending: 'bg-warning-100 text-warning-500',
    processing: 'bg-info-100 text-info-500',
    shipped: 'bg-primary-100 text-primary-700',
    delivered: 'bg-success-100 text-success-500',
    cancelled: 'bg-danger-100 text-danger-500',
    paid: 'bg-success-100 text-success-500',
    unpaid: 'bg-danger-100 text-danger-500',
    refunded: 'bg-neutral-100 text-neutral-600',
    partial: 'bg-warning-100 text-warning-500',
  };
  return colors[status] || 'bg-neutral-100 text-neutral-600';
};

const getTierColor = (tier: string): string => {
  const colors: Record<string, string> = {
    bronze: 'bg-warning-500',
    silver: 'bg-neutral-400',
    gold: 'bg-primary-500',
    platinum: 'bg-info-500',
  };
  return colors[tier] || 'bg-neutral-400';
};

// ============================================
// DYNAMIC ICON COMPONENT
// ============================================

const DynamicIcon: React.FC<{
  iconName: string;
  size?: number;
  className?: string;
}> = ({ iconName, size = 20, className = '' }) => {
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[iconName];
  if (!IconComponent) return <BarChart3 size={size} className={className} />;
  return <IconComponent size={size} className={className} />;
};

// ============================================
// THEME SWITCHER COMPONENT
// ============================================

const ThemeSwitcher: React.FC<{ theme: Theme; onThemeChange: (theme: Theme) => void }> = ({ 
  theme, 
  onThemeChange 
}) => {
  const buttons = [
    { value: 'light' as const, icon: Sun, label: 'Light Mode' },
    { value: 'dark' as const, icon: Moon, label: 'Dark Mode' },
    { value: 'system' as const, icon: Monitor, label: 'System Preference' },
  ];

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1 shadow-sm">
      {buttons.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => onThemeChange(value)}
          className={`p-1.5 rounded-md transition-all duration-200 ${
            theme === value
              ? 'bg-surface-alt text-primary'
              : 'text-muted hover:text-text'
          }`}
          title={label}
          type="button"
        >
          <Icon className="w-5 h-5" />
        </button>
      ))}
    </div>
  );
};

// ============================================
// STATS CARDS COMPONENT
// ============================================

const StatsCards: React.FC = () => {
  const stats = [
    { 
      label: 'Total Revenue', 
      value: '$45,892.50', 
      change: '+12.5%', 
      icon: DollarSign, 
      color: 'text-success',
      bg: 'bg-success-100'
    },
    { 
      label: 'Total Orders', 
      value: '1,247', 
      change: '+8.3%', 
      icon: ShoppingBag, 
      color: 'text-info',
      bg: 'bg-info-100'
    },
    { 
      label: 'Total Customers', 
      value: '3,456', 
      change: '+15.2%', 
      icon: Users, 
      color: 'text-primary',
      bg: 'bg-primary-100'
    },
    { 
      label: 'Conversion Rate', 
      value: '3.2%', 
      change: '+0.8%', 
      icon: TrendingUp, 
      color: 'text-warning',
      bg: 'bg-warning-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div key={index} className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <span className="text-sm font-semibold text-success">
              {stat.change}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-text">{stat.value}</h3>
          <p className="mt-1 text-sm text-muted">{stat.label}</p>
        </div>
      ))}
    </div>
  );
};

// ============================================
// RECENT ORDERS TABLE
// ============================================

const RecentOrdersTable: React.FC<{ orders: Order[] }> = ({ orders }) => {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-border p-6">
        <h3 className="text-lg font-semibold text-text">Recent Orders</h3>
        <button className="font-medium text-sm text-primary hover:text-primary-hover">
          View All
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-background/80">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">Payment</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((order) => (
              <tr key={order.id} className="transition-colors hover:bg-surface-alt">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-text">{order.id}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-text">{order.customer.name}</div>
                    <div className="text-xs text-muted">{order.customer.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-semibold text-text">{formatCurrency(order.total)}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                    {toTitle(order.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.payment_status)}`}>
                    {toTitle(order.payment_status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                  {formatDate(order.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button className="text-muted transition-colors hover:text-text">
                    <MoreVertical size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================
// PRODUCT GRID COMPONENT
// ============================================

const ProductGrid: React.FC<{ products: Product[] }> = ({ products }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const renderGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => (
        <div key={product.id} className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition-shadow hover:shadow-lg">
          <div className="relative h-48 bg-background">
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            <span className={`absolute top-2 right-2 px-2 py-1 text-xs rounded-full ${getStatusColor(product.status)}`}>
              {toTitle(product.status)}
            </span>
          </div>
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="truncate text-sm font-semibold text-text">{product.name}</h4>
                <p className="text-xs text-muted">{product.sku}</p>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-xs font-medium text-muted">{product.rating}</span>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <span className="text-lg font-bold text-text">{formatCurrency(product.price)}</span>
                <span className="ml-1 text-xs text-muted line-through">{formatCurrency(product.cost)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-muted">Stock: {product.stock}</span>
                <button className="rounded-lg p-1.5 text-primary transition-colors hover:bg-primary-50">
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderList = () => (
    <div className="space-y-3">
      {products.map((product) => (
        <div key={product.id} className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-lg">
          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-background">
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="truncate text-sm font-semibold text-text">{product.name}</h4>
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(product.status)}`}>
                {toTitle(product.status)}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-xs text-muted">SKU: {product.sku}</span>
              <span className="text-xs text-muted">Stock: {product.stock}</span>
              <div className="flex items-center">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="ml-1 text-xs font-medium text-muted">{product.rating}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-lg font-bold text-text">{formatCurrency(product.price)}</span>
              <span className="ml-1 text-xs text-muted line-through">{formatCurrency(product.cost)}</span>
            </div>
            <button className="rounded-lg p-2 text-primary transition-colors hover:bg-surface-alt">
              <Edit size={18} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`rounded-lg p-2 transition-colors ${viewMode === 'grid' ? 'bg-surface-alt text-primary' : 'text-muted hover:text-text'}`}
          >
            <Grid size={20} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`rounded-lg p-2 transition-colors ${viewMode === 'list' ? 'bg-surface-alt text-primary' : 'text-muted hover:text-text'}`}
          >
            <List size={20} />
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted">{products.length} products</span>
          <button className="p-2 text-muted transition-colors hover:text-text">
            <Filter size={18} />
          </button>
        </div>
      </div>
      {viewMode === 'grid' ? renderGrid() : renderList()}
    </div>
  );
};

// ============================================
// SIDEBAR NAVIGATION
// ============================================

interface SidebarNavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  children?: SidebarNavItem[];
}

type WorkspaceRole = 'admin' | 'business';

const mapModulesToSidebarNav = (modules: ModuleResponse[]): SidebarNavItem[] => {
  return modules.map((module) => ({
    id: module.code,
    label: module.name,
    icon: module.icon || 'LayoutDashboard',
    path: module.path,
    children: module.children?.map((child) => ({
      id: child.code,
      label: child.name,
      icon: child.icon || 'LayoutDashboard',
      path: child.path,
    })),
  }));
};

const ADMIN_SIDEBAR_NAV: SidebarNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', path: '/admin/dashboard' },
  { 
    id: 'sales', 
    label: 'Sales', 
    icon: 'ShoppingBag', 
    path: '/admin/sales',
    children: [
      { id: 'orders', label: 'Orders', icon: 'ShoppingCart', path: '/admin/sales/orders' },
      { id: 'returns', label: 'Returns', icon: 'Undo2', path: '/admin/sales/returns' },
      { id: 'invoices', label: 'Invoices', icon: 'FileText', path: '/admin/sales/invoices' },
    ]
  },
  { 
    id: 'products', 
    label: 'Products', 
    icon: 'Package', 
    path: '/admin/products',
    children: [
      { id: 'catalog', label: 'Catalog', icon: 'Box', path: '/admin/products/catalog' },
      { id: 'categories', label: 'Categories', icon: 'Layers', path: '/admin/products/categories' },
      { id: 'inventory', label: 'Inventory', icon: 'ClipboardList', path: '/admin/products/inventory' },
    ]
  },
  { 
    id: 'customers', 
    label: 'Customers', 
    icon: 'Users', 
    path: '/admin/customers',
    children: [
      { id: 'all', label: 'All Customers', icon: 'User', path: '/admin/customers' },
      { id: 'loyalty', label: 'Loyalty Program', icon: 'Award', path: '/admin/customers/loyalty' },
    ]
  },
  { 
    id: 'pos', 
    label: 'Point of Sale', 
    icon: 'CreditCard', 
    path: '/admin/terminal' 
  },
  { 
    id: 'reports', 
    label: 'Reports', 
    icon: 'PieChart', 
    path: '/admin/reports',
    children: [
      { id: 'analytics', label: 'Analytics', icon: 'TrendingUp', path: '/admin/reports/analytics' },
      { id: 'tax', label: 'Tax Reports', icon: 'Percent', path: '/admin/reports/tax' },
    ]
  },
  { 
    id: 'settings', 
    label: 'Settings', 
    icon: 'Settings', 
    path: '/admin/settings',
    children: [
      { id: 'store', label: 'Store Settings', icon: 'Store', path: '/admin/settings/store' },
      { id: 'payment', label: 'Payment Methods', icon: 'CreditCard', path: '/admin/settings/payment' },
      { id: 'shipping', label: 'Shipping', icon: 'Truck', path: '/admin/settings/shipping' },
    ]
  },
];

const BUSINESS_SIDEBAR_NAV: SidebarNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', path: '/business/dashboard' },
  { 
    id: 'sales', 
    label: 'Sales', 
    icon: 'ShoppingBag', 
    path: '/business/sales',
    children: [
      { id: 'orders', label: 'Orders', icon: 'ShoppingCart', path: '/business/sales/orders' },
      { id: 'invoices', label: 'Invoices', icon: 'FileText', path: '/business/sales/invoices' },
    ]
  },
  { 
    id: 'products', 
    label: 'Products', 
    icon: 'Package', 
    path: '/business/products',
    children: [
      { id: 'catalog', label: 'Catalog', icon: 'Box', path: '/business/products/catalog' },
      { id: 'inventory', label: 'Inventory', icon: 'ClipboardList', path: '/business/products/inventory' },
    ]
  },
  { 
    id: 'customers', 
    label: 'Customers', 
    icon: 'Users', 
    path: '/business/customers',
    children: [
      { id: 'all', label: 'All Customers', icon: 'User', path: '/business/customers' },
      { id: 'loyalty', label: 'Loyalty Program', icon: 'Award', path: '/business/customers/loyalty' },
    ]
  },
  { 
    id: 'reports', 
    label: 'Reports', 
    icon: 'PieChart', 
    path: '/business/reports',
    children: [
      { id: 'analytics', label: 'Analytics', icon: 'TrendingUp', path: '/business/reports/analytics' },
      { id: 'tax', label: 'Tax Reports', icon: 'Percent', path: '/business/reports/tax' },
    ]
  },
  { 
    id: 'settings', 
    label: 'Settings', 
    icon: 'Settings', 
    path: '/business/settings',
    children: [
      { id: 'store', label: 'Store Settings', icon: 'Store', path: '/business/settings/store' },
      { id: 'payment', label: 'Payment Methods', icon: 'CreditCard', path: '/business/settings/payment' },
    ]
  },
];

const NAV_BY_ROLE: Record<WorkspaceRole, SidebarNavItem[]> = {
  admin: ADMIN_SIDEBAR_NAV,
  business: BUSINESS_SIDEBAR_NAV,
};

// ============================================
// MAIN APP LAYOUT COMPONENT
// ============================================

const AppLayout: React.FC = () => {
  // State
  const { theme, setTheme } = useTheme();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuSearch, setMenuSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [loadingNotifications] = useState(false);

  // Refs
  const sidebarRef = useRef<HTMLElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const menuSearchInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const workspaceRole = useMemo(() => getWorkspaceSlug(user), [user]);
  const workspaceLabel = useMemo(() => getWorkspaceLabel(user), [user]);
  const activeSidebarNav = useMemo(
    () =>
      (user?.modules?.length
        ? mapModulesToSidebarNav(user.modules)
        : NAV_BY_ROLE[workspaceRole as WorkspaceRole] ?? NAV_BY_ROLE.admin),
    [user?.modules, workspaceRole],
  );

  // Memoized values
  const filteredModules = useMemo(() => {
    if (!menuSearch.trim()) return activeSidebarNav;
    return activeSidebarNav.filter(category => {
      const categoryMatch = category.label.toLowerCase().includes(menuSearch.toLowerCase());
      if (categoryMatch) return true;
      if (category.children) {
        return category.children.some(child => 
          child.label.toLowerCase().includes(menuSearch.toLowerCase())
        );
      }
      return false;
    }).map(category => ({
      ...category,
      children: category.children?.filter(child =>
        child.label.toLowerCase().includes(menuSearch.toLowerCase())
      )
    }));
  }, [activeSidebarNav, menuSearch]);

  const routeInfo = useMemo(() => {
    const segments = location.pathname.split("/").filter(Boolean);
    const section = segments[segments.length - 1] || "dashboard";
    return {
      category: workspaceLabel,
      title: toTitle(section)
    };
  }, [location.pathname, workspaceLabel]);

  // Handlers
  const handleNavigation = useCallback((path: string) => {
    navigate(path);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [navigate]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      toast.success('Data refreshed successfully');
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleThemeChange = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
  }, [setTheme]);

  const handleMarkAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    toast.success('Notification marked as read');
  }, []);

  const handleMarkAllAsRead = useCallback(() => {
    setNotifications([]);
    toast.success('All notifications marked as read');
  }, []);

  const clearMenuSearch = useCallback(() => {
    setMenuSearch('');
    menuSearchInputRef.current?.focus();
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch {
      toast.error('Unable to log out right now.');
    } finally {
      navigate('/login', { replace: true });
    }
  }, [logout, navigate]);

  // Effects
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarOpen && window.innerWidth < 1024) {
        if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node) &&
          !(event.target as Element).closest('.menu-button')) {
          setSidebarOpen(false);
        }
      }
      if (showNotifications && notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarOpen, showNotifications]);

  // Render sidebar navigation
  const renderSidebarNav = () => (
    <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
      {filteredModules.map((category) => (
        <div key={category.id} className={sidebarCollapsed ? 'hidden' : ''}>
          <div className="px-3 mb-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted/80">
              {category.label}
            </div>
          </div>
          <div className="space-y-1">
            {category.children ? (
              category.children.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                    ${location.pathname === item.path
                      ? 'border border-border bg-surface-alt text-primary'
                      : 'text-muted hover:bg-surface-alt hover:text-text'
                    }`}
                  title={item.label}
                >
                  <DynamicIcon
                    iconName={item.icon}
                    size={20}
                    className="flex-shrink-0"
                  />
                  {!sidebarCollapsed && (
                    <span className="font-medium text-sm truncate">{item.label}</span>
                  )}
                </button>
              ))
            ) : (
              <button
                onClick={() => handleNavigation(category.path)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                  ${location.pathname === category.path
                    ? 'border border-border bg-surface-alt text-primary'
                    : 'text-muted hover:bg-surface-alt hover:text-text'
                  }`}
                title={category.label}
              >
                <DynamicIcon
                  iconName={category.icon}
                  size={20}
                  className="flex-shrink-0"
                />
                {!sidebarCollapsed && (
                  <span className="font-medium text-sm truncate">{category.label}</span>
                )}
              </button>
            )}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background text-text transition-colors duration-300">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="menu-button fixed left-4 top-4 z-50 rounded-lg border border-border bg-surface p-2 text-text shadow-lg lg:hidden"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`
          fixed inset-y-0 left-0 z-40 flex h-full flex-col border-r border-border bg-surface
          transform transition-transform duration-300 ease-in-out lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}
          shadow-xl lg:shadow-none
        `}
      >
        {/* Logo Section */}
        <div className="border-b border-border p-6">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            {!sidebarCollapsed ? (
              <>
                <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleNavigation(`/${workspaceRole}/dashboard`)}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary font-bold text-lg text-white shadow-md">
                    P
                  </div>
                  <div>
                    <div className="text-xl font-bold text-text">POS Pro</div>
                    <div className="text-xs font-medium text-primary">Ecommerce</div>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="rounded-lg p-2 transition-colors hover:bg-surface-alt"
                >
                  <ChevronLeft size={20} />
                </button>
              </>
            ) : (
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="rounded-lg p-2 transition-colors hover:bg-surface-alt"
              >
                <ChevronRight size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Menu Search */}
        {!sidebarCollapsed && (
          <div className="border-b border-border p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input
                ref={menuSearchInputRef}
                type="text"
                placeholder="Search menu..."
                className="w-full rounded-lg border border-border bg-background px-10 py-2 text-sm text-text outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary-100"
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
              />
              {menuSearch && (
                <button
                  type="button"
                  onClick={clearMenuSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted transition-colors hover:bg-surface-alt hover:text-text"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        {renderSidebarNav()}

        {/* User Profile */}
        <div className="border-t border-border bg-surface-alt/40 p-4">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            {!sidebarCollapsed ? (
              <>
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white shadow-md">
                    {(user?.fullName ?? 'User')
                      .split(' ')
                      .map((part) => part[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-text">{user?.fullName ?? 'John Doe'}</div>
                    <div className="truncate text-xs text-muted">
                      {user?.roles?.[0]?.name ?? workspaceLabel}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-alt hover:text-text disabled:opacity-50"
                    title="Refresh"
                  >
                    <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                  </button>
                  <button
                    onClick={handleLogout}
                    className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-alt hover:text-danger"
                    title="Logout"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-alt hover:text-text disabled:opacity-50"
                >
                  <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                </button>
                <button
                  onClick={handleLogout}
                  className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-alt hover:text-danger"
                >
                  <LogOut size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`
        min-h-screen transition-all duration-300
        ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}
      `}>
        {/* Top Navigation */}
        <nav className="sticky top-0 z-30 border-b border-border bg-surface/80 px-3 py-3 backdrop-blur-md md:px-6 md:py-4">
          <div className="flex items-center justify-between gap-2 md:gap-3">
            {/* Breadcrumb */}
            <div className="min-w-0 flex-1 pl-12 lg:pl-0">
              <div className="flex min-w-0 items-center space-x-1.5 text-xs text-muted sm:text-sm">
                <Home size={14} />
                <span>/</span>
                <span className="truncate">{routeInfo.category}</span>
                <span>/</span>
                <span className="truncate font-medium text-text">
                  {routeInfo.title}
                </span>
              </div>
              <h1 className="mt-1 truncate text-base font-bold text-text sm:text-xl">
                {routeInfo.title}
              </h1>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-2 md:gap-3">
              {/* Global Search */}
              <div className="hidden md:block relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input
                  type="text"
                  placeholder="Search products, orders..."
                  className="w-64 rounded-lg border border-border bg-surface py-2 pl-10 pr-4 text-sm text-text outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary-100"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Theme Switcher */}
              <ThemeSwitcher theme={theme} onThemeChange={handleThemeChange} />

              {/* Notifications */}
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative rounded-lg p-2 text-muted transition-colors hover:bg-surface-alt hover:text-text"
                >
                  {notifications.length > 0 ? <BellRing size={22} /> : <Bell size={22} />}
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger px-1 text-xs text-white">
                      {notifications.length > 99 ? '99+' : notifications.length}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 z-50 mt-2 max-h-[500px] w-96 overflow-hidden rounded-lg border border-border bg-surface shadow-xl">
                    <div className="border-b border-border p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-text">Notifications</h3>
                        {notifications.length > 0 && (
                          <button
                            onClick={handleMarkAllAsRead}
                            className="rounded-md bg-surface-alt px-3 py-1.5 text-xs font-medium text-primary transition hover:opacity-90"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {loadingNotifications ? (
                        <div className="p-8 text-center">
                          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <Bell className="mx-auto mb-3 h-12 w-12 text-muted/40" />
                          <p className="text-sm text-muted">No new notifications</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-border">
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className="cursor-pointer p-4 transition-colors hover:bg-surface-alt"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <div className="flex items-start space-x-3">
                                <div className="text-xl">🔔</div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-text">
                                    {notification.title}
                                  </p>
                                  <p className="mt-1 text-sm text-muted">
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center justify-between mt-3">
                                    <span className="flex items-center text-xs text-muted">
                                      <Clock size={12} className="mr-1" />
                                      {formatNotificationTime(notification.created_at)}
                                    </span>
                                    {!notification.read && (
                                      <span className="text-xs font-medium text-primary">New</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="hidden rounded-lg p-2 text-muted transition-colors hover:bg-surface-alt hover:text-danger sm:flex"
                title="Logout"
              >
                <LogOut size={22} />
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="w-full py-0 px-3 sm:px-4 lg:px-4">
          <Outlet />
        </main>
      </div>

    </div>
  );
};

export default AppLayout;
