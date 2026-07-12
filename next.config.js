/** @type {import('next').NextConfig} */
const nextConfig = {
  // Deliberately minimal: no experimental flags, no Turbopack config.
  // `next dev` / `next build` use Webpack by default in Next.js 15 unless
  // `--turbopack` is explicitly passed — it is not, anywhere in this project.
  reactStrictMode: true,
};

module.exports = nextConfig;
