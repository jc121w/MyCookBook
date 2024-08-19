import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import prisma from "./db";
import { PrismaAdapter } from "@auth/prisma-adapter";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
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
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  session: {
    strategy: "database", // Optional, defaults to 'jwt' if you don’t need database sessions
  },
  pages: {
    signIn: "/auth/signin",
  },
};
