"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { renameAccount, type AccountState } from "@/lib/admin/account-actions";

/** Nom affiché dans le back-office (attributions, historique, devis). */
export function ProfileForm({ name }: { name: string }) {
  const t = useTranslations("admin.live.settings");
  const tErr = useTranslations("admin.live.errors");
  const [state, action, pending] = useActionState<AccountState, FormData>(renameAccount, {});
  return (
    <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <label htmlFor="profile-name" className="text-[13px] font-semibold text-ink">
          {t("name")}
        </label>
        <input id="profile-name" name="name" defaultValue={name} required minLength={2} maxLength={120} className="h-11 w-full rounded-xl border border-line-strong bg-white px-3.5 text-[15px] outline-none focus:border-night" />
      </div>
      <button type="submit" disabled={pending} className="inline-flex h-11 items-center justify-center rounded-full bg-night px-5 text-sm font-semibold text-white hover:bg-night-2 disabled:opacity-60">
        {pending ? t("saving") : t("save")}
      </button>
      {state.error && (
        <p role="alert" className="text-sm text-red-700 sm:basis-full">
          {tErr(state.error)}
        </p>
      )}
      {state.saved && (
        <p role="status" className="text-sm font-semibold text-brand-green-dark sm:basis-full">
          {t("saved")}
        </p>
      )}
    </form>
  );
}
