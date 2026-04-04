"use client";

import { motion } from "framer-motion";
import { Settings, Palette, Globe, Bell, Radio, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "@/contexts/ThemeProvider";

function GlassCard({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className={`glass-panel p-6 ${className}`}
      style={{ animationDelay: `${delay}s`, animationFillMode: "both" }}
    >
      {children}
    </motion.div>
  );
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [network, setNetwork] = useState("Arc Mainnet");
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    setNetwork(localStorage.getItem("arc-network") || "Arc Mainnet");
    setNotifications(localStorage.getItem("arc-notif") !== "false");
  }, []);

  const saveNetwork = (v: string) => { setNetwork(v); localStorage.setItem("arc-network", v); };
  const saveNotif = (v: boolean) => { setNotifications(v); localStorage.setItem("arc-notif", String(v)); };

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-3"
      >
        <Settings className="h-8 w-8 text-indigo-400" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GlassCard delay={0.1}>
          <div className="flex items-center gap-3 mb-4">
            <Palette className="h-5 w-5 text-purple-400" />
            <h3 className="font-medium">Theme</h3>
          </div>
          <div className="flex gap-3">
            {["dark", "light"].map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t as "dark" | "light")}
                className={`flex-1 rounded-xl px-3 py-2 text-sm capitalize border transition-colors ${
                  theme === t
                    ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                    : "bg-white/5 border-white/10 text-gray-500 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard delay={0.15}>
          <div className="flex items-center gap-3 mb-4">
            <Globe className="h-5 w-5 text-indigo-400" />
            <h3 className="font-medium">Network</h3>
          </div>
          <select
            value={network}
            onChange={(e) => saveNetwork(e.target.value)}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none appearance-none cursor-pointer"
          >
            <option value="Arc Mainnet">Arc Mainnet</option>
            <option value="Arc Testnet">Arc Testnet</option>
          </select>
        </GlassCard>

        <GlassCard delay={0.2}>
          <div className="flex items-center gap-3 mb-4">
            <Bell className="h-5 w-5 text-amber-400" />
            <h3 className="font-medium">Notifications</h3>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Receive push notifications</span>
            <button
              onClick={() => saveNotif(!notifications)}
              className={`h-6 w-11 rounded-full transition-colors ${
                notifications ? "bg-indigo-500/50" : "bg-white/10"
              }`}
            >
              <div
                className={`h-5 w-5 rounded-full bg-white bg-white/5 backdrop-blur-md shadow-sm transition-transform ${
                  notifications ? "translate-x-5.5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </GlassCard>

        <GlassCard delay={0.25}>
          <div className="flex items-center gap-3 mb-4">
            <Radio className="h-5 w-5 text-emerald-400" />
            <h3 className="font-medium">RPC Configuration</h3>
          </div>
          <div className="flex flex-col gap-2 text-xs text-gray-600">
            <p>Configure custom RPC endpoints for advanced network access</p>
            <button className="mt-2 self-start rounded-xl bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/10 btn-micro">
              Edit RPC
            </button>
          </div>
        </GlassCard>

        <GlassCard delay={0.3}>
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-5 w-5 text-indigo-400" />
            <h3 className="font-medium">Security</h3>
          </div>
          <div className="flex flex-col gap-2">
            <button className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-left text-gray-400 btn-micro">
              Manage Recovery Phrase
            </button>
            <button className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-left text-gray-400 btn-micro">
              Wallet Lock Timeout
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
