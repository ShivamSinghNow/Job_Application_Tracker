"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function credentialsSignIn(email: string, password: string, callbackUrl: string) {
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password" };
        default:
          return { error: "Something went wrong. Please try again." };
      }
    }
    // Re-throw redirect errors (these are expected)
    throw error;
  }
}
