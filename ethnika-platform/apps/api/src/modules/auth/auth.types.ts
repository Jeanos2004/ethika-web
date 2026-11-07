import type { Role } from "../../generated/prisma/client";

/** Identité attachée à une requête authentifiée (req.auth). */
export type AuthContext = {
  userId: string;
  email: string;
  name: string;
  role: Role;
  sessionId: string;
  mfaVerified: boolean;
  mustChangePassword: boolean;
};

export type AuthedRequest = { auth?: AuthContext; ip?: string; header(name: string): string | undefined };
