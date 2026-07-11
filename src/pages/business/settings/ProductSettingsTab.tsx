import SettingsTabShell from './SettingsTabShell';

export default function ProductSettingsTab() {
  return (
    <SettingsTabShell title="Product Settings" description="Define how products behave across the business.">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Default unit" placeholder="Enter default unit" />
        <Field label="Low stock threshold" placeholder="Enter threshold" />
        <Field label="Product prefix" placeholder="Enter product prefix" />
        <Field label="Auto SKU length" placeholder="Enter SKU length" />
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
