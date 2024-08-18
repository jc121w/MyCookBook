import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import prisma from "./db";
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId:
        process.env.GOOGLE_ID ||
        (() => {
          throw new Error("GOOGLE_ID is not defined");
        })(),
      clientSecret:
        process.env.GOOGLE_SECRET ||
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
};
