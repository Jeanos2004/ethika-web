import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/** Liens et navigation qui conservent la langue courante (à utiliser à la place de next/link). */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
