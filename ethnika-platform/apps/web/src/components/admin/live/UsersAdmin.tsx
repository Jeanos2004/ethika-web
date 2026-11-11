"use client";

import { useActionState } from "react";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { createUser, resetUserMfa, resetUserPassword, updateUser, type UserState } from "@/lib/admin/user-actions";
import type { ApiUser } from "@/lib/admin/types";
import { formatShort } from "@/components/admin/status";

const input = "h-11 w-full rounded-xl border border-line-strong bg-white px-3.5 text-[15px] outline-none focus:border-night";
const small = "min-h-10 rounded-full border-[1.5px] border-line-strong bg-white px-3.5 text-[13px] font-semibold text-night hover:border-night";

/** Mot de passe temporaire : affiché une seule fois, à transmettre à la personne par un canal sûr. */
function TemporaryPassword({ state }: { state: UserState }) {
  const t = useTranslations("admin.live.users");
  if (!state.temporaryPassword) return null;
  return (
    <div role="status" className="flex flex-col gap-1 rounded-xl border border-brand-gold bg-cream p-3.5 text-sm">
      <strong className="text-night">{t("tempTitle", { email: state.email ?? "" })}</strong>
      <code className="font-mono text-base text-night select-all">{state.temporaryPassword}</code>
      <span className="text-muted">{t("tempHint")}</span>
    </div>
  );
}

function Error({ state }: { state: UserState }) {
  const tErr = useTranslations("admin.live.errors");
  return state.error ? (
    <p role="alert" className="text-sm text-red-700">
      {tErr(state.error)}
    </p>
  ) : null;
}

export function NewUserForm() {
  const t = useTranslations("admin.live.users");
  const [state, action, pending] = useActionState<UserState, FormData>(createUser, {});
  return (
    <form key={state.temporaryPassword ?? "new"} action={action} className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5 sm:p-6">
      <h2 className="text-base font-bold text-night">{t("newTitle")}</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_10rem]">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="new-name" className="text-[13px] font-semibold">
            {t("name")}
          </label>
          <input id="new-name" name="name" required minLength={2} maxLength={120} className={input} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="new-email" className="text-[13px] font-semibold">
            {t("email")}
          </label>
          <input id="new-email" name="email" type="email" required maxLength={200} className={input} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="new-role" className="text-[13px] font-semibold">
            {t("role")}
          </label>
          <select id="new-role" name="role" defaultValue="agent" className={input}>
            <option value="agent">{t("roles.agent")}</option>
            <option value="admin">{t("roles.admin")}</option>
          </select>
        </div>
      </div>
      <Error state={state} />
      <TemporaryPassword state={state} />
      <button type="submit" disabled={pending} className="inline-flex h-11 items-center justify-center self-end rounded-full bg-night px-5 text-sm font-semibold text-white hover:bg-night-2 disabled:opacity-60">
        {t("create")}
      </button>
    </form>
  );
}

export function UserRow({ user, self }: { user: ApiUser; self: boolean }) {
  const t = useTranslations("admin.live.users");
  const [roleState, roleAction] = useActionState<UserState, FormData>(updateUser, {});
  const [pwState, pwAction, pwPending] = useActionState<UserState, FormData>(resetUserPassword, {});
  const [mfaState, mfaAction] = useActionState<UserState, FormData>(resetUserMfa, {});
  const locked = user.lockedUntil && new Date(user.lockedUntil) > new Date();

  return (
    <li className="flex flex-col gap-3 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <span className="flex min-w-0 flex-col">
          <strong className="text-night">
            {user.name} {self && <span className="text-xs font-medium text-muted">({t("you")})</span>}
          </strong>
          <span className="truncate text-sm text-muted">{user.email}</span>
          <span className="mt-1 flex flex-wrap gap-1.5 text-xs">
            <Tag>{t(`roles.${user.role}`)}</Tag>
            <Tag tone={user.totpEnabled ? "ok" : "warn"}>{user.totpEnabled ? t("mfaOn") : t("mfaOff")}</Tag>
            {user.disabled && <Tag tone="bad">{t("disabled")}</Tag>}
            {user.mustChangePassword && <Tag tone="warn">{t("tempPassword")}</Tag>}
            {locked && <Tag tone="bad">{t("locked")}</Tag>}
          </span>
        </span>
        <span className="text-xs text-muted">{user.lastLoginAt ? t("lastLogin", { date: formatShort(user.lastLoginAt) }) : t("neverLoggedIn")}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!self && (
          <form action={roleAction} className="flex items-center gap-2">
            <input type="hidden" name="id" value={user.id} />
            <input type="hidden" name="op" value="role" />
            <label className="sr-only" htmlFor={`role-${user.id}`}>
              {t("role")}
            </label>
            <select id={`role-${user.id}`} name="role" defaultValue={user.role} className="h-10 rounded-full border-[1.5px] border-line-strong bg-white px-3 text-[13px] font-semibold">
              <option value="agent">{t("roles.agent")}</option>
              <option value="admin">{t("roles.admin")}</option>
            </select>
            <button type="submit" className={small}>
              {t("saveRole")}
            </button>
          </form>
        )}
        {!self && (
          <Confirm key={String(user.disabled)} label={user.disabled ? t("enable") : t("disable")} question={user.disabled ? t("enableConfirm") : t("disableConfirm")} action={roleAction}>
            <input type="hidden" name="id" value={user.id} />
            <input type="hidden" name="op" value={user.disabled ? "enable" : "disable"} />
          </Confirm>
        )}
        <Confirm label={t("resetPassword")} question={t("resetPasswordConfirm")} action={pwAction} pending={pwPending}>
          <input type="hidden" name="id" value={user.id} />
          <input type="hidden" name="email" value={user.email} />
        </Confirm>
        {user.totpEnabled && !self && (
          <Confirm label={t("resetMfa")} question={t("resetMfaConfirm")} action={mfaAction}>
            <input type="hidden" name="id" value={user.id} />
          </Confirm>
        )}
      </div>
      <Error state={roleState} />
      <Error state={mfaState} />
      <Error state={pwState} />
      <TemporaryPassword state={pwState} />
    </li>
  );
}

function Tag({ children, tone }: { children: React.ReactNode; tone?: "ok" | "warn" | "bad" }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2 py-0.5 font-semibold text-ink">
      {tone && <span aria-hidden="true" className={clsx("size-2 rounded-full", tone === "ok" ? "bg-brand-green" : tone === "warn" ? "bg-brand-gold" : "bg-brand-red")} />}
      {children}
    </span>
  );
}

/** Action sensible : confirmation explicite en deux temps. */
function Confirm({ label, question, action, pending, children }: { label: string; question: string; action: (fd: FormData) => void; pending?: boolean; children: React.ReactNode }) {
  const t = useTranslations("admin.live.users");
  return (
    <details className="relative">
      <summary className={`${small} flex cursor-pointer list-none items-center`}>{label}</summary>
      <form action={action} className="absolute left-0 z-10 mt-2 flex w-64 flex-col gap-2 rounded-xl border border-line bg-white p-3 text-sm shadow-lg">
        {children}
        <span className="text-ink">{question}</span>
        <button type="submit" disabled={pending} className="min-h-10 rounded-full bg-night px-3.5 text-[13px] font-semibold text-white disabled:opacity-60">
          {t("confirm")}
        </button>
      </form>
    </details>
  );
}
