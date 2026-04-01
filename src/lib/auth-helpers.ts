import { cookies } from "next/headers";
import { decode } from "next-auth/jwt";
import { NextResponse } from "next/server";

// Decodes Auth.js JWT session without triggering CSRF validation
// This is needed for v0's proxy environment where headers don't match
export async function getSession() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("authjs.session-token")?.value 
      || cookieStore.get("__Secure-authjs.session-token")?.value;
    
    if (!sessionToken) return null;

    const decoded = await decode({
      token: sessionToken,
      secret: process.env.AUTH_SECRET!,
      salt: cookieStore.get("__Secure-authjs.session-token")?.value 
        ? "__Secure-authjs.session-token" 
        : "authjs.session-token",
    });

    if (!decoded?.id) return null;

    return {
      user: {
        id: decoded.id as string,
        name: decoded.name as string | null,
        email: decoded.email as string | null,
        image: decoded.picture as string | null,
      }
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
