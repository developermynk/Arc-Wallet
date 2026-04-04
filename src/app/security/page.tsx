"use client";

import { motion } from "framer-motion";
import { Shield, Key, Eye, Lock, AlertTriangle, CheckCircle } from "lucide-react";

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
      className={`rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-6 ${className}`}
    >
      {children}
    </motion.div>
  );
}

export default function SecurityPage() {
  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-3"
      >
        <Shield className="h-8 w-8 text-indigo-400" />
        <h1 className="text-2xl font-bold">Security</h1>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GlassCard delay={0.1}>
          <div className="flex items-start gap-4">
            <div className="shrink-0 rounded-xl bg-emerald-500/10 p-3">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-medium">Wallet Status</h3>
              <p className="mt-1 text-sm text-gray-500">Connect wallet to check security status</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard delay={0.15}>
          <div className="flex items-start gap-4">
            <div className="shrink-0 rounded-xl bg-amber-500/10 p-3">
              <Key className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-medium">Private Keys</h3>
              <p className="mt-1 text-sm text-gray-500">Your keys never leave your device</p>
              <button className="mt-3 flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/10 btn-micro">
                <Eye className="h-3 w-3" />
                View Recovery Phrase
              </button>
            </div>
          </div>
        </GlassCard>

        <GlassCard delay={0.2} className="col-span-full lg:col-span-1">
          <div className="flex items-start gap-4">
            <div className="shrink-0 rounded-xl bg-indigo-500/10 p-3">
              <Lock className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-medium">Connection Security</h3>
              <p className="mt-1 text-sm text-gray-500">Manage approved & connected dApps</p>
              <p className="mt-2 text-xs text-gray-600">0 active connections</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard delay={0.25} className="col-span-full lg:col-span-1">
          <div className="flex items-start gap-4">
            <div className="shrink-0 rounded-xl bg-red-500/10 p-3">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <h3 className="font-medium">Risk Alerts</h3>
              <p className="mt-1 text-sm text-gray-500">No threats detected</p>
              <p className="mt-2 text-xs text-emerald-500 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                All clear
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
