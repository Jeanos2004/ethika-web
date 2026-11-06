import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/**
 * Proxy Next 16 (ex-middleware) : résout la langue à partir de l'URL.
 * /circuits → français (réécriture interne vers /fr/circuits) ; /en/circuits → anglais ; /fr/… → redirigé sans préfixe.
 */
export default createMiddleware(routing);

export const config = {
  // Toutes les routes sauf API, back-office (français, hors i18n), fichiers internes de Next et fichiers statiques.
  matcher: "/((?!api|admin|_next|_vercel|.*\\..*).*)",
};
