@tailwind base;
@tailwind components;
@tailwind utilities;

/* ---------------------------------------------------------------------
 * MSBHV Design System — LOCKED token set (approved).
 * Official brand accent: #D96B9A (MSBHV dusty pink). Used as a solid fill
 * in exactly one place (primary buttons) — everywhere else it's a 10-16%
 * tint or a text color. 90-95% of the interface is neutral by design.
 *
 * Rebuilt on Tailwind v3 (classic @tailwind directives + tailwind.config.js
 * color mapping) instead of v4's @theme/Lightning CSS engine — plain CSS
 * custom properties here, no native binary involved in processing this file.
 * ------------------------------------------------------------------- */

:root {
  --radius: 0.5rem;

  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);

  /* Neutral scale — White -> Black, soft warm gray (light mode = light end) */
  --background: #FFFFFF;
  --foreground: #0A0908;

  --surface: #FFFFFF;
  --surface-hover: #F7F6F4;
  --card: var(--surface);
  --card-foreground: var(--foreground);

  --popover: #FFFFFF;
  --popover-foreground: var(--foreground);

  /* Brand pink — identical hex in both modes, it's a brand color not a tint */
  --primary: #D96B9A;
  --primary-strong: #B84A76;      /* hover/pressed, and light-mode text-on-accent */
  --primary-subtle: rgba(217, 107, 154, 0.10);
  --primary-foreground: #18140F;  /* near-black text on solid pink fill (contrast-driven) */

  --secondary: #EEEBE7;
  --secondary-foreground: var(--foreground);

  --muted: #F7F6F4;
  --muted-foreground: #8A8172;

  --destructive: #8C3B34;
  --destructive-foreground: #FAF9F6;
  --destructive-subtle: rgba(140, 59, 52, 0.12);

  --success: #3F6B4E;
  --success-subtle: rgba(63, 107, 78, 0.12);

  --warning: #9C6B23;
  --warning-subtle: rgba(156, 107, 35, 0.12);

  --info: #4A5568;
  --info-subtle: rgba(74, 85, 104, 0.12);

  --chrome: #C7C9CC;
  --chrome-strong: #8B8D91;

  --border: #EEEBE7;
  --border-strong: #DDD9D2;
  --input: #EEEBE7;
  --ring: rgba(217, 107, 154, 0.35);

  --sidebar: #FFFFFF;
  --sidebar-foreground: #0A0908;
  --sidebar-border: #EEEBE7;
  --sidebar-accent: var(--primary-subtle);
  --sidebar-accent-foreground: #B84A76;
  --sidebar-ring: var(--ring);

  --chart-1: #D96B9A;
  --chart-2: #9C6B23;
  --chart-3: #3F6B4E;
  --chart-4: #A79F8F;
  --chart-5: #4A5568;
}

.dark {
  --background: #0A0908;
  --foreground: #FFFFFF;

  --surface: #1C1A15;
  --surface-hover: #2E2B24;
  --card: var(--surface);
  --card-foreground: var(--foreground);

  --popover: #211E18;
  --popover-foreground: var(--foreground);

  --primary: #D96B9A;
  --primary-strong: #E187AE;
  --primary-subtle: rgba(217, 107, 154, 0.16);
  --primary-foreground: #18140F;

  --secondary: #2E2B24;
  --secondary-foreground: var(--foreground);

  --muted: #242219;
  --muted-foreground: #A79F8F;

  --destructive: #C97268;
  --destructive-foreground: #FAF9F6;
  --destructive-subtle: rgba(201, 114, 104, 0.16);

  --success: #6FA37F;
  --success-subtle: rgba(111, 163, 127, 0.16);

  --warning: #D2A34F;
  --warning-subtle: rgba(210, 163, 79, 0.16);

  --info: #9AA5B8;
  --info-subtle: rgba(154, 165, 184, 0.16);

  --chrome: #8B8D91;
  --chrome-strong: #C7C9CC;

  --border: #37342C;
  --border-strong: #4C473C;
  --input: rgba(255, 255, 255, 0.08);
  --ring: rgba(217, 107, 154, 0.4);

  --sidebar: #131210;
  --sidebar-foreground: #F2F0EC;
  --sidebar-border: #2E2B24;
  --sidebar-accent: var(--primary-subtle);
  --sidebar-accent-foreground: #E187AE;
  --sidebar-ring: var(--ring);

  --chart-1: #D96B9A;
  --chart-2: #D2A34F;
  --chart-3: #6FA37F;
  --chart-4: #6B6457;
  --chart-5: #9AA5B8;
}

/* Arabic gets its own paired typeface — Geist has no Arabic glyph coverage.
   Swaps purely via the dir attribute, no per-component logic needed. */
[dir="rtl"] {
  --font-sans: var(--font-ibm-plex-arabic), var(--font-geist-sans), sans-serif;
}
[dir="rtl"] body {
  font-size: 15px;
  line-height: 22px;
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "cv11", "ss01";
  }

  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb {
    background: color-mix(in srgb, var(--foreground) 14%, transparent);
    border-radius: 999px;
    border: 2px solid transparent;
    background-clip: padding-box;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: color-mix(in srgb, var(--foreground) 22%, transparent);
    background-clip: padding-box;
  }
}

/* Custom semantic utilities not covered by tailwind.config's color mapping
   (subtle-background/foreground variants). Plain CSS classes — no Tailwind
   v4-specific @theme mechanism involved. */
@layer utilities {
  .bg-surface { background-color: var(--surface); }
  .bg-surface-hover { background-color: var(--surface-hover); }
  .bg-primary-subtle { background-color: var(--primary-subtle); }
  .text-primary-strong { color: var(--primary-strong); }
  .bg-success-subtle { background-color: var(--success-subtle); }
  .text-success { color: var(--success); }
  .bg-warning-subtle { background-color: var(--warning-subtle); }
  .text-warning { color: var(--warning); }
  .bg-destructive-subtle { background-color: var(--destructive-subtle); }
  .bg-info-subtle { background-color: var(--info-subtle); }
  .text-info { color: var(--info); }
  .border-chrome { border-color: var(--chrome); }
  .text-chrome-strong { color: var(--chrome-strong); }
}
