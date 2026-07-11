"use client";

import { Bell, Languages, Menu, Moon, Search, Sun } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLanguage } from "@/lib/i18n/language-provider";
import { UserMenu } from "./user-menu";
import type { CurrentUser } from "@/lib/auth/get-session";

export function Topbar({
  title,
  onOpenMobileNav,
  user,
}: {
  title: string;
  onOpenMobileNav: () => void;
  user: CurrentUser;
}) {
  const { theme, toggleTheme } = useTheme();
  const { locale, toggleLocale, t } = useLanguage();
  const [notice, setNotice] = useState<string | null>(null);

  function showNotice(msg: string) {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 2400);
  }

  return (
    <header className="relative flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenMobileNav}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary/60 md:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-4" />
        </button>
        <span className="text-sm font-medium text-foreground">{title}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="hidden items-center gap-2 rounded-md border border-input bg-surface-hover px-2.5 py-1.5 text-muted-foreground sm:flex">
          <Search className="size-3.5" />
          <span className="text-xs">{t.topbar.search}</span>
        </div>

        <button
          onClick={toggleLocale}
          className="flex h-8 items-center gap-1.5 rounded-md border border-input px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
          aria-label="Toggle language"
        >
          <Languages className="size-3.5" />
          {locale === "en" ? "AR" : "EN"}
        </button>

        <button
          onClick={toggleTheme}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>

        <button
          onClick={() => showNotice(t.topbar.notificationsPreview)}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
          aria-label={t.topbar.notifications}
        >
          <Bell className="size-4" />
        </button>

        <UserMenu user={user} />
      </div>

      {notice && (
        <div className="absolute top-full end-4 mt-2 rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
          {notice}
        </div>
      )}
    </header>
  );
}
