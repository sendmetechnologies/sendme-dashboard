"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { BidsPricingDetail } from "@/components/dashboard/bids-pricing-detail"
import {
  TrendingUp, TrendingDown, Search, Download, Plus, MoreHorizontal, Filter,
  ChevronLeft, ChevronRight, ChevronDown, Clock, AlertTriangle, CheckCircle,
  Eye, Star, DollarSign, Users, MapPin, FileText, Activity, Loader2, Lock
} from "lucide-react"

const topTabs = ["Bid Activity", "Price Control", "Route Pricing", "Overrides", "Pricing Logs"]

// ====== BID ACTIVITY (live from DB) ======

// ====== PRICE CONTROL ======
const priceControlStats = [
  { label: "Active Price Rules", value: "182", change: "↑ 14% vs last 30 days", up: true, icon: FileText, color: "text-sendme", bg: "bg-sendme-50" },
  { label: "States Configured", value: "31", change: "↑ 3 new", up: true, icon: MapPin, color: "text-sendme", bg: "bg-sendme-50" },
  { label: "Cities Configured", value: "86", change: "↑ 7 new", up: true, icon: MapPin, color: "text-sendme", bg: "bg-sendme-50" },
  { label: "Pending Changes", value: "7", change: "Requires approval", up: true, icon: Clock, color: "text-warning", bg: "bg-warning-light" },
  { label: "Active Overrides", value: "14", change: "Affecting prices", up: true, icon: AlertTriangle, color: "text-danger", bg: "bg-danger-light" },
]

const priceRules = [
  { id: "PR-1042", coverage: "Lagos + All Cities", coverageSub: "Intracity", vehicle: "Motorbike", item: "Small Item", base: "₦1,500", perKm: "₦250", min: "₦2,000", fee: "15%", status: "Active", statusColor: "bg-sendme-50 text-sendme", updated: "May 20, 2025" },
  { id: "PR-1043", coverage: "Abuja • Garki/Wuse", coverageSub: "Intracity", vehicle: "Car", item: "Medium Item", base: "₦2,800", perKm: "₦320", min: "₦3,500", fee: "15%", status: "Scheduled", statusColor: "bg-info-light text-info", updated: "May 20, 2025" },
  { id: "PR-1044", coverage: "Port Harcourt + All Cities", coverageSub: "Intracity", vehicle: "Pickup", item: "Bulk Item", base: "₦12,000", perKm: "₦550", min: "₦15,000", fee: "18%", status: "Active", statusColor: "bg-sendme-50 text-sendme", updated: "May 19, 2025" },
  { id: "PR-1045", coverage: "Lagos → Asaba", coverageSub: "Interstate", vehicle: "Truck (4-7 Tons)", item: "Bulk Item", base: "₦120,000", perKm: "₦1,500", min: "₦150,000", fee: "12%", status: "Active", statusColor: "bg-sendme-50 text-sendme", updated: "May 19, 2025" },
  { id: "PR-1046", coverage: "Ibadan + All Cities", coverageSub: "Intracity", vehicle: "Motorbike", item: "Small Item", base: "₦1,300", perKm: "₦230", min: "₦1,800", fee: "15%", status: "Draft", statusColor: "bg-surface-secondary text-text-muted", updated: "May 18, 2025" },
  { id: "PR-1047", coverage: "Lagos → Abuja", coverageSub: "Interstate", vehicle: "Truck (8-15 Tons)", item: "Bulk Item", base: "₦280,000", perKm: "₦1,800", min: "₦320,000", fee: "12%", status: "Active", statusColor: "bg-sendme-50 text-sendme", updated: "May 18, 2025" },
  { id: "PR-1048", coverage: "Kano + All Cities", coverageSub: "Intracity", vehicle: "Car", item: "Medium Item", base: "₦2,600", perKm: "₦300", min: "₦3,200", fee: "15%", status: "Active", statusColor: "bg-sendme-50 text-sendme", updated: "May 17, 2025" },
  { id: "PR-1049", coverage: "Enugu → Port Harcourt", coverageSub: "Interstate", vehicle: "Pickup", item: "Bulk Item", base: "₦90,000", perKm: "₦1,100", min: "₦110,000", fee: "12%", status: "Pending", statusColor: "bg-warning-light text-warning", updated: "May 17, 2025" },
]

// ====== ROUTE PRICING (live from DB) ======

// ====== OVERRIDES (live from DB) ======

// ====== PRICING LOGS (live from DB) ======

