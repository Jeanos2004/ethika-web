import { clsx } from "clsx";
import type { ReactNode } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getPage, metadataFor } from "@/content/pages";
import { phoneLink, site, whatsappLink } from "@/lib/site";
import { PageHero } from "@/components/layout/PageHero";
import { LeadForm } from "@/components/forms/LeadForm";
import { AgencyMap } from "@/components/sections/AgencyMap";
import { getAgency } from "@/lib/content-source";
import { Icon, type IconName } from "@/components/ui/Icon";

export const generateMetadata = metadataFor("contact");

/* Contact — référence : design/maquettes/Contact.dc.html */

function ContactCard({ icon, title, children, href, external, tone = "light", iconTint }: { icon: IconName; title: string; children: ReactNode; href?: string; external?: boolean; tone?: "light" | "green"; iconTint: string }) {
  const body = (
    <>
      <span className={clsx("flex size-[60px] items-center justify-center rounded-full", iconTint)}>
        <Icon name={icon} size={26} />
      </span>
      <strong className={clsx("text-xl", tone === "light" && "text-night")}>{title}</strong>
      {children}
    </>
  );
  const cls = clsx("flex flex-col gap-3 rounded-[var(--radius-card)] p-7 shadow-[0_24px_60px_rgb(18_24_21/0.14)]", tone === "green" ? "bg-brand-green text-white" : "bg-white");
  if (!href) return <div className={cls}>{body}</div>;
  return (
    <a href={href} className={clsx(cls, "transition-transform motion-safe:hover:-translate-y-1")} {...(external && { target: "_blank", rel: "noopener noreferrer" })}>
      {body}
    </a>
  );
}

const socials = [
  { label: "Facebook", href: site.social.facebook, content: "f", tint: "bg-night text-lg font-extrabold" },
  { label: "Instagram", href: site.social.instagram, content: <Icon name="instagram" size={22} />, tint: "bg-brand-red" },
  { label: "LinkedIn", href: site.social.linkedin, content: "in", tint: "bg-night font-extrabold" },
  { label: "YouTube", href: site.social.youtube, content: <Icon name="play" size={20} />, tint: "bg-brand-red" },
];

export default async function ContactPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");
  const agency = await getAgency();
  const tc = await getTranslations("common");
  const page = await getPage("contact", locale);
  // Libellés des jours traduits ; horaires de Paramètres > Agence.
  const hourValues = [agency.hours.weekdays, agency.hours.saturday, agency.hours.sunday];
  const hours = (t.raw("hours") as { days: string; hours: string }[]).map((h, i) => ({ ...h, hours: hourValues[i] || h.hours }));
  const tel = phoneLink(agency.phone);
  return (
    <>
      <PageHero page={page} crumbs={[{ href: "/", label: tc("home") }, { label: page.title }]} bottomClassName="pb-[150px]" align="center" />

      {/* CARTES DE CONTACT */}
      <section aria-label={t("reachLabel")} className="container-site relative z-10 -mt-[100px]">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-[18px]">
          <ContactCard icon="phone" title={t("phone")} href={tel.startsWith("tel:") ? tel : undefined} iconTint="bg-brand-red text-white">
            <span className="font-mono text-muted">{agency.phone}</span>
          </ContactCard>
          <ContactCard icon="whatsapp" title="WhatsApp" href={whatsappLink(t("whatsappMessage"))} external tone="green" iconTint="bg-white text-brand-green">
            <span className="text-[15px] text-green-50">{t("whatsappText")}</span>
          </ContactCard>
          <ContactCard icon="mail" title={t("email")} iconTint="bg-night text-white">
            <ul className="text-sm leading-relaxed text-muted">
              {site.contact.emails.map((e) => (
                <li key={e}>
                  <a href={`mailto:${e}`} className="inline-flex min-h-6 items-center hover:text-brand-red hover:underline">
                    {e}
                  </a>
                </li>
              ))}
            </ul>
          </ContactCard>
          <ContactCard icon="pin" title={t("agency")} iconTint="bg-brand-gold text-ink">
            <address className="text-[15px] leading-relaxed text-muted not-italic">
              {agency.address}
              <br />
              {t("country")}
            </address>
          </ContactCard>
        </div>
      </section>

      {/* FORMULAIRE + CARTE */}
      <section className="container-site flex flex-wrap items-stretch gap-9 pt-16 sm:pt-24">
        <div className="flex min-w-0 flex-[1.2_1_520px] flex-col gap-[18px] rounded-[30px] bg-white p-[clamp(20px,3vw,40px)] shadow-md">
          <span className="kicker text-brand-red">{t("writeKicker")}</span>
          <h2 className="text-[clamp(30px,3.2vw,42px)] leading-[1.05] font-bold tracking-[-0.03em] text-night">{t("writeTitle")}</h2>
          <LeadForm />
        </div>
        <div className="flex min-w-0 flex-[1_1_400px] flex-col gap-[18px]">
          <AgencyMap agency={agency} />
          <div className="flex flex-col gap-3 rounded-[var(--radius-card)] bg-night p-[26px] text-white">
            <h2 className="text-[19px] font-bold">{t("hoursTitle")}</h2>
            <dl>
              {hours.map((h, i) => (
                <div key={h.days} className={clsx("flex justify-between gap-4 py-2.5 text-[15px]", i < hours.length - 1 && "border-b border-night-muted")}>
                  <dt className="text-on-dark">{h.days}</dt>
                  <dd className="font-mono">{h.hours}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* RÉSEAUX */}
      <section className="container-site py-16 sm:py-24">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-[30px] bg-sand px-9 py-8">
          <div className="flex flex-col gap-1.5">
            <span className="font-serif text-[26px] text-brand-red italic">{t("followKicker")}</span>
            <strong className="text-2xl text-night">{t("followTitle")}</strong>
          </div>
          <ul className="flex gap-3">
            {socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} aria-label={s.label} className={clsx("flex size-14 items-center justify-center rounded-full text-white", s.tint)}>
                  {s.content}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
