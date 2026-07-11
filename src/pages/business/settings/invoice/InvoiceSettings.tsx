import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  Edit,
  Eye,
  FileText,
  Hash,
  Layout,
  Plus,
  RefreshCw,
  Search,
  XCircle,
} from 'lucide-react';
import SettingsTabShell from '../SettingsTabShell';

type InvoiceScheme = {
  id: string;
  name: string;
  prefix: string;
  startFrom: number;
  invoiceCount: number;
  numberOfDigits: number;
  isActive: boolean;
  createdAt: string;
};

type InvoiceLayout = {
  id: string;
  name: string;
  design: 'classic' | 'modern' | 'minimal' | 'compact';
  isDefault: boolean;
  createdAt: string;
  headerText: string;
  footerText: string;
};

type TabKey = 'schemes' | 'layouts';

const designLabels: Record<InvoiceLayout['design'], string> = {
  classic: 'Classic',
  modern: 'Modern',
  minimal: 'Minimal',
  compact: 'Compact',
};

const shellCard = 'rounded-xl border border-border bg-card text-card-foreground shadow-sm';
const primaryButton = 'rounded-lg bg-primary text-primary-foreground hover:bg-primary/90';

const schemesSeed: InvoiceScheme[] = [
  {
    id: '1',
    name: 'Standard Invoice',
    prefix: 'INV-',
    startFrom: 1001,
    invoiceCount: 245,
    numberOfDigits: 6,
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: 'Proforma Invoice',
    prefix: 'PRO-',
    startFrom: 5001,
    invoiceCount: 89,
    numberOfDigits: 6,
    isActive: true,
    createdAt: '2024-03-20T14:30:00Z',
  },
  {
    id: '3',
    name: 'Quotation Scheme',
    prefix: 'QUO-',
    startFrom: 2001,
    invoiceCount: 156,
    numberOfDigits: 5,
    isActive: false,
    createdAt: '2024-06-01T09:00:00Z',
  },
];

const layoutsSeed: InvoiceLayout[] = [
  {
    id: '1',
    name: 'Default Invoice Layout',
    design: 'classic',
    isDefault: true,
    createdAt: '2024-01-15T10:00:00Z',
    headerText: 'INVOICE',
    footerText: 'Thank you for your business!',
  },
  {
    id: '2',
    name: 'Minimal Invoice Layout',
    design: 'minimal',
    isDefault: false,
    createdAt: '2024-03-20T14:30:00Z',
    headerText: 'INVOICE',
    footerText: 'Payment due within 30 days',
  },
  {
    id: '3',
    name: 'Compact Receipt Layout',
    design: 'compact',
    isDefault: false,
    createdAt: '2024-05-05T08:15:00Z',
    headerText: 'RECEIPT',
    footerText: 'Visit again soon.',
  },
];

