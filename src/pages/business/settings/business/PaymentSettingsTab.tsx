import SettingsTabShell from '../SettingsTabShell';

export default function PaymentSettingsTab() {
  return (
    <SettingsTabShell title="Payment Settings" description="Set payment methods, banking details, and settlement defaults.">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Bank name" placeholder="Enter bank name" />
        <Field label="Account number" placeholder="Enter account number" />
        <Field label="Payment method" placeholder="Enter payment method" />
        <Field label="Settlement days" placeholder="Enter settlement days" />
      </div>
    </SettingsTabShell>
  );
}

function Field({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-foreground">{label}</span>
      <input
        type="text"
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}
