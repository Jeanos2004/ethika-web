import { asset, brandStyles, esc, frenchDate } from "./html";

/** Données nécessaires au récapitulatif (sous-ensemble du modèle Lead). */
export type LeadForPdf = {
  reference: string;
  type: "contact" | "billet" | "circuit" | "groupe" | "pelerinage" | "pro";
  fullName: string;
  phone: string;
  email: string | null;
  message: string | null;
  details: unknown;
  createdAt: Date;
};

export type AgencyInfo = { address: string; phone: string; email: string; licence: string; site: string; paymentInstructions?: string; quoteTerms?: string };

const typeTitles: Record<LeadForPdf["type"], string> = {
  contact: "Message",
  billet: "Billet d'avion",
  circuit: "Circuit en Guinée",
  groupe: "Voyage de groupe",
  pelerinage: "Pèlerinage",
  pro: "Voyage professionnel",
};

const trips: Record<string, string> = { rt: "Aller-retour", ow: "Aller simple", multi: "Multi-destinations" };
const cabins: Record<string, string> = { eco: "Économique", business: "Affaires", first: "Première" };
const requests: Record<string, string> = { groupe: "Groupe", pelerinage: "Pèlerinage", entreprise: "Entreprise / institution", ong: "ONG" };

const dateFr = (iso?: unknown) => (typeof iso === "string" && /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.split("-").reverse().join("/") : "—");
const str = (v: unknown) => (typeof v === "string" || typeof v === "number" ? String(v) : "");

/** Lignes « libellé / valeur » propres au type de demande. */
function rows(lead: LeadForPdf): [string, string][] {
  const d = (lead.details ?? {}) as Record<string, unknown>;
  switch (lead.type) {
    case "billet": {
      const pax = [`${str(d.adults) || 1} adulte(s)`, Number(d.children) ? `${str(d.children)} enfant(s)` : "", Number(d.infants) ? `${str(d.infants)} bébé(s)` : ""].filter(Boolean).join(", ");
      const legs = Array.isArray(d.legs) ? (d.legs as Record<string, unknown>[]).map((l) => `${str(l.from)} → ${str(l.to)} le ${dateFr(l.date)}`).join(" · ") : "";
      return [
        ["Trajet", `${str(d.from)} → ${str(d.to)}`],
        ["Type", trips[str(d.trip)] ?? "—"],
        ["Départ", dateFr(d.departDate)],
        ...(d.returnDate ? ([["Retour", dateFr(d.returnDate)]] as [string, string][]) : []),
        ...(legs ? ([["Vols suivants", legs]] as [string, string][]) : []),
        ["Passagers", pax],
        ["Classe", cabins[str(d.cabin)] ?? "—"],
      ];
    }
    case "circuit":
      return [
        ["Circuit", str(d.circuit).replace(/-/g, " ")],
        ["Voyageurs", str(d.travellers) || "—"],
        ["Date souhaitée", dateFr(d.travelDate)],
      ];
    case "groupe":
    case "pelerinage":
    case "pro":
      return [
        ["Demande", requests[str(d.request)] ?? "—"],
        ["Organisation", str(d.organisation) || "—"],
        ["Participants", str(d.travellers) || "—"],
        ["Période", str(d.period) || "—"],
      ];
    default:
      return [["Objet", str(d.subject) || "Demande d'information"]];
  }
}

