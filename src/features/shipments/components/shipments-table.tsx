"use client";

import { Badge, type badgeVariants } from "@/components/ui/badge";
import { useLanguage } from "@/lib/i18n/language-provider";
import type { ShipmentRow } from "../get-shipments";
import type { VariantProps } from "class-variance-authority";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  pending: "secondary",
  picked_up: "info",
  in_transit: "info",
  delivered: "success",
  failed: "destructive",
  returned: "warning",
};

function formatStatusLabel(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ShipmentsTable({ shipments }: { shipments: ShipmentRow[] }) {
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
                Carrier
              </th>
              <th className="px-4 py-2.5 text-start text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Tracking #
              </th>
              <th className="px-4 py-2.5 text-start text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-2.5 text-end text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Updated
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {shipments.map((shipment) => (
              <tr key={shipment.id} className="transition-colors hover:bg-surface-hover">
                <td className="px-4 py-3 text-sm font-medium text-foreground">{shipment.order_number}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{shipment.carrier || "—"}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground" dir="ltr">
                  {shipment.tracking_number || "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[shipment.status] ?? "secondary"}>
                    {formatStatusLabel(shipment.status)}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-end text-sm text-muted-foreground">
                  {new Date(shipment.updated_at).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
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
