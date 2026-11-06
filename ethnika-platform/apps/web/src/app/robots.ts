import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { isDemo } from "@/lib/demo/mode";

export default function robots(): MetadataRoute.Robots {
  // Site de démonstration (placeholders, données fictives) : aucune indexation.
  if (isDemo) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/merci"] }],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
