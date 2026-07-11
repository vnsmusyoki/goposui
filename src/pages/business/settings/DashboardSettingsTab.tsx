import SettingsTabShell from './SettingsTabShell';

export default function DashboardSettingsTab() {
  return (
    <SettingsTabShell title="Dashboard Settings" description="Choose what the business dashboard should emphasize.">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Default dashboard" placeholder="Enter dashboard name" />
        <Field label="Visible KPI set" placeholder="Enter KPI set" />
        <Field label="Theme density" placeholder="Enter density" />
        <Field label="Widget order" placeholder="Enter widget order" />
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
