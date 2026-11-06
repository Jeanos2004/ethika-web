import Image from "next/image";
import { clsx } from "clsx";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getPage, metadataFor } from "@/content/pages";
import { getLocalizedCircuit } from "@/content/circuits";
import { whatsappLink } from "@/lib/site";
import { PageHero } from "@/components/layout/PageHero";
import { Icon } from "@/components/ui/Icon";
import { PhotoTile } from "@/components/cards/PhotoTile";
import { QuoteButton } from "@/components/forms/QuoteButton";

export const generateMetadata = metadataFor("loos");

/* Îles de Loos — référence : design/maquettes/Loos.dc.html. Textes : messages, espace « loos ». */

const milestoneTints = ["text-brand-red", "text-brand-green", "text-gold-700"];
const islandStyles = [
  { name: "Kassa", image: "/images/conakry-plage-ilot.jpg", badgeTint: "bg-brand-red text-white" },
  { name: "Tamara", image: "/images/plage-couchant-rochers.jpg", badgeTint: "bg-brand-gold text-ink" },
  { name: "Roume", image: "/images/barque-calme.jpg", badgeTint: "bg-brand-green text-white" },
];
const otherStyles = [
  { href: "/decouvrir-la-guinee/mali-fouta-djallon", image: "/images/fouta-plateau-couchant.jpg" },
  { href: "/decouvrir-la-guinee/basse-cote", image: "/images/bel-air-cocotiers.jpg" },
  { href: "/decouvrir-la-guinee/basse-cote#dubreka", image: "/images/dubreka-riviere-pirogue.jpg" },
];

type Island = { badge: string; alt: string; text: string; points: string[] };