function BidActivityView({ onSelect }: { onSelect: (id: string) => void }) {
  const [activeTab, setActiveTab] = useState("All Bids")
  const [bids, setBids] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 })

  const tabFilterMap: Record<string, string> = {
    "All Bids": "all",
    "Open for Bids": "open",
    "Won": "won",
    "Lost": "lost",
    "Cancelled": "cancelled",
  }

  const fetchBids = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" })
      if (search) params.set("search", search)
      const statusKey = tabFilterMap[activeTab] || "all"
      if (statusKey !== "all") params.set("status", statusKey)
      const res = await fetch(`/api/dashboard/bids?${params}`)
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setBids(data.bids || [])
      setStats(data.stats || null)
      setPagination(data.pagination || { total: 0, totalPages: 1 })
    } catch {
      setBids([])
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [page, search, activeTab])

  useEffect(() => { fetchBids() }, [fetchBids])

  const handleTabChange = (tab: string) => { setActiveTab(tab); setPage(1) }
  const handleSearch = (v: string) => { setSearch(v); setPage(1) }

  const displayStats = stats ? [
    { label: "Total Bids Today", value: stats.totalBidsToday.toLocaleString(), icon: Users, color: "text-sendme", bg: "bg-sendme-50" },
    { label: "Orders Open for Bids", value: stats.openForBids.toLocaleString(), icon: FileText, color: "text-sendme", bg: "bg-sendme-50" },
    { label: "Avg. Winning Bid", value: `₦${stats.avgWinningBid.toLocaleString()}`, icon: DollarSign, color: "text-sendme", bg: "bg-sendme-50" },
    { label: "Bid Success Rate", value: `${stats.bidSuccessRate}%`, icon: TrendingUp, color: "text-sendme", bg: "bg-sendme-50" },
    { label: "Total Bids", value: stats.totalBids.toLocaleString(), icon: Activity, color: "text-sendme", bg: "bg-sendme-50" },
  ] : []

  const displayTabs = [
    { name: "All Bids", count: stats?.tabCounts.all || 0 },
    { name: "Open for Bids", count: stats?.tabCounts.open || 0 },
    { name: "Won", count: stats?.tabCounts.won || 0 },
    { name: "Lost", count: stats?.tabCounts.lost || 0 },
    { name: "Cancelled", count: stats?.tabCounts.cancelled || 0 },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {displayStats.map(s => { const I = s.icon; return (
          <Card key={s.label} className="p-3 min-w-0 overflow-hidden"><div className="flex items-start justify-between mb-1.5"><p className="text-[10px] text-text-muted truncate">{s.label}</p><div className={`p-1 rounded-lg ${s.bg} ${s.color} shrink-0`}><I size={14}/></div></div><p className="text-base lg:text-lg font-bold text-text-primary truncate">{s.value}</p></Card>
        )})}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[180px] flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-1.5"><Search size={12} className="text-text-muted"/><input value={search} onChange={e => handleSearch(e.target.value)} placeholder="Search by order ID, route or customer..." className="flex-1 text-[11px] placeholder:text-text-muted focus:outline-none bg-transparent"/></div>
      </div>
      <div className="flex items-center justify-between border-b border-border-light">
        <div className="flex gap-0 overflow-x-auto">{displayTabs.map(t => (
          <button key={t.name} onClick={() => handleTabChange(t.name)} className={`flex items-center gap-1 px-3 py-2 text-[11px] font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab===t.name?"border-sendme text-sendme":"border-transparent text-text-muted"}`}>{t.name}<span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${activeTab===t.name?"bg-sendme-50 text-sendme":"bg-surface-secondary text-text-muted"}`}>{t.count.toLocaleString()}</span></button>
        ))}</div>
      </div>
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={20} className="animate-spin text-sendme"/><p className="ml-2 text-[11px] text-text-muted">Loading bids...</p></div>
        ) : bids.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-text-muted"><Users size={28} className="mb-2 opacity-40"/><p className="text-[11px]">No bids found</p></div>
        ) : (
          <>
            <div className="overflow-x-auto"><table className="w-full"><thead><tr className="text-left text-[9px] text-text-muted font-semibold uppercase border-b border-border-light bg-surface-secondary/50">
              <th className="px-3 py-2">Order</th><th className="px-3 py-2">Route & Type</th><th className="px-3 py-2">Customer</th><th className="px-3 py-2">Highest Bid</th><th className="px-3 py-2">Winning Bid</th><th className="px-3 py-2">Bids</th><th className="px-3 py-2">Status</th><th className="px-3 py-2 text-right">Actions</th>
            </tr></thead><tbody>{bids.map((b: any) => (
              <tr key={b.id} onClick={() => onSelect(b.id)} className="border-b border-border-light last:border-0 hover:bg-surface-secondary/50 cursor-pointer">
                <td className="px-3 py-2.5"><p className="text-[11px] font-semibold text-text-primary">{b.shortId}</p><p className="text-[9px] text-text-muted">{b.time}</p></td>
                <td className="px-3 py-2.5"><p className="text-[11px] font-medium text-text-primary">{b.route}</p><p className="text-[9px] text-text-muted">{b.type}</p></td>
                <td className="px-3 py-2.5"><p className="text-[11px] font-medium text-text-primary">{b.customer}</p></td>
                <td className="px-3 py-2.5"><p className="text-[11px] font-semibold text-text-primary">{b.highestBid ? `₦${b.highestBid.toLocaleString()}` : "—"}</p>{b.highestBy !== "—" && <p className="text-[9px] text-text-muted">by {b.highestBy}</p>}</td>
                <td className="px-3 py-2.5"><p className={`text-[11px] font-semibold ${b.winningBid ? "text-sendme" : "text-text-muted"}`}>{b.winningBid ? `₦${b.winningBid.toLocaleString()}` : "—"}</p>{b.winner !== "—" && <p className="text-[9px] text-text-muted">{b.winner}</p>}</td>
                <td className="px-3 py-2.5"><p className="text-[11px] font-medium text-text-primary">{b.bidsCount}</p></td>
                <td className="px-3 py-2.5"><span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${b.statusColor}`}>{b.status}</span><p className="text-[9px] text-text-muted mt-0.5">{b.statusNote}</p></td>
                <td className="px-3 py-2.5 text-right"><button className="p-1 text-text-muted hover:text-text-primary"><Eye size={14}/></button></td>
              </tr>
            ))}</tbody></table></div>
            <div className="flex items-center justify-between px-3 py-2 border-t border-border-light">
              <p className="text-[10px] text-text-muted">Showing {((page-1)*20)+1} to {Math.min(page*20, pagination.total)} of {pagination.total.toLocaleString()} bids</p>
              <div className="flex items-center gap-1">
                <button disabled={page<=1} onClick={() => setPage(p=>p-1)} className="p-1 text-text-muted disabled:opacity-30"><ChevronLeft size={12}/></button>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const p = page <= 3 ? i+1 : page + i - 2
                  if (p < 1 || p > pagination.totalPages) return null
                  return <button key={p} onClick={() => setPage(p)} className={`w-6 h-6 rounded text-[10px] font-medium ${p===page?"bg-sendme text-white":"text-text-muted"}`}>{p}</button>
                })}
                <button disabled={page>=pagination.totalPages} onClick={() => setPage(p=>p+1)} className="p-1 text-text-muted disabled:opacity-30"><ChevronRight size={12}/></button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}

