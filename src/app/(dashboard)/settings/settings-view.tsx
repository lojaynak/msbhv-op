"use client";

import { useState } from "react";
import { Check, Loader2, Moon, Sun } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLanguage, type Locale } from "@/lib/i18n/language-provider";
import { cn, getInitials } from "@/lib/utils";
import type { CurrentUser } from "@/lib/auth/get-session";
import type { Tables } from "@/lib/supabase/database.types";

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

function IntegrationRow({
  integration,
  onRegister,
  registering,
  result,
}: {
  integration: Tables<"integration_status">;
  onRegister?: () => void;
  registering?: boolean;
  result?: string | null;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium capitalize text-foreground">{integration.integration}</span>
        <span
          className={cn(
            "rounded-md px-2 py-0.5 text-xs font-medium",
            integration.connected ? "bg-success-subtle text-success" : "bg-secondary text-muted-foreground",
          )}
        >
          {integration.connected ? "Connected" : "Not connected"}
        </span>
      </div>
      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
        <span>
          Last successful sync:{" "}
          {integration.last_success_at ? new Date(integration.last_success_at).toLocaleString() : "never"}
        </span>
        {integration.last_error && (
          <span className="text-destructive">
            Last error ({integration.last_error_at ? new Date(integration.last_error_at).toLocaleString() : ""}):{" "}
            {integration.last_error}
          </span>
        )}
      </div>
      {onRegister && (
        <button
          onClick={onRegister}
          disabled={registering}
          className="mt-1 flex w-fit items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-hover disabled:opacity-60"
        >
          {registering && <Loader2 className="size-3 animate-spin" />}
          Register Shopify webhooks
        </button>
      )}
      {result && <p className="text-xs text-muted-foreground">{result}</p>}
    </div>
  );
}

export function SettingsView({
  user,
  integrations,
}: {
  user: CurrentUser;
  integrations: Tables<"integration_status">[];
}) {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useLanguage();
  const [registering, setRegistering] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const shopify = integrations.find((i) => i.integration === "shopify");
  const shipblu = integrations.find((i) => i.integration === "shipblu");

  async function handleRegisterWebhooks() {
    setRegistering(true);
    setResult(null);
    try {
      const res = await fetch("/api/shopify/register-webhooks", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setResult(`Error: ${data.error ?? "unknown"}`);
      } else {
        const okCount = data.results.filter((r: { ok: boolean }) => r.ok).length;
        setResult(`Registered ${okCount}/${data.results.length} webhook topics.`);
      }
    } catch (e) {
      setResult(e instanceof Error ? e.message : "Request failed");
    } finally {
      setRegistering(false);
    }
  }

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
            <CardTitle className="text-sm font-medium text-foreground">Integrations</CardTitle>
            <CardDescription>Live connection status — Shopify Stage 1, ShipBlu coming in Stage 2.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {shopify && (
              <IntegrationRow
                integration={shopify}
                onRegister={handleRegisterWebhooks}
                registering={registering}
                result={result}
              />
            )}
            {shipblu && <IntegrationRow integration={shipblu} />}
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
                {getInitials(user.full_name)}
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-medium text-foreground">{user.full_name}</span>
                <span className="text-xs text-muted-foreground">
                  {user.email} · {user.role?.name ?? t.common.role}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
