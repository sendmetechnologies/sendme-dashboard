"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { formatCardValue } from "@/lib/format"
import { OrganizationDetail } from "@/components/dashboard/org-detail"
import { OrganizationForm } from "@/components/dashboard/forms"
import { FilterSelect, StateFilter } from "@/components/dashboard/filters"
import { OtpUnlockModal } from "@/components/ui/otp-unlock-modal"
import { useKycUnlock } from "@/hooks/use-kyc-unlock"
import { usePageRefresh } from "@/hooks/use-page-refresh"
import {
  Building2, CheckCircle, Clock, AlertTriangle, Wallet,
  ChevronDown, Search, Download, Plus, ArrowUpDown, Filter, RotateCcw,
  ChevronLeft, ChevronRight, Loader2, DollarSign
} from "lucide-react"

interface OrgRow {
  id: string
  shortId: string
  name: string
  initials: string
  industry: string
  industryColor: string
  city: string
  state: string
  address: string
  contactName: string
  contactPhone: string
  contactEmail: string
  contactAvatar: string
  status: string
  statusColor: string
  verified: boolean
  orders: number
  totalSpend: number
  totalSpendFormatted: string
  drivers: number
  joined: string
  joinedNote: string
  logoUrl: string | null
}

const INDUSTRY_OPTIONS = [
  { value: "Logistics", label: "Logistics & Delivery" },
  { value: "Retail", label: "Retail & Supermarkets" },
  { value: "E-Commerce", label: "E-Commerce" },
  { value: "Manufacturing", label: "Manufacturing & FMCG" },
  { value: "Healthcare", label: "Healthcare & Pharmaceuticals" },
  { value: "Food & Beverage", label: "Food & Restaurants" },
  { value: "Corporate", label: "Corporate Services" },
]

