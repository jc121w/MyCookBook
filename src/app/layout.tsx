import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/bars/Navbar";
import { Roboto_Mono } from "next/font/google";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Providers from "@/components/providers/Providers";
import SideBar from "@/components/bars/SideBar";
import { sideBarLinks } from "@/constants/navigation";
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
          <div className="drawer mx-auto h-full lg:drawer-open">
            <input
              id="profile-drawer"
              type="checkbox"
              className="drawer-toggle"
            />
            <div className="drawer-content">
              {/* Mobile toggle button */}
              <nav className="navbar bg-base-300 lg:hidden">
                <label
                  htmlFor="profile-drawer"
                  className="btn btn-square btn-ghost"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </label>
              </nav>
              <main className="max-w-screen-xl p-6 px-8 md:px-20 2xl:max-w-screen-2xl">
                {children}
              </main>
            </div>

            <SideBar
              drawerId="profile-drawer"
              links={sideBarLinks}
              session={session}
            />
          </div>
        </Providers>
      </body>
    </html>
  );
}
