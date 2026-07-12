"use client";

import { Truck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { useLanguage } from "@/lib/i18n/language-provider";
import { ShipmentsTable } from "./shipments-table";
import type { ShipmentRow } from "../get-shipments";

export function ShipmentsView({ shipments, connected }: { shipments: ShipmentRow[]; connected: boolean }) {
  const { t } = useLanguage();
  const label = t.nav.shipments;

  return (
    <div>
      <PageHeader
        title={label}
        description={shipments.length > 0 ? `${shipments.length} most recent shipments.` : undefined}
      />
      {shipments.length > 0 ? (
        <ShipmentsTable shipments={shipments} />
      ) : (
        <EmptyState
          icon={Truck}
          title={t.empty.noItemsYet(label)}
          description={
            connected
              ? t.empty.willAppearHere(label)
              : "Supabase isn't connected yet — showing zeroed values until it is."
          }
        />
      )}
    </div>
  );
}
