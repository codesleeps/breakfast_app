import { Home, ChefHat, Settings, MessageSquare, ClipboardList, type LucideIcon } from "lucide-react";

export type NavLink = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const NAV_LINKS: NavLink[] = [
  { label: "Order Breakfast", href: "/", icon: Home },
  { label: "My Orders", href: "/my-orders", icon: ClipboardList },
  { label: "Kitchen Dashboard", href: "/kitchen", icon: ChefHat },
  { label: "Manage Menu", href: "/manage-menu", icon: Settings },
  { label: "Feedback", href: "/feedback", icon: MessageSquare },
];
