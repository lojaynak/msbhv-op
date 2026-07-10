"use client";

import { X } from "lucide-react";
import { NAV_GROUPS } from "@/config/nav";
import { SidebarNavItem } from "./sidebar-nav-item";
import { useLanguage } from "@/lib/i18n/language-provider";
import { SITE } from "@/config/site";
import { cn, getInitials } from "@/lib/utils";
import type { CurrentUser } from "@/lib/auth/get-session";

type SidebarProps = {
  /** Mobile slide-over open state. Ignored on desktop (always visible). */
  mobileOpen: boolean;
  onClose: () => void;
  user: CurrentUser;
};

export function Sidebar({ mobileOpen, onClose, user }: SidebarProps) {
  const { t } = useLanguage();

  const content = (
    <div className="flex h-full w-64 shrink-0 flex-col bg-sidebar border-e border-sidebar-border">
      <div className="flex items-center justify-between gap-2.5 px-5 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary-subtle text-xs font-semibold text-primary-strong">
            M
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">{SITE.brand}</span>
            <span className="text-[11px] text-muted-foreground">Operations</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary/60 md:hidden"
          aria-label="Close menu"
        >
          <X className="size-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} className="mb-4">
            {group.groupKey && (
              <div className="px-2.5 pb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                {t.nav[group.groupKey]}
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <SidebarNavItem key={item.id} item={item} onNavigate={onClose} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-2.5 border-t border-sidebar-border px-4 py-4">
        <div className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-medium text-foreground">
          {getInitials(user.full_name)}
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-xs font-medium text-sidebar-foreground">{user.full_name}</span>
          <span className="text-[11px] text-muted-foreground">{user.role?.name ?? t.common.role}</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: always visible, static */}
      <aside className="hidden md:block h-full">{content}</aside>

      {/* Mobile: slide-over with overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/50 transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={onClose}
        />
        <div
          className={cn(
            "absolute inset-y-0 start-0 transition-transform duration-200 ease-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full",
          )}
        >
          {content}
        </div>
      </div>
    </>
  );
}
