import { asset, brandStyles, esc, frenchDate } from "./html";
import type { AgencyInfo } from "./lead-summary";

export type ReceiptForPdf = {
  reference: string;
  amount: string;
  label: string;
  paidAt: Date;
  method: string | null;
  providerRef: string | null;
  quoteNumber: string | null;
  lead: { reference: string; fullName: string; phone: string; email: string | null };
};

const methods: Record<string, string> = { orange_money: "Orange Money", mtn_momo: "MTN Mobile Money", card: "Carte bancaire", wave: "Wave", cash: "Espèces", simulation: "Simulation (test)" };

/** Reçu de paiement A4 aux couleurs ETHNIKA (Puppeteer) : montant payé, objet, moyen, références, mention « Payé ». */
export function receiptHtml(r: ReceiptForPdf, agency: AgencyInfo): string {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${esc(r.reference)}</title><style>
  ${brandStyles()}
  .stripe { display: flex; height: 2.2mm; } .stripe span { flex: 1; }
  header { display: flex; justify-content: space-between; align-items: flex-start; padding: 13mm 18mm 8mm; border-bottom: 0.3mm solid var(--line); }
  header .logo { height: 14mm; margin-left: -2mm; }
  header .doc { text-align: right; }
  header .doc h1 { margin: 0; font-size: 28px; letter-spacing: -0.03em; color: var(--night); }
  header .doc .mono { color: var(--green); font-size: 14px; }
  header .doc p { margin: 1mm 0 0; color: var(--subtle); font-size: 11px; }
  .paid { display: flex; align-items: center; justify-content: space-between; gap: 8mm; margin: 9mm 18mm 0; background: var(--night); color: #fff; border-radius: 4mm; padding: 7mm 8mm; }
  .paid small { display: block; font-family: "DM Mono", monospace; font-size: 10px; letter-spacing: .14em; color: #a2aaa4; text-transform: uppercase; }
  .paid b { display: block; margin-top: 1.5mm; font-size: 30px; color: var(--gold); font-variant-numeric: tabular-nums; }
  .stamp { border: 0.6mm solid var(--gold); color: var(--gold); border-radius: 2mm; padding: 2mm 5mm; font-weight: 700; letter-spacing: .2em; font-size: 15px; transform: rotate(-6deg); }
  table.rows { width: calc(100% - 36mm); margin: 8mm 18mm 0; border-collapse: collapse; font-size: 12.5px; }
  table.rows th { text-align: left; font-weight: 400; color: var(--subtle); width: 38%; padding: 3mm 0; border-bottom: 0.3mm solid var(--line); }
  table.rows td { color: var(--night); font-weight: 600; padding: 3mm 0; border-bottom: 0.3mm solid var(--line); }
  .note { margin: 8mm 18mm 0; background: var(--sand); border-radius: 3mm; padding: 4mm 5mm; color: var(--muted); font-size: 11px; }
  .agency { margin: 10mm 18mm 0; padding-top: 4mm; border-top: 0.3mm solid var(--line); font-size: 10px; color: var(--subtle); }
  </style></head><body>
  <div class="stripe"><span style="background:var(--red)"></span><span style="background:var(--gold)"></span><span style="background:var(--green)"></span></div>
  <header>
    <img class="logo" src="${asset("logo-horizontal-couleur.svg", "image/svg+xml")}" alt="ETHNIKA">
    <div class="doc"><h1>Reçu de paiement</h1><div class="mono">${esc(r.reference)}</div><p>Payé le ${esc(frenchDate(r.paidAt, true))}</p></div>
  </header>
  <section class="paid"><div><small>Montant reçu</small><b>${esc(r.amount)}</b></div><div class="stamp">PAYÉ</div></section>
  <table class="rows">
    <tr><th>Client</th><td>${esc(r.lead.fullName)}</td></tr>
    <tr><th>Objet</th><td>${esc(r.label)}</td></tr>
    <tr><th>Demande</th><td>${esc(r.lead.reference)}</td></tr>
    ${r.quoteNumber ? `<tr><th>Devis</th><td>${esc(r.quoteNumber)}</td></tr>` : ""}
    <tr><th>Moyen de paiement</th><td>${esc(r.method ? (methods[r.method] ?? r.method) : "—")}</td></tr>
    ${r.providerRef ? `<tr><th>Référence de transaction</th><td>${esc(r.providerRef)}</td></tr>` : ""}
  </table>
  <p class="note">Ce reçu atteste le paiement indiqué ci-dessus. Il ne vaut pas billet ni confirmation de prestation : votre conseiller vous transmet vos documents de voyage après émission. ${esc(agency.quoteTerms ?? "")}</p>
  <p class="agency"><strong>ETHNIKA · Tourisme &amp; Voyages</strong> · ${esc(agency.address)} · ${esc(agency.phone)} · ${esc(agency.email)} · Licence n° ${esc(agency.licence)} · ${esc(agency.site)}</p>
  </body></html>`;
}
