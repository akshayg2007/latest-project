"use server"

import { signIn } from "@/auth"
import { AuthError } from "next-auth"
import { db } from "@/lib/db"

export async function loginUser(prevState: string | undefined, formData: FormData) {
  try {
    const email = formData.get("email") as string
    const password = formData.get("password")

    // Check user role to determine redirect destination
    let redirectTo = "/dashboard"
    if (email) {
      const user = await db.user.findUnique({
        where: { email },
        select: { role: true, isBanned: true, banReason: true }
      })

      if (user?.isBanned) {
        return `Your account has been permanently banned.${user.banReason ? ` Reason: ${user.banReason}` : ""}\n\nPlease contact support for more information.`
      }

      if (user?.role === "ADMIN") {
        redirectTo = "/admin/dashboard"
      }
    }

    // Attempt to sign in using NextAuth Credentials provider
    await signIn("credentials", {
      email,
      password,
      redirectTo,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          if (error.cause?.err?.message === "BANNED") {
            return "Your account has been permanently banned. Please contact support for more information."
          }
          return "Invalid credentials. Please check your email and password."
        default:
          return "Something went wrong. Please try again."
      }
    }
    throw error // Re-throw duplicate errors or redirect errors so Next.js handles them
  }
}