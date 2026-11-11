import { getTranslations } from "next-intl/server";
import type { AgencyPublic } from "@/lib/content-source";
import { Icon } from "@/components/ui/Icon";

/**
 * Carte de l'agence (page Contact) : OpenStreetMap intégré (sans compte, sans clé, sans cookie de suivi),
 * chargé paresseusement ; liens « Itinéraire » (Google Maps) et « Agrandir » (OpenStreetMap).
 * Domaine autorisé dans la CSP (frame-src, next.config.ts).
 */
export async function AgencyMap({ agency }: { agency: AgencyPublic }) {
  const t = await getTranslations("contact");
  const { lat, lng } = agency.geo;
  const approximate = !agency.verified;
  const d = 0.012; // ≈ 1,3 km autour du point : quartier lisible
  const embed = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}&layer=mapnik&marker=${lat}%2C${lng}`;
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const large = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;

  return (
    <figure className="flex min-h-[340px] flex-1 flex-col overflow-hidden rounded-[30px] border border-line bg-sand shadow-sm">
      <iframe title={t("mapTitle")} src={embed} loading="lazy" referrerPolicy="no-referrer" className="min-h-[260px] w-full flex-1 border-0 grayscale-[20%]" />
      <figcaption className="flex flex-wrap items-center justify-between gap-3 bg-white px-5 py-4">
        <span className="flex min-w-0 items-start gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-gold text-ink">
            <Icon name="pin" size={17} />
          </span>
          <span className="flex min-w-0 flex-col">
            <strong className="text-[15px] text-night">{agency.address}</strong>
            {approximate && <span className="text-xs text-muted">{t("mapApproximate")}</span>}
          </span>
        </span>
        <span className="flex gap-2">
          <a href={directions} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-night px-4 text-sm font-semibold text-white hover:bg-night-2">
            <Icon name="arrowUpRight" size={15} /> {t("mapDirections")}
          </a>
          <a href={large} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center rounded-full border-[1.5px] border-night px-4 text-sm font-semibold text-night hover:bg-night hover:text-white">
            {t("mapOpen")}
          </a>
        </span>
      </figcaption>
    </figure>
  );
}
