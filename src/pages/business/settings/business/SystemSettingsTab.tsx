import SettingsTabShell from '../SettingsTabShell';

export default function SystemSettingsTab() {
  return (
    <SettingsTabShell title="System Settings" description="Control system-wide behavior for this business account.">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Timezone" placeholder="Enter timezone" />
        <Field label="Date format" placeholder="Enter date format" />
        <Field label="Language" placeholder="Enter language" />
        <Field label="System note" placeholder="Enter system note" />
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
