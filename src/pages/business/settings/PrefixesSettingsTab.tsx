import SettingsTabShell from './SettingsTabShell';

export default function PrefixesSettingsTab() {
  return (
    <SettingsTabShell title="Prefixes Settings" description="Define the prefixes used when generating internal codes.">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Business prefix" placeholder="Enter business prefix" />
        <Field label="Sale prefix" placeholder="Enter sale prefix" />
        <Field label="Purchase prefix" placeholder="Enter purchase prefix" />
        <Field label="POS prefix" placeholder="Enter POS prefix" />
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
