import { formatMoney, type Currency } from "../../quotes/money";
import { asset, brandStyles, esc } from "./html";
import type { AgencyInfo } from "./lead-summary";

export type QuoteForPdf = {
  number: string;
  currency: Currency;
  lines: { label: string; quantity: number; unitAmount: number }[];
  totalAmount: bigint;
  validUntil: Date;
  notes: string | null;
  createdAt: Date;
  lead: { reference: string; fullName: string; phone: string; email: string | null };
  agentName: string;
};

const dateFr = (d: Date) => new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Africa/Conakry" }).format(d);

/** Devis A4 aux couleurs ETHNIKA (Puppeteer) : en-tête, client, lignes, total, validité, conditions, signatures. */
export function quoteHtml(q: QuoteForPdf, agency: AgencyInfo): string {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${esc(q.number)}</title><style>
  ${brandStyles()}
  .stripe { display: flex; height: 2.2mm; } .stripe span { flex: 1; }
  header { display: flex; justify-content: space-between; align-items: flex-start; padding: 13mm 18mm 8mm; border-bottom: 0.3mm solid var(--line); }
  header .logo { height: 14mm; margin-left: -2mm; }
  header .doc { text-align: right; }
  header .doc h1 { margin: 0; font-size: 28px; letter-spacing: -0.03em; color: var(--night); }
  header .doc .mono { color: var(--red); font-size: 14px; }
  header .doc p { margin: 1mm 0 0; color: var(--subtle); font-size: 11px; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; padding: 8mm 18mm 0; }
  .parties h2 { margin: 0 0 2mm; font-size: 10px; letter-spacing: .14em; color: var(--subtle); font-family: "DM Mono", monospace; font-weight: 500; text-transform: uppercase; }
  .parties p { margin: 0; color: var(--muted); }
  .parties strong { color: var(--night); font-size: 14px; }
  table.lines { width: calc(100% - 36mm); margin: 8mm 18mm 0; border-collapse: collapse; }
  table.lines th { text-align: left; font-family: "DM Mono", monospace; font-weight: 500; font-size: 10px; letter-spacing: .1em; color: var(--subtle); padding: 2.5mm 3mm; border-bottom: 0.4mm solid var(--night); }
  table.lines td { padding: 3mm; border-bottom: 0.3mm solid var(--line); vertical-align: top; }
  table.lines .num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .total { display: flex; justify-content: flex-end; margin: 5mm 18mm 0; }
  .total div { background: var(--night); color: #fff; border-radius: 3mm; padding: 4mm 7mm; min-width: 70mm; display: flex; justify-content: space-between; gap: 8mm; align-items: baseline; }
  .total b { font-size: 20px; color: var(--gold); font-variant-numeric: tabular-nums; }
  .info { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; margin: 8mm 18mm 0; }
  .card { background: var(--sand); border-radius: 3mm; padding: 4mm 5mm; color: var(--muted); font-size: 11.5px; }
  .card h3 { margin: 0 0 1.5mm; font-size: 12px; color: var(--night); }
  .sign { display: grid; grid-template-columns: 1fr 1fr; gap: 10mm; margin: 10mm 18mm 0; }
  .sign div { border-top: 0.3mm solid var(--line); padding-top: 2mm; height: 22mm; color: var(--subtle); font-size: 10.5px; }
  .agency { margin: 8mm 18mm 0; padding-top: 4mm; border-top: 0.3mm solid var(--line); font-size: 10px; color: var(--subtle); }
  </style></head><body>
  <div class="stripe"><span style="background:var(--red)"></span><span style="background:var(--gold)"></span><span style="background:var(--green)"></span></div>
  <header>
    <img class="logo" src="${asset("logo-horizontal-couleur.svg", "image/svg+xml")}" alt="ETHNIKA">
    <div class="doc"><h1>Devis</h1><div class="mono">${esc(q.number)}</div><p>Émis le ${esc(dateFr(q.createdAt))} · Demande ${esc(q.lead.reference)}</p></div>
  </header>
  <section class="parties">
    <div><h2>Client</h2><strong>${esc(q.lead.fullName)}</strong><p>${esc(q.lead.phone)}${q.lead.email ? ` · ${esc(q.lead.email)}` : ""}</p></div>
    <div><h2>Votre conseiller</h2><strong>${esc(q.agentName)}</strong><p>ETHNIKA · ${esc(agency.phone)} · ${esc(agency.email)}</p></div>
  </section>
  <table class="lines">
    <thead><tr><th>Désignation</th><th class="num">Qté</th><th class="num">Prix unitaire</th><th class="num">Montant</th></tr></thead>
    <tbody>${q.lines
      .map((l) => `<tr><td>${esc(l.label)}</td><td class="num">${l.quantity}</td><td class="num">${esc(formatMoney(l.unitAmount, q.currency))}</td><td class="num">${esc(formatMoney(BigInt(l.quantity) * BigInt(l.unitAmount), q.currency))}</td></tr>`)
      .join("")}</tbody>
  </table>
  <div class="total"><div><span>Total TTC</span><b>${esc(formatMoney(q.totalAmount, q.currency))}</b></div></div>
  <section class="info">
    <div class="card"><h3>Validité</h3>Ce devis est valable jusqu'au <strong>${esc(dateFr(q.validUntil))}</strong>, sous réserve de disponibilité au moment de la confirmation. Les tarifs aériens peuvent évoluer jusqu'à l'émission des billets.</div>
    <div class="card"><h3>Conditions</h3>${q.notes ? esc(q.notes) : "Acompte à la confirmation, solde avant le départ. Conditions générales de vente : [À COMPLÉTER]."}</div>
  </section>
  <section class="sign"><div>Bon pour accord — date et signature du client</div><div>Pour ETHNIKA</div></section>
  <div class="agency"><strong>ETHNIKA · Tourisme &amp; Voyages</strong> · ${esc(agency.address)} · Licence n° ${esc(agency.licence)} · ${esc(agency.site)}</div>
  </body></html>`;
}
