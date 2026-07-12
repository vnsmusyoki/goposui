import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import InvoiceLayoutEditor, { type InvoiceLayoutForm } from './InvoiceLayoutEditor';
import { useInvoiceSettings } from '@/hooks/business/settings/useInvoiceSettings';
import SettingsTabShell from '../SettingsTabShell';

export default function EditInvoiceSettings() {
  const { id = '' } = useParams();
  const [searchParams] = useSearchParams();
  const { loadInvoiceLayout, updateInvoiceLayout, isSaving, isLoading, error, clearError } = useInvoiceSettings();
  const [initialValues, setInitialValues] = useState<Partial<InvoiceLayoutForm> | undefined>();
  const initialTab = searchParams.get('tab') === 'preview' ? 'preview' : 'format';

  useEffect(() => {
    let mounted = true;

    clearError();
    void loadInvoiceLayout(id).then((layout) => {
      if (!mounted) return;
      setInitialValues(layout ?? undefined);
    });

    return () => {
      mounted = false;
    };
  }, [clearError, id, loadInvoiceLayout]);

  if (isLoading && !initialValues) {
    return (
      <SettingsTabShell title="Edit Invoice Layout" description="Adjust the invoice format, content and preview before updating.">
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Loading invoice layout...
        </div>
      </SettingsTabShell>
    );
  }

  if (error && !initialValues) {
    return (
      <SettingsTabShell title="Edit Invoice Layout" description="Adjust the invoice format, content and preview before updating.">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
      </SettingsTabShell>
    );
  }

  return (
    <InvoiceLayoutEditor
      mode="edit"
      title="Edit Invoice Layout"
      subtitle="Adjust the invoice format, content and preview before updating."
      initialValues={initialValues}
      initialTab={initialTab}
      submitLabel="Update Layout"
      isSaving={isSaving}
      onSubmit={(values) => updateInvoiceLayout(id, values)}
    />
  );
}
