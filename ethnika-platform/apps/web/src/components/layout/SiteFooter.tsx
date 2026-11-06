import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { footerNav, legalNav, site } from "@/lib/site";
import { Icon } from "@/components/ui/Icon";

export function SiteFooter() {
  const t = useTranslations("site");
  const tNav = useTranslations("nav");
  const year = new Date().getFullYear();
  return (
    <footer className="bg-ink text-on-dark">
      <div className="container-site flex flex-col gap-11 pt-[72px] pb-28 sm:pb-7">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-9">
          <div className="flex flex-col gap-4">
            <Image src="/brand/logo-horizontal-signature-inverse.svg" alt={`${site.name} — ${t("tagline")}`} width={237} height={80} className="-ml-3 h-20 w-auto self-start" />
            <p className="text-sm leading-relaxed">{t("footerAbout")}</p>
            <p className="font-mono text-[11px] text-faint">{t("licence", { licence: site.legal.licence, rccm: site.legal.rccm })}</p>
          </div>
          {footerNav.map((col) => (
            <nav key={col.key} aria-label={tNav(col.key)} className="flex flex-col gap-2.5 text-[15px]">
              <strong className="mb-1 text-white">{tNav(col.key)}</strong>
              {col.items.map((item) => (
                <Link key={item.key} href={item.href} className="hover:text-white">
                  {tNav(item.key)}
                </Link>
              ))}
            </nav>
          ))}
          <div className="flex flex-col gap-3 text-[15px]">
            <strong className="mb-1 text-white">{tNav("colContact")}</strong>
            <span>{site.contact.phone}</span>
            <a href={`mailto:${site.contact.email}`} className="hover:text-white">
              {site.contact.email}
            </a>
            <div className="flex gap-2.5">
              <a href={site.social.facebook} aria-label="Facebook" className="flex size-[42px] items-center justify-center rounded-full bg-night-2 font-bold text-white">
                f
              </a>
              <a href={site.social.instagram} aria-label="Instagram" className="flex size-[42px] items-center justify-center rounded-full bg-night-2 text-white">
                <Icon name="instagram" size={16} />
              </a>
              <a href={site.social.linkedin} aria-label="LinkedIn" className="flex size-[42px] items-center justify-center rounded-full bg-night-2 text-[13px] font-bold text-white">
                in
              </a>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap justify-between gap-3 border-t border-night-line pt-5 text-[13px] text-faint">
          <span>{t("copyright", { year, name: site.name })}</span>
          <nav aria-label={tNav("legalNav")} className="flex flex-wrap gap-5">
            {legalNav.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-white">
                {tNav(item.key)}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
