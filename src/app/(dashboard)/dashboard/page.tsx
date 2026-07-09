"use client";

import {
  ShoppingCart, Clock, CheckCircle2, PackageSearch, Truck, RotateCcw,
  TrendingUp, Banknote, AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { useLanguage } from "@/lib/i18n/language-provider";

export default function DashboardPage() {
  const { t } = useLanguage();

  const cards = [
    { label: t.dashboard.todaysOrders, value: "18", icon: ShoppingCart, trend: { delta: "+4", up: true } },
    { label: t.dashboard.pendingConfirmation, value: "6", icon: Clock, trend: { delta: "-2", up: false } },
    { label: t.dashboard.confirmed, value: "9", icon: CheckCircle2, trend: { delta: "+3", up: true } },
    { label: t.dashboard.readyToShip, value: "4", icon: PackageSearch, trend: { delta: "0", up: true } },
    { label: t.dashboard.inTransit, value: "12", icon: Truck, trend: { delta: "+5", up: true } },
    { label: t.dashboard.delivered, value: "143", icon: CheckCircle2, trend: { delta: "+18", up: true } },
    { label: t.dashboard.returned, value: "3", icon: RotateCcw, trend: { delta: "+1", up: false } },
    { label: t.dashboard.revenue, value: "EGP 86,420", icon: TrendingUp, trend: { delta: "+12%", up: true } },
    { label: t.dashboard.cashWaiting, value: "EGP 14,200", icon: Banknote, trend: { delta: "-6%", up: false } },
    { label: t.dashboard.inventoryAlerts, value: "5", icon: AlertTriangle, trend: { delta: "+2", up: false } },
  ];

  return (
    <div>
      <PageHeader title={t.dashboard.title} description={t.dashboard.description} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => (
          <StatCard key={c.label} icon={c.icon} label={c.label} value={c.value} trend={c.trend} />
        ))}
      </div>
      <p className="mt-6 text-xs text-muted-foreground">{t.common.mockDataNotice}</p>
    </div>
  );
}
