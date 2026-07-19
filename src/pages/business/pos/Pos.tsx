import { useEffect, useMemo } from "react";
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
  const {
    products,
    fetchProducts,
    isLoading: productsLoading,
    error: productsError,
  } = useProducts();
  const { customers, loadCustomers } = useBusinessCustomers();

  useEffect(() => {
    void fetchProducts({ showNotForSelling: false }).catch(() => undefined);
    void loadCustomers().catch(() => undefined);
  }, [fetchProducts, loadCustomers]);

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

  return (
    <PosLayout
      products={posProducts}
      categories={categories}
      customers={posCustomers}
      productsLoading={productsLoading}
      productsError={productsError}
    />
  );
}
