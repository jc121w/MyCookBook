import { auth } from "@/lib/auth";
import { Landing } from "@/components/Landing";
import { headers } from "next/headers";

// The home page: the pitch, with buttons that depend on whether you're signed in
export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  return <Landing signedIn={!!session} />;
}
