import SettingsTabShell from './SettingsTabShell';

export default function PosSettingsTab() {
  return (
    <SettingsTabShell title="POS Settings" description="Manage register behavior and cashier defaults.">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Default POS screen" placeholder="Enter default screen" />
        <Field label="Print copies" placeholder="Enter number of copies" />
        <Field label="Cash drawer code" placeholder="Enter drawer code" />
        <Field label="Shift timeout" placeholder="Enter timeout" />
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
