import { notFound } from "next/navigation";
import { circuits } from "@/content/circuits";
import { siteCircuit } from "@/lib/content-source";
import { renderOg } from "@/lib/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "ETHNIKA";

export function generateStaticParams() {
  return circuits.map((c) => ({ slug: c.slug }));
}

export default async function Image({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const c = await siteCircuit(slug, locale);
  if (!c) notFound();
  return renderOg({
    title: c.headline,
    kicker: `${c.place} · ${c.durationLabel}`,
  });
}
