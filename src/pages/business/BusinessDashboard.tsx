import React, { useState, useEffect, useMemo } from 'react';
import {
  // Core Icons
  TrendingUp, TrendingDown, ShoppingCart, Users, Package, AlertCircle,
  DollarSign, BarChart3, PieChart, Clock, Calendar, ChevronRight,
  Search, Filter, Download, RefreshCw, Eye, Settings, Bell,
  Home, ShoppingBag, Coffee, Layers, Tag, CreditCard, UserCheck,
  Truck, Warehouse, Award, Zap, AlertTriangle, Percent, Weight,
  Box, Activity, Battery, BatteryMedium, BatteryLow,
  CheckCircle, XCircle, ArrowUp, ArrowDown, MoreHorizontal,
  // New Icons
  Target, Shield, Sparkles, Gauge, Timer, BookOpen, Hash,
  Map, Globe, Sun, Moon, Cloud, CloudRain, Thermometer,
  UserPlus, UserMinus, Users2, Crown, Star, Heart,
  BarChart4, ScatterChart, Radar,
  GitBranch, GitCommit, GitPullRequest, GitMerge,
  Compass, Crosshair, Layers2,
  FileText, FileBarChart, FilePieChart, FileSpreadsheet,
  Send, Inbox, Mail, MessageSquare, MessageCircle,
  Phone, Video, Camera, Monitor, Smartphone, Tablet,
  Wifi, WifiOff, Bluetooth, BluetoothOff,
  Database, Server, Cloud as CloudIcon, HardDrive,
  ShieldCheck, ShieldAlert, ShieldOff,
  Lock, Unlock, Key, Fingerprint,
  Eye as EyeIcon, EyeOff, View,
  Radio, RadioTower, Satellite, Signal,
  GitFork, GitGraph, GitPullRequestArrow,
  Bot, Brain, Cpu, Microchip,
  Car, Bus, Train, Ship, Plane,
  Building, Building2, Factory, Store, Warehouse as WarehouseIcon,
  Coffee as CoffeeIcon, Utensils, Wine, Beer, Pizza,
  Scissors, Ruler, Scale, Weight as WeightIcon,
  Palette, Brush, Pencil, PenTool, Eraser,
  Music, Headphones, Mic, Radio as RadioIcon,
  Camera as CameraIcon, Video as VideoIcon, Film, Clapperboard,
  Gamepad, Puzzle, Trophy, Medal,
  Book, BookOpen as BookOpenIcon, GraduationCap, Library,
  Dumbbell, Bike, Activity as ActivityIcon,
  Flower, Leaf, Mountain, Waves,
  CloudRain as CloudRainIcon, CloudSnow, CloudLightning, CloudSun,
  // Navigation
  Menu, X, ChevronDown, ChevronUp, ChevronLeft,
  Maximize, Minimize, Minimize2, Maximize2,
  Plus, Minus, X as XIcon, Check,
  AlertTriangle as AlertTriangleIcon,
  Info, HelpCircle, LifeBuoy,
  // Status
  Circle, CircleDot, CircleCheck,
  Square, SquareDot, SquareCheck,
  Triangle,
  // Money
  Coins, Banknote, Wallet, PiggyBank,
  Receipt, ReceiptText, ReceiptSwissFranc,
  CreditCard as CreditCardIcon, Landmark,
  // Analytics
  TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon,
  Activity as ActivitySquare, LineChart as LineChartIcon,
  AreaChart, PieChart as PieChartIcon, ScatterChart as ScatterChartIcon,
  Radar as RadarIcon, Gauge as GaugeIcon,
} from 'lucide-react';

