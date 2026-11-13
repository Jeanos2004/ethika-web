import { startTransition, type FormEvent } from "react";

/**
 * Soumission qui conserve la saisie : React 19 vide un formulaire non contrôlé après une action `action={…}`,
 * même en cas d'erreur. Sur les longs formulaires (circuit, devis, passagers), on appelle l'action à la main.
 */
export function keepValues(action: (fd: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  };
}
