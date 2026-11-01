"use client"

import { useEffect, useState, useMemo } from "react";
import {
  TrendingUp,
  Users,
  ShoppingBag,
  CheckCircle2,
  DollarSign,
  Smartphone,
  Share2,
  RefreshCw,
  Search,
  ShieldCheck,
  Filter,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface MarketingStats {
  totalAppInstalls: number;
  totalRegistrations: number;
  totalCheckouts: number;
  totalPurchases: number;
  totalGrossRevenue: number;
  channels: {
    meta: number;
    tiktok: number;
    organic: number;
  };
  platforms: {
    android: number;
    ios: number;
  };
}

interface RedactedEvent {
  id: string;
  eventName: "LaunchApp" | "Registration" | "Checkout" | "Purchase" | string;
  channel: string;
  platform: "android" | "ios" | string;
  userName: string;
  userEmail: string;
  city: string;
  value: number;
  currency: string;
  orderId?: string;
  createdAt: string;
}

export default function MarketingDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MarketingStats | null>(null);
  const [events, setEvents] = useState<RedactedEvent[]>([]);
  const [filterEvent, setFilterEvent] = useState<string>("ALL");
  const [filterChannel, setFilterChannel] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/marketing/stats");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setStats(data.stats);
      setEvents(data.events || []);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 25 seconds for live ads monitoring
    const interval = setInterval(fetchData, 25000);
    return () => clearInterval(interval);
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (filterEvent !== "ALL" && ev.eventName !== filterEvent) return false;
      if (filterChannel !== "ALL") {
        if (filterChannel === "META" && !ev.channel.toLowerCase().includes("meta")) return false;
        if (filterChannel === "TIKTOK" && !ev.channel.toLowerCase().includes("tiktok")) return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesCity = ev.city.toLowerCase().includes(query);
        const matchesName = ev.userName.toLowerCase().includes(query);
        const matchesChannel = ev.channel.toLowerCase().includes(query);
        if (!matchesCity && !matchesName && !matchesChannel) return false;
      }
      return true;
    });
  }, [events, filterEvent, filterChannel, searchQuery]);

  const formatRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 60) return "Just now";
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      const diffDays = Math.floor(diffHr / 24);
      return `${diffDays}d ago`;
    } catch {
      return "Recently";
    }
  };

  const getEventBadge = (name: string) => {
    switch (name) {
      case "Registration":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Checkout":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Purchase":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Title & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-border-default shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-text-primary">Marketing & Ads Telemetry</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Tracking Active
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Real-time attribution and performance analytics from Meta (Facebook/Instagram) & TikTok Ads SDKs
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-[11px] text-text-muted">Updated {formatRelativeTime(lastRefreshed.toISOString())}</p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface-secondary hover:bg-slate-100 text-text-secondary border border-border-default transition-all"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-sendme" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* App Installs */}
        <div className="bg-white p-4 rounded-2xl border border-border-default shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted">App Opens & Installs</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Smartphone size={16} />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-text-primary">
              {stats?.totalAppInstalls.toLocaleString() || "—"}
            </p>
            <p className="text-[11px] text-emerald-600 mt-1 font-medium">Meta & TikTok SDK</p>
          </div>
        </div>

        {/* Registrations */}
        <div className="bg-white p-4 rounded-2xl border border-border-default shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted">Signups / Registrations</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-text-primary">
              {stats?.totalRegistrations.toLocaleString() || "—"}
            </p>
            <p className="text-[11px] text-purple-600 mt-1 font-medium">Completed onboarding</p>
          </div>
        </div>

        {/* Checkouts Initiated */}
        <div className="bg-white p-4 rounded-2xl border border-border-default shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted">Orders Initiated</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShoppingBag size={16} />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-text-primary">
              {stats?.totalCheckouts.toLocaleString() || "—"}
            </p>
            <p className="text-[11px] text-amber-600 mt-1 font-medium">Initiated checkout</p>
          </div>
        </div>

        {/* Deliveries Completed */}
        <div className="bg-white p-4 rounded-2xl border border-border-default shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted">Completed Trips</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-text-primary">
              {stats?.totalPurchases.toLocaleString() || "—"}
            </p>
            <p className="text-[11px] text-emerald-600 mt-1 font-medium">Delivered & paid</p>
          </div>
        </div>

        {/* Gross Revenue */}
        <div className="col-span-2 lg:col-span-1 bg-white p-4 rounded-2xl border border-border-default shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted">Gross Order Value</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-sendme">
              ₦{stats?.totalGrossRevenue ? Math.round(stats.totalGrossRevenue).toLocaleString() : "0"}
            </p>
            <p className="text-[11px] text-emerald-600 mt-1 font-medium">Tracked order volume</p>
          </div>
        </div>
      </div>

      {/* Funnel & Channel Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversion Funnel */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-border-default shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-text-primary">Ad Conversion Funnel</h2>
              <p className="text-xs text-text-muted">Progression from mobile ad app launch to paid delivery</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-surface-secondary text-text-secondary rounded-lg border border-border-default">
              Full Lifecycle
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2">
            {/* Step 1 */}
            <div className="p-3 bg-surface-secondary rounded-xl border border-border-default text-center">
              <p className="text-[11px] font-medium text-text-muted">1. App Open</p>
              <p className="text-lg font-bold text-text-primary mt-1">{stats?.totalAppInstalls || 0}</p>
              <span className="inline-block mt-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                100%
              </span>
            </div>

            {/* Step 2 */}
            <div className="p-3 bg-surface-secondary rounded-xl border border-border-default text-center">
              <p className="text-[11px] font-medium text-text-muted">2. Registration</p>
              <p className="text-lg font-bold text-text-primary mt-1">{stats?.totalRegistrations || 0}</p>
              <span className="inline-block mt-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                {stats?.totalAppInstalls
                  ? Math.round((stats.totalRegistrations / stats.totalAppInstalls) * 100)
                  : 0}
                %
              </span>
            </div>

            {/* Step 3 */}
            <div className="p-3 bg-surface-secondary rounded-xl border border-border-default text-center">
              <p className="text-[11px] font-medium text-text-muted">3. Checkout</p>
              <p className="text-lg font-bold text-text-primary mt-1">{stats?.totalCheckouts || 0}</p>
              <span className="inline-block mt-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                {stats?.totalRegistrations
                  ? Math.round((stats.totalCheckouts / stats.totalRegistrations) * 100)
                  : 0}
                %
              </span>
            </div>

            {/* Step 4 */}
            <div className="p-3 bg-surface-secondary rounded-xl border border-border-default text-center">
              <p className="text-[11px] font-medium text-text-muted">4. Purchase</p>
              <p className="text-lg font-bold text-sendme mt-1">{stats?.totalPurchases || 0}</p>
              <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                {stats?.totalCheckouts
                  ? Math.round((stats.totalPurchases / stats.totalCheckouts) * 100)
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>

        {/* Channels & OS Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-border-default shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-bold text-text-primary">Channel & OS Split</h2>
            <p className="text-xs text-text-muted">Attribution distribution</p>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Meta Ads (Facebook / Instagram)</span>
                <span>{stats?.channels.meta || 0} events</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      ((stats?.channels.meta || 0) / Math.max(1, events.length)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>TikTok Ads</span>
                <span>{stats?.channels.tiktok || 0} events</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-900 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      ((stats?.channels.tiktok || 0) / Math.max(1, events.length)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-border-default flex items-center justify-between text-xs text-text-secondary">
              <span>Android: <strong>{stats?.platforms.android || 0}</strong></span>
              <span>iOS: <strong>{stats?.platforms.ios || 0}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Heavily Redacted Live Event Log */}
      <div className="bg-white rounded-2xl border border-border-default shadow-xs overflow-hidden" id="stream">
        <div className="p-5 border-b border-border-default">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-text-primary">Heavily Redacted Marketing Logs</h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  PII Protected
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Customer names (<code className="bg-slate-100 px-1 rounded">Usm***</code>), emails (<code className="bg-slate-100 px-1 rounded">ibn***</code>), and locations are strictly masked for marketing compliance.
              </p>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Filter by city or channel..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-border-default bg-surface-secondary text-text-primary focus:outline-none focus:ring-1 focus:ring-sendme w-44"
                />
              </div>

              {/* Event filter */}
              <select
                value={filterEvent}
                onChange={(e) => setFilterEvent(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-border-default bg-surface-secondary text-text-primary focus:outline-none"
              >
                <option value="ALL">All Events</option>
                <option value="Registration">Registrations</option>
                <option value="Checkout">Checkouts</option>
                <option value="Purchase">Purchases</option>
              </select>

              {/* Channel filter */}
              <select
                value={filterChannel}
                onChange={(e) => setFilterChannel(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-border-default bg-surface-secondary text-text-primary focus:outline-none"
              >
                <option value="ALL">All Channels</option>
                <option value="META">Meta Ads</option>
                <option value="TIKTOK">TikTok Ads</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table of Events */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-secondary border-b border-border-default text-text-muted font-semibold">
              <tr>
                <th className="py-3 px-4">Event</th>
                <th className="py-3 px-4">Channel / Ad Source</th>
                <th className="py-3 px-4">Platform</th>
                <th className="py-3 px-4">Customer (Redacted)</th>
                <th className="py-3 px-4">Email (Redacted)</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4 text-right">Value (₦)</th>
                <th className="py-3 px-4 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default text-text-secondary">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-text-muted">
                    No marketing events match the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getEventBadge(
                          ev.eventName
                        )}`}
                      >
                        {ev.eventName}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-text-primary">
                      {ev.channel}
                    </td>
                    <td className="py-3 px-4 uppercase text-[10px] font-bold tracking-wider text-text-muted">
                      {ev.platform}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-text-primary">
                      {ev.userName}
                    </td>
                    <td className="py-3 px-4 font-mono text-text-muted">
                      {ev.userEmail}
                    </td>
                    <td className="py-3 px-4 font-medium text-text-primary">
                      {ev.city}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-text-primary">
                      {ev.value > 0 ? `₦${Math.round(ev.value).toLocaleString()}` : "—"}
                    </td>
                    <td className="py-3 px-4 text-right text-text-muted">
                      {formatRelativeTime(ev.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
