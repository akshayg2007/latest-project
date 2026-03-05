"use server"

import { db } from "@/lib/db"
import { hash } from "bcryptjs"
import { signIn } from "@/auth" // <--- Import the signIn helper

export async function registerUser(formData: FormData) {
  const username = formData.get("username") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!username || !email || !password) {
    return { error: "Please fill in all fields" }
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" }
  }

  // 1. Check if user already exists
  const existingUser = await db.user.findFirst({
    where: {
      OR: [
        { email: email },
        { username: username }
      ]
    }
  })

  if (existingUser) {
    return { error: "Email or Username already taken" }
  }

  // 2. Hash the password
  const hashedPassword = await hash(password, 10)

  // 3. Create the User
  await db.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      activeProfile: "BUYER",
      onboardingComplete: false
    }
  })

  // 4. AUTO-LOGIN & REDIRECT
  // Instead of sending them to /signin, we log them in immediately.
  // We send them straight to /onboarding since we know they are new.
  await signIn("credentials", {
    email,
    password,
    redirectTo: "/onboarding"
  })
}