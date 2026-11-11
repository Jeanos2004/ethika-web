import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AuthLayout } from "@/components/admin/live/AuthLayout";
import { LoginForm } from "@/components/admin/live/LoginForm";
import { adminMode, currentUser } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Connexion" };

/** Connexion au back-office : e-mail + mot de passe, puis code 2FA si le compte l'a activée. */
export default async function AdminLoginPage() {
  if (adminMode !== "live") notFound();
  if (await currentUser()) redirect("/admin");
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}
