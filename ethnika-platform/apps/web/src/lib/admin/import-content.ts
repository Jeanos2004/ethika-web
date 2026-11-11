"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api } from "@/lib/api/server";
import { requireAdmin } from "@/lib/admin/session";
import { getCircuits, type Circuit } from "@/content/circuits";
import { getOffers } from "@/content/offers";
import { slugify } from "@/lib/slug";
import type { ApiCircuit, ApiOffer } from "@/lib/admin/types";

/*
 * Reprise des contenus actuels du site (src/content) dans l'API, pour que l'agence parte de l'existant.
 * Idempotent : un slug déjà présent n'est ni recréé ni écrasé. Les éléments importés sont publiés, dans le même ordre.
 */

export type ImportState = { created?: number; skipped?: number; failed?: number };

const days = (c: Circuit) => (c.detail?.days.length ? c.detail.days.length : c.durationBucket === "1" ? 1 : c.durationBucket === "2-4" ? 3 : 5);

function circuitTexts(c: Circuit) {
  const d = c.detail;
  return {
    title: c.title,
    headline: c.headline,
    summary: c.summary,
    place: c.place,
    imageAlt: c.imageAlt,
    durationLabel: c.durationLabel,
    ...(d?.intro && { intro: d.intro }),
    days: (d?.days ?? []).map((x) => ({ title: x.title, text: x.text, ...(x.meta && { meta: x.meta }), ...(x.night && { night: x.night }), ...(x.meals && { meals: x.meals }) })),
    included: d?.included ?? [],
    excluded: d?.excluded ?? [],
  };
}

export async function importSiteContent(_prev: ImportState, formData: FormData): Promise<ImportState> {
  const { session } = await requireAdmin();
  const kind = formData.get("kind") === "offers" ? "offers" : "circuits";
  let created = 0;
  let skipped = 0;
  let failed = 0;

  if (kind === "circuits") {
    const existing = new Set((await api<ApiCircuit[]>("/v1/admin/circuits", { session })).map((c) => c.slug));
    const fr = getCircuits("fr");
    const en = getCircuits("en");
    for (const [i, c] of fr.entries()) {
      if (existing.has(c.slug)) {
        skipped++;
        continue;
      }
      const e = en.find((x) => x.slug === c.slug);
      const body = {
        slug: c.slug,
        theme: c.theme,
        region: c.region,
        durationDays: days(c),
        imageUrl: c.image,
        i18n: { fr: circuitTexts(c), ...(e && { en: circuitTexts(e) }) },
        departures: c.detail?.departures ?? [],
        published: true,
        position: i,
      };
      try {
        await api("/v1/admin/circuits", { method: "POST", session, body });
        created++;
      } catch {
        failed++;
      }
    }
  } else {
    const existing = new Set((await api<ApiOffer[]>("/v1/admin/offers", { session })).map((o) => o.slug));
    const fr = getOffers("fr");
    const en = getOffers("en");
    for (const [i, o] of fr.entries()) {
      const slug = slugify(`${o.type}-${o.title}`).slice(0, 80);
      if (existing.has(slug)) {
        skipped++;
        continue;
      }
      const e = en[i];
      const body = {
        slug,
        type: o.type,
        i18n: {
          fr: { kicker: o.kicker, title: o.title, description: o.description, imageAlt: o.imageAlt },
          ...(e && { en: { kicker: e.kicker, title: e.title, description: e.description, imageAlt: e.imageAlt } }),
        },
        imageUrl: o.image,
        href: o.href,
        published: true,
        position: i,
      };
      try {
        await api("/v1/admin/offers", { method: "POST", session, body });
        created++;
      } catch {
        failed++;
      }
    }
  }
  const path = kind === "offers" ? "/admin/offres" : "/admin/circuits";
  revalidatePath(path);
  // Tout est importé : le bouton disparaît, on revient sur la liste avec la confirmation.
  if (failed === 0) redirect(`${path}?enregistre=1`);
  return { created, skipped, failed };
}
