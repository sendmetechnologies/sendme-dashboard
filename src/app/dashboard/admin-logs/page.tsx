"use client"

import { useState, useEffect, useMemo } from "react"
import {
  ShieldCheck,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  ArrowUpDown,
  RefreshCw,
  Wallet,
  Key,
  Users,
  Building2,
  Car,
  AlertCircle,
  Receipt,
  Headphones,
  Settings,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Lock,
  FileText,
  X,
  Info,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { ACTION_TYPE_LABELS, CATEGORY_CONFIG, AdminActivityLog, ActionCategory } from "@/lib/admin-logger-types"

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AdminActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState({
    totalLogs: 0,
    financialActions: 0,
    logins: 0,
    moderationActions: 0,
    expensesLogged: 0,
    activeAdmins: [] as string[],
    archivedAdmins: [] as string[],
  })

  // Filters
  const [search, setSearch] = useState("")
  const [selectedAdmin, setSelectedAdmin] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedActionType, setSelectedActionType] = useState("all")
  const [timelineQuick, setTimelineQuick] = useState("all") // 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  // Inspect Modal
  const [selectedLog, setSelectedLog] = useState<AdminActivityLog | null>(null)

  // Fetch logs from API
  const fetchLogs = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const params = new URLSearchParams()
      if (selectedAdmin && selectedAdmin !== "all") params.append("admin", selectedAdmin)
      if (selectedCategory && selectedCategory !== "all") params.append("actionCategory", selectedCategory)
      if (selectedActionType && selectedActionType !== "all") params.append("actionType", selectedActionType)
      if (dateFrom) params.append("dateFrom", dateFrom)
      if (dateTo) params.append("dateTo", dateTo)
      if (search.trim()) params.append("search", search.trim())
      params.append("limit", "100")

      const res = await fetch(`/api/dashboard/admin-logs?${params.toString()}`)
      const data = await res.json()
      if (data.logs) {
        setLogs(data.logs)
        if (data.stats) setStats(data.stats)
      }
    } catch (err) {
      console.error("[AdminLogs] Fetch failed:", err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Handle timeline quick presets
  const handleTimelinePreset = (preset: string) => {
    setTimelineQuick(preset)
    const now = new Date()
    const todayStr = now.toISOString().slice(0, 10)

    if (preset === "all") {
      setDateFrom("")
      setDateTo("")
    } else if (preset === "today") {
      setDateFrom(todayStr)
      setDateTo(todayStr)
    } else if (preset === "yesterday") {
      const y = new Date(now)
      y.setDate(y.getDate() - 1)
      const yStr = y.toISOString().slice(0, 10)
      setDateFrom(yStr)
      setDateTo(yStr)
    } else if (preset === "week") {
      const w = new Date(now)
      w.setDate(w.getDate() - 7)
      setDateFrom(w.toISOString().slice(0, 10))
      setDateTo(todayStr)
    } else if (preset === "month") {
      const m = new Date(now)
      m.setDate(m.getDate() - 30)
      setDateFrom(m.toISOString().slice(0, 10))
      setDateTo(todayStr)
    }
  }

  const resetFilters = () => {
    setSearch("")
    setSelectedAdmin("all")
    setSelectedCategory("all")
    setSelectedActionType("all")
    setTimelineQuick("all")
    setDateFrom("")
    setDateTo("")
  }

  useEffect(() => {
    fetchLogs()
  }, [selectedAdmin, selectedCategory, selectedActionType, dateFrom, dateTo])

  // Trigger search on enter or debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs()
    }, 350)
    return () => clearTimeout(timer)
  }, [search])

  // Format date grouping helper
  const groupedLogsByDay = useMemo(() => {
    const groups: { [dateLabel: string]: AdminActivityLog[] } = {}
    const todayStr = new Date().toDateString()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toDateString()

    logs.forEach((log) => {
      const d = new Date(log.created_at)
      const dStr = d.toDateString()

      let label = ""
      if (dStr === todayStr) {
        label = `Today — ${d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
      } else if (dStr === yesterdayStr) {
        label = `Yesterday — ${d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
      } else {
        label = d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
      }

      if (!groups[label]) groups[label] = []
      groups[label].push(log)
    })

    return groups
  }, [logs])

  // Icon mapper
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "AUTH":
        return <Key size={14} className="text-indigo-600" />
      case "FINANCE":
        return <Wallet size={14} className="text-emerald-600" />
      case "DRIVERS":
        return <Users size={14} className="text-sky-600" />
      case "ORGANIZATIONS":
        return <Building2 size={14} className="text-purple-600" />
      case "VEHICLES":
        return <Car size={14} className="text-teal-600" />
      case "DISPUTES":
        return <AlertCircle size={14} className="text-amber-600" />
      case "EXPENSES":
        return <Receipt size={14} className="text-rose-600" />
      case "SUPPORT":
        return <Headphones size={14} className="text-emerald-700" />
      default:
        return <Settings size={14} className="text-slate-600" />
    }
  }

  // Format exact time e.g. "9:40 PM"
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString)
      return d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    } catch {
      return "—"
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sendme/10 border border-sendme/20 flex items-center justify-center text-sendme">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary">Admin Activity Audit Logs</h1>
              <p className="text-xs text-text-muted mt-0.5">
                Permanent, chronological audit ledger of admin operations, authentication, and financial overrides.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Immutability Seal */}
          <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/70 text-emerald-800 px-3 py-1.5 rounded-lg text-xs font-semibold">
            <Lock size={13} className="text-emerald-600" />
            <span>Immutable Ledger · Deletion Prohibited</span>
          </div>

          <button
            onClick={() => fetchLogs(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-border-default rounded-lg text-xs font-semibold text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors disabled:opacity-50 shadow-xs"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin text-sendme" : ""} />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="p-4 bg-white border border-border-light shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Total Logged Events
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <FileText size={15} />
            </div>
          </div>
          <p className="text-2xl font-bold text-text-primary mt-2">{stats.totalLogs.toLocaleString()}</p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-text-muted">
            <span className="text-sendme font-semibold">100% Captured</span>
            <span>· All admins audited</span>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-border-light shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Financial Actions
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-sendme">
              <Wallet size={15} />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">{stats.financialActions.toLocaleString()}</p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-text-muted">
            <span>Credits, debits & approved payouts</span>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-border-light shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Security & Logins
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Key size={15} />
            </div>
          </div>
          <p className="text-2xl font-bold text-indigo-700 mt-2">{stats.logins.toLocaleString()}</p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-text-muted">
            <span>2FA OTP authentications</span>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-border-light shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Moderation & Approvals
            </span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
              <CheckCircle2 size={15} />
            </div>
          </div>
          <p className="text-2xl font-bold text-sky-700 mt-2">{stats.moderationActions.toLocaleString()}</p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-text-muted">
            <span>KYC verifications & suspensions</span>
          </div>
        </Card>
      </div>

      {/* Robust Filter Bar */}
      <Card className="p-4 bg-white border border-border-default shadow-xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-border-light pb-2.5">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-sendme" />
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Robust Audit Filters
            </span>
            {(search ||
              selectedAdmin !== "all" ||
              selectedCategory !== "all" ||
              selectedActionType !== "all" ||
              timelineQuick !== "all" ||
              dateFrom ||
              dateTo) && (
              <span className="bg-sendme/10 text-sendme text-[10px] font-bold px-2 py-0.5 rounded-full">
                Filters Active
              </span>
            )}
          </div>

          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-[11px] font-semibold text-text-muted hover:text-danger transition-colors"
          >
            <RotateCcw size={12} />
            <span>Reset Filters</span>
          </button>
        </div>

        {/* Row 1: Search, Admin, Category, Action Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Keyword Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search admin, rider, org, reason, IP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-border-default rounded-lg focus:outline-none focus:border-sendme bg-surface-secondary/40"
            />
          </div>

          {/* Admin Selector */}
          <div>
            <select
              value={selectedAdmin}
              onChange={(e) => setSelectedAdmin(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-border-default rounded-lg focus:outline-none focus:border-sendme bg-white font-medium"
            >
              <option value="all">👤 All Administrators</option>
              {stats.activeAdmins?.map((adm) => (
                <option key={adm} value={adm}>
                  @{adm} (Active Admin)
                </option>
              ))}
              {stats.archivedAdmins?.map((adm) => (
                <option key={adm} value={adm}>
                  @{adm} (Deleted / Archived)
                </option>
              ))}
            </select>
          </div>

          {/* Action Category */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value)
                setSelectedActionType("all") // reset type on category change
              }}
              className="w-full px-3 py-2 text-xs border border-border-default rounded-lg focus:outline-none focus:border-sendme bg-white font-medium"
            >
              <option value="all">📂 All Categories</option>
              {Object.entries(CATEGORY_CONFIG).map(([key, conf]) => (
                <option key={key} value={key}>
                  {conf.label}
                </option>
              ))}
            </select>
          </div>

          {/* Action Type Dropdown */}
          <div>
            <select
              value={selectedActionType}
              onChange={(e) => setSelectedActionType(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-border-default rounded-lg focus:outline-none focus:border-sendme bg-white font-medium"
            >
              <option value="all">⚡ All Activity Types</option>
              {Object.entries(ACTION_TYPE_LABELS)
                .filter(([_, conf]) =>
                  selectedCategory === "all" ? true : conf.category === selectedCategory
                )
                .map(([typeKey, conf]) => (
                  <option key={typeKey} value={typeKey}>
                    {conf.label}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Row 2: Timeline Preset Buttons & Custom Date Pickers */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-border-light/60">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-semibold text-text-muted mr-1">Timeline:</span>
            {[
              { id: "all", label: "All Time" },
              { id: "today", label: "Today" },
              { id: "yesterday", label: "Yesterday" },
              { id: "week", label: "Last 7 Days" },
              { id: "month", label: "Last 30 Days" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handleTimelinePreset(p.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  timelineQuick === p.id
                    ? "bg-sendme text-white shadow-xs"
                    : "bg-surface-secondary text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-text-muted">From:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value)
                  setTimelineQuick("custom")
                }}
                className="px-2 py-1 text-[11px] border border-border-default rounded-md bg-white focus:outline-none focus:border-sendme font-mono"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-text-muted">To:</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value)
                  setTimelineQuick("custom")
                }}
                className="px-2 py-1 text-[11px] border border-border-default rounded-md bg-white focus:outline-none focus:border-sendme font-mono"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Main Timeline View */}
      <Card className="overflow-hidden border border-border-default shadow-xs bg-white">
        <div className="p-4 bg-surface-secondary/40 border-b border-border-light flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-sendme" />
            <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Chronological Audit Stream
            </h2>
            <span className="bg-white border border-border-light text-text-muted text-[10px] font-bold px-2 py-0.5 rounded-full">
              {logs.length} Logged Entries
            </span>
          </div>

          <span className="text-[11px] text-text-muted hidden sm:inline">
            Sorted newest first · Immutable timestamps
          </span>
        </div>

        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center">
            <RefreshCw size={24} className="animate-spin text-sendme mb-2" />
            <p className="text-xs text-text-muted font-medium">Loading verified audit trail...</p>
          </div>
        ) : Object.keys(groupedLogsByDay).length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-surface-secondary flex items-center justify-center text-text-muted mb-3">
              <FileText size={24} />
            </div>
            <h3 className="text-sm font-bold text-text-primary">No Admin Activities Found</h3>
            <p className="text-xs text-text-muted max-w-sm mt-1">
              No audit logs matched the selected filters. Try broadening your date range or clearing keyword search.
            </p>
            <button
              onClick={resetFilters}
              className="mt-3 text-xs font-semibold text-sendme hover:underline"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border-light">
            {Object.entries(groupedLogsByDay).map(([dayLabel, dayLogs]) => (
              <div key={dayLabel} className="space-y-0">
                {/* Day Header Banner */}
                <div className="sticky top-0 z-10 bg-surface-secondary/80 backdrop-blur-xs px-4 py-2 border-b border-t border-border-light flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar size={13} className="text-text-muted" />
                    <span className="text-xs font-bold text-text-primary tracking-tight">{dayLabel}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-text-muted bg-white border border-border-light/80 px-2 py-0.5 rounded-full">
                    {dayLogs.length} {dayLogs.length === 1 ? "activity" : "activities"}
                  </span>
                </div>

                {/* Day Entries List */}
                <div className="divide-y divide-border-light/60">
                  {dayLogs.map((log) => {
                    const catConfig =
                      CATEGORY_CONFIG[log.action_category as ActionCategory] || CATEGORY_CONFIG.SYSTEM
                    const actionLabel =
                      ACTION_TYPE_LABELS[log.action_type]?.label || log.action_type

                    return (
                      <div
                        key={log.id}
                        onClick={() => setSelectedLog(log)}
                        className="p-3.5 sm:px-4 hover:bg-surface-hover/60 transition-colors cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        {/* Left block: Time, Icon, Admin, Description */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {/* Time badge */}
                          <div className="w-16 shrink-0 pt-0.5 text-right font-mono text-[11px] font-semibold text-text-muted group-hover:text-text-primary transition-colors">
                            {formatTime(log.created_at)}
                          </div>

                          {/* Category Icon Badge */}
                          <div
                            className={`w-7 h-7 rounded-lg ${catConfig.badgeBg} flex items-center justify-center shrink-0 mt-0.5`}
                            title={catConfig.label}
                          >
                            {getCategoryIcon(log.action_category)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              {/* Admin performer tag */}
                              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                <User size={10} className="text-slate-500" />
                                @{log.admin_username}
                              </span>

                              {/* Action Type Badge */}
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${catConfig.badgeBg} ${catConfig.textColor}`}
                              >
                                {actionLabel}
                              </span>

                              {/* Amount Badge if financial */}
                              {log.amount !== undefined && log.amount !== null && (
                                <span className="text-[11px] font-bold text-danger font-mono bg-rose-50 px-2 py-0.5 rounded">
                                  ₦{Number(log.amount).toLocaleString()}
                                </span>
                              )}

                              {/* IP address if available */}
                              {log.ip_address && (
                                <span className="text-[10px] font-mono text-text-muted bg-surface-secondary px-1.5 py-0.5 rounded hidden md:inline">
                                  IP: {log.ip_address}
                                </span>
                              )}
                            </div>

                            {/* Readable Activity Description */}
                            <p className="text-xs font-medium text-text-primary leading-relaxed break-words">
                              {log.description}
                            </p>

                            {/* Reason or Extra Details if present */}
                            {log.reason && log.description !== log.reason && (
                              <p className="text-[11px] text-text-muted mt-1 italic">
                                Note / Reason: {log.reason}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right block: Target Entity & Inspect Arrow */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pl-19 sm:pl-0">
                          {log.target_name && (
                            <span className="text-[10px] font-medium text-text-secondary bg-surface-secondary/70 border border-border-light px-2.5 py-1 rounded-md truncate max-w-[170px]">
                              {log.target_name}
                            </span>
                          )}

                          <button
                            type="button"
                            className="text-[11px] font-semibold text-sendme hover:underline flex items-center gap-0.5"
                          >
                            <span>Inspect</span>
                            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Audit Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-border-default space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-border-light pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-sendme flex items-center justify-center">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">Audit Log Record Details</h3>
                  <p className="text-[11px] font-mono text-text-muted">ID: {selectedLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-surface-secondary transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Description Hero */}
            <div className="p-3.5 rounded-xl bg-surface-secondary/60 border border-border-light space-y-2">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                Activity Summary
              </span>
              <p className="text-xs font-semibold text-text-primary leading-relaxed">
                {selectedLog.description}
              </p>
            </div>

            {/* Key Field Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-white border border-border-light">
                <span className="text-[10px] text-text-muted uppercase font-semibold block mb-0.5">
                  Logged Administrator
                </span>
                <span className="font-bold text-text-primary">@{selectedLog.admin_username}</span>
                <p className="text-[10px] text-text-muted">DisplayName: {selectedLog.admin_display_name}</p>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-border-light">
                <span className="text-[10px] text-text-muted uppercase font-semibold block mb-0.5">
                  Action Category
                </span>
                <span className="font-bold text-text-primary">{selectedLog.action_category}</span>
                <p className="text-[10px] text-text-muted">{selectedLog.action_type}</p>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-border-light">
                <span className="text-[10px] text-text-muted uppercase font-semibold block mb-0.5">
                  Timestamp (UTC & Local)
                </span>
                <span className="font-bold text-text-primary font-mono text-[11px]">
                  {formatTime(selectedLog.created_at)}
                </span>
                <p className="text-[10px] text-text-muted font-mono">{selectedLog.created_at}</p>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-border-light">
                <span className="text-[10px] text-text-muted uppercase font-semibold block mb-0.5">
                  Network & IP
                </span>
                <span className="font-bold text-text-primary font-mono text-[11px]">
                  {selectedLog.ip_address || "127.0.0.1"}
                </span>
                <p className="text-[10px] text-text-muted">Verified Server Gateway</p>
              </div>
            </div>

            {/* Target Information */}
            {(selectedLog.target_name || selectedLog.target_id || selectedLog.amount) && (
              <div className="p-3 rounded-lg border border-border-light space-y-1.5 text-xs">
                <span className="text-[10px] text-text-muted uppercase font-semibold block">
                  Target Entity Details
                </span>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-text-secondary">
                    {selectedLog.target_type ? `Type: ${selectedLog.target_type}` : "Entity"}:
                  </span>
                  <span className="font-bold text-text-primary">{selectedLog.target_name || "—"}</span>
                </div>
                {selectedLog.amount !== undefined && selectedLog.amount !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Amount Processed:</span>
                    <span className="font-bold text-danger font-mono">
                      ₦{Number(selectedLog.amount).toLocaleString()}
                    </span>
                  </div>
                )}
                {selectedLog.reason && (
                  <div className="pt-1 border-t border-border-light text-[11px] text-text-secondary">
                    <strong>Reason / Note:</strong> {selectedLog.reason}
                  </div>
                )}
              </div>
            )}

            {/* Raw JSON Metadata Payload */}
            {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] text-text-muted uppercase font-semibold block">
                  Raw Event Metadata Payload
                </span>
                <pre className="p-3 rounded-lg bg-surface-secondary text-[11px] font-mono text-text-secondary overflow-x-auto max-h-36 border border-border-light">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}

            {/* Tamper-proof Security Footer */}
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/60 flex items-start gap-2.5 text-xs text-emerald-800">
              <Lock size={15} className="text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <strong>Immutable Audit Ledger Guarantee:</strong> This entry is stored with row-level security in
                PostgreSQL. In accordance with system security rules, log entries cannot be modified or deleted.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-white border border-border-default rounded-lg text-xs font-semibold text-text-primary hover:bg-surface-secondary transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
