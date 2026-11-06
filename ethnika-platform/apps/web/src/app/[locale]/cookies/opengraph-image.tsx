import { routing } from "@/i18n/routing";
import { ogFor } from "@/lib/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "ETHNIKA";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
export default ogFor("cookies");