export default function OrganizationsPage() {
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("All Organizations")
  const [isOrgFormOpen, setIsOrgFormOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [orgs, setOrgs] = useState<OrgRow[]>([])
  const [stats, setStats] = useState({ total: 0, verified: 0, pending: 0, suspended: 0, totalBalance: 0, totalBalanceFormatted: "₦0" })
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({})
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 })
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [stateFilter, setStateFilter] = useState("")
  const [industryFilter, setIndustryFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  
  const kyc = useKycUnlock()

  const fetchData = (page: number, search: string) => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("limit", "20")
    if (search) params.set("search", search)
    if (activeTab !== "All Organizations") {
      params.set("status", activeTab)
    } else if (statusFilter) {
      params.set("status", statusFilter)
    }
    if (stateFilter) params.set("state", stateFilter)
    if (industryFilter) params.set("industry", industryFilter)

    fetch(`/api/dashboard/organizations?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setOrgs(data.organizations || [])
        setStats(data.stats || { total: 0, verified: 0, pending: 0, suspended: 0, totalBalance: 0, totalBalanceFormatted: "₦0" })
        setTabCounts(data.tabCounts || {})
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchData(1, searchQuery)
  }, [activeTab, stateFilter, industryFilter, statusFilter])

  usePageRefresh(() => fetchData(pagination.page, searchQuery))

  const handleSearch = (q: string) => {
    setSearchQuery(q)
    fetchData(1, q)
  }

  const resetFilters = () => {
    setSearchQuery("")
    setStateFilter("")
    setIndustryFilter("")
    setStatusFilter("")
    setActiveTab("All Organizations")
  }

  const hasActiveFilters = Boolean(
    searchQuery || stateFilter || industryFilter || statusFilter || activeTab !== "All Organizations"
  )

  const handlePageChange = (page: number) => {
    fetchData(page, searchQuery)
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

  const statCards = [
    { label: "Total Organizations", value: stats.total, icon: Building2, color: "text-sendme", bg: "bg-sendme-50" },
    { label: "Verified", value: stats.verified, icon: CheckCircle, color: "text-sendme", bg: "bg-sendme-50" },
    { label: "Pending Review", value: stats.pending, icon: Clock, color: "text-warning", bg: "bg-warning-light" },
    { label: "Suspended", value: stats.suspended, icon: AlertTriangle, color: "text-danger", bg: "bg-danger-light" },
    { label: "Total Balance", value: stats.totalBalanceFormatted, icon: DollarSign, color: "text-sendme", bg: "bg-sendme-50" },
  ]

  const statusTabNames = ["All Organizations", "Verified", "Unverified", "Suspended"]

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-5 p-4 lg:p-6 animate-in fade-in duration-500">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-text-primary">Organizations & Fleets</h1>
              <p className="text-sm text-text-muted mt-0.5">Manage enterprise accounts, business verification, and fleet partners.</p>
            </div>
            <button
              onClick={() => setIsOrgFormOpen(true)}
              className="flex items-center gap-2 bg-sendme text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-sendme-dark transition-colors"
            >
              <Plus size={16} /> Add Organization
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {statCards.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.label} className="p-4 min-w-0 overflow-hidden">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-xs text-text-muted truncate">{stat.label}</p>
                    <div className={`p-1.5 rounded-lg ${stat.bg} ${stat.color} shrink-0`}>
                      <Icon size={16} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-text-primary mb-0.5 truncate" title={String(stat.value)}>
                    {formatCardValue(stat.value)}
                  </p>
                </Card>
              )
            })}
          </div>

          {/* Filters Bar */}
          <div className="bg-white border border-border-default rounded-xl p-3 shadow-xs space-y-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search Box */}
              <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-surface-secondary border border-border-default rounded-lg px-3 py-2">
                <Search size={14} className="text-text-muted shrink-0" />
                <input
                  type="text"
                  placeholder="Search organization, admin contact, email or ID..."
                  className="flex-1 text-xs text-text-primary placeholder:text-text-muted focus:outline-none bg-transparent"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                {searchQuery && (
                  <button onClick={() => handleSearch("")} className="text-xs text-text-muted hover:text-text-primary">✕</button>
                )}
              </div>

              {/* State Filter */}
              <StateFilter value={stateFilter} onChange={setStateFilter} />

              {/* Industry Filter */}
              <FilterSelect
                value={industryFilter}
                onChange={setIndustryFilter}
                placeholder="All Industries"
                options={INDUSTRY_OPTIONS}
              />

              {/* Status Filter */}
              <FilterSelect
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="Verification Status"
                options={[
                  { value: "Verified", label: "Verified" },
                  { value: "Unverified", label: "Unverified / Pending" },
                  { value: "Suspended", label: "Suspended" },
                ]}
              />
            </div>

            <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-border-light">
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="flex items-center gap-1.5 text-xs text-danger font-medium hover:underline px-2 py-1.5"
                  >
                    <RotateCcw size={12} /> Reset Filters
                  </button>
                )}
              </div>

              <button
                onClick={() => {
                  const csv = "data:text/csv;charset=utf-8," + ["Name,Industry,City,State,Contact,Email,Phone,Status,Orders,Spend,Drivers", ...orgs.map(o => `"${o.name}","${o.industry}","${o.city}","${o.state}","${o.contactName}","${o.contactEmail}","${o.contactPhone}","${o.status}","${o.orders}","${o.totalSpend}","${o.drivers}"`)].join("\n")
                  const uri = encodeURI(csv)
                  const link = document.createElement("a")
                  link.setAttribute("href", uri)
                  link.setAttribute("download", `sendme-organizations-${new Date().toISOString().slice(0, 10)}.csv`)
                  document.body.appendChild(link)
                  link.click()
                  link.remove()
                }}
                className="flex items-center gap-1.5 bg-white border border-border-default rounded-lg px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors"
              >
                <Download size={13} className="text-text-muted" /> Export CSV
              </button>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center justify-between border-b border-border-light">
            <div className="flex gap-0">
              {statusTabNames.map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab
                      ? "border-sendme text-sendme"
                      : "border-transparent text-text-muted hover:text-text-primary"
                  }`}
                >
                  {tab}
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    activeTab === tab ? "bg-sendme-50 text-sendme" : "bg-surface-secondary text-text-muted"
                  }`}>
                    {(tabCounts[tab] || 0).toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Organizations Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="h-48 flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-sendme" />
                </div>
              ) : orgs.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-text-muted">
                  <p className="text-sm font-medium">No organizations found matching your filter criteria</p>
                  {hasActiveFilters && (
                    <button onClick={resetFilters} className="mt-2 text-xs text-sendme underline font-semibold">
                      Clear all filters
                    </button>
                  )}
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] text-text-muted font-semibold uppercase tracking-wider border-b border-border-light bg-surface-secondary/50">
                      <th className="px-4 py-3 font-semibold">Organization <ArrowUpDown size={10} className="inline ml-1" /></th>
                      <th className="px-4 py-3 font-semibold">Industry</th>
                      <th className="px-4 py-3 font-semibold">City / State</th>
                      <th className="px-4 py-3 font-semibold">Contact Person</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Orders</th>
                      <th className="px-4 py-3 font-semibold">Total Spend</th>
                      <th className="px-4 py-3 font-semibold">Drivers</th>
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orgs.map((o) => (
                      <tr
                        key={o.id}
                        onClick={() => setSelectedOrg(o.id)}
                        className={`border-b border-border-light last:border-0 hover:bg-surface-secondary/50 transition-colors cursor-pointer ${
                          selectedOrg === o.id ? "bg-sendme-50/30" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-sendme-50 text-sendme font-bold flex items-center justify-center text-xs shrink-0">
                              {o.initials}
                            </div>
                            <div>
                              <p className="font-semibold text-xs text-text-primary leading-tight">{o.name}</p>
                              <p className="text-[10px] text-text-muted font-mono">{o.shortId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${o.industryColor}`}>
                            {o.industry}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-text-primary">
                          {o.city || o.state || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-text-primary">{o.contactName}</p>
                          <p className="text-[10px] text-text-muted font-mono">{o.contactPhone}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${o.statusColor}`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-text-primary">{o.orders}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-text-primary">{o.totalSpendFormatted}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-text-primary">{o.drivers}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedOrg(o.id)
                            }}
                            className="text-xs font-semibold text-sendme hover:underline"
                          >
                            Details →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {!loading && orgs.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border-light text-xs text-text-muted">
                <p>Showing page {pagination.page} of {pagination.totalPages} ({pagination.total.toLocaleString()} total)</p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                    className="p-1 rounded hover:bg-surface-hover disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                    className="p-1 rounded hover:bg-surface-hover disabled:opacity-40"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Organization Detail Drawer */}
      {selectedOrg && (
        <OrganizationDetail
          orgId={selectedOrg}
          onClose={() => setSelectedOrg(null)}
          kycLocked={!kyc.isUnlocked}
          onRequestUnlock={kyc.requestUnlock}
        />
      )}

      {/* Organization Form Modal */}
      {isOrgFormOpen && (
        <OrganizationForm
          isOpen={isOrgFormOpen}
          onClose={() => {
            setIsOrgFormOpen(false)
            fetchData(1, "")
          }}
        />
      )}

      {/* KYC Unlock Modal */}
      {kyc.otpOpen && (
        <OtpUnlockModal
          isOpen={kyc.otpOpen}
          onClose={kyc.closeOtp}
          onUnlocked={kyc.handleUnlocked}
        />
      )}
    </div>
  )
}
