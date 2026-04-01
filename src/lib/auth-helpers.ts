import { cookies } from "next/headers";
import { decode } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("authjs.session-token")?.value 
      || cookieStore.get("__Secure-authjs.session-token")?.value;
    
    if (!sessionToken) {
      return null;
    }

    const decoded = await decode({
      token: sessionToken,
      secret: process.env.AUTH_SECRET!,
      salt: cookieStore.get("__Secure-authjs.session-token")?.value 
        ? "__Secure-authjs.session-token" 
        : "authjs.session-token",
    });

    if (!decoded?.id) {
      return null;
    }

    return {
      id: decoded.id as string,
      name: decoded.name as string | null,
      email: decoded.email as string | null,
      image: decoded.picture as string | null,
    };
  } catch (error) {
    console.error("[v0] Error decoding session:", error);
    return null;
  }
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