function PriceControlView({ onSelect }: { onSelect: (id: string) => void }) {
  const [states, setStates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingState, setEditingState] = useState<any>(null)
  const [form, setForm] = useState({
    state: '',
    label: '',
    base_fare: '',
    bicycle_per_km: '',
    motorcycle_per_km: '',
    car_per_km: '',
    truck_per_km: '',
    bicycle_per_min: '',
    motorcycle_per_min: '',
    car_per_min: '',
    truck_per_min: '',
    bicycle_min_fare: '',
    motorcycle_min_fare: '',
    car_min_fare: '',
    truck_min_fare: '',
  })

  const fetchStates = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/state-pricing')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setStates(data.states || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchStates() }, [fetchStates])

  const handleSave = async () => {
    try {
      const payload = {
        state: form.state,
        label: form.label,
        base_fare: form.base_fare ? Number(form.base_fare) : null,
        per_km: {
          bicycle: Number(form.bicycle_per_km) || 200,
          motorcycle: Number(form.motorcycle_per_km) || 300,
          car: Number(form.car_per_km) || 500,
          truck: Number(form.truck_per_km) || 1000,
        },
        per_minute: {
          bicycle: Number(form.bicycle_per_min) || null,
          motorcycle: Number(form.motorcycle_per_min) || null,
          car: Number(form.car_per_min) || null,
          truck: Number(form.truck_per_min) || null,
        },
        minimum_fare: {
          bicycle: Number(form.bicycle_min_fare) || null,
          motorcycle: Number(form.motorcycle_min_fare) || null,
          car: Number(form.car_min_fare) || null,
          truck: Number(form.truck_min_fare) || null,
        },
      }
      const method = editingState ? 'PUT' : 'POST'
      const res = await fetch('/api/admin/state-pricing', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setShowAddModal(false)
      setEditingState(null)
      setForm({ state: '', label: '', base_fare: '', bicycle_per_km: '', motorcycle_per_km: '', car_per_km: '', truck_per_km: '', bicycle_per_min: '', motorcycle_per_min: '', car_per_min: '', truck_per_min: '', bicycle_min_fare: '', motorcycle_min_fare: '', car_min_fare: '', truck_min_fare: '' })
      fetchStates()
    } catch (e: any) {
      alert('Error: ' + e.message)
    }
  }

  const handleToggleActive = async (state: string, currentActive: boolean) => {
    try {
      const res = await fetch('/api/admin/state-pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state, is_active: !currentActive }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      fetchStates()
    } catch (e: any) {
      alert('Error: ' + e.message)
    }
  }

  const handleDelete = async (state: string) => {
    if (!confirm(`Delete pricing for ${state}?`)) return
    try {
      const res = await fetch(`/api/admin/state-pricing?state=${encodeURIComponent(state)}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      fetchStates()
    } catch (e: any) {
      alert('Error: ' + e.message)
    }
  }

  const startEdit = (s: any) => {
    setEditingState(s)
    setForm({
      state: s.state,
      label: s.label,
      base_fare: s.base_fare?.toString() || '',
      bicycle_per_km: s.per_km?.bicycle?.toString() || '',
      motorcycle_per_km: s.per_km?.motorcycle?.toString() || '',
      car_per_km: s.per_km?.car?.toString() || '',
      truck_per_km: s.per_km?.truck?.toString() || '',
      bicycle_per_min: s.per_minute?.bicycle?.toString() || '',
      motorcycle_per_min: s.per_minute?.motorcycle?.toString() || '',
      car_per_min: s.per_minute?.car?.toString() || '',
      truck_per_min: s.per_minute?.truck?.toString() || '',
      bicycle_min_fare: s.minimum_fare?.bicycle?.toString() || '',
      motorcycle_min_fare: s.minimum_fare?.motorcycle?.toString() || '',
      car_min_fare: s.minimum_fare?.car?.toString() || '',
      truck_min_fare: s.minimum_fare?.truck?.toString() || '',
    })
    setShowAddModal(true)
  }

  const activeCount = states.filter(s => s.is_active).length

  // ─── Global (fallback) vehicle rates ──────────────────────────────────────
  const [globalConfig, setGlobalConfig] = useState<any>(null)
  const [globalLoading, setGlobalLoading] = useState(true)
  const [globalSaving, setGlobalSaving] = useState(false)
  const [globalSaved, setGlobalSaved] = useState(false)

  const fetchGlobalConfig = useCallback(async () => {
    try {
      setGlobalLoading(true)
      const res = await fetch('/api/admin/pricing-config')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setGlobalConfig(data.config)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setGlobalLoading(false)
    }
  }, [])

  useEffect(() => { fetchGlobalConfig() }, [fetchGlobalConfig])

  const updateGlobal = (path: string, value: string) => {
    setGlobalConfig((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev))
      const parts = path.split('.')
      let node = next
      for (let i = 0; i < parts.length - 1; i++) node = node[parts[i]]
      node[parts[parts.length - 1]] = value === '' ? '' : Number(value)
      return next
    })
  }

  const handleSaveGlobal = async () => {
    try {
      setGlobalSaving(true)
      const res = await fetch('/api/admin/pricing-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: globalConfig }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setGlobalSaved(true)
      setTimeout(() => setGlobalSaved(false), 2000)
    } catch (e: any) {
      alert('Error: ' + e.message)
    } finally {
      setGlobalSaving(false)
    }
  }

  const vehicles = [
    { key: 'bicycle', label: 'Bicycle' },
    { key: 'motorcycle', label: 'Motorcycle' },
    { key: 'car', label: 'Car' },
    { key: 'truck', label: 'Truck' },
  ]

  // ─── Haversine OTP gate ────────────────────────────────────────────────────
  const [otpPromptOpen, setOtpPromptOpen] = useState(false)
  const [haversineVerified, setHaversineVerified] = useState(false)
  const [otpInput, setOtpInput] = useState('')

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <Card className="p-3"><p className="text-[10px] text-text-muted">Total States</p><p className="text-lg font-bold text-text-primary">{states.length}</p></Card>
        <Card className="p-3"><p className="text-[10px] text-text-muted">Active States</p><p className="text-lg font-bold text-sendme">{activeCount}</p></Card>
        <Card className="p-3"><p className="text-[10px] text-text-muted">Inactive States</p><p className="text-lg font-bold text-text-muted">{states.length - activeCount}</p></Card>
        <Card className="p-3"><p className="text-[10px] text-text-muted">Default Fallback</p><p className="text-lg font-bold text-sendme">₦400/km</p><p className="text-[9px] text-text-muted">Motorcycle base</p></Card>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-text-muted">Per-kilometre rates by state. States without pricing use the global fallback.</p>
        <button onClick={() => { setEditingState(null); setForm({ state: '', label: '', base_fare: '', bicycle_per_km: '', motorcycle_per_km: '', car_per_km: '', truck_per_km: '', bicycle_per_min: '', motorcycle_per_min: '', car_per_min: '', truck_per_min: '', bicycle_min_fare: '', motorcycle_min_fare: '', car_min_fare: '', truck_min_fare: '' }); setShowAddModal(true) }} className="flex items-center gap-1.5 bg-sendme text-white px-3 py-1.5 rounded-lg text-[11px] font-semibold"><Plus size={14}/> Add State</button>
      </div>

      {loading ? (
        <Card className="p-8 text-center"><p className="text-sm text-text-muted">Loading state pricing...</p></Card>
      ) : error ? (
        <Card className="p-8 text-center"><p className="text-sm text-danger">{error}</p></Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[9px] text-text-muted font-semibold uppercase border-b border-border-light bg-surface-secondary/50">
                  <th className="px-3 py-2">State</th>
                  <th className="px-3 py-2">Label</th>
                  <th className="px-3 py-2">Bicycle/km</th>
                  <th className="px-3 py-2">Motorcycle/km</th>
                  <th className="px-3 py-2">Car/km</th>
                  <th className="px-3 py-2">Truck/km</th>
                  <th className="px-3 py-2">Base Fare</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {states.map((s) => (
                  <tr key={s.state} className="border-b border-border-light last:border-0 hover:bg-surface-secondary/50">
                    <td className="px-3 py-2.5"><p className="text-[11px] font-semibold text-sendme">{s.state}</p></td>
                    <td className="px-3 py-2.5"><p className="text-[11px] font-medium text-text-primary">{s.label}</p></td>
                    <td className="px-3 py-2.5"><p className="text-[11px] text-text-primary">₦{s.per_km?.bicycle || '—'}</p></td>
                    <td className="px-3 py-2.5"><p className="text-[11px] font-medium text-text-primary">₦{s.per_km?.motorcycle || '—'}</p></td>
                    <td className="px-3 py-2.5"><p className="text-[11px] text-text-primary">₦{s.per_km?.car || '—'}</p></td>
                    <td className="px-3 py-2.5"><p className="text-[11px] text-text-primary">₦{s.per_km?.truck || '—'}</p></td>
                    <td className="px-3 py-2.5"><p className="text-[11px] text-text-primary">{s.base_fare ? `₦${s.base_fare}` : '—'}</p></td>
                    <td className="px-3 py-2.5">
                      <button onClick={() => handleToggleActive(s.state, s.is_active)} className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${s.is_active ? 'bg-sendme-50 text-sendme' : 'bg-surface-secondary text-text-muted'}`}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => startEdit(s)} className="p-1 text-text-muted hover:text-sendme text-[10px]">Edit</button>
                        <button onClick={() => handleDelete(s.state)} className="p-1 text-text-muted hover:text-danger text-[10px]">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <Card className="w-full max-w-md p-6 space-y-4">
            <h3 className="text-sm font-bold text-text-primary">{editingState ? 'Edit State Pricing' : 'Add State Pricing'}</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-text-muted font-medium">State Key *</label>
                  <input disabled={!!editingState} value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} className="w-full mt-1 px-3 py-1.5 border border-border-default rounded-lg text-xs" placeholder="e.g. Lagos" />
                </div>
                <div>
                  <label className="text-[10px] text-text-muted font-medium">Display Label *</label>
                  <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} className="w-full mt-1 px-3 py-1.5 border border-border-default rounded-lg text-xs" placeholder="e.g. Lagos State" />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-text-muted font-medium">Base Fare (₦)</label>
                <input value={form.base_fare} onChange={e => setForm(f => ({ ...f, base_fare: e.target.value }))} className="w-full mt-1 px-3 py-1.5 border border-border-default rounded-lg text-xs" placeholder="e.g. 500" type="number" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-text-muted font-medium">Bicycle /km (₦)</label>
                  <input value={form.bicycle_per_km} onChange={e => setForm(f => ({ ...f, bicycle_per_km: e.target.value }))} className="w-full mt-1 px-3 py-1.5 border border-border-default rounded-lg text-xs" type="number" />
                </div>
                <div>
                  <label className="text-[10px] text-text-muted font-medium">Motorcycle /km (₦)</label>
                  <input value={form.motorcycle_per_km} onChange={e => setForm(f => ({ ...f, motorcycle_per_km: e.target.value }))} className="w-full mt-1 px-3 py-1.5 border border-border-default rounded-lg text-xs" type="number" />
                </div>
                <div>
                  <label className="text-[10px] text-text-muted font-medium">Car /km (₦)</label>
                  <input value={form.car_per_km} onChange={e => setForm(f => ({ ...f, car_per_km: e.target.value }))} className="w-full mt-1 px-3 py-1.5 border border-border-default rounded-lg text-xs" type="number" />
                </div>
                <div>
                  <label className="text-[10px] text-text-muted font-medium">Truck /km (₦)</label>
                  <input value={form.truck_per_km} onChange={e => setForm(f => ({ ...f, truck_per_km: e.target.value }))} className="w-full mt-1 px-3 py-1.5 border border-border-default rounded-lg text-xs" type="number" />
                </div>
              </div>
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide pt-1">Per-Minute Rate (₦/min)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-text-muted font-medium">Bicycle /min (₦)</label>
                  <input value={form.bicycle_per_min} onChange={e => setForm(f => ({ ...f, bicycle_per_min: e.target.value }))} className="w-full mt-1 px-3 py-1.5 border border-border-default rounded-lg text-xs" type="number" />
                </div>
                <div>
                  <label className="text-[10px] text-text-muted font-medium">Motorcycle /min (₦)</label>
                  <input value={form.motorcycle_per_min} onChange={e => setForm(f => ({ ...f, motorcycle_per_min: e.target.value }))} className="w-full mt-1 px-3 py-1.5 border border-border-default rounded-lg text-xs" type="number" />
                </div>
                <div>
                  <label className="text-[10px] text-text-muted font-medium">Car /min (₦)</label>
                  <input value={form.car_per_min} onChange={e => setForm(f => ({ ...f, car_per_min: e.target.value }))} className="w-full mt-1 px-3 py-1.5 border border-border-default rounded-lg text-xs" type="number" />
                </div>
                <div>
                  <label className="text-[10px] text-text-muted font-medium">Truck /min (₦)</label>
                  <input value={form.truck_per_min} onChange={e => setForm(f => ({ ...f, truck_per_min: e.target.value }))} className="w-full mt-1 px-3 py-1.5 border border-border-default rounded-lg text-xs" type="number" />
                </div>
              </div>
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide pt-1">Minimum Fare (₦)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-text-muted font-medium">Bicycle min (₦)</label>
                  <input value={form.bicycle_min_fare} onChange={e => setForm(f => ({ ...f, bicycle_min_fare: e.target.value }))} className="w-full mt-1 px-3 py-1.5 border border-border-default rounded-lg text-xs" type="number" />
                </div>
                <div>
                  <label className="text-[10px] text-text-muted font-medium">Motorcycle min (₦)</label>
                  <input value={form.motorcycle_min_fare} onChange={e => setForm(f => ({ ...f, motorcycle_min_fare: e.target.value }))} className="w-full mt-1 px-3 py-1.5 border border-border-default rounded-lg text-xs" type="number" />
                </div>
                <div>
                  <label className="text-[10px] text-text-muted font-medium">Car min (₦)</label>
                  <input value={form.car_min_fare} onChange={e => setForm(f => ({ ...f, car_min_fare: e.target.value }))} className="w-full mt-1 px-3 py-1.5 border border-border-default rounded-lg text-xs" type="number" />
                </div>
                <div>
                  <label className="text-[10px] text-text-muted font-medium">Truck min (₦)</label>
                  <input value={form.truck_min_fare} onChange={e => setForm(f => ({ ...f, truck_min_fare: e.target.value }))} className="w-full mt-1 px-3 py-1.5 border border-border-default rounded-lg text-xs" type="number" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => { setShowAddModal(false); setEditingState(null) }} className="px-3 py-1.5 text-[11px] font-medium border border-border-default rounded-lg">Cancel</button>
              <button onClick={handleSave} className="px-3 py-1.5 text-[11px] font-semibold bg-sendme text-white rounded-lg">{editingState ? 'Update' : 'Create'}</button>
            </div>
          </Card>
        </div>
      )}

      {/* Global (fallback) vehicle rates */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-text-primary">Global Vehicle Rates (Fallback)</h3>
            <p className="text-xs text-text-muted">Base rates used for states WITHOUT their own pricing. The app&apos;s fare engine layers per-state overrides on top of these.</p>
          </div>
          {globalSaved && <span className="text-[11px] font-medium text-sendme flex items-center gap-1"><CheckCircle size={12}/> Saved</span>}
        </div>

        {globalLoading || !globalConfig ? (
          <Card className="p-8 text-center"><p className="text-sm text-text-muted">Loading global pricing...</p></Card>
        ) : (
          <Card className="p-5 space-y-5">
            <div className="flex items-end gap-4 max-w-xs">
              <div className="flex-1">
                <label className="text-[10px] text-text-muted font-medium">Base Fare (₦)</label>
                <input value={globalConfig.baseFare} onChange={e => updateGlobal('baseFare', e.target.value)} className="w-full mt-1 px-3 py-1.5 border border-border-default rounded-lg text-xs" type="number" />
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-2">Per Kilometre (₦/km)</p>
              <div className="grid grid-cols-4 gap-3">
                {vehicles.map(v => (
                  <div key={v.key}>
                    <label className="text-[10px] text-text-muted font-medium">{v.label} /km</label>
                    <input value={globalConfig.perKm?.[v.key] ?? ''} onChange={e => updateGlobal(`perKm.${v.key}`, e.target.value)} className="w-full mt-1 px-3 py-1.5 border border-border-default rounded-lg text-xs" type="number" />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-2">Per Minute (₦/min)</p>
              <div className="grid grid-cols-4 gap-3">
                {vehicles.map(v => (
                  <div key={v.key}>
                    <label className="text-[10px] text-text-muted font-medium">{v.label} /min</label>
                    <input value={globalConfig.perMinute?.[v.key] ?? ''} onChange={e => updateGlobal(`perMinute.${v.key}`, e.target.value)} className="w-full mt-1 px-3 py-1.5 border border-border-default rounded-lg text-xs" type="number" />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-2">Minimum Fare (₦)</p>
              <div className="grid grid-cols-4 gap-3">
                {vehicles.map(v => (
                  <div key={v.key}>
                    <label className="text-[10px] text-text-muted font-medium">{v.label} min</label>
                    <input value={globalConfig.minimumFare?.[v.key] ?? ''} onChange={e => updateGlobal(`minimumFare.${v.key}`, e.target.value)} className="w-full mt-1 px-3 py-1.5 border border-border-default rounded-lg text-xs" type="number" />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-2">Vehicle Speed (km/h) — used for ETA</p>
              <div className="grid grid-cols-4 gap-3">
                {vehicles.map(v => (
                  <div key={v.key}>
                    <label className="text-[10px] text-text-muted font-medium">{v.label} km/h</label>
                    <input value={globalConfig.vehicleSpeedKmh?.[v.key] ?? ''} onChange={e => updateGlobal(`vehicleSpeedKmh.${v.key}`, e.target.value)} className="w-full mt-1 px-3 py-1.5 border border-border-default rounded-lg text-xs" type="number" />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-sm">
              <div>
                <label className="text-[10px] text-text-muted font-medium">Pickup Buffer (min)</label>
                <input value={globalConfig.pickupBufferMin ?? ''} onChange={e => updateGlobal('pickupBufferMin', e.target.value)} className="w-full mt-1 px-3 py-1.5 border border-border-default rounded-lg text-xs" type="number" />
              </div>
              <div>
                <label className="text-[10px] text-text-muted font-medium">Dropoff Buffer (min)</label>
                <input value={globalConfig.dropoffBufferMin ?? ''} onChange={e => updateGlobal('dropoffBufferMin', e.target.value)} className="w-full mt-1 px-3 py-1.5 border border-border-default rounded-lg text-xs" type="number" />
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-2">Urgency Multipliers</p>
              <div className="grid grid-cols-4 gap-3">
                {['normal', 'fast', 'immediate', 'express'].map(u => (
                  <div key={u}>
                    <label className="text-[10px] text-text-muted font-medium capitalize">{u}</label>
                    <input value={globalConfig.urgencyMultiplier?.[u] ?? ''} onChange={e => updateGlobal(`urgencyMultiplier.${u}`, e.target.value)} className="w-full mt-1 px-3 py-1.5 border border-border-default rounded-lg text-xs" type="number" step="0.1" />
                  </div>
                ))}
              </div>
            </div>

            <button onClick={handleSaveGlobal} disabled={globalSaving}
              className="flex items-center gap-2 px-4 py-2 bg-sendme text-white rounded-lg text-xs font-semibold hover:bg-sendme-dark transition-colors disabled:opacity-50">
              {globalSaving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              {globalSaving ? 'Saving...' : 'Save Global Rates'}
            </button>
          </Card>
        )}
      </div>

      {/* Haversine (Distance & ETA engine) — read-only, OTP-gated */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-text-primary">Haversine — Distance &amp; ETA Engine</h3>
            <p className="text-xs text-text-muted">How the app turns map points into distance and minutes. These values feed every fare quote.</p>
          </div>
          <button
            onClick={() => { setOtpPromptOpen(true); setHaversineVerified(false) }}
            className="flex items-center gap-1.5 border border-border-default rounded-lg px-3 py-1.5 text-[11px] font-semibold text-text-secondary hover:border-danger hover:text-danger transition-colors"
          >
            <Lock size={12} /> Edit (requires OTP)
          </button>
        </div>

        <Card className="p-5 space-y-5">
          {/* Warning banner */}
          <div className="flex items-start gap-2.5 bg-danger-light/60 border border-danger/20 rounded-lg p-3">
            <AlertTriangle size={16} className="text-danger shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-danger">Caution — read-only</p>
              <p className="text-[11px] text-text-secondary mt-0.5">
                These values power the distance and time estimate for EVERY order. Changing them alters all fares. Editing requires OTP verification.
              </p>
            </div>
          </div>

          {/* The maths */}
          <div className="bg-surface-secondary rounded-lg p-4 space-y-2">
            <p className="text-[11px] font-semibold text-text-primary">How it works</p>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              <span className="font-medium text-text-primary">Distance:</span> straight-line (haversine) distance between pickup and drop-off, then inflated by a road multiplier to approximate real roads — 1.45× under 2 km, down to 1.18× over 20 km.
            </p>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              <span className="font-medium text-text-primary">Minutes:</span> road distance ÷ vehicle speed, plus pickup and drop-off buffers.
            </p>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              <span className="font-medium text-text-primary">Formula:</span> minutes = (distance ÷ speed) × 60 + pickupBuffer + dropoffBuffer
            </p>
          </div>

          {/* Current values */}
          {globalConfig && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-2">Vehicle Speeds (km/h)</p>
                <div className="space-y-1.5">
                  {vehicles.map(v => (
                    <div key={v.key} className="flex items-center justify-between text-[11px]">
                      <span className="text-text-secondary">{v.label}</span>
                      <span className="font-semibold text-text-primary">{globalConfig.vehicleSpeedKmh?.[v.key] ?? '—'} km/h</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-2">ETA Buffers (min)</p>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-text-secondary">Pickup buffer</span>
                    <span className="font-semibold text-text-primary">{globalConfig.pickupBufferMin ?? '—'} min</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-text-secondary">Dropoff buffer</span>
                    <span className="font-semibold text-text-primary">{globalConfig.dropoffBufferMin ?? '—'} min</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* OTP prompt */}
          {otpPromptOpen && (
            <div className="border-t border-border-light pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-text-primary">
                  {haversineVerified ? 'Verified — editing unlocked (not yet persisted)' : 'Enter OTP to unlock editing'}
                </p>
                <button onClick={() => setOtpPromptOpen(false)} className="text-[10px] text-text-muted hover:text-text-primary">Cancel</button>
              </div>
              {!haversineVerified ? (
                <div className="flex items-center gap-2 max-w-xs">
                  <input
                    value={otpInput}
                    onChange={e => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="6-digit OTP"
                    className="flex-1 px-3 py-2 border border-border-default rounded-lg text-xs"
                    inputMode="numeric"
                    maxLength={6}
                  />
                  <button
                    onClick={() => {
                      // OTP verification placeholder — admin OTP flow can be wired here.
                      if (otpInput.length === 6) {
                        setHaversineVerified(true)
                        setOtpInput('')
                      } else {
                        alert('Enter the 6-digit OTP sent to your email.')
                      }
                    }}
                    className="px-3 py-2 bg-sendme text-white rounded-lg text-xs font-semibold"
                  >
                    Verify
                  </button>
                </div>
              ) : (
                <p className="text-[11px] text-sendme flex items-center gap-1"><CheckCircle size={12}/> Verified. Editing these requires a full admin OTP flow — wiring in progress.</p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function RoutePricingView({ onSelect }: { onSelect: (id: string) => void }) {
  const [routes, setRoutes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRoutes = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/route-pricing')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setRoutes(data.routes || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRoutes() }, [fetchRoutes])

  const activeRoutes = routes.filter(r => r.is_active)
  const interstateRoutes = routes.filter(r => r.route_type === 'interstate')
  const intracityRoutes = routes.filter(r => r.route_type === 'intracity')

  const routePricingStats = [
    { label: "Active Routes", value: activeRoutes.length.toString(), change: `${routes.length} total`, up: true, icon: MapPin, color: "text-sendme", bg: "bg-sendme-50" },
    { label: "Interstate Routes", value: interstateRoutes.length.toString(), change: routes.length ? `${Math.round(interstateRoutes.length/routes.length*100)}% of total` : "0%", up: true, icon: MapPin, color: "text-sendme", bg: "bg-sendme-50" },
    { label: "Intracity Routes", value: intracityRoutes.length.toString(), change: routes.length ? `${Math.round(intracityRoutes.length/routes.length*100)}% of total` : "0%", up: true, icon: MapPin, color: "text-sendme", bg: "bg-sendme-50" },
    { label: "Total Routes", value: routes.length.toString(), change: "All configured", up: true, icon: MapPin, color: "text-sendme", bg: "bg-sendme-50" },
    { label: "Inactive Routes", value: (routes.length - activeRoutes.length).toString(), change: "Disabled", up: false, icon: AlertTriangle, color: "text-danger", bg: "bg-danger-light" },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">{routePricingStats.map(s => { const I = s.icon; return (
        <Card key={s.label} className="p-3 min-w-0 overflow-hidden"><div className="flex items-start justify-between mb-1.5"><p className="text-[10px] text-text-muted truncate">{s.label}</p><div className={`p-1 rounded-lg ${s.bg} ${s.color} shrink-0`}><I size={14}/></div></div><p className="text-base lg:text-lg font-bold text-text-primary truncate">{s.value}</p><p className={`text-[9px] font-medium truncate ${s.up?"text-sendme":"text-danger"}`}>{s.change}</p></Card>
      )})}</div>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[180px] flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-1.5"><Search size={12} className="text-text-muted"/><input placeholder="Search by route, city, state or route ID..." className="flex-1 text-[11px] placeholder:text-text-muted focus:outline-none bg-transparent"/></div>
      </div>
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><Loader2 size={20} className="animate-spin mx-auto text-sendme"/><p className="text-[11px] text-text-muted mt-2">Loading routes...</p></div>
        ) : error ? (
          <div className="p-8 text-center"><AlertTriangle size={20} className="mx-auto text-danger"/><p className="text-[11px] text-danger mt-2">{error}</p></div>
        ) : routes.length === 0 ? (
          <div className="p-8 text-center"><MapPin size={20} className="mx-auto text-text-muted"/><p className="text-[11px] text-text-muted mt-2">No routes configured yet. Create your first route pricing.</p></div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full"><thead><tr className="text-left text-[9px] text-text-muted font-semibold uppercase border-b border-border-light bg-surface-secondary/50">
            <th className="px-3 py-2">Origin</th><th className="px-3 py-2">Destination</th><th className="px-3 py-2">Distance</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Duration</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Updated</th><th className="px-3 py-2 text-right">Actions</th>
          </tr></thead><tbody>{routes.map((r: any) => (
            <tr key={r.id} onClick={() => onSelect(r.id)} className="border-b border-border-light last:border-0 hover:bg-surface-secondary/50 cursor-pointer">
              <td className="px-3 py-2.5"><p className="text-[11px] font-semibold text-sendme">{r.origin_state}</p>{r.origin_city && <p className="text-[9px] text-text-muted">{r.origin_city}</p>}</td>
              <td className="px-3 py-2.5"><p className="text-[11px] font-medium text-text-primary">{r.destination_state}</p>{r.destination_city && <p className="text-[9px] text-text-muted">{r.destination_city}</p>}</td>
              <td className="px-3 py-2.5"><p className="text-[11px] font-medium text-text-primary">{r.distance_km ? `${r.distance_km} km` : "—"}</p></td>
              <td className="px-3 py-2.5"><span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${r.route_type === 'interstate' ? 'bg-info-light text-info' : 'bg-sendme-50 text-sendme'}`}>{r.route_type}</span></td>
              <td className="px-3 py-2.5"><p className="text-[11px] font-medium text-text-primary">{r.estimated_duration || "—"}</p></td>
              <td className="px-3 py-2.5"><span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${r.is_active ? 'bg-sendme-50 text-sendme' : 'bg-surface-secondary text-text-muted'}`}>{r.is_active ? 'Active' : 'Inactive'}</span></td>
              <td className="px-3 py-2.5"><p className="text-[10px] text-text-muted">{r.updated_at ? new Date(r.updated_at).toLocaleDateString() : "—"}</p></td>
              <td className="px-3 py-2.5 text-right"><button className="p-1 text-text-muted hover:text-text-primary"><MoreHorizontal size={14}/></button></td>
            </tr>
          ))}</tbody></table></div>
        )}
      </Card>
    </div>
  )
}

function OverridesView({ onSelect }: { onSelect: (id: string) => void }) {
  const [overrides, setOverrides] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOverrides = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/pricing-overrides')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setOverrides(data.overrides || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchOverrides() }, [fetchOverrides])

  const now = new Date()
  const activeOverrides = overrides.filter(o => o.is_active && (!o.end_date || new Date(o.end_date) > now))
  const scheduledOverrides = overrides.filter(o => o.is_active && o.start_date && new Date(o.start_date) > now)
  const expiredOverrides = overrides.filter(o => o.end_date && new Date(o.end_date) <= now)

  const overrideStats = [
    { label: "Total Overrides", value: overrides.length.toString(), change: "All time", up: true, icon: AlertTriangle, color: "text-sendme", bg: "bg-sendme-50" },
    { label: "Active Overrides", value: activeOverrides.length.toString(), change: "Currently in effect", up: true, icon: AlertTriangle, color: "text-sendme", bg: "bg-sendme-50" },
    { label: "Scheduled", value: scheduledOverrides.length.toString(), change: "Starts in future", up: true, icon: Clock, color: "text-sendme", bg: "bg-sendme-50" },
    { label: "Expired", value: expiredOverrides.length.toString(), change: "Past end date", up: false, icon: AlertTriangle, color: "text-danger", bg: "bg-danger-light" },
    { label: "With End Date", value: overrides.filter(o => o.end_date).length.toString(), change: "Auto-expire set", up: true, icon: Clock, color: "text-sendme", bg: "bg-sendme-50" },
  ]

  const formatAdjustment = (o: any) => {
    if (o.adjustment_type === 'percentage') return `${o.adjustment_value > 0 ? '+' : ''}${o.adjustment_value}%`
    return `${o.adjustment_value > 0 ? '+' : ''}₦${o.adjustment_value.toLocaleString()}`
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">{overrideStats.map(s => { const I = s.icon; return (
        <Card key={s.label} className="p-3 min-w-0 overflow-hidden"><div className="flex items-start justify-between mb-1.5"><p className="text-[10px] text-text-muted truncate">{s.label}</p><div className={`p-1 rounded-lg ${s.bg} ${s.color} shrink-0`}><I size={14}/></div></div><p className="text-base lg:text-lg font-bold text-text-primary truncate">{s.value}</p><p className={`text-[9px] font-medium truncate ${s.up?"text-sendme":"text-danger"}`}>{s.change}</p></Card>
      )})}</div>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[180px] flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-1.5"><Search size={12} className="text-text-muted"/><input placeholder="Search by override name, route, state or reason..." className="flex-1 text-[11px] placeholder:text-text-muted focus:outline-none bg-transparent"/></div>
      </div>
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><Loader2 size={20} className="animate-spin mx-auto text-sendme"/><p className="text-[11px] text-text-muted mt-2">Loading overrides...</p></div>
        ) : error ? (
          <div className="p-8 text-center"><AlertTriangle size={20} className="mx-auto text-danger"/><p className="text-[11px] text-danger mt-2">{error}</p></div>
        ) : overrides.length === 0 ? (
          <div className="p-8 text-center"><AlertTriangle size={20} className="mx-auto text-text-muted"/><p className="text-[11px] text-text-muted mt-2">No overrides configured yet. Create your first override.</p></div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full"><thead><tr className="text-left text-[9px] text-text-muted font-semibold uppercase border-b border-border-light bg-surface-secondary/50">
            <th className="px-3 py-2">Name</th><th className="px-3 py-2">Coverage</th><th className="px-3 py-2">Adjustment</th><th className="px-3 py-2">Applies To</th><th className="px-3 py-2">Duration</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Reason</th><th className="px-3 py-2 text-right">Actions</th>
          </tr></thead><tbody>{overrides.map((o: any) => {
            const isActive = o.is_active && (!o.end_date || new Date(o.end_date) > now)
            const isScheduled = o.is_active && o.start_date && new Date(o.start_date) > now
            return (
            <tr key={o.id} onClick={() => onSelect(o.id)} className="border-b border-border-light last:border-0 hover:bg-surface-secondary/50 cursor-pointer">
              <td className="px-3 py-2.5"><p className="text-[11px] font-medium text-text-primary">{o.override_name}</p></td>
              <td className="px-3 py-2.5"><p className="text-[11px] font-medium text-text-primary">{o.state || "All States"}{o.city ? ` → ${o.city}` : ""}</p>{o.vehicle_type && <p className="text-[9px] text-text-muted">{o.vehicle_type}</p>}</td>
              <td className="px-3 py-2.5"><p className={`text-[11px] font-semibold ${o.adjustment_value >= 0 ? 'text-sendme' : 'text-danger'}`}>{formatAdjustment(o)}</p><p className="text-[9px] text-text-muted">{o.adjustment_type}</p></td>
              <td className="px-3 py-2.5"><p className="text-[11px] font-medium text-text-primary">{(o.applies_to || []).join(", ") || "—"}</p></td>
              <td className="px-3 py-2.5"><p className="text-[10px] font-medium text-text-primary">{o.start_date ? new Date(o.start_date).toLocaleDateString() : "—"}</p>{o.end_date && <p className="text-[9px] text-text-muted">→ {new Date(o.end_date).toLocaleDateString()}</p>}</td>
              <td className="px-3 py-2.5"><span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-sendme-50 text-sendme' : isScheduled ? 'bg-info-light text-info' : 'bg-surface-secondary text-text-muted'}`}>{isActive ? 'Active' : isScheduled ? 'Scheduled' : 'Expired'}</span></td>
              <td className="px-3 py-2.5"><p className="text-[10px] text-text-primary max-w-[120px] truncate">{o.reason || "—"}</p></td>
              <td className="px-3 py-2.5 text-right"><button className="p-1 text-text-muted hover:text-text-primary"><MoreHorizontal size={14}/></button></td>
            </tr>
          )})}</tbody></table></div>
        )}
      </Card>
    </div>
  )
}

function PricingLogsView({ onSelect }: { onSelect: (id: string) => void }) {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/pricing-logs?limit=100')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setLogs(data.logs || [])
      setTotal(data.total || 0)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const today = new Date().toDateString()
  const todayLogs = logs.filter(l => new Date(l.created_at).toDateString() === today)

  const pricingLogStats = [
    { label: "Total Changes", value: total.toString(), change: "All logged changes", up: true, icon: FileText, color: "text-sendme", bg: "bg-sendme-50" },
    { label: "Changes Today", value: todayLogs.length.toString(), change: new Date().toLocaleDateString(), up: true, icon: Activity, color: "text-sendme", bg: "bg-sendme-50" },
    { label: "Price Control", value: logs.filter(l => l.module === 'state_pricing' || l.module === 'global_config').length.toString(), change: "Rule changes", up: true, icon: FileText, color: "text-sendme", bg: "bg-sendme-50" },
    { label: "Route Pricing", value: logs.filter(l => l.module === 'route_pricing').length.toString(), change: "Route changes", up: true, icon: MapPin, color: "text-sendme", bg: "bg-sendme-50" },
    { label: "Overrides", value: logs.filter(l => l.module === 'pricing_overrides').length.toString(), change: "Override changes", up: true, icon: AlertTriangle, color: "text-warning", bg: "bg-warning-light" },
  ]

  const formatTime = (ts: string) => {
    const d = new Date(ts)
    return `${d.toLocaleDateString()}\n${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  }

  const actionIcon = (action: string) => {
    if (action === 'create') return '➕'
    if (action === 'update') return '✏️'
    if (action === 'delete') return '🗑️'
    if (action.includes('override')) return '📋'
    return '🔄'
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">{pricingLogStats.map(s => { const I = s.icon; return (
        <Card key={s.label} className="p-3 min-w-0 overflow-hidden"><div className="flex items-start justify-between mb-1.5"><p className="text-[10px] text-text-muted truncate">{s.label}</p><div className={`p-1 rounded-lg ${s.bg} ${s.color} shrink-0`}><I size={14}/></div></div><p className="text-base lg:text-lg font-bold text-text-primary truncate">{s.value}</p><p className={`text-[9px] font-medium truncate ${s.up?"text-sendme":"text-danger"}`}>{s.change}</p></Card>
      )})}</div>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[180px] flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-1.5"><Search size={12} className="text-text-muted"/><input placeholder="Search by log ID, admin, rule ID, route or action..." className="flex-1 text-[11px] placeholder:text-text-muted focus:outline-none bg-transparent"/></div>
      </div>
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><Loader2 size={20} className="animate-spin mx-auto text-sendme"/><p className="text-[11px] text-text-muted mt-2">Loading logs...</p></div>
        ) : error ? (
          <div className="p-8 text-center"><AlertTriangle size={20} className="mx-auto text-danger"/><p className="text-[11px] text-danger mt-2">{error}</p></div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center"><FileText size={20} className="mx-auto text-text-muted"/><p className="text-[11px] text-text-muted mt-2">No pricing logs yet. Changes will appear here.</p></div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full"><thead><tr className="text-left text-[9px] text-text-muted font-semibold uppercase border-b border-border-light bg-surface-secondary/50">
            <th className="px-3 py-2">Action</th><th className="px-3 py-2">Module</th><th className="px-3 py-2">Previous</th><th className="px-3 py-2">New</th><th className="px-3 py-2">Changed By</th><th className="px-3 py-2">Reason</th><th className="px-3 py-2">Time</th>
          </tr></thead><tbody>{logs.map((l: any) => (
            <tr key={l.id} onClick={() => onSelect(l.id)} className="border-b border-border-light last:border-0 hover:bg-surface-secondary/50 cursor-pointer">
              <td className="px-3 py-2.5"><div className="flex items-center gap-1.5"><span className="text-sm">{actionIcon(l.action)}</span><div><p className="text-[11px] font-medium text-text-primary capitalize">{l.action}</p></div></div></td>
              <td className="px-3 py-2.5"><p className="text-[10px] font-medium text-text-primary capitalize">{l.module?.replace(/_/g, ' ')}</p></td>
              <td className="px-3 py-2.5"><p className="text-[10px] font-medium text-text-muted">{l.previous_value ? JSON.stringify(l.previous_value) : "—"}</p></td>
              <td className="px-3 py-2.5"><p className="text-[10px] font-semibold text-text-primary">{l.new_value ? JSON.stringify(l.new_value) : "—"}</p></td>
              <td className="px-3 py-2.5"><p className="text-[10px] font-medium text-text-primary">{l.changed_by_name || "—"}</p></td>
              <td className="px-3 py-2.5"><p className="text-[10px] text-text-primary max-w-[120px] truncate">{l.reason || "—"}</p></td>
              <td className="px-3 py-2.5"><p className="text-[9px] text-text-muted whitespace-pre-line">{formatTime(l.created_at)}</p></td>
            </tr>
          ))}</tbody></table></div>
        )}
      </Card>
    </div>
  )
}

export default function BidsPricingPage() {
  const [activeTopTab, setActiveTopTab] = useState("Bid Activity")
  const [selectedId, setSelectedId] = useState<string | null>("SM-20491")

  const detailType = activeTopTab === "Bid Activity" ? "bids" : activeTopTab === "Price Control" ? "price-control" : activeTopTab === "Route Pricing" ? "route-pricing" : activeTopTab === "Pricing Logs" ? "pricing-logs" : "overrides"

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4 p-4 lg:p-6 animate-in fade-in duration-500">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-text-primary">Bids & Pricing</h1>
              <p className="text-sm text-text-muted mt-0.5">{activeTopTab === "Bid Activity" ? "Monitor bid activity, control fares and manage pricing rules across locations and delivery types." : activeTopTab === "Price Control" ? "Set manual price rules across states, cities, vehicle types and delivery categories." : activeTopTab === "Route Pricing" ? "Manage pricing for specific pickup and dropoff routes across cities and states." : activeTopTab === "Overrides" ? "Create and manage temporary pricing overrides for states, routes and delivery conditions." : "Track every pricing change, override and adjustment made on the platform."}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-white border border-border-default rounded-lg px-3 py-2 text-xs font-medium"><span className="text-sendme">📍</span> Lagos, Nigeria</div>
              <button className="flex items-center gap-2 bg-sendme text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-sendme-dark transition-colors"><Plus size={16}/> {activeTopTab === "Bid Activity" ? "Create Price Override" : activeTopTab === "Price Control" ? "Create Price Rule" : activeTopTab === "Route Pricing" ? "Create Route Price" : activeTopTab === "Overrides" ? "Create Override" : "Export Logs"}</button>
            </div>
          </div>

          {/* Top Tabs */}
          <div className="flex gap-0 border-b border-border-light">
            {topTabs.map(t => (
              <button key={t} onClick={() => { setActiveTopTab(t); setSelectedId(null) }} className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${activeTopTab===t ? "border-sendme text-sendme" : "border-transparent text-text-muted hover:text-text-primary"}`}>{t}</button>
            ))}
          </div>

          {/* Content */}
          {activeTopTab === "Bid Activity" && <BidActivityView onSelect={setSelectedId} />}
          {activeTopTab === "Price Control" && <PriceControlView onSelect={setSelectedId} />}
          {activeTopTab === "Route Pricing" && <RoutePricingView onSelect={setSelectedId} />}
          {activeTopTab === "Overrides" && <OverridesView onSelect={setSelectedId} />}
          {activeTopTab === "Pricing Logs" && <PricingLogsView onSelect={setSelectedId} />}
        </div>
      </div>
      {selectedId && <BidsPricingDetail type={detailType} itemId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  )
}
