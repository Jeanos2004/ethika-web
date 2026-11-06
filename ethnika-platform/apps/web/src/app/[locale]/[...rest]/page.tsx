import { notFound } from "next/navigation";

/** Toute URL inconnue dans une langue → page 404 localisée ([locale]/not-found.tsx). */
export default function CatchAll() {
  notFound();
}
