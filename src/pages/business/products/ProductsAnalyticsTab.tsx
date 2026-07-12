import { useMemo } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  DollarSign,
  Package,
  ShoppingCart,
  Shield,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type AnalyticsCardTone = 'primary' | 'success' | 'blue' | 'amber' | 'destructive';

function AnalyticsCard({
  title,
  value,
  subtitle,
  icon,
  color,
  trend,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  color: AnalyticsCardTone;
  trend?: 'up' | 'down';
}) {
  const colorClasses: Record<AnalyticsCardTone, string> = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    blue: 'bg-blue-500/10 text-blue-500',
    amber: 'bg-amber-500/10 text-amber-600',
    destructive: 'bg-destructive/10 text-destructive',
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className={`rounded-lg ${colorClasses[color]} p-2.5`}>{icon}</div>
      </div>
      {trend ? (
        <div
          className={`mt-2 flex items-center gap-1 text-xs font-medium ${
            trend === 'up' ? 'text-success' : 'text-destructive'
          }`}
        >
          {trend === 'up' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
          {trend === 'up' ? 'Positive growth' : 'Negative trend'}
        </div>
      ) : null}
    </div>
  );
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function groupBy<T>(items: T[], keyFn: (item: T) => string, valueFn: (item: T) => number = () => 1) {
  const map = new Map<string, number>();
  items.forEach((item) => {
    const key = keyFn(item);
    map.set(key, (map.get(key) ?? 0) + valueFn(item));
  });
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

function monthLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString('en', { month: 'short', year: '2-digit' });
}

export function ProductsAnalyticsTab({
  analytics,
  products,
  formatCurrency,
}: {
  analytics: any;
  products: any[];
  formatCurrency: (value: number) => string;
}) {
  const stockStatus = useMemo(() => {
    const inStock = products.filter((p) => p.manageStock && p.currentStock > p.alertQuantity).length;
    const lowStock = products.filter((p) => p.manageStock && p.currentStock > 0 && p.currentStock <= p.alertQuantity).length;
    const outOfStock = products.filter((p) => p.manageStock && p.currentStock === 0).length;
    return [
      { name: 'In Stock', value: inStock },
      { name: 'Low Stock', value: lowStock },
      { name: 'Out of Stock', value: outOfStock },
    ];
  }, [products]);

  const productsByCategory = useMemo(() => groupBy(products, (p) => p.categoryName), [products]);
  const productsByBrand = useMemo(() => groupBy(products, (p) => p.brandName), [products]);
  const productsByType = useMemo(() => groupBy(products, (p) => p.productType), [products]);
  const productsByLocation = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((product) => {
      const locations = Array.isArray(product.locationNames) ? product.locationNames : [];
      if (locations.length === 0) {
        map.set('Unassigned', (map.get('Unassigned') ?? 0) + product.currentStock);
        return;
      }
      locations.forEach((location: string) => {
        map.set(location, (map.get(location) ?? 0) + product.currentStock);
      });
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [products]);

  const priceBands = useMemo(() => {
    const bands = [
      { name: '0 - 500', min: 0, max: 500 },
      { name: '500 - 1k', min: 500, max: 1000 },
      { name: '1k - 5k', min: 1000, max: 5000 },
      { name: '5k - 10k', min: 5000, max: 10000 },
      { name: '10k+', min: 10000, max: Number.POSITIVE_INFINITY },
    ];
    return bands.map((band) => ({
      name: band.name,
      value: products.filter((p) => p.defaultSellingPrice >= band.min && p.defaultSellingPrice < band.max).length,
    }));
  }, [products]);

  const profitMarginBands = useMemo(() => {
    const bands = [
      { name: '0-10%', min: 0, max: 10 },
      { name: '10-25%', min: 10, max: 25 },
      { name: '25-50%', min: 25, max: 50 },
      { name: '50-100%', min: 50, max: 100 },
      { name: '100%+', min: 100, max: Number.POSITIVE_INFINITY },
    ];
    return bands.map((band) => ({
      name: band.name,
      value: products.filter((p) => p.profitMargin >= band.min && p.profitMargin < band.max).length,
    }));
  }, [products]);

  const createdByMonth = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((product) => {
      const month = monthLabel(product.createdAt);
      map.set(month, (map.get(month) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const topSelling = useMemo(
    () =>
      [...products]
        .sort((a, b) => b.totalUnitsSold - a.totalUnitsSold)
        .slice(0, 8)
        .map((product) => ({
          name: product.name.length > 18 ? `${product.name.slice(0, 18)}…` : product.name,
          value: product.totalUnitsSold,
        })),
    [products],
  );

  const topStockValue = useMemo(
    () =>
      [...products]
        .sort((a, b) => b.currentStockValue - a.currentStockValue)
        .slice(0, 8)
        .map((product) => ({
          name: product.name.length > 18 ? `${product.name.slice(0, 18)}…` : product.name,
          value: product.currentStockValue,
        })),
    [products],
  );

  const taxDistribution = useMemo(
    () => groupBy(products, (p) => `${p.taxType} (${p.taxRate}%)`),
    [products],
  );

  const totalStockCoverage = analytics.totalProducts > 0
    ? ((analytics.totalProducts - analytics.outOfStockItems) / analytics.totalProducts) * 100
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AnalyticsCard
          title="Total Products"
          value={analytics.totalProducts.toString()}
          subtitle={`${analytics.activeProducts} active products`}
          icon={<Package className="h-5 w-5" />}
          color="primary"
        />
        <AnalyticsCard
          title="Total Stock Value"
          value={formatCurrency(analytics.totalStockValue)}
          subtitle={`Potential profit: ${formatCurrency(analytics.totalPotentialProfit)}`}
          icon={<DollarSign className="h-5 w-5" />}
          color="success"
        />
        <AnalyticsCard
          title="Total Units Sold"
          value={analytics.totalUnitsSold.toLocaleString()}
          subtitle={`Revenue: ${formatCurrency(analytics.totalValueSold)}`}
          icon={<ShoppingCart className="h-5 w-5" />}
          color="blue"
        />
        <AnalyticsCard
          title="Total Profit"
          value={formatCurrency(analytics.totalProfit)}
          subtitle={`Avg margin: ${analytics.avgProfitMargin.toFixed(1)}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          color="amber"
          trend={analytics.totalProfit > 0 ? 'up' : 'down'}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Low Stock Items</p>
            <AlertCircle className="h-5 w-5 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{analytics.lowStockItems}</p>
          <p className="text-xs text-muted-foreground">Items at or below alert quantity</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Out of Stock</p>
            <X className="h-5 w-5 text-destructive" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{analytics.outOfStockItems}</p>
          <p className="text-xs text-muted-foreground">Products with zero stock</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Stock Coverage</p>
            <Shield className="h-5 w-5 text-success" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{totalStockCoverage.toFixed(0)}%</p>
          <p className="text-xs text-muted-foreground">Products with available stock</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Products by Category" description="How your catalog is spread across categories">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={productsByCategory}>
              <CartesianGrid horizontal vertical={false} strokeDasharray="4 4" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis hide />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Products by Brand" description="Which brands dominate the catalog">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={productsByBrand}>
              <CartesianGrid horizontal vertical={false} strokeDasharray="4 4" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis hide />
              <Tooltip />
              <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Stock Health" description="Inventory health across in-stock, low-stock and out-of-stock items">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={stockStatus} dataKey="value" nameKey="name" innerRadius={65} outerRadius={100} paddingAngle={3}>
                {stockStatus.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={['#22c55e', '#f59e0b', '#ef4444'][index % 3]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Product Mix" description="Single, combo, and variable product balance">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={productsByType} dataKey="value" nameKey="name" innerRadius={55} outerRadius={100} paddingAngle={2}>
                {productsByType.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={['#3b82f6', '#8b5cf6', '#f97316'][index % 3]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Stock by Location" description="Where your inventory currently sits">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={productsByLocation}>
              <CartesianGrid horizontal vertical={false} strokeDasharray="4 4" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis hide />
              <Tooltip />
              <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Creation Trend" description="Products added by month">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={createdByMonth}>
              <CartesianGrid horizontal vertical={false} strokeDasharray="4 4" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis hide />
              <Tooltip />
              <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top Selling Products" description="Highest unit movers in the product catalog">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={topSelling} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid horizontal vertical={false} strokeDasharray="4 4" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" hide />
              <Tooltip />
              <Bar dataKey="value" fill="#f97316" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top Stock Value Products" description="Products tying up the most cash in inventory">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={topStockValue} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid horizontal vertical={false} strokeDasharray="4 4" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(value) => formatCurrency(Number(value ?? 0))} />
              <YAxis type="category" dataKey="name" hide />
              <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
              <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Selling Price Bands" description="How your products are distributed by selling price">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={priceBands}>
              <CartesianGrid horizontal vertical={false} strokeDasharray="4 4" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis hide />
              <Tooltip />
              <Bar dataKey="value" fill="#14b8a6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Profit Margin Bands" description="How many products fall into each margin range">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={profitMarginBands}>
              <CartesianGrid horizontal vertical={false} strokeDasharray="4 4" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis hide />
              <Tooltip />
              <Bar dataKey="value" fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Tax Distribution" description="How products are taxed">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={taxDistribution} dataKey="value" nameKey="name" outerRadius={100} paddingAngle={2}>
                {taxDistribution.map((entry, index) => (
                  <Cell key={entry.name} fill={['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444'][index % 4]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
