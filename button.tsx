import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  /** Placeholder-friendly: pass "—" until Supabase queries are wired up. */
  value: string;
  /** Optional mock trend, e.g. "+4" / "-6%". Omit once real data lands and trends are computed. */
  trend?: { delta: string; up: boolean };
  className?: string;
};

export function StatCard({ icon: Icon, label, value, trend, className }: StatCardProps) {
  return (
    <Card className={cn("gap-3 p-4", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className="size-4 text-muted-foreground" strokeWidth={1.75} />
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">{value}</span>
        {trend && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              trend.up ? "text-success" : "text-destructive",
            )}
          >
            {trend.up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {trend.delta}
          </span>
        )}
      </div>
    </Card>
  );
}
