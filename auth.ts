import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import { compare } from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials.email as string
        const password = credentials.password as string

        if (!email || !password) return null

        const user = await db.user.findUnique({
          where: { email }
        })

        if (!user) return null

        if (user.isBanned) {
          throw new Error("BANNED")
        }

        const isMatch = await compare(password, user.password)

        if (!isMatch) return null

        return {
          id: user.id,
          name: user.username,
          email: user.email,
          onboardingComplete: user.onboardingComplete,
          activeProfile: user.activeProfile,
          role: user.role,
          image: user.avatarUrl,
          isBanned: user.isBanned,
          suspendedUntil: user.suspendedUntil,
        }
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // If the URL already points somewhere specific (e.g., /admin), respect it
      if (url.startsWith(baseUrl) && url !== baseUrl && url !== `${baseUrl}/`) {
        return url
      }
      return `${baseUrl}/dashboard`
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.sub = user.id as string
        token.name = user.name
        token.email = user.email
        // @ts-ignore
        token.onboardingComplete = user.onboardingComplete
        // @ts-ignore
        token.activeProfile = user.activeProfile
        // @ts-ignore
        token.role = user.role
        // @ts-ignore
        token.image = user.image
        // @ts-ignore
        token.isBanned = user.isBanned
        // @ts-ignore
        token.suspendedUntil = user.suspendedUntil
      }

      if (trigger === "update" && session) {
        return { ...token, ...session }
      }

      return token
    },

    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub
        session.user.name = token.name as string
        session.user.email = token.email as string
        // @ts-ignore
        session.user.onboardingComplete = token.onboardingComplete as boolean
        // @ts-ignore
        session.user.activeProfile = token.activeProfile as "BUYER" | "SELLER"
        // @ts-ignore
        session.user.role = token.role as string
        // @ts-ignore
        session.user.image = token.image as string
        // @ts-ignore
        session.user.impersonatingFromId = token.impersonatingFromId as string | undefined
        // @ts-ignore
        session.user.isBanned = token.isBanned as boolean
        // @ts-ignore
        session.user.suspendedUntil = token.suspendedUntil as Date | null
      }
      return session
    }
  },
  pages: {
    signIn: "/signin",
  },
})