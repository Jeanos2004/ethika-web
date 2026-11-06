import type { LeadStatus } from "@/lib/demo/store";

/** Couleurs des statuts (maquette AdminDemandes.dc.html), en tokens. */
export const statusStyle: Record<LeadStatus, { badge: string; accent: string; active: string }> = {
  new: {
    badge: "bg-line text-muted",
    accent: "border-l-subtle",
    active: "border-subtle bg-line text-ink",
  },
  progress: {
    badge: "bg-gold-50 text-gold-700",
    accent: "border-l-brand-gold",
    active: "border-brand-gold bg-gold-50 text-gold-700",
  },
  confirmed: {
    badge: "bg-green-50 text-green-700",
    accent: "border-l-brand-green",
    active: "border-brand-green bg-green-50 text-green-700",
  },
  cancelled: {
    badge: "bg-red-50 text-red-700",
    accent: "border-l-brand-red",
    active: "border-brand-red bg-red-50 text-red-700",
  },
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
