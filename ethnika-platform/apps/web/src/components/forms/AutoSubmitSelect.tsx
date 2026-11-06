"use client";

import type { ComponentProps } from "react";

/**
 * Liste déroulante qui soumet son formulaire GET dès qu'on change de valeur.
 * Sans JavaScript, le formulaire garde son bouton « Appliquer » (rendu dans <noscript> par le parent).
 */
export function AutoSubmitSelect(props: Omit<ComponentProps<"select">, "onChange">) {
  return <select {...props} onChange={(e) => e.currentTarget.form?.requestSubmit()} />;
}