// ===================== EXTENDED MOCK DATA =====================
const mockData = {
  // A: Executive KPIs
  kpis: {
    netSales: 12450.75,
    prevNetSales: 11200.30,
    transactions: 342,
    prevTransactions: 310,
    atv: 36.40,
    prevAtv: 36.13,
    grossMargin: 38.5,
    prevGrossMargin: 37.2,
    totalWeight: 847.5,
    prevTotalWeight: 790.2,
    shrinkageAlerts: 3,
  },
  
  // B: Sales Trends
  salesTrend: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    current: [9800, 10200, 9500, 11500, 12450, 14200, 11800],
    previous: [9200, 9800, 9100, 10800, 11200, 13500, 11000],
  },
  hourlySales: Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    value: Math.floor(Math.random() * 800) + 200,
  })),
  paymentMethods: {
    cash: 42,
    mpesa: 31,
    card: 18,
    credit: 9,
  },
  categorySales: {
    cereals: 35,
    beverages: 20,
    household: 18,
    snacks: 15,
    other: 12,
  },
  returnRate: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    values: [2.1, 1.8, 2.4, 1.9, 2.2, 1.5, 1.7],
  },
  
  // C: Cereal Analytics
  weightedSales: [
    { name: 'Maize Flour', kg: 280 },
    { name: 'Rice', kg: 210 },
    { name: 'Beans', kg: 145 },
    { name: 'Wheat Flour', kg: 120 },
    { name: 'Sugar', kg: 92.5 },
  ],
  costFluctuation: {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    maize: [1.20, 1.22, 1.25, 1.28],
    rice: [2.10, 2.15, 2.12, 2.18],
    beans: [3.50, 3.45, 3.40, 3.35],
  },
  shrinkage: [
    { item: 'Maize Flour', expected: 285, actual: 280, difference: -5 },
    { item: 'Rice', expected: 215, actual: 210, difference: -5 },
    { item: 'Beans', expected: 150, actual: 148, difference: -2 },
    { item: 'Wheat Flour', expected: 125, actual: 120, difference: -5 },
    { item: 'Sugar', expected: 95, actual: 92, difference: -3 },
  ],
  expiryAlerts: [
    { item: 'Maize Flour', daysLeft: 45, status: 'warning' },
    { item: 'Beans', daysLeft: 22, status: 'danger' },
    { item: 'Rice', daysLeft: 60, status: 'success' },
    { item: 'Wheat Flour', daysLeft: 35, status: 'warning' },
  ],
  
  // D: Profitability
  marginMatrix: [
    { category: 'Cereals', volume: 35, margin: 22, revenue: 12450 },
    { category: 'Beverages', volume: 20, margin: 45, revenue: 8200 },
    { category: 'Household', volume: 18, margin: 38, revenue: 6800 },
    { category: 'Snacks', volume: 15, margin: 52, revenue: 5500 },
    { category: 'Other', volume: 12, margin: 30, revenue: 4200 },
  ],
  topMarginItems: [
    { name: 'Premium Coffee', margin: 65 },
    { name: 'Chocolate Bar', margin: 58 },
    { name: 'Hand Sanitizer', margin: 55 },
    { name: 'Cooking Oil', margin: 48 },
    { name: 'Toilet Paper', margin: 45 },
  ],
  lowMarginItems: [
    { name: 'Maize Flour', margin: 12 },
    { name: 'Bread', margin: 15 },
    { name: 'Salt', margin: 18 },
    { name: 'Rice', margin: 20 },
    { name: 'Sugar', margin: 22 },
  ],
  supplierCosts: [
    { supplier: 'AgriCorp', item: 'Maize Flour', current: 1.28, last: 1.20, change: 6.7 },
    { supplier: 'Grain Masters', item: 'Rice', current: 2.18, last: 2.10, change: 3.8 },
    { supplier: 'Bean Co.', item: 'Beans', current: 3.35, last: 3.50, change: -4.3 },
  ],
  
  // E: Inventory
  inventoryStatus: [
    { item: 'Maize Flour', stock: 45, reorderPoint: 50, status: 'danger' },
    { item: 'Rice', stock: 120, reorderPoint: 40, status: 'success' },
    { item: 'Beans', stock: 30, reorderPoint: 35, status: 'warning' },
    { item: 'Cooking Oil', stock: 85, reorderPoint: 30, status: 'success' },
    { item: 'Sugar', stock: 15, reorderPoint: 25, status: 'danger' },
    { item: 'Salt', stock: 200, reorderPoint: 50, status: 'success' },
  ],
  daysOfStock: {
    maize: 12,
    rice: 18,
    beans: 8,
    oil: 25,
    sugar: 5,
  },
  purchaseOrders: [
    { id: 'PO-2024-001', supplier: 'AgriCorp', items: 3, expected: '2024-07-12', received: 60 },
    { id: 'PO-2024-002', supplier: 'Grain Masters', items: 2, expected: '2024-07-10', received: 100 },
    { id: 'PO-2024-003', supplier: 'Bean Co.', items: 1, expected: '2024-07-08', received: 0 },
  ],
  deadStock: [
    { name: 'Millet', daysWithoutSale: 45 },
    { name: 'Buckwheat', daysWithoutSale: 38 },
    { name: 'Barley', daysWithoutSale: 32 },
  ],
  
  // F: Staff & Customers
  staffPerformance: [
    { name: 'Grace M.', sales: 4850, transactions: 142, atv: 34.15 },
    { name: 'Peter O.', sales: 4200, transactions: 110, atv: 38.18 },
    { name: 'Sarah K.', sales: 3400, transactions: 90, atv: 37.78 },
    { name: 'James N.', sales: 0, transactions: 0, atv: 0 },
  ],
  staffOverrides: [
    { name: 'Grace M.', overrides: 4, baseline: 3 },
    { name: 'Peter O.', overrides: 7, baseline: 3 },
    { name: 'Sarah K.', overrides: 2, baseline: 3 },
    { name: 'James N.', overrides: 0, baseline: 3 },
  ],
  basketAffinity: [
    { itemA: 'Maize Flour', itemB: 'Sugar', support: 72 },
    { itemA: 'Rice', itemB: 'Beans', support: 58 },
    { itemA: 'Cooking Oil', itemB: 'Salt', support: 45 },
    { itemA: 'Bread', itemB: 'Butter', support: 38 },
  ],
  customerLoyalty: {
    new: 28,
    returning: 72,
  },
  hourlyTraffic: Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    transactions: Math.floor(Math.random() * 25) + 5,
    staff: i >= 8 && i < 20 ? Math.floor(i / 4) + 1 : 0,
  })),
  
  // G: Cash Operations
  cashOverShort: 12.50,
  denominationForecast: {
    '1000': 5,
    '500': 12,
    '200': 8,
    '100': 15,
    '50': 20,
    '20': 30,
  },
  negativeInventory: [
    { item: 'Maize Flour', qty: -3 },
    { item: 'Beans', qty: -2 },
  ],
  voidReturnRatio: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    values: [3.2, 2.8, 3.5, 2.5, 3.0, 2.2, 2.4],
  },
  
  // H: Alerts
  alerts: [
    { type: 'stockout', message: 'Maize Flour just sold the last unit. Reorder now!', time: '2 min ago' },
    { type: 'delivery', message: 'PO #002 from Grain Masters is 1 day late.', time: '5 min ago' },
    { type: 'transaction', message: 'Transaction #456 exceeds $500 - requires manager review.', time: '12 min ago' },
    { type: 'price', message: "Peter O. changed price of Rice from $2.18 to $2.05 at 2:15 PM.", time: '28 min ago' },
  ],

  // I: PREDICTIVE ANALYTICS
  demandForecast: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    actual: [9800, 10200, 9500, 11500, 12450, 14200, 11800],
    predicted: [10100, 10700, 10000, 11900, 12800, 14500, 12000],
    lowerBound: [9500, 10000, 9400, 11200, 12100, 13800, 11400],
    upperBound: [10700, 11400, 10600, 12600, 13500, 15200, 12600],
  },
  seasonalIndex: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    cereals: [0.8, 0.7, 0.9, 1.1, 1.2, 1.0, 0.9, 0.8, 1.0, 1.3, 1.4, 1.2],
    beverages: [1.1, 1.0, 1.2, 1.3, 1.4, 1.5, 1.6, 1.5, 1.3, 1.1, 1.0, 0.9],
    household: [1.0, 0.9, 1.0, 1.1, 1.0, 1.0, 1.1, 1.2, 1.1, 1.0, 0.9, 0.8],
  },
  promotionUplift: [
    { promotion: 'Rice 20% Off', before: 1200, after: 1608, uplift: 34 },
    { promotion: 'Maize Bundle', before: 900, after: 1143, uplift: 27 },
    { promotion: 'Sugar BOGO', before: 600, after: 720, uplift: 20 },
  ],
  customerLTV: [
    { customer: 'A001', ltv: 4500, frequency: 12, recency: 2 },
    { customer: 'A002', ltv: 3200, frequency: 8, recency: 5 },
    { customer: 'A003', ltv: 2100, frequency: 6, recency: 1 },
    { customer: 'A004', ltv: 1800, frequency: 4, recency: 10 },
    { customer: 'A005', ltv: 1500, frequency: 3, recency: 15 },
    { customer: 'A006', ltv: 1200, frequency: 2, recency: 8 },
    { customer: 'A007', ltv: 900, frequency: 1, recency: 20 },
    { customer: 'A008', ltv: 600, frequency: 1, recency: 30 },
  ],

  // J: ADVANCED INVENTORY
  abcClassification: {
    a: [{ name: 'Maize Flour', revenue: 4500 }, { name: 'Rice', revenue: 3800 }, { name: 'Cooking Oil', revenue: 2800 }],
    b: [{ name: 'Beans', revenue: 1800 }, { name: 'Sugar', revenue: 1200 }, { name: 'Salt', revenue: 800 }],
    c: [{ name: 'Millet', revenue: 300 }, { name: 'Buckwheat', revenue: 200 }, { name: 'Barley', revenue: 150 }],
  },
  safetyStock: {
    'Maize Flour': 75,
    'Rice': 60,
    'Beans': 50,
    'Sugar': 40,
    'Cooking Oil': 30,
  },
  stockoutCost: 1450,
  excessInventoryCost: 8200,
  reorderEfficiency: 78,
  leadTimeVariability: {
    min: 2,
    max: 7,
    median: 3.5,
    q1: 3,
    q3: 5,
  },
  daysInventoryOutstanding: {
    labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'],
    values: [45, 42, 48, 44, 40, 38, 42, 39],
  },

  // K: FINANCIAL DEEP DIVE
  netProfit: 2850,
  contributionMargin: {
    cereals: 22,
    beverages: 45,
    household: 38,
    snacks: 52,
    other: 30,
  },
  breakEven: 8500,
  salesPerSquareFoot: 185.50,
  profitPerTransaction: 8.33,
  cashConversionCycle: 28,
  minimumViableStock: 12500,

  // L: ADVANCED CUSTOMER
  customerSegments: [
    { segment: 'VIP', frequency: 95, monetary: 90, recency: 95 },
    { segment: 'Regular', frequency: 70, monetary: 65, recency: 75 },
    { segment: 'Occasional', frequency: 45, monetary: 40, recency: 50 },
    { segment: 'New', frequency: 20, monetary: 25, recency: 90 },
    { segment: 'At Risk', frequency: 30, monetary: 35, recency: 20 },
    { segment: 'Churned', frequency: 5, monetary: 10, recency: 5 },
  ],
  churnRisk: [
    { customer: '#1234', daysSinceLast: 21, risk: 'High' },
    { customer: '#5678', daysSinceLast: 12, risk: 'Medium' },
    { customer: '#9012', daysSinceLast: 5, risk: 'Low' },
    { customer: '#3456', daysSinceLast: 28, risk: 'Critical' },
  ],
  basketComposition: {
    cereals: 60,
    household: 20,
    snacks: 20,
  },
  purchaseCycle: {
    labels: ['0-2', '3-5', '6-8', '9-11', '12-14', '15-21', '22-30', '30+'],
    values: [45, 60, 50, 35, 25, 20, 10, 5],
  },
  customerMigration: {
    new: 100,
    occasional: 65,
    regular: 40,
    vip: 20,
    churned: 15,
  },
  referralValue: [
    { customer: 'Grace', referrals: 5, value: 1200 },
    { customer: 'Peter', referrals: 3, value: 800 },
    { customer: 'Sarah', referrals: 2, value: 450 },
  ],

  // M: OPERATIONAL
  queueLength: 2.3,
  transactionTime: {
    fast: 45,
    average: 78,
    slow: 120,
  },
  shelfReplenishmentLag: [
    { item: 'Maize Flour', lag: 4 },
    { item: 'Sugar', lag: 3.5 },
    { item: 'Cooking Oil', lag: 6 },
  ],
  priceChangeFrequency: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    values: [3, 2, 5, 1, 4, 2, 1],
  },
  discountAbuseScore: 12.5,
  scanningAccuracy: 98.7,
  staffUtilization: 68,

  // N: PRODUCT PERFORMANCE
  productLifecycle: {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
    newProduct: [100, 180, 250, 320, 380, 420, 450, 470],
    matureProduct: [500, 490, 480, 470, 460, 450, 440, 430],
    decliningProduct: [300, 280, 250, 210, 180, 150, 120, 100],
  },
  priceElasticity: {
    labels: ['Maize', 'Rice', 'Beans', 'Sugar', 'Oil'],
    elasticity: [-0.5, -0.8, -0.3, -0.6, -0.4],
  },
  shelfSpaceROI: {
    'Maize Flour': 85,
    'Rice': 72,
    'Beans': 45,
    'Sugar': 38,
    'Oil': 65,
    'Salt': 20,
  },
  substitutionRate: 45,
  newProductAdoption: {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
    values: [5, 12, 25, 40, 55, 70],
  },
  competitorPriceIndex: {
    'Maize Flour': 95,
    'Rice': 102,
    'Beans': 98,
    'Sugar': 100,
    'Oil': 97,
  },
  haloEffect: {
    'Maize Flour': ['Sugar', 'Cooking Oil', 'Salt'],
    'Rice': ['Beans', 'Cooking Oil'],
    'Bread': ['Butter', 'Jam'],
  },

  // O: SUPPLIER
  supplierScorecard: {
    agriCorp: { price: 85, quality: 90, delivery: 75, communication: 80 },
    grainMasters: { price: 75, quality: 85, delivery: 95, communication: 85 },
    beanCo: { price: 90, quality: 80, delivery: 85, communication: 75 },
  },
  bulkDiscountImpact: 140,
  supplierConcentration: {
    'AgriCorp': 65,
    'Grain Masters': 25,
    'Bean Co.': 10,
  },
  costVolatility: {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
    values: [1.20, 1.22, 1.18, 1.25, 1.30, 1.28, 1.32, 1.28],
  },
  poApprovalCycle: {
    labels: ['0-1h', '1-4h', '4-12h', '12-24h', '24-48h', '48h+'],
    values: [25, 35, 20, 12, 5, 3],
  },
  qualityRejectRate: 3.2,
  earlyPaymentDiscountCapture: 67,

  // P: ANOMALIES
  anomalies: [
    { type: 'sales_spike', message: 'Sales spike detected: 3x normal at 8 AM today', severity: 'high' },
    { type: 'return_pattern', message: 'Unusual return pattern for Maize Flour (5x normal)', severity: 'medium' },
    { type: 'employee_outlier', message: "Grace's sales 40% above average today - high performer!", severity: 'low' },
    { type: 'fraud_alert', message: 'Multiple large cash transactions in short time - review required', severity: 'critical' },
    { type: 'reconciliation', message: 'Physical count vs system: -25 units of Sugar', severity: 'high' },
    { type: 'seasonal_break', message: 'Cereal sales NOT following usual seasonal pattern', severity: 'medium' },
  ],
  weatherImpact: {
    labels: ['Sunny', 'Cloudy', 'Rainy', 'Stormy'],
    sales: [12000, 11500, 9800, 8500],
  },

  // Q: BUSINESS HEALTH
  businessHealth: 78,
  healthBreakdown: {
    sales: 85,
    inventory: 72,
    cash: 68,
    staff: 82,
    customers: 78,
    suppliers: 70,
  },
  benchmarks: 82,
  goalAchievement: {
    sales: 92,
    profit: 88,
    inventory: 95,
    customers: 80,
    staff: 90,
  },
  riskScore: 23,
};

