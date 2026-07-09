"use client";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { useLanguage } from "@/lib/i18n/language-provider";
import { ALL_NAV_ITEMS } from "@/config/nav";

export default function FinancePage() {
  const { t } = useLanguage();
  const item = ALL_NAV_ITEMS.find((i) => i.id === "finance")!;

  return (
    <div>
      <PageHeader title={t.nav.finance} />
      <EmptyState icon={item.icon} variant="reserved" title={t.reserved.title} description={t.reserved.finance} />
    </div>
  );
}
