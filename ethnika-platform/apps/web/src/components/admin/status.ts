import type { LeadStatus } from "@/lib/demo/store";

/** Statuts : une simple pastille de couleur (maquette AdminDemandes.dc.html, version sobre), en tokens. */
export const statusDot: Record<LeadStatus, string> = {
  new: "bg-subtle",
  progress: "bg-brand-gold",
  confirmed: "bg-brand-green",
  cancelled: "bg-brand-red",
};

const dateTime = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Conakry",
});
const dateLong = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Conakry",
});

/** « 05/11 09:14 » (colonne « Reçue »). */
export function formatShort(iso: string) {
  return dateTime.format(new Date(iso)).replace(",", "");
}

/** « 5 nov. 2026, 09:14 » (historique). */
export function formatLong(iso: string) {
  return dateLong.format(new Date(iso));
}

/** Lien WhatsApp vers le numéro d'un client (chiffres uniquement). */
export function whatsappTo(phone: string, text: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 8 ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : undefined;
}
