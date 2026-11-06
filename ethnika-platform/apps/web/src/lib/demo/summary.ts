import { getCircuit } from "@/content/circuits";
import { cityOf, extractIata } from "@/content/airports";
import { cabins, proRequestTypes, tripTypes } from "@/lib/schemas/search";
import type { DemoLead } from "@/lib/demo/store";

/** Trajet d'une demande de billet, pour la carte « embarquement » de l'e-mail. */
export type LeadRoute = { from: string; to: string; fromCity: string; toCity: string };

export type LeadDigest = { summary: string; route?: LeadRoute; tripLine?: string; note?: string };

const code = (v?: string) => (v ? (extractIata(v) ?? v.slice(0, 3).toUpperCase()) : "");

function plural(n: number, one: string, many: string) {
  return `${n} ${n > 1 ? many : one}`;
}

/** Date AAAA-MM-JJ → JJ/MM/AAAA (affichage back-office). */
export function shortDate(iso?: string) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso ?? "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

/** Résumé d'une demande en une ligne (maquette AdminDemandes.dc.html, colonne « Détail »). */
export function digest(lead: DemoLead): LeadDigest {
  const f = lead.fields;
  const note = f.message;
  if (lead.summary) return { summary: lead.summary, note };

  switch (lead.type) {
    case "billet": {
      const from = code(f.from);
      const to = code(f.to);
      const trip = f.trip === "rt" ? "A/R" : f.trip === "multi" ? "multi-destinations" : "aller simple";
      const adults = Number(f.adults ?? 1);
      const pax = [plural(adults, "adulte", "adultes"), Number(f.children) ? plural(Number(f.children), "enfant", "enfants") : "", Number(f.infants) ? plural(Number(f.infants), "bébé", "bébés") : ""]
        .filter(Boolean)
        .join(", ");
      const cabin = cabins[f.cabin as keyof typeof cabins] ?? cabins.eco;
      const dates = [shortDate(f.departDate), shortDate(f.returnDate)].filter(Boolean).join(" → ") || "[Dates]";
      return {
        summary: `${from} → ${to} · ${trip} · ${pax}`,
        route: { from, to, fromCity: cityOf(from, "fr"), toCity: cityOf(to, "fr") },
        tripLine: `${tripTypes[f.trip as keyof typeof tripTypes] ?? tripTypes.ow} · ${dates} · ${pax} · ${cabin}`,
        note,
      };
    }
    case "circuit": {
      const c = f.circuit ? getCircuit(f.circuit) : undefined;
      const title = c?.title ?? f.circuitTitle ?? "Circuit";
      const parts = [title, c?.durationLabel, f.travellers ? `${f.travellers} pers.` : "", f.travelDate ? shortDate(f.travelDate) : ""].filter(Boolean);
      return { summary: parts.join(" · "), note };
    }
    case "groupe":
    case "pelerinage":
    case "pro": {
      const kind = proRequestTypes[f.request as keyof typeof proRequestTypes] ?? "Demande professionnelle";
      const parts = [kind, f.travellers ? `${f.travellers} pers.` : "", f.period ?? "", f.organisation ?? ""].filter(Boolean);
      return { summary: parts.join(" · "), note };
    }
    default:
      return { summary: f.subject || "Message via le formulaire de contact", note };
  }
}

/** Prénom pour la formule d'appel de l'e-mail (« Bonjour Aminata, »). */
export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}
