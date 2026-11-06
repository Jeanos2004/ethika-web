import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ETHNIKA · Tourisme & Voyages",
    short_name: "ETHNIKA",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFBF5",
    theme_color: "#16211C",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