export default async function LoosPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("loos");
  const tc = await getTranslations("common");
  const tNav = await getTranslations("nav");
  const page = await getPage("loos", locale);
  const circuit = getLocalizedCircuit("escapade-iles-de-loos", locale);
  const program = t.raw("program") as { time: string; title: string; text: string }[];
  const islands = t.raw("islands") as Island[];

  return (
    <>
      <PageHero page={page} crumbs={[{ href: "/", label: tc("home") }, { href: "/decouvrir-la-guinee", label: tNav("guinee") }, { label: tNav("loos") }]}>
        <p className="max-w-[640px] text-lg leading-relaxed text-on-dark-2">{t("intro")}</p>
        <ul className="mt-2 flex flex-wrap gap-2.5 text-sm">
          {(t.raw("chips") as string[]).map((c) => (
            <li key={c} className="rounded-full border border-white/25 bg-white/15 px-4 py-2.5">
              {c}
            </li>
          ))}
        </ul>
      </PageHero>

      {/* HISTOIRE */}
      <section className="container-site flex flex-wrap items-center gap-14 pt-16 sm:pt-[100px]">
        <div className="flex min-w-0 flex-[1_1_460px] flex-col gap-5">
          <span className="kicker text-brand-red">{t("historyKicker")}</span>
          <h2 className="text-[clamp(34px,3.8vw,52px)] leading-[1.02] font-bold tracking-[-0.035em] text-night">{t("historyTitle")}</h2>
          <p className="text-[17px] leading-[1.7] text-muted">{t("historyP1")}</p>
          <p className="text-[17px] leading-[1.7] text-muted">{t("historyP2")}</p>
          <ul className="mt-2 grid grid-cols-[repeat(auto-fit,minmax(min(140px,100%),1fr))] gap-3">
            {(t.raw("milestones") as { value: string; label: string }[]).map((m, i) => (
              <li key={m.label} className="rounded-[var(--radius-panel)] bg-white p-[18px] shadow-sm">
                <span className={clsx("font-mono text-[26px]", milestoneTints[i])}>{m.value}</span>
                <span className="block text-[13px] text-muted">{m.label}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative h-[420px] min-w-0 flex-[1_1_480px] overflow-hidden rounded-[999px_999px_28px_28px] sm:h-[520px]">
          <Image src="/images/loos-horizon.jpg" alt={t("historyImageAlt")} fill sizes="(min-width: 1100px) 50vw, 100vw" className="object-cover" />
        </div>
      </section>

      {/* TROIS ÎLES */}
      <section className="mt-16 bg-night px-0 py-16 text-white sm:mt-[110px] sm:py-[100px]">
        <div className="container-site flex flex-col gap-11">
          <div className="flex flex-col items-center gap-2.5 text-center">
            <span className="kicker text-brand-gold">{t("islandsKicker")}</span>
            <h2 className="h-section">{t("islandsTitle")}</h2>
          </div>
          <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-[22px]">
            {islands.map((island, i) => (
              <li key={islandStyles[i]?.name} className="flex flex-col overflow-hidden rounded-[var(--radius-lg)] bg-night-2">
                <div className="relative h-[260px]">
                  <Image src={islandStyles[i]?.image ?? ""} alt={island.alt} fill sizes="(min-width: 1100px) 33vw, 100vw" className="object-cover" />
                  <span className={clsx("absolute top-4 left-4 rounded-full px-3.5 py-[7px] text-[13px] font-bold", islandStyles[i]?.badgeTint)}>{island.badge}</span>
                </div>
                <div className="flex flex-col gap-3 p-[26px]">
                  <h3 className="text-[28px] font-bold tracking-tight">{islandStyles[i]?.name}</h3>
                  <p className="text-[15px] leading-[1.65] text-on-dark">{island.text}</p>
                  <ul className="list-disc pl-[18px] text-sm leading-[1.9] text-on-dark-2">
                    {island.points.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* PROGRAMME */}
      <section className="container-site flex flex-wrap gap-12 pt-16 sm:pt-[110px]">
        <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-6">
          <span className="kicker text-brand-red">{t("programKicker")}</span>
          <h2 className="text-[clamp(34px,3.8vw,50px)] leading-[1.02] font-bold tracking-[-0.035em] text-night">{t("programTitle")}</h2>
          <ol>
            {program.map((p, i) => (
              <li key={p.time} className={clsx("flex gap-5 py-5", i < program.length - 1 && "border-b border-line")}>
                <span className="w-[70px] shrink-0 font-mono text-sm text-brand-red">{p.time}</span>
                <div>
                  <strong className="text-night">{p.title}</strong>
                  <p className="text-[15px] leading-relaxed text-muted">{p.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <aside aria-label={t("asideLabel")} className="flex min-w-0 flex-[1_1_340px] flex-col gap-4 self-start rounded-[var(--radius-lg)] bg-white p-[30px] shadow-[0_20px_50px_rgb(22_33_28/0.1)]">
          <span className="font-mono text-xs tracking-[0.12em] text-subtle">{t("asideEyebrow")}</span>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-sm text-muted">{tc("startingFrom")}</span>
            <strong className="text-4xl tracking-tight text-night">{tc("price")}</strong>
          </div>
          <span className="text-sm text-muted">{t("priceBasis")}</span>
          <hr className="border-line" />
          <ul className="flex flex-col gap-2.5 text-[15px] text-ink">
            {(t.raw("asideItems") as string[]).map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <Icon name="check" size={16} strokeWidth={2.8} className="text-brand-green" />
                {item}
              </li>
            ))}
          </ul>
          <QuoteButton circuit="escapade-iles-de-loos" title={circuit?.headline ?? page.title} summary={t("quoteSummary")} className="h-[54px] rounded-full bg-brand-red font-bold text-white hover:bg-brand-red-dark" />
          <a
            href={whatsappLink(t("whatsappMessage"))}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[54px] items-center justify-center rounded-full border-[1.5px] border-brand-green font-bold text-brand-green hover:bg-green-50"
          >
            {tc("writeWhatsapp")}
          </a>
        </aside>
      </section>

      {/* CONSEILS */}
      <section className="container-site pt-16 sm:pt-[100px]">
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-7 rounded-[32px] bg-sand p-[clamp(28px,4vw,52px)]">
          {(t.raw("tips") as { title: string; text: string }[]).map((tip) => (
            <li key={tip.title} className="flex flex-col gap-2">
              <h3 className="text-lg font-bold text-night">{tip.title}</h3>
              <p className="text-[15px] leading-relaxed text-muted">{tip.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* AUTRES DESTINATIONS */}
      <section className="container-site flex flex-col gap-8 py-16 sm:pt-[100px] sm:pb-[110px]">
        <h2 className="text-[clamp(30px,3.2vw,42px)] font-bold tracking-[-0.03em] text-night">{t("othersTitle")}</h2>
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-5">
          {(t.raw("others") as { alt: string; title: string }[]).map((o, i) => (
            <li key={o.title}>
              <PhotoTile href={otherStyles[i]?.href ?? "/"} image={otherStyles[i]?.image ?? ""} alt={o.alt} title={o.title} />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
