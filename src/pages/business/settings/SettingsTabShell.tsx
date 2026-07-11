import React from 'react';

type SettingsTabShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export default function SettingsTabShell({ title, description, children }: SettingsTabShellProps) {
  return (
    <section className="rounded-sm border border-border bg-card p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}
