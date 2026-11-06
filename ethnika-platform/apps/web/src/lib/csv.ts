/**
 * CSV sûr pour Excel / LibreOffice :
 * - neutralise l'injection de formules en préfixant d'une apostrophe les cellules commençant par = + - @ (ou tabulation / retour) ;
 * - guillemets doublés, séparateur « ; » (Excel en français), BOM UTF-8 pour les accents.
 */
export function csvCell(value: unknown): string {
  let s = value === undefined || value === null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(header: string[], rows: unknown[][]): string {
  return `﻿${[header, ...rows].map((r) => r.map(csvCell).join(";")).join("\r\n")}\r\n`;
}
