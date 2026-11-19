import { redirect } from "next/navigation";

// The landing page lives at "/" now; keep old /home links working
export default function HomeRedirect() {
  redirect("/");
}
