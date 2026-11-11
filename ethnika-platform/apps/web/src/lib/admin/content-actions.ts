"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { api, ApiError } from "@/lib/api/server";
import { requireAdmin } from "@/lib/admin/session";
import { quoteCurrencies, toMinorUnits, type QuoteCurrency } from "@/lib/admin/money";

/*
 * Contenus du site gérés depuis le back-office (administrateurs) : offres et circuits, FR obligatoire, EN facultatif.
 * Validation ici pour des messages clairs, puis validation stricte par l'API (liens internes, images, slugs).
 */

export type ContentState = { error?: string; saved?: number };

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const lines = (fd: FormData, k: string) =>
  str(fd, k)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
/** Champs facultatifs : une chaîne vide n'est pas envoyée (l'API exigerait au moins un caractère). */
function compact<T extends Record<string, unknown>>(o: T) {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== "" && v !== undefined && !(Array.isArray(v) && v.length === 0))) as Partial<T>;
}

function errorKey(e: unknown) {
  if (e instanceof ApiError) {
    if (e.status === 409) return "slugTaken";
    if (e.status === 400) return "contentForm";
    if (e.status === 404) return "notFound";
  }
  return "unavailable";
}

function price(fd: FormData, amountKey: string) {
  const text = str(fd, amountKey);
  const currency = str(fd, "currency");
  if (!text) return { amount: null, currency: null };
  if (!(currency in quoteCurrencies)) return undefined;
  const amount = toMinorUnits(text, currency as QuoteCurrency);
  return amount === null ? undefined : { amount, currency };
}

const id = z.uuid();
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(3).max(80);

/* ---------- Offres ---------- */

export async function saveOffer(_prev: ContentState, fd: FormData): Promise<ContentState> {
  const { session } = await requireAdmin();
  const existing = str(fd, "id");
  const p = price(fd, "price");
  if (!slug.safeParse(str(fd, "slug")).success || !p || (existing && !id.safeParse(existing).success)) return { error: "contentForm" };
  const en = compact({ kicker: str(fd, "en.kicker"), title: str(fd, "en.title"), description: str(fd, "en.description"), imageAlt: str(fd, "en.imageAlt") });
  const body = {
    slug: str(fd, "slug"),
    type: str(fd, "type"),
    i18n: { fr: { kicker: str(fd, "fr.kicker"), title: str(fd, "fr.title"), description: str(fd, "fr.description"), imageAlt: str(fd, "fr.imageAlt") }, ...(Object.keys(en).length && { en }) },
    imageUrl: str(fd, "imageUrl"),
    href: str(fd, "href"),
    priceAmount: p.amount,
    currency: p.currency,
    validUntil: str(fd, "validUntil") || null,
    published: fd.get("published") === "on",
    position: Number(str(fd, "position") || 0),
  };
  try {
    if (existing) await api(`/v1/admin/offers/${existing}`, { method: "PATCH", session, body });
    else await api("/v1/admin/offers", { method: "POST", session, body });
  } catch (e) {
    return { error: errorKey(e) };
  }
  revalidatePath("/admin/offres");
  redirect("/admin/offres?enregistre=1");
}

/* ---------- Circuits ---------- */

export async function saveCircuit(_prev: ContentState, fd: FormData): Promise<ContentState> {
  const { session } = await requireAdmin();
  const existing = str(fd, "id");
  const p = price(fd, "priceFrom");
  if (!slug.safeParse(str(fd, "slug")).success || !p || (existing && !id.safeParse(existing).success)) return { error: "contentForm" };

  const titles = fd.getAll("day.title").map((v) => String(v).trim());
  const days = titles
    .map((title, i) =>
      compact({
        title,
        meta: String(fd.getAll("day.meta")[i] ?? "").trim(),
        text: String(fd.getAll("day.text")[i] ?? "").trim(),
        night: String(fd.getAll("day.night")[i] ?? "").trim(),
        meals: String(fd.getAll("day.meals")[i] ?? "").trim(),
      }),
    )
    .filter((d) => d.title || d.text);
  const departures = fd
    .getAll("dep.dates")
    .map((v, i) => ({ dates: String(v).trim(), status: String(fd.getAll("dep.status")[i] ?? "available"), price: String(fd.getAll("dep.price")[i] ?? "").trim() }))
    .filter((d) => d.dates);

  const fr = {
    title: str(fd, "fr.title"),
    headline: str(fd, "fr.headline"),
    summary: str(fd, "fr.summary"),
    place: str(fd, "fr.place"),
    imageAlt: str(fd, "fr.imageAlt"),
    durationLabel: str(fd, "fr.durationLabel"),
    ...compact({ intro: str(fd, "fr.intro") }),
    days,
    included: lines(fd, "fr.included"),
    excluded: lines(fd, "fr.excluded"),
  };
  const en = compact({
    title: str(fd, "en.title"),
    headline: str(fd, "en.headline"),
    summary: str(fd, "en.summary"),
    place: str(fd, "en.place"),
    imageAlt: str(fd, "en.imageAlt"),
    durationLabel: str(fd, "en.durationLabel"),
    intro: str(fd, "en.intro"),
  });
  const body = {
    slug: str(fd, "slug"),
    theme: str(fd, "theme"),
    region: str(fd, "region"),
    durationDays: Number(str(fd, "durationDays")),
    imageUrl: str(fd, "imageUrl"),
    priceFrom: p.amount,
    currency: p.currency,
    i18n: { fr, ...(Object.keys(en).length && { en }) },
    departures,
    published: fd.get("published") === "on",
    position: Number(str(fd, "position") || 0),
  };
  try {
    if (existing) await api(`/v1/admin/circuits/${existing}`, { method: "PATCH", session, body });
    else await api("/v1/admin/circuits", { method: "POST", session, body });
  } catch (e) {
    return { error: errorKey(e) };
  }
  revalidatePath("/admin/circuits");
  redirect("/admin/circuits?enregistre=1");
}

/* ---------- Commun ---------- */

const kind = z.enum(["offers", "circuits"]);
const pathOf = { offers: "/admin/offres", circuits: "/admin/circuits" } as const;

export async function setPublished(fd: FormData) {
  const { session } = await requireAdmin();
  const k = kind.parse(fd.get("kind"));
  await api(`/v1/admin/${k}/${id.parse(fd.get("id"))}`, { method: "PATCH", session, body: { published: fd.get("published") === "true" } });
  revalidatePath(pathOf[k]);
}

export async function deleteContent(fd: FormData) {
  const { session } = await requireAdmin();
  const k = kind.parse(fd.get("kind"));
  await api(`/v1/admin/${k}/${id.parse(fd.get("id"))}`, { method: "DELETE", session });
  revalidatePath(pathOf[k]);
  redirect(pathOf[k]);
}
