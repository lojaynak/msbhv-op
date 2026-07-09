"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { ALL_NAV_ITEMS } from "@/config/nav";
import { useLanguage } from "@/lib/i18n/language-provider";

// NOTE: Auth is intentionally not enforced here yet — Supabase isn't
// connected in this phase. This layout will call requireUser() (see
// lib/auth/get-session.ts) once the auth step is wired up; src/proxy.ts's
// redirect is disabled for the same reason. See README for phase status.

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useLanguage();

  const activeItem = ALL_NAV_ITEMS.find((item) => pathname.startsWith(item.href));
  const title = activeItem ? t.nav[activeItem.id] : "";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title={title} onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