// ===================== HELPER COMPONENTS =====================

type IconComponent = React.ComponentType<{ className?: string }>;
type KPICardColor = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'teal' | 'indigo';
type ProgressRingColor = 'blue' | 'green' | 'orange' | 'red' | 'purple';
type AlertType = 'stockout' | 'delivery' | 'transaction' | 'price';
type Severity = 'critical' | 'high' | 'medium' | 'low';
type HealthKey = keyof typeof mockData.healthBreakdown;

// KPI Card Component
const KPICard = ({ title, value, prevValue, icon: Icon, suffix = '', prefix = '', trend = true, color = 'blue' }: {
  title: string;
  value: number;
  prevValue?: number;
  icon: IconComponent;
  suffix?: string;
  prefix?: string;
  trend?: boolean;
  color?: KPICardColor;
}) => {
  const change = prevValue ? ((value - prevValue) / prevValue * 100) : 0;
  const isPositive = change >= 0;
  const colorClasses: Record<KPICardColor, string> = {
    blue: 'bg-blue-50 border-gray-200',
    green: 'bg-green-50 border-gray-200',
    purple: 'bg-purple-50 border-gray-200',
    orange: 'bg-orange-50 border-gray-200',
    red: 'bg-red-50 border-gray-200',
    teal: 'bg-teal-50 border-gray-200',
    indigo: 'bg-indigo-50 border-gray-200',
  };
  
  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color]} transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold mt-1">
            {prefix}{typeof value === 'number' ? value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : value}{suffix}
          </p>
        </div>
        <div className="p-2 bg-white rounded-lg shadow-sm">
          <Icon className="w-5 h-5 text-gray-700" />
        </div>
      </div>
      {trend && prevValue !== undefined && (
        <div className="flex items-center mt-2 text-xs">
          <span className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <ArrowUp className="w-3 h-3 mr-0.5" /> : <ArrowDown className="w-3 h-3 mr-0.5" />}
            {Math.abs(change).toFixed(1)}%
          </span>
          <span className="text-gray-500 ml-2">vs yesterday</span>
        </div>
      )}
    </div>
  );
};

