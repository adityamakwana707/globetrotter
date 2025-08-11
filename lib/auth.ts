import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { getUserByEmail } from "@/lib/database"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Missing credentials")
          return null
        }

        try {
          console.log("🔍 Attempting to authenticate:", credentials.email)
          const user = await getUserByEmail(credentials.email)

          if (!user) {
            console.log("❌ User not found:", credentials.email)
            return null
          }

          // Check if email is verified
          if (!user.email_verified) {
            console.log("❌ Email not verified for:", credentials.email)
            return null
          }

          console.log("✅ User found:", user.email, "Role:", user.role)
          
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          console.log("🔑 Password validation result:", isPasswordValid)

          if (!isPasswordValid) {
            console.log("❌ Invalid password")
            return null
          }

          console.log("✅ Authentication successful for:", user.email)
          return {
            id: user.id,
            email: user.email,
            name: `${user.first_name} ${user.last_name}`,
            role: user.role || 'user',
          }
        } catch (error) {
          console.error("❌ Auth error:", error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
}
