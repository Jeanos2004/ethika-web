"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { markNotificationsSeen } from "@/lib/admin/notification-actions";
import type { ApiNotification, ApiNotifications } from "@/lib/admin/types";
import { Icon, type IconName } from "@/components/ui/Icon";

const icons: Record<ApiNotification["kind"], IconName> = { lead_new: "mail", lead_assigned: "users", payment_received: "check", payment_failed: "alert", hold_due: "clock" };
const tones: Record<ApiNotification["kind"], string> = {
  lead_new: "bg-sand text-night",
  lead_assigned: "bg-sand text-night",
  payment_received: "bg-green-50 text-green-700",
  payment_failed: "bg-red-50 text-red-700",
  hold_due: "bg-red-50 text-red-700",
};

/** « il y a 5 min », « il y a 3 h », « hier »… (échéances : « dans 4 h »). */
function relative(iso: string, now: number, rtf: Intl.RelativeTimeFormat) {
  const diff = new Date(iso).getTime() - now;
  const abs = Math.abs(diff);
  if (abs < 3600_000) return rtf.format(Math.round(diff / 60_000), "minute");
  if (abs < 86_400_000) return rtf.format(Math.round(diff / 3600_000), "hour");
  return rtf.format(Math.round(diff / 86_400_000), "day");
}

/** Bas de l'écran : au-dessus de la barre d'onglets en mobile, dans le coin en grand écran. */
const anchor = "right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] lg:right-6 lg:bottom-6";

/**
 * Cloche flottante du back-office, en bas à droite au-dessus du contenu : compteur de non-lus ; un clic fait
 * émerger le panneau juste au-dessus du bouton (dialog natif : focus piégé, Échap et clic extérieur ferment).
 * L'ouverture marque tout comme lu. Le parent remonte le composant (key) quand le nombre de non-lus change côté serveur.
 */
export function NotificationBell({ data }: { data: ApiNotifications }) {
  const t = useTranslations("admin.live.notifications");
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(data.unread);
  const [, start] = useTransition();
  const ref = useRef<HTMLDialogElement>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    const onClose = () => setOpen(false);
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, [open]);

  function show() {
    setNow(Date.now());
    setOpen(true);
    if (unread > 0) {
      setUnread(0);
      start(() => markNotificationsSeen());
    }
  }

  const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });

  return (
    <>
      <button
        type="button"
        onClick={show}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={unread ? t("labelUnread", { count: unread }) : t("label")}
        className={clsx(
          "fixed z-40 flex size-14 items-center justify-center rounded-full bg-night text-white shadow-[0_10px_30px_-8px_rgb(0_0_0/0.45)] ring-4 ring-white/70 transition-transform hover:scale-105 hover:bg-night-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-night",
          anchor,
        )}
      >
        <Icon name="bell" size={22} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-red px-1.5 text-xs font-bold text-white tabular-nums ring-2 ring-white">{unread > 9 ? "9+" : unread}</span>
        )}
      </button>

      {open && (
        <dialog
          ref={ref}
          aria-labelledby="notif-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) ref.current?.close();
          }}
          className={clsx(
            "fixed inset-auto m-0 flex max-h-[min(560px,calc(100dvh-11rem))] w-[min(400px,calc(100vw-2rem))] origin-bottom-right flex-col overflow-hidden rounded-3xl border border-line bg-sand p-0 text-ink shadow-2xl backdrop:bg-ink/20",
            // Émerge du bouton : léger zoom depuis le coin, désactivé si l'utilisateur réduit les animations.
            "transition-[opacity,scale,translate] duration-200 ease-out motion-safe:starting:translate-y-3 motion-safe:starting:scale-90 starting:opacity-0",
            "right-4 bottom-[calc(9.25rem+env(safe-area-inset-bottom))] lg:right-6 lg:bottom-24",
          )}
        >
          <header className="flex items-center justify-between gap-3 border-b border-line bg-white px-5 py-4">
            <div className="flex flex-col">
              <h2 id="notif-title" className="text-lg font-bold text-night">
                {t("title")}
              </h2>
              <span className="text-xs text-muted">{t("subtitle")}</span>
            </div>
            <button type="button" onClick={() => ref.current?.close()} aria-label={t("close")} className="flex size-10 items-center justify-center rounded-full bg-sand text-night hover:bg-line">
              <Icon name="close" size={18} />
            </button>
          </header>
          {data.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-8 py-12 text-center">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-night">
                <Icon name="check" size={22} />
              </span>
              <strong className="text-night">{t("empty")}</strong>
              <span className="text-sm text-muted">{t("emptyHint")}</span>
            </div>
          ) : (
            <ul className="min-h-0 flex-1 divide-y divide-line overflow-y-auto overscroll-contain">
              {data.items.map((n) => (
                <li key={n.id}>
                  <Link href={n.href} onClick={() => ref.current?.close()} className="flex gap-3 px-5 py-3.5 hover:bg-white">
                    <span className={clsx("flex size-9 shrink-0 items-center justify-center rounded-xl", tones[n.kind])}>
                      <Icon name={icons[n.kind]} size={16} />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <strong className="text-sm text-night">{t(`kinds.${n.kind}`, { reference: n.reference, name: n.name ?? "", amount: n.amount ?? "" })}</strong>
                      <span className="truncate text-xs text-muted">
                        <span className="font-mono">{n.reference}</span>
                        {n.name && <> · {n.name}</>}
                        {now > 0 && <> · {relative(n.at, now, rtf)}</>}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </dialog>
      )}
    </>
  );
}
