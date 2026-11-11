import type { Metadata } from "next";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/live/LoginForm";
import { adminMode, currentUser } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Connexion" };

/** Connexion au back-office : e-mail + mot de passe, puis code 2FA si le compte l'a activée. */
export default async function AdminLoginPage() {
  if (adminMode !== "live") notFound();
  if (await currentUser()) redirect("/admin");
  return (
    <main className="flex min-h-dvh items-center justify-center bg-night px-4 py-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Image src="/brand/logo-horizontal-inverse.svg" alt="ETHNIKA" width={152} height={48} className="h-11 w-auto self-center" priority />
        <LoginForm />
      </div>
    </main>
  );
}
