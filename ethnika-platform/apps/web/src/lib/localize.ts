/**
 * Contenus bilingues : le français est la base ; une couche anglaise ne contient que les champs traduits.
 * `localize(base, overlay)` fusionne en profondeur (les tableaux sont fusionnés élément par élément).
 */

export type DeepPartial<T> = T extends readonly (infer U)[] ? readonly DeepPartial<U>[] : T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function localize<T>(base: T, overlay: DeepPartial<T> | undefined): T {
  if (overlay === undefined) return base;
  if (Array.isArray(base) && Array.isArray(overlay)) {
    return base.map((item, i) => localize(item, (overlay as unknown[])[i] as DeepPartial<typeof item>)) as T;
  }
  if (isObject(base) && isObject(overlay)) {
    const out: Record<string, unknown> = { ...base };
    for (const [k, v] of Object.entries(overlay)) out[k] = localize((base as Record<string, unknown>)[k], v as DeepPartial<unknown>);
    return out as T;
  }
  return overlay as T;
}
