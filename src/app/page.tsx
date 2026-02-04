import { auth } from "@/lib/auth";
import { DownArrow } from "../../public/assets/down-arrow";
import { Search } from "lucide-react";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import LandingPage from "./home/page";
export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <main className="m-auto flex h-screen max-w-4xl flex-col items-center gap-10">
      <LandingPage />
    </main>
  );
}
