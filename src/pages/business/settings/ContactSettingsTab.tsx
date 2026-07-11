import SettingsTabShell from './SettingsTabShell';

export default function ContactSettingsTab() {
  return (
    <SettingsTabShell title="Contact Settings" description="Update phone, email, and address defaults.">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Support email" placeholder="Enter support email" />
        <Field label="Support phone" placeholder="Enter support phone" />
        <Field label="Website" placeholder="Enter website" />
        <Field label="Physical address" placeholder="Enter address" />
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
