"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { ALL_NAV_ITEMS } from "@/config/nav";
import { useLanguage } from "@/lib/i18n/language-provider";
import type { CurrentUser } from "@/lib/auth/get-session";

export function DashboardShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useLanguage();

  const activeItem = ALL_NAV_ITEMS.find((item) => pathname.startsWith(item.href));
  const title = activeItem ? t.nav[activeItem.id] : "";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} user={user} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title={title} onOpenMobileNav={() => setMobileNavOpen(true)} user={user} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
