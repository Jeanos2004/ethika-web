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

/**
 * Cloche du back-office : compteur de non-lus, panneau latéral (dialog natif) avec les événements qui demandent
 * une action. L'ouverture marque tout comme lu. `tone` : couleur du bouton selon le fond (barre sombre ou claire).
 * Le parent remonte le composant (key) quand le nombre de non-lus change côté serveur.
 */
export function NotificationBell({ data, tone = "dark" }: { data: ApiNotifications; tone?: "dark" | "light" }) {
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
        aria-label={unread ? t("labelUnread", { count: unread }) : t("label")}
        className={clsx("relative flex size-10 items-center justify-center rounded-full transition-colors", tone === "dark" ? "text-white hover:bg-night-2" : "text-night hover:bg-sand")}
      >
        <Icon name="bell" size={19} />
        {unread > 0 && <span className="absolute -top-0.5 -right-0.5 flex min-w-5 items-center justify-center rounded-full bg-brand-red px-1 text-[11px] font-bold text-white tabular-nums">{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <dialog
          ref={ref}
          aria-labelledby="notif-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) ref.current?.close();
          }}
          className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-full max-w-[400px] bg-sand p-0 text-ink shadow-2xl backdrop:bg-ink/40"
        >
          <div className="flex h-full flex-col">
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
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-night">
                  <Icon name="check" size={22} />
                </span>
                <strong className="text-night">{t("empty")}</strong>
                <span className="text-sm text-muted">{t("emptyHint")}</span>
              </div>
            ) : (
              <ul className="flex-1 divide-y divide-line overflow-y-auto">
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
          </div>
        </dialog>
      )}
    </>
  );
}
