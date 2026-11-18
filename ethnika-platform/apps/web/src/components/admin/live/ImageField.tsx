"use client";

import { useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icon";
import { input } from "@/components/admin/live/ContentFields";

const MAX = 15 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];
/** Adresse prévisualisable : chemin du site ou https (même règle que l'API). */
const previewable = (v: string) => /^\/[A-Za-z0-9/_.-]+\.(jpe?g|png|webp|avif)$/i.test(v) || /^https:\/\/[^\s"'<>]+$/.test(v);

/**
 * Image d'un contenu : aperçu, envoi d'une photo (JPEG, PNG ou WebP, 15 Mo max, relayée à l'API par /admin/media)
 * ou chemin saisi à la main (/images/… du site, https). Une photo en hauteur coche « tall » si le formulaire en a un.
 */
export function ImageField({ name = "imageUrl", label, defaultValue = "", hint, required = true }: { name?: string; label: string; defaultValue?: string; hint?: string; required?: boolean }) {
  const t = useTranslations("admin.live.media");
  const tErr = useTranslations("admin.live.errors");
  const id = useId();
  const [value, setValue] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setError(undefined);
    if (!TYPES.includes(file.type)) return setError("uploadType");
    if (file.size > MAX) return setError("uploadTooLarge");
    setBusy(true);
    try {
      const res = await fetch("/admin/media", { method: "POST", headers: { "content-type": file.type, "x-file-name": encodeURIComponent(file.name) }, body: file });
      const data = (await res.json().catch(() => ({}))) as { url?: string; width?: number | null; height?: number | null; error?: string };
      if (!res.ok || !data.url) return setError(data.error ?? "unavailable");
      setValue(data.url);
      const tall = fileRef.current?.form?.elements.namedItem("tall");
      if (tall instanceof HTMLInputElement && data.width && data.height) tall.checked = data.height > data.width * 1.15;
    } catch {
      setError("unavailable");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-ink">
        {label}
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="relative flex aspect-[4/3] w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-sand sm:w-40">
          {previewable(value) ? (
            // eslint-disable-next-line @next/next/no-img-element -- aperçu d'une image du site, du back-office ou d'un CDN https
            <img src={value} alt="" className="size-full object-cover" />
          ) : (
            <Icon name="image" size={24} className="text-subtle" />
          )}
          {busy && <span className="absolute inset-0 flex items-center justify-center bg-white/75 text-xs font-semibold text-night">{t("uploading")}</span>}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input id={id} name={name} value={value} onChange={(e) => setValue(e.target.value)} required={required} maxLength={300} className={input} aria-describedby={`${id}-hint`} />
          <div className="flex flex-wrap items-center gap-2">
            <input ref={fileRef} type="file" accept={TYPES.join(",")} className="sr-only" id={`${id}-file`} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} disabled={busy} />
            <label
              htmlFor={`${id}-file`}
              className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-night bg-white px-4 text-[13px] font-semibold text-night hover:bg-night hover:text-white has-[:disabled]:opacity-60"
            >
              <Icon name="plus" size={15} /> {busy ? t("uploading") : t("upload")}
            </label>
            <span id={`${id}-hint`} className="text-xs text-muted">
              {hint ?? t("hint")}
            </span>
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {tErr(error)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
