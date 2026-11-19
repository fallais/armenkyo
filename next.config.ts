import type { NextConfig } from "next";
import { execSync } from "node:child_process";
import pkg from "./package.json";

/**
 * Export statique (GitHub Pages) : l'application n'a pas besoin de serveur.
 * PAGES_BASE_PATH vaut « /armenkyo » en production (dépôt servi sous fallais.github.io/armenkyo).
 * Cache Components n'est pas activé : il ne sert qu'avec un serveur et refuse `dynamicParams`.
 */
const basePath = process.env.PAGES_BASE_PATH ?? "";

/** Révision affichée dans l'aide : SHA fourni par GitHub Actions, sinon celui du dépôt local. */
function commit(): string {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7);
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "dev";
  }
}

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_APP_VERSION: pkg.version,
    NEXT_PUBLIC_COMMIT: commit(),
    NEXT_PUBLIC_BUILD_DATE: new Date().toISOString().slice(0, 10),
  },
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
