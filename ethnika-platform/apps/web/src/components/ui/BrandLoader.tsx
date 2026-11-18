import { clsx } from "clsx";

/**
 * Loader de marque ETHNIKA : le symbole respire au centre d'un anneau aux trois couleurs du logo (rouge, or, vert)
 * qui tourne, sous lequel une fine barre glisse. Le fond couvre l'écran immédiatement ; le logo apparaît en fondu.
 * Mouvement réduit : l'anneau et la barre s'arrêtent, seul un léger fondu reste.
 * `tone` : fond clair (site) ou sombre (back-office) ; `fullscreen` : couvre tout l'écran.
 */
export function BrandLoader({ label, tone = "light", fullscreen = false }: { label: string; tone?: "light" | "dark"; fullscreen?: boolean }) {
  const dark = tone === "dark";
  return (
    <div
      role="status"
      aria-live="polite"
      className={clsx(
        // Fond opaque dès le premier affichage (sinon la page vide, pied de page remonté, transparaît) ; seul le contenu apparaît en fondu.
        "flex flex-col items-center justify-center gap-6 [&>*]:animate-loader-in",
        fullscreen ? "fixed inset-0 z-[100]" : "min-h-[60vh] w-full py-24",
        fullscreen && (dark ? "bg-night" : "bg-cream"),
      )}
    >
      <div className="relative size-[104px]">
        {/* Anneau tricolore : dégradé conique masqué en anneau. */}
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,var(--color-brand-red),var(--color-brand-gold),var(--color-brand-green),transparent_78%)] [mask:radial-gradient(farthest-side,transparent_calc(100%-4px),#000_calc(100%-3px))] motion-safe:animate-loader-spin"
        />
        <span aria-hidden="true" className={clsx("absolute inset-[10px] rounded-full", dark ? "bg-night-2" : "bg-white shadow-[0_8px_30px_-12px_rgb(22_33_28/0.35)]")} />
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG de marque local, sans optimisation nécessaire */}
        <img src="/brand/symbole-couleur.svg" alt="" width={52} height={52} className="absolute inset-0 m-auto size-[52px] motion-safe:animate-loader-breathe" />
      </div>
      <div className="flex flex-col items-center gap-3">
        <span className={clsx("font-mono text-[11px] tracking-[0.32em] uppercase", dark ? "text-on-dark-muted" : "text-subtle")}>ETHNIKA</span>
        <span aria-hidden="true" className={clsx("relative h-[3px] w-28 overflow-hidden rounded-full", dark ? "bg-night-line" : "bg-line")}>
          <span className="absolute inset-y-0 left-0 w-2/5 rounded-full bg-brand-gold motion-safe:animate-loader-slide" />
        </span>
        <span className="sr-only">{label}</span>
      </div>
    </div>
  );
}
