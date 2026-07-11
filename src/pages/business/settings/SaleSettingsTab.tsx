import SettingsTabShell from './SettingsTabShell';

export default function SaleSettingsTab() {
  return (
    <SettingsTabShell title="Sale Settings" description="Configure sales behavior and transaction defaults.">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Discount limit" placeholder="Enter discount limit" />
        <Field label="Receipt footer" placeholder="Enter receipt footer" />
        <Field label="Sale prefix" placeholder="Enter sale prefix" />
        <Field label="Reference format" placeholder="Enter reference format" />
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
