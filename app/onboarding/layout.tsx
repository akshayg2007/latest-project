import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { ReactNode } from "react" // Imported explicitly to avoid type errors

export default async function OnboardingLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await auth()

  // 1. Not Logged In? -> Go to Login
  if (!session?.user) {
    redirect("/api/auth/signin")
  }

  // 2. Fetch Fresh Data
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingComplete: true }
  })

  // 3. Already Completed Onboarding? -> Go to Dashboard
  if (user?.onboardingComplete === true) {
    redirect("/dashboard")
  }

  // 4. Render Form
  return (
    <>
      {children}
    </>
  )
}