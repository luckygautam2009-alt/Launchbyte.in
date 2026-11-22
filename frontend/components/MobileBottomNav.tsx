"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Home,
  Briefcase,
  Calendar,
  MessageSquare,
  User,
  UsersRound,
} from "lucide-react";
import { clsx } from "clsx";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const items = [
    { label: "Home", href: "/", icon: Home },
    { label: "Explore", href: "/opportunities", icon: Briefcase },
    { label: "Events", href: "/events", icon: Calendar },
    { label: "Teams", href: "/teams", icon: UsersRound },
    {
      label: user ? "Profile" : "Log In",
      href: user ? "/profile/edit" : "/login",
      icon: user ? User : User,
    },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-slate-950/90 backdrop-blur-lg border-t border-slate-800/80 px-2 flex items-center justify-around select-none safe-area-pb"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 rounded-xl transition-colors duration-150",
              isActive
                ? "text-brand-400 font-semibold"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Icon className={clsx("w-5 h-5", isActive && "stroke-[2.4]")} />
            <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
