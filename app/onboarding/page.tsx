// app/onboarding/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth"; // <-- Importing from your confirmed auth file
import { db } from "@/lib/db";   // <-- Importing from your confirmed db file
import OnboardingClient from "./client";

export default async function OnboardingPage() {
  // 1. Get the session using the v5 auth helper
  const session = await auth();

  // 2. Protect the route
  if (!session || !session.user?.email) {
    return redirect("/signin");
  }

  // 3. Fetch the username specifically from the DB to be sure
  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { username: true }
  });

  // 4. Pass it to the client form
  return <OnboardingClient username={user?.username || "User"} />;
}