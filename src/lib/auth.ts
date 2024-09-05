import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "./db";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Adapter } from "next-auth/adapters";
import { compare } from "bcrypt";

export const authOptions: NextAuthOptions = {
  pages: { signIn: "/sign-in" },
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET_KEY,
  providers: [
    GoogleProvider({
      clientId:
        process.env.GOOGLE_CLIENT_ID ||
        (() => {
          throw new Error("GOOGLE_ID is not defined");
        })(),
      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET ||
        (() => {
          throw new Error("GOOGLE_SECRET is not defined");
        })(),
    }),
    CredentialsProvider({
      // The name to display on the sign in form (e.g. "Sign in with...")
      name: "Credentials",

      credentials: {
        email: { label: "Email", type: "email", placeholder: "Email" },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Password",
        },
      },
      async authorize(credentials) {
        // Add logic here to look up the user from the credentials supplied

        // Check if credentials are provided
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const existingUser = await prisma.userReg.findUnique({
          where: { email: credentials.email },
        });
        if (!existingUser) {
          // Could not find a user with email in database
          return null;
        }
        // Email exists now check passwords match
        const checkPass = await compare(
          credentials.password,
          existingUser.password
        );
        if (!checkPass) {
          console.log("checking the passwords match");
          return null;
        }
        const ret = {
          id: `${existingUser.id}`,
          username: existingUser.username,
          email: existingUser.email,
        };
        console.log("here is what's getting returned: ", ret);
        return ret;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return { ...token, username: user.username };
      }
      return token;
    },
    async session({ session, token }) {
      console.log("Token: ", token);
      return {
        ...session,
        user: { ...session.user, username: token.username },
      };
    },
  },
};
