import { useMemo, useState } from 'react';
import {
  Building2,
  CreditCard,
  FileText,
  Globe,
  Hash,
  LayoutDashboard,
  Monitor,
  Phone,
  Package,
  Settings,
  ShoppingCart,
} from 'lucide-react';
import BusinessSettingsBusinessTab from './BusinessSettingsBusinessTab';
import TaxSettingsTab from './TaxSettingsTab';
import ProductSettingsTab from './ProductSettingsTab';
import ContactSettingsTab from './ContactSettingsTab';
import SaleSettingsTab from './SaleSettingsTab';
import PosSettingsTab from './PosSettingsTab';
import PurchasesSettingsTab from './PurchasesSettingsTab';
import PaymentSettingsTab from './PaymentSettingsTab';
import DashboardSettingsTab from './DashboardSettingsTab';
import SystemSettingsTab from './SystemSettingsTab';
import PrefixesSettingsTab from './PrefixesSettingsTab';

type TabKey =
  | 'business'
  | 'tax'
  | 'product'
  | 'contact'
  | 'sale'
  | 'pos'
  | 'purchases'
  | 'payment'
  | 'dashboard'
  | 'system'
  | 'prefixes';

export default function BusinessSettings() {
  const [activeTab, setActiveTab] = useState<TabKey>('business');

  const tabs = useMemo(
    () => [
      { key: 'business' as const, label: 'Business', icon: Building2 },
      { key: 'tax' as const, label: 'Tax', icon: FileText },
      { key: 'product' as const, label: 'Product', icon: Package },
      { key: 'contact' as const, label: 'Contact', icon: Phone },
      { key: 'sale' as const, label: 'Sale', icon: ShoppingCart },
      { key: 'pos' as const, label: 'POS', icon: Monitor },
      { key: 'purchases' as const, label: 'Purchases', icon: CreditCard },
      { key: 'payment' as const, label: 'Payment', icon: CreditCard },
      { key: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
      { key: 'system' as const, label: 'System', icon: Settings },
      { key: 'prefixes' as const, label: 'Prefixes', icon: Hash },
    ],
    [],
  );

  return (
    <div className="min-h-screen bg-background pb-10">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Globe className="h-6 w-6 text-primary" />
          Business Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Each tab keeps its own form, validation, and save logic isolated.
        </p>
      </div>

      <div className="mb-6 overflow-x-auto">
        <div className="flex min-w-max items-end gap-6 border-b border-border">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`relative inline-flex items-center gap-2 px-1 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                <span
                  className={`absolute inset-x-0 -bottom-[1px] h-[3px] rounded-full transition-colors ${
                    isActive ? 'bg-primary' : 'bg-transparent'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === 'business' && <BusinessSettingsBusinessTab />}
      {activeTab === 'tax' && <TaxSettingsTab />}
      {activeTab === 'product' && <ProductSettingsTab />}
      {activeTab === 'contact' && <ContactSettingsTab />}
      {activeTab === 'sale' && <SaleSettingsTab />}
      {activeTab === 'pos' && <PosSettingsTab />}
      {activeTab === 'purchases' && <PurchasesSettingsTab />}
      {activeTab === 'payment' && <PaymentSettingsTab />}
      {activeTab === 'dashboard' && <DashboardSettingsTab />}
      {activeTab === 'system' && <SystemSettingsTab />}
      {activeTab === 'prefixes' && <PrefixesSettingsTab />}
    </div>
  );
}
