"use client";

import { ShoppingCart } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { useLanguage } from "@/lib/i18n/language-provider";
import { OrdersTable } from "./orders-table";
import type { OrderRow } from "../get-orders";

export function OrdersView({ orders, connected }: { orders: OrderRow[]; connected: boolean }) {
  const { t } = useLanguage();
  const label = t.nav.orders;

  return (
    <div>
      <PageHeader
        title={label}
        description={orders.length > 0 ? `${orders.length} most recent orders.` : undefined}
      />
      {orders.length > 0 ? (
        <OrdersTable orders={orders} />
      ) : (
        <EmptyState
          icon={ShoppingCart}
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
