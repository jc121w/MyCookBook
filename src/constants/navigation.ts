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
  needsSession: boolean;
};

export type SidebarProps = {
  session?: Session | null;
  links: SidebarLink[];
  drawerId: string;
};

export const sideBarLinks: SidebarLink[] = [
  {
    href: "/search",
    label: "Discover Recipes",
    icon: Search,
    needsSession: false,
  },
  { href: "/profile", label: "Profile", icon: User, needsSession: true },
  {
    href: "/library",
    label: "My Recipes",
    icon: UtensilsCrossed,
    needsSession: true,
  },
  { href: "/settings", label: "Settings", icon: Settings, needsSession: false },
];
