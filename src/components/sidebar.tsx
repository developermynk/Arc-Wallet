"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  BarChart3,
  Settings,
  Shield,
  Zap,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Wallet, label: "Wallet", href: "/wallet" },
  { icon: ArrowLeftRight, label: "Swap", href: "/swap" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
];

const bottomItems = [
  { icon: Shield, label: "Security", href: "/security" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <motion.aside
      initial={{ x: -40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative z-10 flex w-[260px] shrink-0 flex-col justify-between border-r border-zinc-800 bg-zinc-950/95 p-4 backdrop-blur-xl"
    >
      <div>
        <motion.div
          className="mb-8 flex items-center gap-3 px-2"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 ring-1 ring-indigo-500/30">
            <Zap className="h-5 w-5 text-indigo-400" />
          </div>
          <span className="text-lg font-semibold tracking-wide text-white">
            Arc Wallet
          </span>
        </motion.div>

        <nav className="flex flex-col gap-1">
          {navItems.map((item, i) => (
            <NavLink key={item.label} item={item} index={i} active={item.href === pathname} />
          ))}
        </nav>
      </div>

      <nav className="flex flex-col gap-1">
        {bottomItems.map((item, i) => (
          <NavLink key={item.label} item={item} index={navItems.length + i} active={item.href === pathname} />
        ))}
      </nav>
    </motion.aside>
  );
}

function NavLink({
  item,
  index,
  active,
}: {
  item: (typeof navItems)[number];
  index: number;
  active: boolean;
}) {
  const Icon = item.icon;

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
    >
      <Link
        href={item.href}
        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
          active
            ? "bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20"
            : "text-zinc-400 hover:bg-surface-hover hover:text-zinc-200"
        }`}
      >
        <Icon className="h-[18px] w-[18px]" />
        <span>{item.label}</span>
      </Link>
    </motion.div>
  );
}
