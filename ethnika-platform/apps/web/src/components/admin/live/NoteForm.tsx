"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { addLeadNote, type NoteState } from "@/lib/admin/actions";

/** Note interne sur une demande (historisée par l'API). */
export function NoteForm({ reference }: { reference: string }) {
  const t = useTranslations("admin.live");
  const [state, action, pending] = useActionState<NoteState, FormData>(addLeadNote, {});
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) form.current?.reset();
  }, [state.ok]);

  return (
    <form ref={form} action={action} className="flex flex-col gap-2 border-t border-line pt-3">
      <input type="hidden" name="ref" value={reference} />
      <label htmlFor="note" className="text-[13px] font-semibold">
        {t("leads.noteLabel")}
      </label>
      <textarea
        id="note"
        name="note"
        required
        minLength={2}
        maxLength={2000}
        rows={3}
        aria-describedby={state.error ? "note-error" : undefined}
        className="rounded-xl border border-line-strong bg-white px-3.5 py-2.5 text-[15px] outline-none focus:border-night"
      />
      {state.error && (
        <p id="note-error" role="alert" className="text-sm text-red-700">
          {t(`errors.${state.error}`)}
        </p>
      )}
      <button type="submit" disabled={pending} className="inline-flex h-10 items-center justify-center self-end rounded-full bg-night px-4 text-sm font-semibold text-white hover:bg-night-2 disabled:opacity-60">
        {pending ? t("saving") : t("leads.addNote")}
      </button>
    </form>
  );
}
