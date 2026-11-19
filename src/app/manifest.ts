import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Armenkyo — alphabet arménien",
    short_name: "Armenkyo",
    description: "Apprendre à lire et écrire l'alphabet arménien.",
    start_url: `${BASE}/`,
    display: "standalone",
    background_color: "#fbf8f4",
    theme_color: "#c2304b",
    lang: "fr",
    icons: [{ src: `${BASE}/icon.svg`, sizes: "any", type: "image/svg+xml" }],
  };
}
