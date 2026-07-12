"use client";

import { cn } from "@/lib/utils";
import type { InventoryRow } from "../get-inventory";

export function InventoryTable({ items }: { items: InventoryRow[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface-hover">
              <th className="px-4 py-2.5 text-start text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Product
              </th>
              <th className="px-4 py-2.5 text-start text-xs font-medium uppercase tracking-wide text-muted-foreground">
                SKU
              </th>
              <th className="px-4 py-2.5 text-end text-xs font-medium uppercase tracking-wide text-muted-foreground">
                On Hand
              </th>
              <th className="px-4 py-2.5 text-end text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Reserved
              </th>
              <th className="px-4 py-2.5 text-end text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Available
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((item) => {
              const isLow = item.quantity_on_hand <= item.low_stock_threshold;
              return (
                <tr
                  key={item.id}
                  className={cn(
                    "transition-colors hover:bg-surface-hover",
                    isLow && "bg-destructive-subtle",
                  )}
                >
                  <td className="px-4 py-3 text-sm font-medium text-foreground">
                    {item.product_name}
                    {item.size && <span className="ms-1.5 text-muted-foreground">({item.size})</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{item.sku}</td>
                  <td
                    className={cn(
                      "px-4 py-3 text-end text-sm tabular-nums",
                      isLow ? "font-medium text-destructive" : "text-foreground",
                    )}
                  >
                    {item.quantity_on_hand}
                  </td>
                  <td className="px-4 py-3 text-end text-sm tabular-nums text-muted-foreground">
                    {item.quantity_reserved}
                  </td>
                  <td className="px-4 py-3 text-end text-sm tabular-nums text-foreground">
                    {item.quantity_on_hand - item.quantity_reserved}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