// Progress Ring Component
const ProgressRing = ({ value, max = 100, color = 'blue', size = 80, label = '' }: {
  value: number;
  max?: number;
  color?: ProgressRingColor;
  size?: number;
  label?: string;
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  
  const colorMap = {
    blue: '#3B82F6',
    green: '#22C55E',
    orange: '#F59E0B',
    red: '#EF4444',
    purple: '#8B5CF6',
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={colorMap[color]}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold">{Math.round(percentage)}%</span>
        </div>
      </div>
      {label && <span className="text-xs text-gray-500 mt-1">{label}</span>}
    </div>
  );
};

// Chart Components
const LineChart = ({ data, labels, height = 200, colors = ['#3B82F6', '#EF4444'] }: {
  data: number[][];
  labels: string[];
  height?: number;
  colors?: string[];
}) => {
  const maxValue = Math.max(...data.flat()) * 1.1;
  const width = 100;
  const innerHeight = height - 20;
  
  return (
    <div className="relative" style={{ height }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {data.map((dataset, di) => (
          <polyline
            key={di}
            points={dataset.map((val, i) => {
              const x = (dataset.length === 1 ? 0.5 : i / (dataset.length - 1)) * width;
              const y = height - (val / maxValue) * innerHeight;
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke={colors[di % colors.length]}
            strokeWidth="2"
            className="transition-all duration-500"
          />
        ))}
        {data.map((dataset, di) => (
          dataset.map((val, i) => (
            <circle
              key={`${di}-${i}`}
              cx={(dataset.length === 1 ? 0.5 : i / (dataset.length - 1)) * width}
              cy={height - (val / maxValue) * innerHeight}
              r="3"
              fill={colors[di % colors.length]}
              className="transition-all duration-500"
            />
          ))
        ))}
      </svg>
      <div className="flex justify-between mt-1">
        {labels.map((label, i) => (
          <span key={i} className="text-[10px] text-gray-400">{label}</span>
        ))}
      </div>
    </div>
  );
};

const BarChart = ({ data, labels, height = 200, color = '#3B82F6', horizontal = false }: {
  data: number[];
  labels: string[];
  height?: number;
  color?: string;
  horizontal?: boolean;
}) => {
  const maxValue = Math.max(...data) * 1.1;
  
  if (horizontal) {
    return (
      <div className="space-y-2">
        {data.map((val, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-gray-600 w-16 truncate">{labels[i]}</span>
            <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
              <div
                className="h-full rounded transition-all duration-700"
                style={{ width: `${(val / maxValue) * 100}%`, backgroundColor: color }}
              />
            </div>
            <span className="text-xs font-medium w-10 text-right">{val}</span>
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div className="relative" style={{ height }}>
      <div className="flex items-end gap-1 h-[calc(100%-20px)]">
        {data.map((val, i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div
              className="w-full rounded-t transition-all duration-700 hover:opacity-80"
              style={{ 
                height: `${(val / maxValue) * (height - 20)}px`,
                backgroundColor: color,
                minHeight: '4px'
              }}
            />
            <span className="text-[10px] text-gray-400 mt-1">{labels[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const RadarChart = ({ data, labels, height = 200 }: {
  data: number[];
  labels: string[];
  height?: number;
}) => {
  const maxValue = 100;
  const centerX = 100;
  const centerY = 100;
  const radius = 80;
  const numPoints = data.length;
  
  const getPoint = (index: number, value: number) => {
    const angle = (index / numPoints) * 2 * Math.PI - Math.PI / 2;
    const r = (value / maxValue) * radius;
    return {
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle),
    };
  };
  
  return (
    <div className="relative" style={{ height }}>
      <svg width="100%" height={height} viewBox="0 0 200 200">
        {/* Grid rings */}
        {[0.25, 0.5, 0.75, 1].map((level) => (
          <polygon
            key={level}
            points={Array.from({ length: numPoints }, (_, i) => {
              const angle = (i / numPoints) * 2 * Math.PI - Math.PI / 2;
              const r = level * radius;
              return `${centerX + r * Math.cos(angle)},${centerY + r * Math.sin(angle)}`;
            }).join(' ')}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="0.5"
          />
        ))}
        {/* Data polygon */}
        <polygon
          points={data.map((val, i) => {
            const p = getPoint(i, val);
            return `${p.x},${p.y}`;
          }).join(' ')}
          fill="rgba(59, 130, 246, 0.2)"
          stroke="#3B82F6"
          strokeWidth="2"
          className="transition-all duration-700"
        />
        {/* Labels */}
        {labels.map((label, i) => {
          const angle = (i / numPoints) * 2 * Math.PI - Math.PI / 2;
          const r = radius + 20;
          return (
            <text
              key={i}
              x={centerX + r * Math.cos(angle)}
              y={centerY + r * Math.sin(angle)}
              textAnchor="middle"
              dominantBaseline="central"
              className="text-[8px] fill-gray-600"
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

const Heatmap = ({ data, labels, height = 200 }: {
  data: Array<number | { value?: number; label?: string }>;
  labels: string[];
  height?: number;
}) => {
  const maxValue = Math.max(...data.map(d => typeof d === 'number' ? d : d.value ?? 0));
  
  return (
    <div className="grid" style={{ gridTemplateColumns: `repeat(${data.length}, 1fr)`, height }}>
      {data.map((item, i) => {
        const value = typeof item === 'number' ? item : item.value ?? 0;
        const intensity = (value / maxValue) * 100;
        return (
          <div key={i} className="flex flex-col items-center">
            <div
              className="w-full rounded transition-all duration-500"
              style={{
                height: `${(value / maxValue) * height}px`,
                backgroundColor: `rgba(59, 130, 246, ${0.2 + (intensity / 100) * 0.8})`,
                minHeight: '4px'
              }}
            />
            <span className="text-[8px] text-gray-400 mt-1">{labels[i]}</span>
          </div>
        );
      })}
    </div>
  );
};

// ===================== MAIN DASHBOARD =====================

export default function BusinessDashboard() {
  const [timeframe, setTimeframe] = useState('today');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAllSections, setShowAllSections] = useState(true);
  
  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Calculate business health score
  const healthBreakdownEntries = useMemo(
    () => Object.entries(mockData.healthBreakdown) as Array<[HealthKey, number]>,
    []
  );

  const healthScore = useMemo(() => {
    const weights = { sales: 0.25, inventory: 0.2, cash: 0.15, staff: 0.15, customers: 0.15, suppliers: 0.1 };
    let total = 0;
    healthBreakdownEntries.forEach(([key, value]) => {
      total += (value / 100) * weights[key];
    });
    return Math.round(total * 100);
  }, [healthBreakdownEntries]);

  const businessHighlights = useMemo(() => {
    const salesGrowth = ((mockData.kpis.netSales - mockData.kpis.prevNetSales) / mockData.kpis.prevNetSales) * 100;
    const transactionGrowth = ((mockData.kpis.transactions - mockData.kpis.prevTransactions) / mockData.kpis.prevTransactions) * 100;
    const avgBasketValue = mockData.kpis.netSales / mockData.kpis.transactions;
    const topCategory = Object.entries(mockData.categorySales).sort((a, b) => b[1] - a[1])[0];
    const inventoryWarnings = mockData.inventoryStatus.filter((item) => item.status !== 'success').length;
    const operationalPressure = mockData.alerts.length + mockData.anomalies.length;
    const retentionRate = mockData.customerLoyalty.returning;
    const forecastLift = Math.round(
      ((mockData.demandForecast.predicted[mockData.demandForecast.predicted.length - 1] - mockData.demandForecast.actual[mockData.demandForecast.actual.length - 1]) /
        mockData.demandForecast.actual[mockData.demandForecast.actual.length - 1]) * 100
    );

    return {
      salesGrowth,
      transactionGrowth,
      avgBasketValue,
      topCategory,
      inventoryWarnings,
      operationalPressure,
      retentionRate,
      forecastLift,
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 font-sans">
      {/* ===== HEADER ===== */}
      <div className="flex flex-wrap items-center justify-between  gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Business POS Dashboard</h1>
          <p className="text-sm text-gray-500">General Shop & Cereals Section • Real-time Analytics</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
            {['today', 'week', 'month'].map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  timeframe === t ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-green-50'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setShowAllSections(!showAllSections)}
            className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-green-50 transition-colors"
          >
            <Layout className="w-5 h-5 text-green-700" />
          </button>
          <button className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-green-50 transition-colors relative">
            <Bell className="w-5 h-5 text-green-700" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {mockData.alerts.length + mockData.anomalies.length}
            </span>
          </button>
          <button 
            onClick={handleRefresh}
            className={`p-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-green-50 transition-all ${refreshing ? 'rotate-180' : ''}`}
          >
            <RefreshCw className={`w-5 h-5 text-green-700 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button className="p-2 bg-green-600 text-white rounded-lg shadow-sm hover:bg-green-700 transition-colors">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ===== Q: BUSINESS HEALTH SCORE ===== */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
              <GaugeIcon className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Business Health Score</h2>
              <p className="text-green-100 text-sm">Overall performance across all metrics</p>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <p className="text-4xl font-bold text-white">{healthScore}</p>
              <p className="text-green-100 text-xs">/ 100</p>
            </div>
            <div className="h-12 w-px bg-white/30" />
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-white font-bold text-sm">{mockData.riskScore}</p>
                <p className="text-green-100 text-[10px]">Risk Score</p>
              </div>
              <div>
                <p className="text-white font-bold text-sm">Top {mockData.benchmarks}%</p>
                <p className="text-green-100 text-[10px]">Benchmark</p>
              </div>
              <div>
                <p className="text-white font-bold text-sm">✓</p>
                <p className="text-green-100 text-[10px]">Status</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-6 gap-2">
          {healthBreakdownEntries.map(([key, value]) => (
            <div key={key} className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center border border-white/10">
              <p className="text-white font-semibold text-sm">{value}%</p>
              <p className="text-green-100 text-[10px] capitalize">{key}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ===== SECTION A: EXECUTIVE KPI ROW ===== */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <KPICard 
          title="Net Sales" 
          value={mockData.kpis.netSales} 
          prevValue={mockData.kpis.prevNetSales}
          icon={DollarSign} 
          prefix="$"
          color="blue"
        />
        <KPICard 
          title="Transactions" 
          value={mockData.kpis.transactions} 
          prevValue={mockData.kpis.prevTransactions}
          icon={ShoppingCart} 
          color="green"
        />
        <KPICard 
          title="Avg. Transaction" 
          value={mockData.kpis.atv} 
          prevValue={mockData.kpis.prevAtv}
          icon={TrendingUp} 
          prefix="$"
          color="purple"
        />
        <KPICard 
          title="Gross Margin" 
          value={mockData.kpis.grossMargin} 
          prevValue={mockData.kpis.prevGrossMargin}
          icon={Percent} 
          suffix="%"
          color="green"
        />
        <KPICard 
          title="Weight Sold" 
          value={mockData.kpis.totalWeight} 
          prevValue={mockData.kpis.prevTotalWeight}
          icon={Weight} 
          suffix=" kg"
          color="orange"
        />
        <KPICard 
          title="Shrinkage Alerts" 
          value={mockData.kpis.shrinkageAlerts} 
          prevValue={0}
          icon={AlertTriangle} 
          color="red"
          trend={false}
        />
      </div>

      {/* ===== B: EXECUTIVE SNAPSHOT ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Sales Growth</p>
          <p className="text-2xl font-bold text-green-600">{businessHighlights.salesGrowth.toFixed(1)}%</p>
          <p className="text-xs text-gray-500">Compared with the previous period</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Transaction Momentum</p>
          <p className="text-2xl font-bold text-emerald-600">{businessHighlights.transactionGrowth.toFixed(1)}%</p>
          <p className="text-xs text-gray-500">Average basket value ${businessHighlights.avgBasketValue.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Customer Retention</p>
          <p className="text-2xl font-bold text-green-700">{businessHighlights.retentionRate}%</p>
          <p className="text-xs text-gray-500">Returning customers across the business</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Operational Pressure</p>
          <p className="text-2xl font-bold text-amber-600">{businessHighlights.operationalPressure}</p>
          <p className="text-xs text-gray-500">{businessHighlights.inventoryWarnings} inventory risks and live alerts</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Top Category</p>
          <p className="text-2xl font-bold text-gray-800 capitalize">{businessHighlights.topCategory[0]}</p>
          <p className="text-xs text-gray-500">{businessHighlights.topCategory[1]}% of category sales</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Forecast Lift</p>
          <p className="text-2xl font-bold text-green-600">{businessHighlights.forecastLift > 0 ? '+' : ''}{businessHighlights.forecastLift}%</p>
          <p className="text-xs text-gray-500">Predicted vs actual demand trend</p>
        </div>
      </div>

      {/* ===== I: PREDICTIVE ANALYTICS ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-600" />
              Demand Forecast (7-Day)
            </h3>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">AI Powered</span>
          </div>
          <div className="relative">
            <LineChart 
              data={[
                mockData.demandForecast.actual,
                mockData.demandForecast.predicted,
                mockData.demandForecast.upperBound,
                mockData.demandForecast.lowerBound,
              ]}
              labels={mockData.demandForecast.labels}
              colors={['#3B82F6', '#8B5CF6', '#F59E0B', '#F59E0B']}
              height={180}
            />
            <div className="flex flex-wrap justify-center gap-4 mt-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-blue-500"></div>
                <span className="text-gray-600">Actual</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-purple-500"></div>
                <span className="text-gray-600">Predicted</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-yellow-500"></div>
                <span className="text-gray-600">Confidence Band</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-emerald-100 rounded border border-gray-200"></div>
                <span className="text-gray-600">Accuracy: 89%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Sun className="w-4 h-4 text-yellow-500" />
            Seasonal Index
          </h3>
          <div className="h-40">
            <Heatmap 
              data={mockData.seasonalIndex.cereals.map((v, i) => ({
                label: mockData.seasonalIndex.labels[i],
                value: v
              }))}
              labels={mockData.seasonalIndex.labels}
              height={150}
            />
          </div>
          <div className="mt-2 text-center text-xs text-gray-500">
            Cereal sales peak in Oct-Dec (holiday season)
          </div>
        </div>
      </div>

      {/* ===== J: ADVANCED INVENTORY ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            ABC Classification (80/20 Rule)
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs">
                <span className="font-medium text-green-600">A Items (20% of items = 80% revenue)</span>
                <span>$11,100</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full mt-0.5">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '80%' }} />
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {mockData.abcClassification.a.map(item => (
                  <span key={item.name} className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs">
                <span className="font-medium text-yellow-600">B Items (30% of items = 15% revenue)</span>
                <span>$3,800</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full mt-0.5">
                <div className="h-full bg-yellow-500 rounded-full" style={{ width: '15%' }} />
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {mockData.abcClassification.b.map(item => (
                  <span key={item.name} className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs">
                <span className="font-medium text-red-600">C Items (50% of items = 5% revenue)</span>
                <span>$650</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full mt-0.5">
                <div className="h-full bg-red-500 rounded-full" style={{ width: '5%' }} />
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {mockData.abcClassification.c.map(item => (
                  <span key={item.name} className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            Safety Stock Recommendations
          </h3>
          <div className="space-y-2">
            {Object.entries(mockData.safetyStock).map(([item, qty]) => (
              <div key={item} className="flex items-center justify-between p-2 border-b last:border-0">
                <span className="text-sm">{item}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-blue-600">{qty} units</span>
                  <span className="text-xs text-gray-400">↑ 50%</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
            <div className="bg-gray-50 rounded p-2">
              <p className="font-bold text-red-600">${mockData.stockoutCost}</p>
              <p className="text-gray-500">Stockout Cost (Week)</p>
            </div>
            <div className="bg-gray-50 rounded p-2">
              <p className="font-bold text-orange-600">${mockData.excessInventoryCost}</p>
              <p className="text-gray-500">Excess Inventory Cost</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-green-600" />
            Inventory Efficiency
          </h3>
          <div className="flex flex-col items-center">
            <ProgressRing value={mockData.reorderEfficiency} color="green" label="Reorder Efficiency" />
            <div className="grid grid-cols-2 gap-3 w-full mt-4">
              <div className="text-center bg-gray-50 rounded p-2">
                <p className="text-xs text-gray-500">DIO</p>
                <p className="text-lg font-bold">{mockData.daysInventoryOutstanding.values[mockData.daysInventoryOutstanding.values.length - 1]} days</p>
              </div>
              <div className="text-center bg-gray-50 rounded p-2">
                <p className="text-xs text-gray-500">Lead Time</p>
                <p className="text-lg font-bold">{mockData.leadTimeVariability.median} days</p>
                <p className="text-[10px] text-gray-400">Range: {mockData.leadTimeVariability.min}-{mockData.leadTimeVariability.max}d</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== K: FINANCIAL DEEP DIVE ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Net Profit</p>
          <p className="text-2xl font-bold text-green-600">${mockData.netProfit}</p>
          <p className="text-xs text-gray-400">↑ 12% vs last week</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Break-Even Point</p>
          <p className="text-2xl font-bold text-orange-600">${mockData.breakEven}/day</p>
          <p className="text-xs text-green-600">✓ 146% of target</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Sales per Sq Ft</p>
          <p className="text-2xl font-bold text-blue-600">${mockData.salesPerSquareFoot}</p>
          <p className="text-xs text-gray-400">↑ 8% vs last month</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Cash Conversion Cycle</p>
          <p className="text-2xl font-bold text-purple-600">{mockData.cashConversionCycle} days</p>
          <p className="text-xs text-gray-400">↓ 3 days improvement</p>
        </div>
      </div>

      {/* ===== L: ADVANCED CUSTOMER ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Users2 className="w-4 h-4 text-indigo-600" />
            Customer Segmentation (RFM)
          </h3>
          <RadarChart 
            data={mockData.customerSegments[0] ? 
              [mockData.customerSegments[0].frequency, mockData.customerSegments[0].monetary, mockData.customerSegments[0].recency] : 
              [70, 65, 75]
            }
            labels={['Frequency', 'Monetary', 'Recency']}
            height={180}
          />
          <div className="grid grid-cols-3 gap-1 mt-2">
            {mockData.customerSegments.slice(0, 3).map((seg) => (
              <div key={seg.segment} className="text-center p-1 bg-gray-50 rounded">
                <p className="text-[10px] font-medium">{seg.segment}</p>
                <p className="text-[8px] text-gray-500">F:{seg.frequency} M:{seg.monetary}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <UserMinus className="w-4 h-4 text-red-600" />
            Churn Risk
          </h3>
          <div className="space-y-2">
            {mockData.churnRisk.map((customer) => (
              <div key={customer.customer} className="flex items-center justify-between p-2 border-b last:border-0">
                <div>
                  <span className="text-sm font-medium">{customer.customer}</span>
                  <span className="text-xs text-gray-400 ml-2">{customer.daysSinceLast} days</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  customer.risk === 'Critical' ? 'bg-red-100 text-red-700' :
                  customer.risk === 'High' ? 'bg-orange-100 text-orange-700' :
                  customer.risk === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {customer.risk}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-blue-600" />
            Basket Composition
          </h3>
          <div className="space-y-3">
            {Object.entries(mockData.basketComposition).map(([category, percentage]) => (
              <div key={category}>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 capitalize">{category}</span>
                  <span className="font-medium">{percentage}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-full bg-green-600 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Avg Purchase Cycle</span>
              <span className="font-medium">4.2 days</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== M: OPERATIONAL PERFORMANCE ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Queue Length
          </p>
          <p className="text-2xl font-bold text-orange-600">{mockData.queueLength} min</p>
          <p className="text-xs text-gray-400">↓ 12% vs peak</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <Timer className="w-3 h-3" /> Transaction Time
          </p>
          <p className="text-2xl font-bold text-blue-600">{mockData.transactionTime.average}s</p>
          <p className="text-xs text-gray-400">Fast: {mockData.transactionTime.fast}s • Slow: {mockData.transactionTime.slow}s</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <Scanning className="w-3 h-3" /> Scanning Accuracy
          </p>
          <p className="text-2xl font-bold text-green-600">{mockData.scanningAccuracy}%</p>
          <p className="text-xs text-gray-400">{100 - mockData.scanningAccuracy}% manual entry</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <Users className="w-3 h-3" /> Staff Utilization
          </p>
          <ProgressRing value={mockData.staffUtilization} color="green" size={60} />
        </div>
      </div>

      {/* ===== N: PRODUCT PERFORMANCE ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <LineChartIcon className="w-4 h-4 text-green-600" />
            Product Lifecycle
          </h3>
          <LineChart 
            data={[
              mockData.productLifecycle.newProduct,
              mockData.productLifecycle.matureProduct,
              mockData.productLifecycle.decliningProduct,
            ]}
            labels={mockData.productLifecycle.labels}
            colors={['#22C55E', '#3B82F6', '#EF4444']}
            height={150}
          />
          <div className="flex justify-center gap-4 mt-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-green-500"></div>
              <span className="text-gray-600">New</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-blue-500"></div>
              <span className="text-gray-600">Mature</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-red-500"></div>
              <span className="text-gray-600">Declining</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <ScatterChart className="w-4 h-4 text-purple-600" />
            Price Elasticity Index
          </h3>
          <div className="space-y-2">
            {mockData.priceElasticity.labels.map((item, i) => {
              const elasticity = mockData.priceElasticity.elasticity[i];
              const isElastic = elasticity < -0.6;
              return (
                <div key={item} className="flex items-center justify-between p-2 border-b last:border-0">
                  <span className="text-sm">{item}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${isElastic ? 'text-red-600' : 'text-green-600'}`}>
                      {elasticity.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {isElastic ? 'Elastic' : 'Inelastic'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 text-center text-xs text-gray-500">
            Substitution Rate: {mockData.substitutionRate}% when out of stock
          </div>
        </div>
      </div>

      {/* ===== O: SUPPLIER PERFORMANCE ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Truck className="w-4 h-4 text-blue-600" />
            Supplier Scorecard
          </h3>
          <div className="space-y-4">
            {Object.entries(mockData.supplierScorecard).map(([name, scores]) => {
              const avg = Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length;
              return (
                <div key={name} className="border rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm capitalize">{name.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="text-sm font-bold text-blue-600">{Math.round(avg)}%</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 mt-1">
                    {Object.entries(scores).map(([metric, score]) => (
                      <div key={metric} className="text-center">
                        <div className="text-[8px] text-gray-500 capitalize">{metric}</div>
                        <div className="text-xs font-medium">{score}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-orange-600" />
            Supplier Concentration
          </h3>
          <div className="space-y-2">
            {Object.entries(mockData.supplierConcentration).map(([supplier, percentage]) => (
              <div key={supplier}>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">{supplier}</span>
                  <span className="font-medium">{percentage}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div 
                    className={`h-full rounded-full transition-all ${percentage > 50 ? 'bg-red-500' : percentage > 30 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-center text-xs text-red-600">
            ⚠️ High concentration risk (65% from one supplier)
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            Procurement Metrics
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Bulk Discount Impact</span>
              <span className="font-bold text-green-600">+${mockData.bulkDiscountImpact}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Quality Reject Rate</span>
              <span className="font-bold text-red-600">{mockData.qualityRejectRate}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Early Payment Discount Capture</span>
              <span className="font-bold text-blue-600">{mockData.earlyPaymentDiscountCapture}%</span>
            </div>
            <div className="mt-2 pt-2 border-t">
              <span className="text-xs text-gray-500">Avg PO Approval: 6.2 hours</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== P: ANOMALIES ===== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-red-500" />
            Anomaly Detection
          </h3>
          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
            {mockData.anomalies.filter(a => a.severity === 'critical' || a.severity === 'high').length} critical
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {mockData.anomalies.map((anomaly, i) => (
            <div key={i} className={`flex items-start gap-2 p-2 rounded-lg border ${
              anomaly.severity === 'critical' ? 'bg-red-50 border-gray-200' :
              anomaly.severity === 'high' ? 'bg-orange-50 border-gray-200' :
              anomaly.severity === 'medium' ? 'bg-yellow-50 border-gray-200' :
              'bg-gray-50 border-gray-200'
            }`}>
              <div className={`w-2 h-2 rounded-full mt-1.5 ${
                anomaly.severity === 'critical' ? 'bg-red-500' :
                anomaly.severity === 'high' ? 'bg-orange-500' :
                anomaly.severity === 'medium' ? 'bg-yellow-500' :
                'bg-blue-500'
              }`} />
              <div className="flex-1">
                <p className="text-xs text-gray-800">{anomaly.message}</p>
                <p className="text-[10px] text-gray-500 capitalize mt-0.5">Severity: {anomaly.severity}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== H: ALERT FEED ===== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Bell className="w-4 h-4 text-yellow-500" />
              Live Alerts & Exceptions
            </h3>
          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
            {mockData.alerts.length} active
          </span>
        </div>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {mockData.alerts.map((alert, i) => {
            const alertType = alert.type as AlertType;
            const iconMap: Record<AlertType, React.ReactNode> = {
              stockout: <AlertTriangle className="w-4 h-4 text-red-500" />,
              delivery: <Truck className="w-4 h-4 text-orange-500" />,
              transaction: <AlertCircle className="w-4 h-4 text-blue-500" />,
              price: <Edit className="w-4 h-4 text-purple-500" />,
            };
            const bgMap: Record<AlertType, string> = {
              stockout: 'bg-red-50 border-gray-200',
              delivery: 'bg-orange-50 border-gray-200',
              transaction: 'bg-emerald-50 border-gray-200',
              price: 'bg-purple-50 border-gray-200',
            };
            return (
              <div key={i} className={`flex items-start gap-3 p-2 rounded-lg border ${bgMap[alertType]} transition-all hover:shadow-sm`}>
                {iconMap[alertType]}
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{alert.message}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{alert.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <div className="mt-6 text-center text-xs text-gray-400 border-t pt-4">
        Dashboard refreshes automatically every 5 minutes • Data is live • Last updated: {new Date().toLocaleString()}
      </div>
    </div>
  );
}

// Missing icon components
const Edit = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const Layout = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="21" x2="9" y2="9" />
  </svg>
);

const Scanning = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    <line x1="7" y1="12" x2="17" y2="12" />
  </svg>
);

const AlertOctagon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
