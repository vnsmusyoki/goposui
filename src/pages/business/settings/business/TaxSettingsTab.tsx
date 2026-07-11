import SettingsTabShell from '../SettingsTabShell';

export default function TaxSettingsTab() {
  return (
    <SettingsTabShell title="Tax Settings" description="Manage tax identifiers, rates, and tax rules.">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Tax PIN" placeholder="Enter tax PIN" />
        <Field label="VAT rate" placeholder="Enter VAT rate" />
        <Field label="Tax jurisdiction" placeholder="Enter tax jurisdiction" />
        <Field label="Tax note" placeholder="Enter tax note" />
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
