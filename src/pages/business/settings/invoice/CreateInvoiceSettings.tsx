import InvoiceLayoutEditor from './InvoiceLayoutEditor';

export default function CreateInvoiceSettings() {
  return (
    <InvoiceLayoutEditor
      mode="create"
      title="Create Invoice Layout"
      subtitle="Build a new invoice layout and preview it before saving."
      submitLabel="Create Layout"
    />
  );
}