/** Récapitulatif d'une demande, remis au client ou joint au dossier. Ce n'est ni un devis ni une confirmation. */
export function leadSummaryHtml(lead: LeadForPdf, agency: AgencyInfo): string {
  const created = frenchDate(lead.createdAt, true);
  const route = lead.type === "billet" ? ((lead.details ?? {}) as Record<string, unknown>) : undefined;
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${esc(lead.reference)}</title><style>
  ${brandStyles()}
  .head { background: var(--night); color: #fff; padding: 10mm 18mm 7mm; position: relative; overflow: hidden; }
  .head .symbol { position: absolute; right: -18mm; top: -10mm; width: 78mm; opacity: .08; }
  .stripe { display: flex; height: 2.2mm; } .stripe span { flex: 1; }
  .head .logo { height: 15mm; margin-left: -2mm; }
  .head h1 { margin: 6mm 0 1mm; font-size: 27px; letter-spacing: -0.03em; line-height: 1.1; }
  .head .meta { display: flex; gap: 10mm; color: #d0d4cf; font-size: 11px; margin-top: 4mm; }
  .head .meta b { display: block; color: var(--gold); font-family: "DM Mono", monospace; font-size: 15px; font-weight: 500; }
  main { padding: 7mm 18mm 0; }
  .hello { font-size: 20px; color: var(--red); }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; margin-top: 5mm; }
  .card { border-radius: 4mm; padding: 5mm 6mm; background: var(--sand); }
  .card h2 { margin: 0 0 3mm; font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: var(--subtle); font-family: "DM Mono", monospace; font-weight: 500; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 1.3mm 0; vertical-align: top; border-top: 0.3mm solid var(--line); }
  tr:first-child td { border-top: 0; }
  td:first-child { color: var(--subtle); width: 40%; }
  .ticket { margin-top: 5mm; border-radius: 4mm; background: var(--night); color: #fff; padding: 5mm 7mm; display: flex; align-items: center; justify-content: space-between; }
  .ticket .code { font-family: "DM Mono", monospace; font-size: 34px; } .ticket .to { color: var(--gold); }
  .ticket .plane { color: var(--gold); font-size: 18px; }
  .msg { margin-top: 5mm; border-left: 1mm solid var(--gold); padding: 2mm 0 2mm 5mm; color: var(--muted); white-space: pre-line; }
  .steps { margin-top: 5mm; } .steps h2 { font-size: 15px; margin: 0 0 2mm; color: var(--night); }
  .steps ol { margin: 0; padding: 0; list-style: none; }
  .steps li { display: flex; gap: 5mm; padding: 1.2mm 0; color: var(--muted); }
  .steps li span { font-family: "DM Mono", monospace; width: 7mm; }
  .notice { margin-top: 5mm; font-size: 10.5px; color: var(--subtle); background: #fff8e8; border-radius: 3mm; padding: 3mm 5mm; }
  .agency { margin: 5mm 18mm 0; padding-top: 3mm; border-top: 0.3mm solid var(--line); font-size: 10.5px; color: var(--subtle); }
  .agency strong { color: var(--night); }
  </style></head><body>
  <div class="stripe"><span style="background:var(--red)"></span><span style="background:var(--gold)"></span><span style="background:var(--green)"></span></div>
  <header class="head">
    <img class="symbol" src="${asset("symbole-or.svg", "image/svg+xml")}" alt="">
    <img class="logo" src="${asset("logo-horizontal-inverse.svg", "image/svg+xml")}" alt="ETHNIKA">
    <h1>Récapitulatif de votre demande</h1>
    <div class="meta">
      <div><b>${esc(lead.reference)}</b>Référence</div>
      <div><b style="font-family:Bricolage,Arial;font-size:13px;color:#fff">${esc(typeTitles[lead.type])}</b>Demande</div>
      <div><b style="font-family:Bricolage,Arial;font-size:13px;color:#fff">${esc(created)}</b>Reçue le</div>
    </div>
  </header>
  <main>
    <div class="hello serif">Bonjour ${esc(lead.fullName.split(/\s+/)[0])},</div>
    <p style="margin:2mm 0 0;color:var(--muted)">Voici le récapitulatif de votre demande. Un conseiller ETHNIKA l'étudie et vous recontacte sous 24 h ouvrées avec les meilleures options.</p>
    ${
      route?.from && route?.to
        ? `<div class="ticket"><div><div class="code">${esc(route.from)}</div><div style="font-size:11px;color:#d0d4cf">Départ</div></div><div class="plane">✈</div><div style="text-align:right"><div class="code to">${esc(route.to)}</div><div style="font-size:11px;color:#d0d4cf">Arrivée</div></div></div>`
        : ""
    }
    <div class="grid">
      <section class="card"><h2>Votre demande</h2><table>${rows(lead)
        .map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`)
        .join("")}</table></section>
      <section class="card"><h2>Vos coordonnées</h2><table>
        <tr><td>Nom</td><td>${esc(lead.fullName)}</td></tr>
        <tr><td>Téléphone</td><td>${esc(lead.phone)}</td></tr>
        <tr><td>E-mail</td><td>${esc(lead.email ?? "—")}</td></tr>
      </table></section>
    </div>
    ${lead.message ? `<div class="msg">${esc(lead.message)}</div>` : ""}
    <section class="steps"><h2>Prochaines étapes</h2><ol>
      <li><span style="color:var(--green)">01</span>Nous vérifions les disponibilités et les tarifs.</li>
      <li><span style="color:#8f6514">02</span>Vous recevez une proposition détaillée par e-mail ou WhatsApp.</li>
      <li><span style="color:var(--red)">03</span>Vous validez, et nous émettons vos documents de voyage.</li>
    </ol></section>
    <p class="notice">Ce document récapitule votre demande. Il ne constitue ni un devis, ni une confirmation de réservation : aucun paiement n'est dû à ce stade.</p>
  </main>
  <div class="agency"><strong>ETHNIKA · Tourisme &amp; Voyages</strong><br>${esc(agency.address)} · ${esc(agency.phone)} · ${esc(agency.email)}<br>Licence n° ${esc(agency.licence)} · ${esc(agency.site)}</div>
  </body></html>`;
}
