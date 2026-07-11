import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  Truck,
  Undo2,
  Boxes,
  MessagesSquare,
  ListChecks,
  BarChart3,
  Wallet,
  Sparkles,
  Settings,
} from "lucide-react";
import type { Dictionary } from "@/lib/i18n/en";

export type NavId =
  | "dashboard" | "orders" | "customers" | "products" | "shipments" | "returns" | "inventory"
  | "communications" | "tasks" | "analytics" | "finance" | "aiAssistant" | "settings";

export type NavItem = {
  id: NavId;
  href: string;
  icon: LucideIcon;
  /** True for modules that are reserved but have no feature behind them yet (Phase 1). */
  reserved?: boolean;
};

export type NavGroup = {
  /** Key into Dictionary["nav"], or null for the ungrouped trailing section (Settings). */
  groupKey: keyof Pick<Dictionary["nav"], "groupOperations" | "groupEngagement" | "groupInsights"> | null;
  items: NavItem[];
};

/**
 * Single source of truth for the sidebar. Labels come from the active
 * locale's dictionary (src/lib/i18n) via item.id — this file only owns
 * structure (grouping, order, icon, route, reserved flag).
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    groupKey: "groupOperations",
    items: [
      { id: "dashboard", href: "/dashboard", icon: LayoutDashboard },
      { id: "orders", href: "/orders", icon: ShoppingCart },
      { id: "customers", href: "/customers", icon: Users },
      { id: "products", href: "/products", icon: Package },
      { id: "shipments", href: "/shipments", icon: Truck },
      { id: "returns", href: "/returns", icon: Undo2 },
      { id: "inventory", href: "/inventory", icon: Boxes },
    ],
  },
  {
    groupKey: "groupEngagement",
    items: [
      { id: "communications", href: "/communications", icon: MessagesSquare },
      { id: "tasks", href: "/tasks", icon: ListChecks },
    ],
  },
  {
    groupKey: "groupInsights",
    items: [
      { id: "analytics", href: "/analytics", icon: BarChart3 },
      { id: "finance", href: "/finance", icon: Wallet, reserved: true },
      { id: "aiAssistant", href: "/ai-assistant", icon: Sparkles, reserved: true },
    ],
  },
  {
    groupKey: null,
    items: [{ id: "settings", href: "/settings", icon: Settings }],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);