export default function InvoiceSettings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('schemes');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSchemes = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return schemesSeed;
    return schemesSeed.filter(
      (scheme) =>
        scheme.name.toLowerCase().includes(search) ||
        scheme.prefix.toLowerCase().includes(search) ||
        scheme.startFrom.toString().includes(search),
    );
  }, [searchTerm]);

  const filteredLayouts = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return layoutsSeed;
    return layoutsSeed.filter(
      (layout) =>
        layout.name.toLowerCase().includes(search) ||
        designLabels[layout.design].toLowerCase().includes(search),
    );
  }, [searchTerm]);

  const stats = useMemo(
    () => ({
      totalSchemes: schemesSeed.length,
      activeSchemes: schemesSeed.filter((scheme) => scheme.isActive).length,
      totalLayouts: layoutsSeed.length,
      defaultLayout: layoutsSeed.find((layout) => layout.isDefault)?.name ?? 'None',
    }),
    [],
  );

  return (
    <SettingsTabShell title="Invoice Settings" description="Configure invoice schemes and layouts for your business">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
            <FileText className="h-6 w-6 text-primary" />
            Invoice Configuration
          </h2>
          <p className="text-sm text-muted-foreground">
            {stats.totalSchemes} schemes • {stats.totalLayouts} layouts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/business/invoice-settings/create')}
            className={`flex items-center gap-2 px-4 py-2 shadow-sm ${primaryButton}`}
          >
            <Plus className="h-4 w-4" />
            New Layout
          </button>
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className={`${shellCard} p-2 transition-colors hover:bg-surface-alt`}
            aria-label="Refresh filters"
          >
            <RefreshCw className="h-5 w-5 text-primary" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-4">
        <div className={`${shellCard} p-3 text-center`}>
          <p className="text-xs text-muted-foreground">Total Schemes</p>
          <p className="text-lg font-bold text-foreground">{stats.totalSchemes}</p>
        </div>
        <div className={`${shellCard} p-3 text-center`}>
          <p className="text-xs text-muted-foreground">Active Schemes</p>
          <p className="text-lg font-bold text-success">{stats.activeSchemes}</p>
        </div>
        <div className={`${shellCard} p-3 text-center`}>
          <p className="text-xs text-muted-foreground">Total Layouts</p>
          <p className="text-lg font-bold text-foreground">{stats.totalLayouts}</p>
        </div>
        <div className={`${shellCard} p-3 text-center`}>
          <p className="text-xs text-muted-foreground">Default Layout</p>
          <p className="truncate text-sm font-bold text-primary">{stats.defaultLayout}</p>
        </div>
      </div>

      <div className="mb-6 inline-flex gap-1 rounded-lg border border-border bg-surface-alt p-1">
        <TabButton active={activeTab === 'schemes'} onClick={() => setActiveTab('schemes')}>
          <Hash className="h-4 w-4" />
          Invoice Schemes
        </TabButton>
        <TabButton active={activeTab === 'layouts'} onClick={() => setActiveTab('layouts')}>
          <Layout className="h-4 w-4" />
          Invoice Layouts
        </TabButton>
      </div>

      <div className={`${shellCard} mb-6 p-4`}>
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={`Search ${activeTab === 'schemes' ? 'schemes' : 'layouts'}...`}
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {activeTab === 'schemes' ? (
        <div className={`${shellCard} overflow-hidden`}>
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface-alt/60">
              <tr>
                <Th>Name</Th>
                <Th>Prefix</Th>
                <Th align="right">Start From</Th>
                <Th align="right">Invoice Count</Th>
                <Th align="center">Digits</Th>
                <Th align="center">Status</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredSchemes.map((scheme) => (
                <tr key={scheme.id} className="transition-colors hover:bg-surface-alt/70">
                  <Td>
                    <p className="text-sm font-medium text-foreground">{scheme.name}</p>
                  </Td>
                  <Td>
                    <code className="rounded bg-surface-alt px-2 py-1 text-sm text-foreground">{scheme.prefix}</code>
                  </Td>
                  <Td align="right" className="text-sm text-foreground">
                    {scheme.startFrom}
                  </Td>
                  <Td align="right" className="text-sm text-foreground">
                    {scheme.invoiceCount}
                  </Td>
                  <Td align="center" className="text-sm text-foreground">
                    {scheme.numberOfDigits}
                  </Td>
                  <Td align="center">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        scheme.isActive ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {scheme.isActive ? (
                        <>
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="mr-1 h-3 w-3" />
                          Inactive
                        </>
                      )}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={`${shellCard} overflow-hidden`}>
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface-alt/60">
              <tr>
                <Th>Layout Name</Th>
                <Th>Design</Th>
                <Th align="center">Default</Th>
                <Th>Created</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLayouts.map((layout) => (
                <tr key={layout.id} className="transition-colors hover:bg-surface-alt/70">
                  <Td>
                    <p className="text-sm font-medium text-foreground">{layout.name}</p>
                    <p className="text-xs text-muted-foreground">{layout.headerText}</p>
                  </Td>
                  <Td>
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {designLabels[layout.design]}
                    </span>
                  </Td>
                  <Td align="center">
                    {layout.isDefault ? (
                      <CheckCircle className="mx-auto h-5 w-5 text-success" />
                    ) : (
                      <span className="text-xs text-muted-foreground">No</span>
                    )}
                  </Td>
                  <Td className="text-sm text-muted-foreground">{formatDate(layout.createdAt)}</Td>
                  <Td align="right">
                    <div className="flex items-center justify-end gap-1">
                      <IconButton
                        label="Preview layout"
                        onClick={() => navigate('/business/invoice-settings/create')}
                      >
                        <Eye className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        label="Edit layout"
                        onClick={() => navigate(`/business/invoice-settings/${layout.id}/edit`)}
                      >
                        <Edit className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SettingsTabShell>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
        active ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

function Th({
  children,
  align = 'left',
}: {
  children: ReactNode;
  align?: 'left' | 'center' | 'right';
}) {
  return <th className={`px-4 py-3 ${tableAlignClass(align)} text-xs font-medium uppercase tracking-wider text-muted-foreground`}>{children}</th>;
}

function Td({
  children,
  align = 'left',
  className = '',
}: {
  children: ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}) {
  return <td className={`px-4 py-3 ${tableAlignClass(align)} ${className}`}>{children}</td>;
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-surface-alt hover:text-primary"
    >
      {children}
    </button>
  );
}

function tableAlignClass(align: 'left' | 'center' | 'right') {
  switch (align) {
    case 'center':
      return 'text-center';
    case 'right':
      return 'text-right';
    default:
      return 'text-left';
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
