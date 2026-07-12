"use client";

import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/i18n/language-provider";
import type { CustomerRow } from "../get-customers";

export function CustomersTable({ customers }: { customers: CustomerRow[] }) {
  const { locale } = useLanguage();

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface-hover">
              <th className="px-4 py-2.5 text-start text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Name
              </th>
              <th className="px-4 py-2.5 text-start text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Phone
              </th>
              <th className="px-4 py-2.5 text-start text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Email
              </th>
              <th className="px-4 py-2.5 text-start text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Tags
              </th>
              <th className="px-4 py-2.5 text-end text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Added
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {customers.map((customer) => (
              <tr key={customer.id} className="transition-colors hover:bg-surface-hover">
                <td className="px-4 py-3 text-sm font-medium text-foreground">{customer.full_name}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground" dir="ltr">
                  {customer.phone || "—"}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{customer.email || "—"}</td>
                <td className="px-4 py-3">
                  {customer.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {customer.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-end text-sm text-muted-foreground">
                  {new Date(customer.created_at).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
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
