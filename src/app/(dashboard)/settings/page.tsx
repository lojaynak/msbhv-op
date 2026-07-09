"use client";

import { Check, Moon, Sun } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLanguage, type Locale } from "@/lib/i18n/language-provider";
import { cn } from "@/lib/utils";

function OptionCard({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-between gap-2 rounded-lg border px-4 py-3 text-start text-sm transition-colors",
        active
          ? "border-primary bg-primary-subtle font-medium text-primary-strong"
          : "border-border text-muted-foreground hover:bg-surface-hover hover:text-foreground",
      )}
    >
      <span className="flex items-center gap-2">
        {icon}
        {label}
      </span>
      {active && <Check className="size-4" />}
    </button>
  );
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useLanguage();

  return (
    <div>
      <PageHeader title={t.settings.title} description={t.settings.description} />

      <div className="flex flex-col gap-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">{t.settings.appearance}</CardTitle>
            <CardDescription>{t.settings.appearanceDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 sm:flex-row">
              <OptionCard
                active={theme === "dark"}
                onClick={() => setTheme("dark")}
                icon={<Moon className="size-4" />}
                label={t.settings.dark}
              />
              <OptionCard
                active={theme === "light"}
                onClick={() => setTheme("light")}
                icon={<Sun className="size-4" />}
                label={t.settings.light}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">{t.settings.language}</CardTitle>
            <CardDescription>{t.settings.languageDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 sm:flex-row">
              {(["en", "ar"] as Locale[]).map((l) => (
                <OptionCard
                  key={l}
                  active={locale === l}
                  onClick={() => setLocale(l)}
                  label={l === "en" ? t.settings.english : t.settings.arabic}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">{t.settings.account}</CardTitle>
            <CardDescription>{t.settings.accountDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-border px-4 py-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-secondary text-xs font-medium text-foreground">
                AM
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-medium text-foreground">Amira M.</span>
                <span className="text-xs text-muted-foreground">amira@msbhv.com · {t.common.role}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
