"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { site } from "@/lib/site";
import type { DemoLead } from "@/lib/demo/store";
import { digest, firstName } from "@/lib/demo/summary";

const stepTints = ["text-brand-green", "text-gold-700", "text-brand-red"];

/**
 * Aperçu de l'accusé de réception (EmailAccuse.dc.html), largeur fluide jusqu'à 640 px.
 * L'e-mail réel (phase 2) sera produit par l'API en tableaux + styles en ligne (React Email).
 */
export function AckEmail({ lead }: { lead: DemoLead }) {
  const t = useTranslations("admin.email");
  const tTypes = useTranslations("admin.types");
  const d = digest(lead);
  const steps = t.raw("steps") as string[];

  return (
    <div className="flex flex-col gap-3">
      <p className="font-mono text-[11px] leading-relaxed break-words text-muted">
        {t("from")}
        <br />
        {t("subject", { ref: lead.ref })}
      </p>
      <div className="w-full max-w-[640px] overflow-hidden rounded-[20px] bg-cream">
        <div className="bg-night px-6 py-6 sm:px-9">
          <Image src="/brand/logo-horizontal-inverse.svg" alt="ETHNIKA" width={170} height={54} className="-ml-2 h-[46px] w-auto sm:h-[54px]" />
        </div>
        <div aria-hidden="true" className="grid h-1.5 grid-cols-3">
          <span className="bg-brand-red" />
          <span className="bg-brand-gold" />
          <span className="bg-brand-green" />
        </div>
        <div className="flex flex-col gap-3 px-6 pt-8 sm:px-9 sm:pt-10">
          <span className="font-serif text-2xl text-brand-red italic sm:text-[26px]">{t("hello", { name: firstName(lead.name) })}</span>
          <strong className="text-[26px] leading-[1.1] tracking-[-0.03em] text-night sm:text-[32px]">{t("title")}</strong>
          <p className="text-[15px] leading-[1.65] text-muted sm:text-base">{t("text")}</p>
        </div>

        <div className="px-6 py-6 sm:px-9">
          <div className="overflow-hidden rounded-2xl bg-night text-white">
            <p className="px-5 pt-[18px] pb-1.5 font-mono text-[11px] tracking-[0.12em] text-on-dark-muted">
              {t("reference")} · <span className="text-brand-gold">{lead.ref}</span>
            </p>
            {d.route ? (
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-5 py-1.5">
                <div>
                  <span className="block font-mono text-[32px] leading-none sm:text-[40px]">{d.route.from}</span>
                  <span className="text-[13px] text-on-dark">{d.route.fromCity}</span>
                </div>
                <PlaneGlyph />
                <div className="text-right">
                  <span className="block font-mono text-[32px] leading-none text-brand-gold sm:text-[40px]">{d.route.to}</span>
                  <span className="text-[13px] text-on-dark">{d.route.toCity}</span>
                </div>
              </div>
            ) : (
              <p className="px-5 py-1.5">
                <span className="block font-mono text-[11px] tracking-[0.1em] text-on-dark-muted uppercase">{tTypes(lead.type)}</span>
                <strong className="text-lg">{d.summary}</strong>
              </p>
            )}
            {d.tripLine && <p className="mt-3 border-t border-dashed border-night-muted px-5 pt-3.5 pb-[18px] text-sm text-on-dark-2">{d.tripLine}</p>}
            {!d.tripLine && <div className="h-4" />}
          </div>
        </div>

        <div className="px-6 pb-6 sm:px-9">
          <strong className="mb-2 block text-[17px] text-night">{t("nextSteps")}</strong>
          <ol className="flex flex-col text-[15px] text-muted">
            {steps.map((s, i) => (
              <li key={s} className="flex gap-4 py-2">
                <span className={`w-7 shrink-0 font-mono ${stepTints[i] ?? ""}`}>{String(i + 1).padStart(2, "0")}</span>
                {s}
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-wrap gap-2 px-6 pb-8 sm:px-9 sm:pb-9">
          <span className="inline-flex min-h-[50px] items-center rounded-full bg-brand-green px-6 text-[15px] font-bold text-white">{t("whatsapp")}</span>
          <span className="inline-flex min-h-[50px] items-center rounded-full border-[1.5px] border-night px-6 text-[15px] font-semibold text-night">{t("circuits")}</span>
        </div>

        <div className="bg-sand px-6 py-6 text-[13px] leading-[1.7] text-muted sm:px-9">
          <strong className="text-night">ETHNIKA · Tourisme &amp; Voyages</strong>
          <br />
          {site.contact.address} · {site.contact.phone} · {site.contact.email}
          <br />
          {t("footerLegal", { licence: site.legal.licence })}
          <br />
          <span className="text-xs">
            {t("footerNote")} <span className="underline">{t("privacy")}</span>
          </span>
        </div>
      </div>
      <p className="font-mono text-[11px] leading-relaxed text-muted">{t("devNote")}</p>
    </div>
  );
}

function PlaneGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6 fill-brand-gold">
      <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />
    </svg>
  );
}
