# MSBHV Ops — App Shell (Windows-safe rebuild)

Internal operations dashboard for MSBHV. This build is deliberately pinned to a conservative, stable
toolchain so it runs cleanly on a standard Windows 11 machine with no native-binding or blocked-binary
issues.

## Exact versions in this build

| Package | Version | Why |
|---|---|---|
| Next.js | **15.5.20** (latest stable 15.x) | Not 16 — avoids the newer `proxy.ts` convention and any 16-era changes; uses the traditional `middleware.ts` convention |
| React / React DOM | **19.2.7** | Current stable, fully supported by Next 15 |
| Tailwind CSS | **3.4.19** (v3, not v4) | Classic PostCSS pipeline — **no Lightning CSS, no Oxide engine**. v4's new engine is Rust/native-binding-based and is the most common source of "won't install on Windows" issues |
| Bundler | **Webpack** (Next's default) | No `--turbopack` flag anywhere in this project — `next dev` / `next build` / `next start` all run the standard Webpack pipeline |
| PostCSS / Autoprefixer | 8.x / 10.x | Plain JS, no native binaries |
| tailwindcss-animate | 1.0.7 | v3-compatible animation utilities (replaces v4's `tw-animate-css` import) |
| lucide-react | 1.24.0 | Bumped from the original 0.383.0 — that version doesn't declare React 19 as a supported peer; 1.24.0 does |
| @supabase/ssr | 0.12.0 | Bumped from 0.5.x for cleaner TypeScript inference under React 19 |

## Native-binding honesty check

Three things in `node_modules` are native (platform-specific) binaries, and it's worth being upfront
about exactly what they are, since "no native bindings" is rarely 100% achievable with Next.js itself:

1. **`@next/swc-*`** — Next.js's own Rust-based compiler. This ships for every platform Next supports,
   including `@next/swc-win32-x64-msvc` for Windows, and is not something any Next.js project can avoid
   — it's how Next.js compiles your code on every OS. It's mature, widely deployed, and not the source
   of the Tailwind-v4-era Windows issues you were likely running into.
2. **`sharp`** — used by `next/image` for image optimization. Has a Windows prebuilt binary; if it ever
   fails to install in a locked-down environment, Next.js automatically falls back to unoptimized images
   with a console warning rather than breaking the build.
3. **`unrs-resolver`** (via `eslint-import-resolver-typescript`, a dependency of `eslint-config-next`) —
   this only runs during `npm run lint`, never during `dev`/`build`/`start`, and has its own WASM/JS
   fallback if the native binding can't load.

**What's genuinely gone:** Lightning CSS and Tailwind's Oxide engine (Tailwind v4-specific), Turbopack,
and any `experimental.*` flags in `next.config.js`. Those were the actual native-binding risk in the
previous build — this one doesn't have them.

## Getting started (Windows 11)

1. Install [Node.js LTS](https://nodejs.org) (20.x or 22.x).
2. Unzip this project.
3. Open PowerShell or Command Prompt in the project folder.
4. `npm install`
5. `npm run dev`
6. Open `http://localhost:3000`.

No WSL, no build tools (`node-gyp`, Visual Studio Build Tools, Python) should be required — everything
above is either pure JS or ships a prebuilt Windows binary.

## What's included

Same as the previous app-shell step — sidebar, topbar, dark/light toggle, EN/AR with RTL, dashboard with
mock stat cards, empty states for every module, Finance/AI Assistant reserved states, and a working
Settings page. Mock data only — Supabase isn't connected, and `middleware.ts`'s auth redirect is
disabled for the same reason (see the comment in that file).

## Structure

- `src/app` — routing (App Router), `(dashboard)` route group holds all 13 pages
- `src/components/{ui,layout,shared}` — shadcn-style primitives, app shell, cross-domain shared pieces
- `src/lib/{theme,i18n,supabase,auth}` — dark/light provider, EN/AR provider + dictionaries, Supabase
  client setup (built, not yet connected), auth session helper
- `src/config/nav.ts` — sidebar structure (labels come from `src/lib/i18n`)
- `supabase/migrations` — full schema + RLS, ready to run against a real Supabase project
- `tailwind.config.js` / `postcss.config.js` / `globals.css` — the v3 token system, functionally
  identical output to the v4 version, different (simpler, non-native) build pipeline underneath
