import React, { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AlertCircle, ArrowLeft, RefreshCw, Building2, Users, MapPin, Globe, Mail, Phone, Calendar, CreditCard, Shield, Sparkles, Activity, Package, BarChart3, Eye } from 'lucide-react';
import { useAdminBusinesses } from '@/hooks/admin/businesses/useAdminBusinesses';

export default function AdminBusinessDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { businesses, isLoading, isSyncing, error, fetchBusinesses, syncBusinessModules } = useAdminBusinesses();

  useEffect(() => {
    void fetchBusinesses();
  }, [fetchBusinesses]);

  const business = useMemo(() => businesses.find((item) => item.id === id), [businesses, id]);

  const metricCards = business
    ? [
        { label: 'Users', value: business.totalUsers, icon: Users },
        { label: 'Locations', value: business.totalLocations, icon: MapPin },
        { label: 'Products', value: business.totalProducts, icon: Package },
        { label: 'Orders', value: business.totalOrders, icon: BarChart3 },
      ]
    : [];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <button
            type="button"
            className="mb-3 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-surface-alt"
            onClick={() => navigate('/business-management/list')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to businesses
          </button>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Building2 className="h-6 w-6 text-primary" />
            Business Details
          </h1>
          <p className="text-sm text-muted-foreground">
            Review the full business profile and sync missing modules from the catalog.
          </p>
        </div>

        {business && (
          <button
            type="button"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-alt sm:w-auto"
            onClick={async () => {
              const response = await syncBusinessModules(business.id);
              if (response) {
                toast.success(
                  `${response.message} ${response.inserted_modules} modules and ${response.inserted_submodules} submodules added.`,
                );
              }
            }}
            disabled={isSyncing}
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Modules'}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !business ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-lg font-medium text-foreground">Business not found</p>
          <p className="text-sm">The requested business could not be loaded.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
            {metricCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{card.label}</p>
                      <p className="text-2xl font-bold text-foreground">{card.value}</p>
                    </div>
                    <div className="rounded-lg bg-primary/10 p-3">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-foreground">{business.name}</h2>
                  <p className="break-words text-sm text-muted-foreground">{business.legalName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                    {business.status}
                  </span>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {business.tier}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <Field label="Email" value={business.email} icon={Mail} />
                <Field label="Phone" value={business.phone} icon={Phone} />
                <Field label="Website" value={business.website || 'N/A'} icon={Globe} />
                <Field label="Industry" value={business.industry} icon={Sparkles} />
                <Field label="Subscription" value={business.subscriptionStatus} icon={CreditCard} />
                <Field label="Created" value={new Date(business.createdAt).toLocaleString()} icon={Calendar} />
              </div>

              <div className="mt-4 rounded-xl border border-border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Address</p>
                <p className="mt-1 text-sm text-foreground">{business.address || 'No address on file'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Business Flags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {business.flags.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No flags</p>
                  ) : (
                    business.flags.map((flag) => (
                      <span key={flag} className="rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">
                        {flag.replace('-', ' ')}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Module Sync
                </h3>
                <p className="text-sm text-muted-foreground">
                  Use the sync action above to backfill any missing modules or submodules assigned to this business.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" />
                  Meta
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Verified</span>
                    <span className="font-medium text-foreground">{business.isVerified ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Featured</span>
                    <span className="font-medium text-foreground">{business.isFeatured ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Last active</span>
                    <span className="font-medium text-foreground">{new Date(business.lastActive).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="min-w-0 rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1 break-words text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
