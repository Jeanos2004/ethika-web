import type { IconName } from "@/components/ui/Icon";

/**
 * Sites du Fouta Djallon à visiter depuis Mali : une page de détail chacun
 * (/decouvrir-la-guinee/mali-fouta-djallon/<id>). Structure ici, textes dans messages, espace « foutaSites.<id> ».
 * L'ordre suit les cartes « Les sites à visiter » de la page Mali & le Fouta Djallon.
 */
export const foutaSiteIds = ["mont-loura", "chutes-de-nguilo", "roches-de-koumba"] as const;
export type FoutaSiteId = (typeof foutaSiteIds)[number];

export const foutaBasePath = "/decouvrir-la-guinee/mali-fouta-djallon";

export const foutaSites: Record<FoutaSiteId, { image: string; photo: string; icon: IconName }> = {
  "mont-loura": { image: "/images/fouta-sommets.jpg", photo: "/images/fouta-plateau-couchant.jpg", icon: "mountainSun" },
  "chutes-de-nguilo": { image: "/images/chutes-nguilo.jpg", photo: "/images/vallee-route.jpg", icon: "waterfall" },
  "roches-de-koumba": { image: "/images/roches-koumba.jpg", photo: "/images/collines-brume.jpg", icon: "mountain" },
};

export function isFoutaSite(id: string): id is FoutaSiteId {
  return (foutaSiteIds as readonly string[]).includes(id);
}

export const foutaSitePath = (id: FoutaSiteId) => `${foutaBasePath}/${id}`;
