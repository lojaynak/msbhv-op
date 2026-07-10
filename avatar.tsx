import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  /**
   * "empty"    — the feature is fully modeled but has no data yet (Orders, Customers, etc.)
   * "reserved" — the feature itself doesn't exist yet in this phase (Finance, AI Assistant).
   * Reserved uses the brand pink tint (Design System Accent Rule #7) — never a solid fill.
   */
  variant?: "empty" | "reserved";
  /** Optional list of example prompts, shown as static (non-interactive) chips — used by AI Assistant. */
  suggestions?: string[];
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = "empty",
  suggestions,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border px-6 py-20 text-center",
        variant === "reserved" ? "border-chrome bg-primary-subtle" : "border-dashed border-border",
        className,
      )}
    >
      <div
        className={cn(
          "flex size-11 items-center justify-center rounded-lg",
          variant === "reserved" ? "bg-primary-subtle" : "bg-secondary/70",
        )}
      >
        <Icon
          className={cn("size-5", variant === "reserved" ? "text-primary-strong" : "text-muted-foreground")}
          strokeWidth={1.75}
        />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      {suggestions && suggestions.length > 0 && (
        <div className="mt-4 flex w-full max-w-md flex-col gap-2">
          {suggestions.map((q) => (
            <div
              key={q}
              className="cursor-not-allowed rounded-lg border border-border bg-surface-hover px-3.5 py-2.5 text-start text-sm text-muted-foreground"
            >
              {q}
            </div>
          ))}
        </div>
      )}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
