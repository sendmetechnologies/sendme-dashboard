"use client"

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  TrendingUp,
  Activity,
  Layers,
  LogOut,
  ShieldAlert,
  Smartphone,
  Sparkles,
} from "lucide-react";

interface MarketingSidebarProps {
  displayName?: string;
  isMobile?: boolean;
  onCloseMobile?: () => void;
}

export function MarketingSidebar({
  displayName = "Marketing Team",
  isMobile,
  onCloseMobile,
}: MarketingSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
    }
  };

  const navItems = [
    {
      name: "Growth Overview",
      href: "/marketing",
      icon: BarChart3,
    },
    {
      name: "Ad Events Stream",
      href: "/marketing#stream",
      icon: Activity,
    },
    {
      name: "Conversion Funnels",
      href: "/marketing#funnel",
      icon: Layers,
    },
    {
      name: "Meta & TikTok Channels",
      href: "/marketing#channels",
      icon: TrendingUp,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-border-default flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className="h-16 px-6 border-b border-border-default flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sendme flex items-center justify-center text-white font-bold text-lg shadow-sm">
            S
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base text-text-primary">SendMe</span>
              <span className="text-[10px] font-semibold bg-sendme-100 text-sendme px-1.5 py-0.5 rounded-full">
                Marketing
              </span>
            </div>
            <p className="text-[11px] text-text-muted">Ads & Growth Telemetry</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-text-muted uppercase">
          Campaign Analytics
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href === "/marketing" && pathname === "/marketing");

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sendme-50 text-sendme font-semibold"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-secondary"
              }`}
            >
              <Icon size={18} className={isActive ? "text-sendme" : "text-text-muted"} />
              <span>{item.name}</span>
            </Link>
          );
        })}

        {/* Integration notice */}
        <div className="mt-8 p-3.5 rounded-xl bg-surface-secondary border border-border-default space-y-2">
          <div className="flex items-center gap-2 text-text-primary text-xs font-semibold">
            <Sparkles size={14} className="text-sendme" />
            <span>Active SDK Tracking</span>
          </div>
          <div className="space-y-1 text-[11px] text-text-secondary">
            <div className="flex items-center justify-between">
              <span>Meta App Events</span>
              <span className="text-emerald-600 font-medium">● Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <span>TikTok Business SDK</span>
              <span className="text-emerald-600 font-medium">● Connected</span>
            </div>
          </div>
        </div>

        {/* Privacy badge */}
        <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200/60 flex items-start gap-2 text-[11px] text-amber-800">
          <ShieldAlert size={14} className="shrink-0 mt-0.5 text-amber-600" />
          <p>PII redacted. Only anonymized marketing logs & city locations are visible.</p>
        </div>
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-border-default">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-text-secondary font-semibold text-xs border border-border-default">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-text-primary truncate">{displayName}</p>
              <p className="text-[10px] text-text-muted">Marketing Portal</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="p-1.5 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
