"use client";

import { useActionState } from "react";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { createUser, resetUserMfa, resetUserPassword, updateUser, type UserState } from "@/lib/admin/user-actions";
import type { ApiUser } from "@/lib/admin/types";
import { formatShort } from "@/components/admin/status";
import { Icon } from "@/components/ui/Icon";

const input = "h-11 w-full rounded-xl border border-line-strong bg-white px-3.5 text-[15px] outline-none focus:border-night";
const small = "inline-flex min-h-9 items-center rounded-full border-[1.5px] border-line-strong bg-white px-3 text-[13px] font-semibold text-night hover:border-night";

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

function ErrorText({ state }: { state: UserState }) {
  const tErr = useTranslations("admin.live.errors");
  return state.error ? (
    <p role="alert" className="text-sm text-red-700">
      {tErr(state.error)}
    </p>
  ) : null;
}

/** Création d'un compte, repliée par défaut (ouverte tant qu'un mot de passe temporaire est à transmettre). */
export function NewUserForm() {
  const t = useTranslations("admin.live.users");
  const [state, action, pending] = useActionState<UserState, FormData>(createUser, {});
  return (
    <details open={Boolean(state.temporaryPassword || state.error) || undefined} className="group rounded-2xl border border-line bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
        <span className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand-gold text-ink">
            <Icon name="plus" size={18} />
          </span>
          <span className="flex flex-col">
            <strong className="text-night">{t("newTitle")}</strong>
            <span className="text-xs text-muted">{t("newHint")}</span>
          </span>
        </span>
        <Icon name="chevronDown" size={18} className="text-muted transition-transform group-open:rotate-180" />
      </summary>
      <form key={state.temporaryPassword ?? "new"} action={action} className="flex flex-col gap-3 border-t border-line px-5 py-4">
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
        <ErrorText state={state} />
        <TemporaryPassword state={state} />
        <button type="submit" disabled={pending} className="inline-flex h-11 items-center justify-center self-end rounded-full bg-night px-5 text-sm font-semibold text-white hover:bg-night-2 disabled:opacity-60">
          {t("create")}
        </button>
      </form>
    </details>
  );
}

/** Ligne d'un compte : identité et état ; « Gérer » déplie les actions (rôle, accès, réinitialisations). */
export function UserRow({ user, self }: { user: ApiUser; self: boolean }) {
  const t = useTranslations("admin.live.users");
  const [roleState, roleAction] = useActionState<UserState, FormData>(updateUser, {});
  const [pwState, pwAction, pwPending] = useActionState<UserState, FormData>(resetUserPassword, {});
  const [mfaState, mfaAction] = useActionState<UserState, FormData>(resetUserMfa, {});
  const locked = Boolean(user.lockedUntil && new Date(user.lockedUntil) > new Date());
  const initials = user.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <li>
      <details open={Boolean(pwState.temporaryPassword || roleState.error || pwState.error || mfaState.error) || undefined} className="group">
        <summary className="grid cursor-pointer list-none grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3.5 gap-y-1 px-4 py-3.5 hover:bg-cream sm:px-5 lg:grid-cols-[auto_minmax(0,1.2fr)_minmax(0,1fr)_9rem_auto]">
          <span aria-hidden="true" className={clsx("flex size-10 items-center justify-center rounded-full text-sm font-bold", user.disabled ? "bg-sand text-subtle" : user.role === "admin" ? "bg-night text-brand-gold" : "bg-brand-gold text-ink")}>
            {initials}
          </span>
          <span className="flex min-w-0 flex-col">
            <strong className={clsx("truncate", user.disabled ? "text-muted line-through" : "text-night")}>
              {user.name} {self && <span className="text-xs font-medium text-muted no-underline">({t("you")})</span>}
            </strong>
            <span className="truncate text-xs text-muted">{user.email}</span>
          </span>
          <span className="col-span-3 flex flex-wrap gap-1.5 text-[11px] lg:col-span-1">
            <Tag>{t(`roles.${user.role}`)}</Tag>
            <Tag tone={user.totpEnabled ? "ok" : "warn"}>{user.totpEnabled ? t("mfaOn") : t("mfaOff")}</Tag>
            {user.disabled && <Tag tone="bad">{t("disabled")}</Tag>}
            {user.mustChangePassword && <Tag tone="warn">{t("tempPassword")}</Tag>}
            {locked && <Tag tone="bad">{t("locked")}</Tag>}
          </span>
          <span className="hidden text-xs text-muted lg:block">{user.lastLoginAt ? formatShort(user.lastLoginAt) : t("neverLoggedIn")}</span>
          <span className="col-start-3 row-start-1 inline-flex items-center gap-1 text-[13px] font-semibold text-night lg:col-start-auto lg:row-start-auto">
            {t("manage")} <Icon name="chevronDown" size={15} className="transition-transform group-open:rotate-180" />
          </span>
        </summary>

        <div className="flex flex-col gap-3 border-t border-dashed border-line bg-cream/60 px-4 py-4 sm:px-5 lg:pl-[4.5rem]">
          <span className="text-xs text-muted lg:hidden">{user.lastLoginAt ? t("lastLogin", { date: formatShort(user.lastLoginAt) }) : t("neverLoggedIn")}</span>
          <div className="flex flex-wrap items-center gap-2">
            {!self && (
              <form action={roleAction} className="flex items-center gap-1.5">
                <input type="hidden" name="id" value={user.id} />
                <input type="hidden" name="op" value="role" />
                <label className="sr-only" htmlFor={`role-${user.id}`}>
                  {t("role")}
                </label>
                <select id={`role-${user.id}`} name="role" defaultValue={user.role} className="h-9 rounded-full border-[1.5px] border-line-strong bg-white px-3 text-[13px] font-semibold">
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
            {self && <span className="text-xs text-muted">{t("selfHint")}</span>}
          </div>
          <ErrorText state={roleState} />
          <ErrorText state={mfaState} />
          <ErrorText state={pwState} />
          <TemporaryPassword state={pwState} />
        </div>
      </details>
    </li>
  );
}

function Tag({ children, tone }: { children: React.ReactNode; tone?: "ok" | "warn" | "bad" }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-2 py-0.5 font-semibold text-ink">
      {tone && <span aria-hidden="true" className={clsx("size-1.5 rounded-full", tone === "ok" ? "bg-brand-green" : tone === "warn" ? "bg-brand-gold" : "bg-brand-red")} />}
      {children}
    </span>
  );
}

/** Action sensible : confirmation explicite en deux temps. */
function Confirm({ label, question, action, pending, children }: { label: string; question: string; action: (fd: FormData) => void; pending?: boolean; children: React.ReactNode }) {
  const t = useTranslations("admin.live.users");
  return (
    <details className="relative">
      <summary className={`${small} cursor-pointer list-none`}>{label}</summary>
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
