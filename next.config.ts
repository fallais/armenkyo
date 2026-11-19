import type { NextConfig } from "next";

/**
 * Export statique (GitHub Pages) : l'application n'a pas besoin de serveur.
 * PAGES_BASE_PATH vaut « /armenkyo » en production (dépôt servi sous fallais.github.io/armenkyo).
 * Cache Components n'est pas activé : il ne sert qu'avec un serveur et refuse `dynamicParams`.
 */
const basePath = process.env.PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
