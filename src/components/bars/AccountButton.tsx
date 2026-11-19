import Link from "next/link";
import { auth } from "@/lib/auth";
import { Avatar } from "../Avatar";

type Session = typeof auth.$Infer.Session;

// Top-right of the navbar. Signed in: your avatar, which takes you to your profile.
// Signed out: a Sign in button. (Sign out lives in the ☰ menu.)
export function AccountButton({ session }: { session: Session | null }) {
  if (!session) {
    return (
      <Link href="/sign-in" className="btn btn-primary btn-sm font-serif">
        Sign in
      </Link>
    );
  }

  const { name, image } = session.user;

  return (
    <Link
      href="/profile"
      aria-label="Your profile"
      title="Your profile"
      className="ring-base-300 hover:ring-primary/60 focus-visible:ring-primary ring-offset-base-100 rounded-full ring-2 ring-offset-2 transition-shadow"
    >
      <Avatar name={name} image={image} size={36} />
    </Link>
  );
}
