"use client";

import {
  ShoppingCart, Clock, CheckCircle2, PackageSearch, Truck, RotateCcw,
  TrendingUp, Banknote, AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { useLanguage } from "@/lib/i18n/language-provider";
import type { DashboardStats } from "../get-dashboard-stats";

function formatEGP(amount: number) {
  return `EGP ${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function DashboardView({ stats }: { stats: DashboardStats }) {
  const { t } = useLanguage();

  const cards = [
    { label: t.dashboard.todaysOrders, value: String(stats.todaysOrders), icon: ShoppingCart },
    { label: t.dashboard.pendingConfirmation, value: String(stats.pendingConfirmation), icon: Clock },
    { label: t.dashboard.confirmed, value: String(stats.confirmed), icon: CheckCircle2 },
    { label: t.dashboard.readyToShip, value: String(stats.readyToShip), icon: PackageSearch },
    { label: t.dashboard.inTransit, value: String(stats.inTransit), icon: Truck },
    { label: t.dashboard.delivered, value: String(stats.delivered), icon: CheckCircle2 },
    { label: t.dashboard.returned, value: String(stats.returned), icon: RotateCcw },
    { label: t.dashboard.revenue, value: formatEGP(stats.revenue), icon: TrendingUp },
    { label: t.dashboard.cashWaiting, value: formatEGP(stats.cashWaiting), icon: Banknote },
    { label: t.dashboard.inventoryAlerts, value: String(stats.inventoryAlerts), icon: AlertTriangle },
  ];

  return (
    <div>
      <PageHeader title={t.dashboard.title} description={t.dashboard.description} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => (
          <StatCard key={c.label} icon={c.icon} label={c.label} value={c.value} />
        ))}
      </div>
      {!stats.connected && (
        <p className="mt-6 rounded-lg border border-dashed border-border bg-surface-hover px-4 py-3 text-xs text-muted-foreground">
          {t.common.supabaseNotConnected}
        </p>
      )}
    </div>
  );
}
