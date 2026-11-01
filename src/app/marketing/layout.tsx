"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MarketingSidebar } from "@/components/marketing/marketing-sidebar";
import { Loader2, Menu } from "lucide-react";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [admin, setAdmin] = useState<{ displayName: string; role: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => {
        if (res.status === 401) {
          router.push("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        setAdmin(data.admin || null);
        setChecking(false);
      })
      .catch(() => {
        router.push("/login");
      });
  }, [router]);

  if (checking) {
    return (
      <div className="h-screen bg-surface-secondary flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-sendme" />
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-surface-secondary">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <MarketingSidebar displayName={admin?.displayName} />
      </div>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white border-r border-border-default flex flex-col animate-in slide-in-from-left duration-200">
            <MarketingSidebar
              displayName={admin?.displayName}
              isMobile
              onCloseMobile={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Mobile Top Bar */}
        <header className="lg:hidden h-14 bg-white border-b border-border-default px-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-text-secondary hover:bg-surface-secondary"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sendme flex items-center justify-center text-white font-bold text-sm">
              S
            </div>
            <span className="font-semibold text-sm">Marketing Portal</span>
          </div>
          <div className="w-8" />
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
