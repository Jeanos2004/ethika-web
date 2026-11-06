import type { ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "../../messages/fr.json";

/** Rendu de test avec les messages français, comme dans l'application. */
export function renderWithIntl(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return render(ui, {
    wrapper: ({ children }) => (
      <NextIntlClientProvider locale="fr" messages={messages} timeZone="Africa/Conakry">
        {children}
      </NextIntlClientProvider>
    ),
    ...options,
  });
}
