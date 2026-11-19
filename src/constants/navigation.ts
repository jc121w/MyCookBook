import { auth } from "@/lib/auth";
import {
  LucideIcon,
  Search,
  Settings,
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
  // Profile: reached from your avatar in the top-right, so it's not repeated here
  {
    href: "/library",
    label: "My Recipes",
    icon: UtensilsCrossed,
    needsSession: true,
  },
  // { href: "/settings", label: "Settings", icon: Settings, needsSession: false },
];
