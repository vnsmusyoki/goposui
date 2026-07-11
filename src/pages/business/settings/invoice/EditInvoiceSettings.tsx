import { useParams } from 'react-router-dom';
import InvoiceLayoutEditor, { type InvoiceLayoutForm } from './InvoiceLayoutEditor';

const seedLayouts: Record<string, Partial<InvoiceLayoutForm>> = {
  '1': {
    name: 'Default Invoice Layout',
    code: 'default-invoice-layout',
    design: 'classic',
    paperSize: 'a4',
    isDefault: true,
    showLogo: true,
    showBusinessDetails: true,
    showCustomerDetails: true,
    showItemsSku: true,
    showQrCode: false,
    showTaxBreakdown: true,
    showDiscounts: true,
    headerAlignment: 'center',
    headerText: '<p><strong>INVOICE</strong></p>',
    footerText: '<p>Thank you for your business.</p>',
  },
};

export default function EditInvoiceSettings() {
  const { id = '' } = useParams();

  return (
    <InvoiceLayoutEditor
      mode="edit"
      title="Edit Invoice Layout"
      subtitle="Adjust the invoice format, content and preview before updating."
      initialValues={seedLayouts[id] ?? seedLayouts['1']}
      submitLabel="Update Layout"
    />
  );
}
