import { readFileSync } from "node:fs";
import { join } from "node:path";

/** Échappement HTML de toute donnée insérée dans un gabarit. */
export function esc(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}

const assets = join(__dirname, "..", "assets");
const cache = new Map<string, string>();

/** Ressource embarquée en data: (aucun accès réseau au rendu). */
export function asset(file: string, mime: string): string {
  let v = cache.get(file);
  if (!v) {
    v = `data:${mime};base64,${readFileSync(join(assets, file)).toString("base64")}`;
    cache.set(file, v);
  }
  return v;
}

/** Charte ETHNIKA commune aux documents : polices de la marque, couleurs (tokens de globals.css), mise en page A4. */
export function brandStyles(): string {
  return `
  @font-face { font-family: "Bricolage"; src: url(${asset("bricolage-grotesque-latin-wght-normal.woff2", "font/woff2")}) format("woff2"); font-weight: 200 800; }
  @font-face { font-family: "DM Mono"; src: url(${asset("dm-mono-latin-500-normal.woff2", "font/woff2")}) format("woff2"); font-weight: 500; }
  @font-face { font-family: "Instrument Serif"; font-style: italic; src: url(${asset("instrument-serif-latin-400-italic.woff2", "font/woff2")}) format("woff2"); }
  :root { --night:#16211c; --red:#b0121b; --gold:#e3a935; --green:#0e5232; --cream:#fffbf5; --sand:#f5eee3; --line:#efe6d2; --muted:#4e463f; --subtle:#6b6259; }
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; }
  body { font-family: "Bricolage", Arial, sans-serif; color: #121815; background: #fff; font-size: 12.5px; line-height: 1.55; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .mono { font-family: "DM Mono", monospace; }
  .serif { font-family: "Instrument Serif", serif; font-style: italic; }
  `;
}

/** Date en toutes lettres à la française, heure de Conakry ; « 1er » pour le premier du mois. */
export function frenchDate(d: Date, withTime = false): string {
  const text = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", ...(withTime && { timeStyle: "short" }), timeZone: "Africa/Conakry" }).format(d);
  return text.replace(/^1 /, "1er ");
}

/** Pied de page Chrome (styles en ligne obligatoires : le gabarit est rendu à part). */
export function footerTemplate(left: string): string {
  return `<div style="width:100%;padding:0 18mm;font-family:Arial,sans-serif;font-size:8px;color:#6b6259;display:flex;justify-content:space-between">
    <span>${esc(left)}</span><span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;
}
