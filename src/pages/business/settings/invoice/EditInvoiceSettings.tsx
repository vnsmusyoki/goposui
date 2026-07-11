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
    productLabel: 'Product',
    quantityLabel: 'Qty',
    unitPriceLabel: 'Unit Price',
    subTotalLabel: 'Subtotal',
    categoryHsnCodeLabel: 'Category / HSN Code',
    totalQuantityLabel: 'Total Quantity',
    itemDiscountLabel: 'Item Discount',
    discountedUnitPriceLabel: 'Discounted Unit Price',
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
