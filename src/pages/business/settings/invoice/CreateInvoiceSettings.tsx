import InvoiceLayoutEditor from './InvoiceLayoutEditor';
import { useInvoiceSettings } from '@/hooks/business/settings/useInvoiceSettings';

export default function CreateInvoiceSettings() {
  const { createInvoiceLayout, isSaving } = useInvoiceSettings();

  return (
    <InvoiceLayoutEditor
      mode="create"
      title="Create Invoice Layout"
      subtitle="Build a new invoice layout and preview it before saving."
      initialTab="format"
      submitLabel="Create Layout"
      isSaving={isSaving}
      onSubmit={createInvoiceLayout}
    />
  );
}
