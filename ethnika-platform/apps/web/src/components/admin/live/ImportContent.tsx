"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { importSiteContent, type ImportState } from "@/lib/admin/import-content";

/** Reprise des contenus actuels du site dans le back-office (idempotent). */
export function ImportContent({ kind, count }: { kind: "offers" | "circuits" | "posts" | "gallery"; count: number }) {
  const t = useTranslations("admin.live.content");
  const [state, action, pending] = useActionState<ImportState, FormData>(importSiteContent, {});
  return (
    <form action={action} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-line-strong bg-white/60 px-5 py-4 text-sm">
      <input type="hidden" name="kind" value={kind} />
      <span className="max-w-xl text-muted">
        {state.created !== undefined ? t("importDone", { created: state.created, skipped: state.skipped ?? 0, failed: state.failed ?? 0 }) : t("importHint", { count })}
      </span>
      <button type="submit" disabled={pending} className="min-h-10 rounded-full border-[1.5px] border-night bg-white px-4 text-[13px] font-semibold text-night hover:bg-night hover:text-white disabled:opacity-60">
        {pending ? t("importing") : t("import", { count })}
      </button>
    </form>
  );
}
