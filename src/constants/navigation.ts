import { auth } from "@/lib/auth";
import {
  LucideIcon,
  Search,
  Settings,
  User,
  UtensilsCrossed,
} from "lucide-react";
type Session = typeof auth.$Infer.Session;
type SidebarLink = {
  href: string;
  label: string;
  icon?: LucideIcon;
};

export type SidebarProps = {
  session?: Session | null;
  links: SidebarLink[];
  drawerId: string;
};

export const sideBarLinks: SidebarLink[] = [
  { href: "/search", label: "Find Recipe", icon: Search },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/library", label: "Library", icon: UtensilsCrossed },
  { href: "/profile/settings", label: "Settings", icon: Settings },
];
