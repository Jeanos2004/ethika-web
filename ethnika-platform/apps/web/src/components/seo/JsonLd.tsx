/**
 * Balise JSON-LD (schema.org). Seule exception autorisée à `dangerouslySetInnerHTML` (CLAUDE.md) :
 * les données sont des constantes du site, sérialisées par JSON.stringify, et « < » est échappé
 * pour empêcher toute fermeture prématurée de la balise <script>.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

/** Fil d'Ariane schema.org à partir des miettes affichées. */
export function breadcrumbJsonLd(baseUrl: string, crumbs: { href?: string; label: string }[], currentPath: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      item: `${baseUrl}${c.href ?? currentPath}`,
    })),
  };
}
