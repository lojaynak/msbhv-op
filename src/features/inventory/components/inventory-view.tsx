"use client";

import { Boxes } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { useLanguage } from "@/lib/i18n/language-provider";
import { InventoryTable } from "./inventory-table";
import type { InventoryRow } from "../get-inventory";

export function InventoryView({ items, connected }: { items: InventoryRow[]; connected: boolean }) {
  const { t } = useLanguage();
  const label = t.nav.inventory;

  return (
    <div>
      <PageHeader
        title={label}
        description={items.length > 0 ? `${items.length} variant(s). Rows in red are at or below their low-stock threshold.` : undefined}
      />
      {items.length > 0 ? (
        <InventoryTable items={items} />
      ) : (
        <EmptyState
          icon={Boxes}
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
