"use client";

import { Badge, type badgeVariants } from "@/components/ui/badge";
import { useLanguage } from "@/lib/i18n/language-provider";
import type { OrderRow } from "../get-orders";
import type { VariantProps } from "class-variance-authority";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  pending_confirmation: "warning",
  confirmed: "info",
  ready_to_ship: "accent",
  in_transit: "info",
  delivered: "success",
  returned: "destructive",
  cancelled: "secondary",
};

function formatStatusLabel(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatMoney(amount: number) {
  return `EGP ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function OrdersTable({ orders }: { orders: OrderRow[] }) {
  const { locale } = useLanguage();

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface-hover">
              <th className="px-4 py-2.5 text-start text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Order
              </th>
              <th className="px-4 py-2.5 text-start text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Customer
              </th>
              <th className="px-4 py-2.5 text-end text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Total
              </th>
              <th className="px-4 py-2.5 text-start text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-2.5 text-end text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((order) => (
              <tr key={order.id} className="transition-colors hover:bg-surface-hover">
                <td className="px-4 py-3 text-sm font-medium text-foreground">{order.order_number}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{order.customer_name}</td>
                <td className="px-4 py-3 text-end font-mono text-sm tabular-nums text-foreground">
                  {formatMoney(order.total)}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[order.status] ?? "secondary"}>
                    {formatStatusLabel(order.status)}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-end text-sm text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
