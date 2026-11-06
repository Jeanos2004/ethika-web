import { useId, type ComponentProps, type ReactNode } from "react";
import { clsx } from "clsx";
import { Icon } from "@/components/ui/Icon";

/*
 * Champs de formulaire (Composants §05).
 * Chaque champ relie automatiquement libellé, aide et erreur (aria-describedby, aria-invalid).
 * États : défaut, focus (anneau or 4px), erreur, valide, désactivé.
 */

type FieldState = { hint?: ReactNode; error?: string; valid?: boolean };
type FieldProps = FieldState & { label: ReactNode; id?: string; className?: string };

const controlBase =
  "w-full rounded-[var(--radius-sm)] border-[1.5px] bg-white px-3.5 text-base font-medium text-ink placeholder:font-normal placeholder:text-faint transition-shadow focus:border-night focus:ring-4 focus:ring-brand-gold/35 focus:outline-none disabled:cursor-not-allowed disabled:border-line disabled:bg-sand disabled:font-normal disabled:text-on-dark-muted";

function controlClasses({ error, valid }: FieldState, extra?: string) {
  return clsx(controlBase, error ? "border-brand-red bg-red-25" : valid ? "border-brand-green" : "border-line-strong", extra);
}

function useFieldIds(id: string | undefined, { hint, error }: FieldState) {
  const auto = useId();
  const controlId = id ?? auto;
  const hintId = `${controlId}-hint`;
  const errorId = `${controlId}-error`;
  const describedBy = clsx(error && errorId, hint && hintId) || undefined;
  return { controlId, hintId, errorId, aria: { "aria-invalid": error ? true : undefined, "aria-describedby": describedBy } };
}

function FieldShell({
  label,
  controlId,
  hintId,
  errorId,
  hint,
  error,
  valid,
  disabled,
  className,
  children,
}: FieldState & { label: ReactNode; controlId: string; hintId: string; errorId: string; disabled?: boolean; className?: string; children: ReactNode }) {
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={controlId}
        className={clsx("text-sm font-semibold", disabled ? "text-on-dark-muted" : error ? "text-red-700" : valid ? "text-green-700" : "text-night")}
      >
        {label}
      </label>
      {children}
      {error && (
        <p id={errorId} className="text-xs font-semibold text-red-700">
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className={clsx("text-xs", valid && !error ? "text-green-700" : "text-subtle")}>
          {hint}
        </p>
      )}
    </div>
  );
}

export function Input({ label, hint, error, valid, id, className, disabled, ...rest }: FieldProps & Omit<ComponentProps<"input">, "className" | "id">) {
  const ids = useFieldIds(id, { hint, error });
  return (
    <FieldShell label={label} hint={hint} error={error} valid={valid} disabled={disabled} className={className} {...ids}>
      <div className="relative">
        <input id={ids.controlId} disabled={disabled} className={controlClasses({ error, valid }, clsx("h-[52px]", valid && "pr-11"))} {...ids.aria} {...rest} />
        {valid && !error && (
          <Icon name="check" size={18} strokeWidth={2.4} className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-brand-green" />
        )}
      </div>
    </FieldShell>
  );
}

export function Textarea({ label, hint, error, valid, id, className, disabled, rows = 5, ...rest }: FieldProps & Omit<ComponentProps<"textarea">, "className" | "id">) {
  const ids = useFieldIds(id, { hint, error });
  return (
    <FieldShell label={label} hint={hint} error={error} valid={valid} disabled={disabled} className={className} {...ids}>
      <textarea id={ids.controlId} rows={rows} disabled={disabled} className={controlClasses({ error, valid }, "py-3 leading-relaxed")} {...ids.aria} {...rest} />
    </FieldShell>
  );
}

export type SelectOption = { value: string; label: string };

export function Select({
  label,
  hint,
  error,
  valid,
  id,
  className,
  disabled,
  options,
  placeholder,
  ...rest
}: FieldProps & { options: readonly SelectOption[]; placeholder?: string } & Omit<ComponentProps<"select">, "className" | "id" | "children">) {
  const ids = useFieldIds(id, { hint, error });
  return (
    <FieldShell label={label} hint={hint} error={error} valid={valid} disabled={disabled} className={className} {...ids}>
      <div className="relative">
        <select id={ids.controlId} disabled={disabled} className={controlClasses({ error, valid }, "h-[52px] appearance-none pr-11")} {...ids.aria} {...rest}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Icon name="chevronDown" size={18} className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-night" />
      </div>
    </FieldShell>
  );
}

/** Case à cocher. Le libellé accepte du contenu riche (lien vers la politique de confidentialité, etc.). */
export function Checkbox({
  label,
  error,
  id,
  className,
  tone = "light",
  ...rest
}: { label: ReactNode; error?: string; id?: string; className?: string; tone?: "light" | "dark" } & Omit<ComponentProps<"input">, "className" | "id" | "type">) {
  const ids = useFieldIds(id, { error });
  return (
    <div className={clsx("flex flex-col gap-1", className)}>
      <label htmlFor={ids.controlId} className="flex items-start gap-2.5 text-[15px] leading-snug text-ink">
        <span className="relative mt-px flex size-5 shrink-0">
          <input
            id={ids.controlId}
            type="checkbox"
            className={clsx(
              "peer size-5 cursor-pointer appearance-none rounded-[6px] border-[1.5px] bg-white transition-colors checked:border-brand-red checked:bg-brand-red disabled:cursor-not-allowed disabled:border-line disabled:bg-sand",
              error ? "border-brand-red" : "border-line-strong",
            )}
            {...ids.aria}
            {...rest}
          />
          <Icon name="check" size={14} strokeWidth={3} className="pointer-events-none absolute inset-0 m-auto hidden text-white peer-checked:block" />
        </span>
        <span>{label}</span>
      </label>
      {error && (
        <p id={ids.errorId} className={clsx("text-xs font-semibold", tone === "dark" ? "text-red-100" : "text-red-700")}>
          {error}
        </p>
      )}
    </div>
  );
}

/** Groupe de boutons radio dans un fieldset (légende annoncée par les lecteurs d'écran). */
export function RadioGroup({
  legend,
  name,
  options,
  defaultValue,
  value,
  onChange,
  className,
}: {
  legend: ReactNode;
  name: string;
  options: readonly SelectOption[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}) {
  const uid = useId();
  return (
    <fieldset className={clsx("flex flex-col gap-2.5", className)}>
      <legend className="mb-2.5 text-sm font-semibold text-night">{legend}</legend>
      {options.map((o) => {
        const optionId = `${uid}-${o.value}`;
        return (
          <label key={o.value} htmlFor={optionId} className="flex items-center gap-2.5 text-[15px] text-ink">
            <input
              id={optionId}
              type="radio"
              name={name}
              value={o.value}
              defaultChecked={value === undefined ? defaultValue === o.value : undefined}
              checked={value === undefined ? undefined : value === o.value}
              onChange={onChange ? () => onChange(o.value) : undefined}
              className="size-5 shrink-0 cursor-pointer appearance-none rounded-full border-[1.5px] border-line-strong bg-white transition-[border] checked:border-[6px] checked:border-brand-red"
            />
            {o.label}
          </label>
        );
      })}
    </fieldset>
  );
}
