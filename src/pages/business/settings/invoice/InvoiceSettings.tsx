import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  AlertCircle,
  Edit,
  Eye,
  FileText,
  Layout,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react';
import SettingsTabShell from '../SettingsTabShell';
import { useInvoiceSettings } from '@/hooks/business/settings/useInvoiceSettings';

const designLabels: Record<'classic' | 'modern' | 'minimal' | 'compact', string> = {
  classic: 'Classic',
  modern: 'Modern',
  minimal: 'Minimal',
  compact: 'Compact',
};

const shellCard = 'rounded-xl border border-border bg-card text-card-foreground shadow-sm';
const primaryButton = 'rounded-lg bg-primary text-primary-foreground hover:bg-primary/90';

export default function InvoiceSettings() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const { layouts, isLoading, error, loadInvoiceLayouts } = useInvoiceSettings();

  const filteredLayouts = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    const source = layouts;
    if (!search) return source;
    return source.filter(
      (layout) =>
        layout.name.toLowerCase().includes(search) ||
        designLabels[layout.design as keyof typeof designLabels].toLowerCase().includes(search),
    );
  }, [layouts, searchTerm]);

  const stats = useMemo(
    () => ({
      totalLayouts: layouts.length,
      defaultLayout: layouts.find((layout) => layout.isDefault)?.name ?? 'None',
      latestLayout: layouts[0]?.name ?? 'None',
    }),
    [layouts],
  );

  return (
    <SettingsTabShell title="Invoice Settings" description="Manage the saved invoice layouts for your business">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
            <FileText className="h-6 w-6 text-primary" />
            Saved Invoice Layouts
          </h2>
          <p className="text-sm text-muted-foreground">
            {stats.totalLayouts} saved layout{stats.totalLayouts === 1 ? '' : 's'}
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
            onClick={() => {
              setSearchTerm('');
              void loadInvoiceLayouts();
            }}
            className={`${shellCard} p-2 transition-colors hover:bg-surface-alt`}
            aria-label="Refresh filters"
          >
            <RefreshCw className="h-5 w-5 text-primary" />
          </button>
        </div>
      </div>

       

      <div className={`${shellCard} mb-6 p-4`}>
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search saved layouts..."
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

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
                  <p className="text-xs text-muted-foreground">{layout.code || 'No code set'}</p>
                </Td>
                <Td>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {designLabels[layout.design as keyof typeof designLabels]}
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
                      onClick={() => navigate(`/business/invoice-settings/${layout.id}/edit?tab=preview`)}
                    >
                      <Eye className="h-4 w-4" />
                    </IconButton>
                    <IconButton label="Edit layout" onClick={() => navigate(`/business/invoice-settings/${layout.id}/edit`)}>
                      <Edit className="h-4 w-4" />
                    </IconButton>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading && <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">Loading invoice layouts...</div>}
        {!isLoading && filteredLayouts.length === 0 && (
          <div className="border-t border-border px-4 py-10 text-center">
            <Layout className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">No saved invoice layouts found</p>
            <p className="mt-1 text-sm text-muted-foreground">Create a new layout to start customizing invoice printouts for this business.</p>
          </div>
        )}
        {error && !isLoading && (
          <div className="flex items-start gap-2 border-t border-border px-4 py-3 text-sm text-red-600">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </SettingsTabShell>
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
