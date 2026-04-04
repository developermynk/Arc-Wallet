"use client";

import { ArrowUpRight, ArrowDownLeft, Repeat, ArrowLeftRight } from "lucide-react";

const actions = [
  { label: "Send", icon: ArrowUpRight, key: "send" },
  { label: "Receive", icon: ArrowDownLeft, key: "receive" },
  { label: "Bridge", icon: Repeat, key: "bridge" },
  { label: "Swap", icon: ArrowLeftRight, key: "swap" },
] as const;

type ActionKey = (typeof actions)[number]["key"];

interface QuickActionsProps {
  onClick?: (action: ActionKey) => void;
  disabled?: boolean;
}

export function QuickActions({ onClick, disabled }: QuickActionsProps) {
  return (
    <div className="flex gap-2">
      {actions.map(({ label, icon: Icon }) => (
        <button
          key={label}
          disabled={disabled}
          onClick={() => onClick?.(label.toLowerCase() as ActionKey)}
          className="qa-btn group relative flex w-12 flex-col items-center gap-0.5 rounded-lg border border-white/10 bg-white/5 p-2 transition-all duration-200 hover:cursor-pointer hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white/5"
        >
          <span className="text-indigo-400 transition-colors duration-200 group-hover:text-indigo-300">
            <Icon size={14} />
          </span>
          <span className="text-[9px] font-medium tracking-wide text-zinc-600 transition-colors duration-200 dark:text-white/70 group-hover:text-zinc-800 dark:group-hover:text-white/90">
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}
