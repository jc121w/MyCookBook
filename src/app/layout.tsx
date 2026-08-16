import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/bars/Navbar";
import { Roboto_Mono } from "next/font/google";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Providers from "@/components/providers/Providers";
import SideBar from "@/components/bars/SideBar";
import { sideBarLinks } from "@/constants/navigation";
import Footer from "@/components/bars/Footer";
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
  const session = await auth.api.getSession({ headers: await headers() });
  return (
    <html lang="en">
      <body className={roboto_mono.className}>
        <Providers>
          <Navbar session={session} />

          <main className="mx-auto max-w-7xl p-6 px-8 md:px-20 2xl:max-w-[1536px]">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
