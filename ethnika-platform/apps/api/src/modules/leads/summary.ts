/** Résumé d'une ligne d'une demande, dans la langue du client (e-mails, notifications). */
export function leadSummary(type: string, details: Record<string, unknown>, locale: "fr" | "en"): { summary: string; route?: { from: string; to: string } } {
  const en = locale === "en";
  const s = (v: unknown) => (typeof v === "string" || typeof v === "number" ? String(v) : "");
  const n = (v: unknown) => Number(v) || 0;
  switch (type) {
    case "billet": {
      const trip = { rt: en ? "Round trip" : "Aller-retour", ow: en ? "One way" : "Aller simple", multi: en ? "Multi-city" : "Multi-destinations" }[s(details.trip)] ?? "";
      const cabin = { eco: en ? "Economy" : "Économique", business: en ? "Business" : "Affaires", first: en ? "First" : "Première" }[s(details.cabin)] ?? "";
      const adults = n(details.adults) || 1;
      const pax = [`${adults} ${en ? (adults > 1 ? "adults" : "adult") : adults > 1 ? "adultes" : "adulte"}`];
      if (n(details.children)) pax.push(`${n(details.children)} ${en ? "child(ren)" : "enfant(s)"}`);
      if (n(details.infants)) pax.push(`${n(details.infants)} ${en ? "infant(s)" : "bébé(s)"}`);
      const date = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v.split("-").reverse().join("/") : "");
      const dates = [date(details.departDate), date(details.returnDate)].filter(Boolean).join(" → ");
      return { summary: [trip, dates, pax.join(", "), cabin].filter(Boolean).join(" · "), route: { from: s(details.from), to: s(details.to) } };
    }
    case "circuit":
      return { summary: [s(details.circuit).replace(/-/g, " "), details.travellers ? `${s(details.travellers)} ${en ? "travellers" : "voyageurs"}` : ""].filter(Boolean).join(" · ") };
    case "groupe":
    case "pelerinage":
    case "pro":
      return { summary: [s(details.organisation), details.travellers ? `${s(details.travellers)} ${en ? "participants" : "participants"}` : "", s(details.period)].filter(Boolean).join(" · ") || (en ? "Professional request" : "Demande professionnelle") };
    default:
      return { summary: s(details.subject) || (en ? "Information request" : "Demande d'information") };
  }
}
