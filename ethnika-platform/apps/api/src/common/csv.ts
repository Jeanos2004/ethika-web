/**
 * CSV sûr pour Excel / LibreOffice (même règle que le site) :
 * cellules commençant par = + - @ (ou tabulation / retour) préfixées d'une apostrophe, guillemets doublés,
 * séparateur « ; », BOM UTF-8.
 */
export function csvCell(value: unknown): string {
  let s = value === undefined || value === null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(header: string[], rows: unknown[][]): string {
  return `﻿${[header, ...rows].map((r) => r.map(csvCell).join(";")).join("\r\n")}\r\n`;
}
