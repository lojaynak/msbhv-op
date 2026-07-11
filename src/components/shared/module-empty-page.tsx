"use client";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { useLanguage } from "@/lib/i18n/language-provider";
import { ALL_NAV_ITEMS, type NavId } from "@/config/nav";

/**
 * Every standard (non-reserved) module page in this phase is identical:
 * a page header and an empty state, both translated, both driven by the
 * same nav config entry. See architecture doc §4.3 — this is the ~5
 * shared components composed N ways, not N bespoke pages.
 */
export function ModuleEmptyPage({ navId }: { navId: NavId }) {
  const { t } = useLanguage();
  const item = ALL_NAV_ITEMS.find((i) => i.id === navId)!;
  const label = t.nav[navId];

  return (
    <div>
      <PageHeader title={label} />
      <EmptyState icon={item.icon} title={t.empty.noItemsYet(label)} description={t.empty.willAppearHere(label)} />
    </div>
  );
}
