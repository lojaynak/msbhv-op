"use client";

import { Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { useLanguage } from "@/lib/i18n/language-provider";
import { CustomersTable } from "./customers-table";
import type { CustomerRow } from "../get-customers";

export function CustomersView({ customers, connected }: { customers: CustomerRow[]; connected: boolean }) {
  const { t } = useLanguage();
  const label = t.nav.customers;

  return (
    <div>
      <PageHeader
        title={label}
        description={customers.length > 0 ? `${customers.length} most recent customers.` : undefined}
      />
      {customers.length > 0 ? (
        <CustomersTable customers={customers} />
      ) : (
        <EmptyState
          icon={Users}
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
