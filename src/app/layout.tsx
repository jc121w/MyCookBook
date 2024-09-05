import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import Providers from "@/components//providers/Providers";
import { getServerSession } from "next-auth";
import SessionProvider from "@/components/providers/SessionProvider";
import { Roboto_Mono } from "next/font/google";
import { authOptions } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"] });
const roboto_mono = Roboto_Mono({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});
export const metadata: Metadata = {
  title: "MyCookBook",
  description:
    "An app to help users achieve their nutrition goals through an easy-to-use and organized recipe builder / meal planner.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en">
      <body className={roboto_mono.className}>
        <SessionProvider session={session}>
          <Providers>
            {" "}
            <Navbar />
            <div className="mx-auto h-full max-w-screen-xl px-8 md:px-20 2xl:max-w-screen-2xl">
              {children}
            </div>
          </Providers>{" "}
        </SessionProvider>
      </body>
    </html>
  );
}
