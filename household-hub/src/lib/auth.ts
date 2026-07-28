import { cookies } from "next/headers";

const SESSION_COOKIE = "household_admin_session";
const SESSION_VALUE = "authenticated";
const FRONTEND_COOKIE = "household_frontend_session";

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? "charlene2026";
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value === SESSION_VALUE;
}

export async function setAuthenticated(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, SESSION_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function clearAuthentication(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/** Frontend app session — stores allowlisted email */
export async function getFrontendSessionEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(FRONTEND_COOKIE)?.value;
  if (!raw) return null;
  try {
    return decodeURIComponent(raw).trim().toLowerCase() || null;
  } catch {
    return raw.trim().toLowerCase() || null;
  }
}

export async function setFrontendSession(email: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(FRONTEND_COOKIE, encodeURIComponent(email.trim().toLowerCase()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function clearFrontendSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(FRONTEND_COOKIE);
}
