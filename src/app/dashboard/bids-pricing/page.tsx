"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { BidsPricingDetail } from "@/components/dashboard/bids-pricing-detail"
import {
  TrendingUp, TrendingDown, Search, Download, Plus, MoreHorizontal, Filter,
  ChevronLeft, ChevronRight, ChevronDown, Clock, AlertTriangle, CheckCircle,
  Eye, Star, DollarSign, Users, MapPin, FileText, Activity
} from "lucide-react"

const topTabs = ["Bid Activity", "Price Control", "Route Pricing", "Overrides", "Pricing Logs"]

// ====== BID ACTIVITY ======
const bidStats = [
  { label: "Total Bids (Today)", value: "1,842", change: "↑ 16% vs yesterday", up: true, icon: Users, color: "text-sendme", bg: "bg-sendme-50" },
  { label: "Orders Open for Bids", value: "246", change: "↑ 12% vs yesterday", up: true, icon: FileText, color: "text-sendme", bg: "bg-sendme-50" },
  { label: "Avg. Winning Bid", value: "₦6,420", change: "↑ 8% vs yesterday", up: true, icon: DollarSign, color: "text-sendme", bg: "bg-sendme-50" },
  { label: "Bid Success Rate", value: "68.4%", change: "↑ 5% vs yesterday", up: true, icon: TrendingUp, color: "text-sendme", bg: "bg-sendme-50" },
  { label: "Manual Adjustments (Today)", value: "24", change: "↓ 11% vs yesterday", up: false, icon: Activity, color: "text-danger", bg: "bg-danger-light" },
]

const bidTabs = [
  { name: "All Bids", count: 1842, active: true },
  { name: "Open for Bids", count: 246 },
  { name: "Won", count: 942 },
  { name: "Lost", count: 638 },
  { name: "Cancelled", count: 16 },
]

const bids = [
  { id: "SM-20491", time: "Today, 10:24 AM", route: "Lekki → Ikeja", type: "Small Item • Motorbike", customer: "Collins Bassie", customerType: "Individual", highestBid: "₦6,800", highestBy: "Damilare A.", winningBid: "₦6,800", winner: "Damilare A.", bids: 7, status: "Won", statusNote: "Driver assigned", statusColor: "bg-sendme-50 text-sendme", timeLeft: "—" },
  { id: "SM-20492", time: "Today, 10:18 AM", route: "Ikate → Yaba", type: "Medium Item • Car", customer: "Peace Stores", customerType: "Organization", highestBid: "₦4,500", highestBy: "Chinedu O.", winningBid: "—", winner: "—", bids: 3, status: "Open for bids", statusNote: "3 bids received", statusColor: "bg-warning-light text-warning", timeLeft: "12m 45s" },
  { id: "SM-20493", time: "Today, 09:57 AM", route: "Surulere → Ajah", type: "Bulk • Truck (ST)", customer: "Starlight Logistics", customerType: "Organization", highestBid: "₦52,000", highestBy: "Emeka N.", winningBid: "₦52,000", winner: "Emeka N.", bids: 5, status: "Won", statusNote: "Driver assigned", statusColor: "bg-sendme-50 text-sendme", timeLeft: "—" },
  { id: "SM-20494", time: "Today, 09:45 AM", route: "Ikeja → Ogba", type: "Electronics • Car", customer: "Ada Okon", customerType: "Individual", highestBid: "₦8,000", highestBy: "Tosin A.", winningBid: "—", winner: "—", bids: 1, status: "Open for bids", statusNote: "1 bid received", statusColor: "bg-warning-light text-warning", timeLeft: "25m 12s" },
  { id: "SM-20495", time: "Today, 09:31 AM", route: "Victoria Island → Lekki", type: "Documents • Motorbike", customer: "QuickStore Ltd.", customerType: "Organization", highestBid: "₦2,200", highestBy: "Rashid L.", winningBid: "₦2,200", winner: "Rashid L.", bids: 4, status: "Won", statusNote: "Driver assigned", statusColor: "bg-sendme-50 text-sendme", timeLeft: "—" },
  { id: "SM-20496", time: "Today, 09:20 AM", route: "Garki → Wuse 2", type: "Small Item • Motorbike", customer: "Mercy Johnson", customerType: "Individual", highestBid: "₦3,100", highestBy: "Chinedu O.", winningBid: "₦3,100", winner: "Chinedu O.", bids: 6, status: "Won", statusNote: "Driver assigned", statusColor: "bg-sendme-50 text-sendme", timeLeft: "—" },
  { id: "SM-20497", time: "Today, 09:05 AM", route: "Asaba → Lagos", type: "Return Load • Truck (10T)", customer: "GreenBasket", customerType: "Organization", highestBid: "₦120,000", highestBy: "Emeka N.", winningBid: "₦120,000", winner: "Emeka N.", bids: 2, status: "Won", statusNote: "Driver assigned", statusColor: "bg-sendme-50 text-sendme", timeLeft: "—" },
  { id: "SM-20498", time: "Today, 08:50 AM", route: "Yaba → Surulere", type: "Small Item • Motorbike", customer: "Blessing Okafor", customerType: "Individual", highestBid: "₦2,500", highestBy: "Damilare A.", winningBid: "—", winner: "—", bids: 0, status: "Cancelled", statusNote: "Cancelled by customer", statusColor: "bg-surface-secondary text-text-muted", timeLeft: "—" },
]

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

// ====== ROUTE PRICING ======
const routePricingStats = [
  { label: "Active Routes", value: "68", change: "↑ 8 new this month", up: true, icon: MapPin, color: "text-sendme", bg: "bg-sendme-50" },
  { label: "Interstate Routes", value: "42", change: "62% of total", up: true, icon: MapPin, color: "text-sendme", bg: "bg-sendme-50" },
  { label: "Intracity Routes", value: "26", change: "38% of total", up: true, icon: MapPin, color: "text-sendme", bg: "bg-sendme-50" },
  { label: "Return Load Routes", value: "14", change: "20% of total", up: true, icon: MapPin, color: "text-sendme", bg: "bg-sendme-50" },
  { label: "Routes Needing Review", value: "5", change: "↓ 2 vs last month", up: false, icon: AlertTriangle, color: "text-danger", bg: "bg-danger-light" },
]

const routes = [
  { id: "RT-1001", route: "Lagos → Ibadan", routeSub: "Lagos State → Oyo State", distance: "136 km", type: "Interstate", typeColor: "bg-info-light text-info", vehicle: "Truck (4-7 Tons)", base: "₦85,000", perKm: "₦1,200", returnRate: "₦60,000", status: "Active", statusColor: "bg-sendme-50 text-sendme", updated: "May 20, 2025" },
  { id: "RT-1002", route: "Lagos → Abuja", routeSub: "Lagos State → FCT", distance: "524 km", type: "Interstate", typeColor: "bg-info-light text-info", vehicle: "Truck (4-7 Tons)", base: "₦180,000", perKm: "₦1,500", returnRate: "₦120,000", status: "Active", statusColor: "bg-sendme-50 text-sendme", updated: "May 19, 2025" },
  { id: "RT-1003", route: "Lagos → Port Harcourt", routeSub: "Lagos State → Rivers State", distance: "651 km", type: "Interstate", typeColor: "bg-info-light text-info", vehicle: "Truck (10-15 Tons)", base: "₦210,000", perKm: "₦1,600", returnRate: "₦150,000", status: "Active", statusColor: "bg-sendme-50 text-sendme", updated: "May 18, 2025" },
  { id: "RT-1004", route: "Lagos → Benin City", routeSub: "Lagos State → Edo State", distance: "320 km", type: "Interstate", typeColor: "bg-info-light text-info", vehicle: "Truck (4-7 Tons)", base: "₦110,000", perKm: "₦1,350", returnRate: "₦75,000", status: "Active", statusColor: "bg-sendme-50 text-sendme", updated: "May 18, 2025" },
  { id: "RT-1005", route: "Asaba → Lagos", routeSub: "Delta State → Lagos State", distance: "452 km", type: "Return Load", typeColor: "bg-warning-light text-warning", vehicle: "Truck (4-7 Tons)", base: "₦120,000", perKm: "₦1,450", returnRate: "₦90,000", status: "Active", statusColor: "bg-sendme-50 text-sendme", updated: "May 18, 2025" },
  { id: "RT-1006", route: "Ibadan → Lagos", routeSub: "Oyo State → Lagos State", distance: "136 km", type: "Interstate", typeColor: "bg-info-light text-info", vehicle: "Pickup", base: "₦28,000", perKm: "₦800", returnRate: "₦18,000", status: "Active", statusColor: "bg-sendme-50 text-sendme", updated: "May 17, 2025" },
  { id: "RT-1007", route: "Abuja → Kaduna", routeSub: "FCT → Kaduna State", distance: "176 km", type: "Interstate", typeColor: "bg-info-light text-info", vehicle: "Truck (4-7 Tons)", base: "₦70,000", perKm: "₦1,100", returnRate: "₦45,000", status: "Needs Review", statusColor: "bg-warning-light text-warning", updated: "May 17, 2025" },
  { id: "RT-1008", route: "Lekki → Ikeja", routeSub: "Lagos State → Lagos State", distance: "32 km", type: "Intracity", typeColor: "bg-sendme-50 text-sendme", vehicle: "Motorbike", base: "₦1,900", perKm: "₦280", returnRate: "—", status: "Active", statusColor: "bg-sendme-50 text-sendme", updated: "May 16, 2025" },
]

// ====== OVERRIDES ======
const overrideStats = [
  { label: "Active Overrides", value: "14", change: "↑ 27% vs last 30 days", up: true, icon: AlertTriangle, color: "text-sendme", bg: "bg-sendme-50" },
  { label: "Scheduled Overrides", value: "8", change: "Starts in future", up: true, icon: Clock, color: "text-sendme", bg: "bg-sendme-50" },
  { label: "Expiring Today", value: "3", change: "Ends within 24 hours", up: true, icon: AlertTriangle, color: "text-warning", bg: "bg-warning-light" },
  { label: "Awaiting Approval", value: "7", change: "Requires review", up: true, icon: Clock, color: "text-warning", bg: "bg-warning-light" },
  { label: "Completed Overrides", value: "96", change: "This month", up: true, icon: CheckCircle, color: "text-sendme", bg: "bg-sendme-50" },
]

const overrides = [
  { id: "OV-1024", name: "Fuel Price Adjustment", coverage: "Lagos State + All Cities", adjustment: "+ 8%", adjType: "Increase", adjColor: "text-sendme", appliesTo: "Base Fare & Per KM", appliesDetail: "All Vehicles", duration: "May 20 – May 31, 2025", durationDays: "11 days", status: "Active", statusColor: "bg-sendme-50 text-sendme", createdBy: "Admin", createdDate: "May 20" },
  { id: "OV-1023", name: "Christmas Interstate Surge", coverage: "Lagos → South East", adjustment: "+ 15%", adjType: "Increase", adjColor: "text-sendme", appliesTo: "Base Fare", appliesDetail: "Trucks & Pickups", duration: "Dec 15, 2025 – Jan 5, 2026", durationDays: "22 days", status: "Scheduled", statusColor: "bg-info-light text-info", createdBy: "John Paul", createdDate: "May 18" },
  { id: "OV-1022", name: "Return Load Promotion", coverage: "Asaba → Lagos", adjustment: "- 20%", adjType: "Discount", adjColor: "text-danger", appliesTo: "Base Fare", appliesDetail: "Trucks (4-7 Tons)", duration: "May 20 – Jun 10, 2025", durationDays: "22 days", status: "Active", statusColor: "bg-sendme-50 text-sendme", createdBy: "Admin", createdDate: "May 20" },
  { id: "OV-1021", name: "Rainy Season Adjustment", coverage: "Port Harcourt + All Cities", adjustment: "+ 12%", adjType: "Increase", adjColor: "text-sendme", appliesTo: "Per KM & Min. Fare", appliesDetail: "All Vehicles", duration: "May 15 – May 28, 2025", durationDays: "13 days", status: "Active", statusColor: "bg-sendme-50 text-sendme", createdBy: "Grace Idowu", createdDate: "May 15" },
  { id: "OV-1020", name: "Fuel Price Spike (North)", coverage: "Kano, Kaduna, Katsina", adjustment: "+ 10%", adjType: "Increase", adjColor: "text-sendme", appliesTo: "Base Fare & Per KM", appliesDetail: "All Vehicles", duration: "May 10 – May 25, 2025", durationDays: "15 days", status: "Completed", statusColor: "bg-surface-secondary text-text-muted", createdBy: "John Paul", createdDate: "May 10" },
  { id: "OV-1019", name: "Eid Holiday Surge", coverage: "Abuja + All Cities", adjustment: "+ 15%", adjType: "Increase", adjColor: "text-sendme", appliesTo: "Base Fare", appliesDetail: "All Vehicles", duration: "Apr 28 – May 5, 2025", durationDays: "7 days", status: "Completed", statusColor: "bg-surface-secondary text-text-muted", createdBy: "Admin", createdDate: "Apr 28" },
  { id: "OV-1018", name: "Low Supply Adjustment", coverage: "Ibadan + All Cities", adjustment: "+ 7%", adjType: "Increase", adjColor: "text-sendme", appliesTo: "Base Fare & Per KM", appliesDetail: "Motorbike, Car", duration: "May 12 – May 23, 2025", durationDays: "12 days", status: "Active", statusColor: "bg-sendme-50 text-sendme", createdBy: "Grace Idowu", createdDate: "May 12" },
  { id: "OV-1017", name: "Security Risk Adjustment", coverage: "Delta State + All Cities", adjustment: "+ 20%", adjType: "Increase", adjColor: "text-sendme", appliesTo: "Base Fare", appliesDetail: "Trucks & Pickups", duration: "May 5 – May 12, 2025", durationDays: "8 days", status: "Completed", statusColor: "bg-surface-secondary text-text-muted", createdBy: "Admin", createdDate: "May 5" },
]

// ====== PRICING LOGS ======
const pricingLogStats = [
  { label: "Total Changes", value: "1,248", change: "↑ 16% vs last 30 days", up: true, icon: FileText, color: "text-sendme", bg: "bg-sendme-50" },
  { label: "Changes Today", value: "32", change: "↑ 8 vs yesterday", up: true, icon: Activity, color: "text-sendme", bg: "bg-sendme-50" },
  { label: "Pending Approvals", value: "7", change: "Requires review", up: true, icon: Clock, color: "text-warning", bg: "bg-warning-light" },
  { label: "Reverted Changes", value: "12", change: "↓ 3 vs last 30 days", up: false, icon: AlertTriangle, color: "text-danger", bg: "bg-danger-light" },
  { label: "Admins Active", value: "9", change: "Made changes today", up: true, icon: Users, color: "text-sendme", bg: "bg-sendme-50" },
]

const pricingLogs = [
  { id: "PL-1248", action: "Update", actionDesc: "Base fare updated", actionColor: "bg-sendme-50 text-sendme", module: "Price Control", area: "Lagos → All Cities\nMotorbike + Small Item", prev: "₦1,300", new: "₦1,500", changedBy: "Admin", changedByRole: "Super Admin", reason: "Adjust for fuel price increase", time: "May 20, 2025\n10:24 AM", status: "Approved", statusColor: "bg-sendme-50 text-sendme" },
  { id: "PL-1247", action: "Create", actionDesc: "New price rule created", actionColor: "bg-sendme-50 text-sendme", module: "Price Control", area: "Abuja • Garki/Wuse\nCar + Medium Item", prev: "—", new: "₦2,800 / km", changedBy: "John Paul", changedByRole: "Ops Manager", reason: "New pricing for medium cars", time: "May 20, 2025\n09:15 AM", status: "Approved", statusColor: "bg-sendme-50 text-sendme" },
  { id: "PL-1246", action: "Override Created", actionDesc: "Temporary override", actionColor: "bg-warning-light text-warning", module: "Overrides", area: "Lagos → South East\nAll Vehicles", prev: "—", new: "+18%", changedBy: "Grace Idowu", changedByRole: "Pricing Analyst", reason: "Christmas period demand", time: "May 19, 2025\n04:40 PM", status: "Pending", statusColor: "bg-warning-light text-warning" },
  { id: "PL-1245", action: "Update", actionDesc: "Per KM rate updated", actionColor: "bg-sendme-50 text-sendme", module: "Route Pricing", area: "Lagos → Ibadan\nTruck (4-7 Tons)", prev: "₦1,000", new: "₦1,200", changedBy: "Admin", changedByRole: "Super Admin", reason: "Road condition adjustment", time: "May 19, 2025\n02:10 PM", status: "Approved", statusColor: "bg-sendme-50 text-sendme" },
  { id: "PL-1244", action: "Disable", actionDesc: "Rule disabled", actionColor: "bg-danger-light text-danger", module: "Price Control", area: "Port Harcourt + All Cities\nPickup + Bulk Item", prev: "Active", new: "Disabled", changedBy: "John Paul", changedByRole: "Ops Manager", reason: "Low demand suspension", time: "May 18, 2025\n11:33 AM", status: "Approved", statusColor: "bg-sendme-50 text-sendme" },
  { id: "PL-1243", action: "Override Ended", actionDesc: "Override expired", actionColor: "bg-surface-secondary text-text-muted", module: "Overrides", area: "Fuel Price Adjustment\nLagos State + All Vehicles", prev: "+12%", new: "0%", changedBy: "System", changedByRole: "Automated", reason: "Auto expired on May 18, 2025", time: "May 18, 2025\n12:00 AM", status: "Completed", statusColor: "bg-surface-secondary text-text-muted" },
  { id: "PL-1242", action: "Create", actionDesc: "Route pricing created", actionColor: "bg-sendme-50 text-sendme", module: "Route Pricing", area: "Asaba → Lagos\nTruck (8-15 Tons)", prev: "—", new: "₦120,000", changedBy: "Admin", changedByRole: "Super Admin", reason: "New return load route", time: "May 17, 2025\n03:45 PM", status: "Approved", statusColor: "bg-sendme-50 text-sendme" },
  { id: "PL-1241", action: "Update", actionDesc: "Platform fee updated", actionColor: "bg-sendme-50 text-sendme", module: "Price Control", area: "All States + All Cities\nAll Vehicles", prev: "12%", new: "15%", changedBy: "Grace Idowu", changedByRole: "Pricing Analyst", reason: "Operational cost increase", time: "May 17, 2025\n10:05 AM", status: "Approved", statusColor: "bg-sendme-50 text-sendme" },
  { id: "PL-1240", action: "Revert", actionDesc: "Change reverted", actionColor: "bg-danger-light text-danger", module: "Price Control", area: "Kano + All Cities\nCar + Medium Item", prev: "₦2,400", new: "₦2,100", changedBy: "Admin", changedByRole: "Super Admin", reason: "Reverted to previous stable price", time: "May 16, 2025\n05:20 PM", status: "Completed", statusColor: "bg-surface-secondary text-text-muted" },
  { id: "PL-1239", action: "Override Updated", actionDesc: "Override edited", actionColor: "bg-warning-light text-warning", module: "Overrides", area: "Rainy Season Adjustment\nRivers State + All Vehicles", prev: "+10%", new: "+12%", changedBy: "John Paul", changedByRole: "Ops Manager", reason: "Increased due to heavy rainfall", time: "May 16, 2025\n01:12 PM", status: "Approved", statusColor: "bg-sendme-50 text-sendme" },
]

function BidActivityView({ onSelect }: { onSelect: (id: string) => void }) {
  const [activeTab, setActiveTab] = useState("All Bids")
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-3">
        {bidStats.map(s => { const I = s.icon; return (
          <Card key={s.label} className="p-3 min-w-0 overflow-hidden"><div className="flex items-start justify-between mb-1.5"><p className="text-[10px] text-text-muted truncate">{s.label}</p><div className={`p-1 rounded-lg ${s.bg} ${s.color} shrink-0`}><I size={14}/></div></div><p className="text-base lg:text-lg font-bold text-text-primary truncate">{s.value}</p><p className={`text-[9px] font-medium truncate ${s.up?"text-sendme":"text-danger"}`}>{s.change}</p></Card>
        )})}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[180px] flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-1.5"><Search size={12} className="text-text-muted"/><input placeholder="Search by order ID, driver, route or customer..." className="flex-1 text-[11px] placeholder:text-text-muted focus:outline-none bg-transparent"/></div>
        <button className="flex items-center gap-1.5 bg-white border border-border-default rounded-lg px-2.5 py-1.5 text-[11px] font-medium">May 20, 2025 📅</button>
        <button className="flex items-center gap-1.5 bg-white border border-border-default rounded-lg px-2.5 py-1.5 text-[11px] font-medium">All Cities <ChevronDown size={12}/></button>
        <button className="flex items-center gap-1.5 bg-white border border-border-default rounded-lg px-2.5 py-1.5 text-[11px] font-medium">All Vehicle Types <ChevronDown size={12}/></button>
        <button className="flex items-center gap-1.5 bg-white border border-border-default rounded-lg px-2.5 py-1.5 text-[11px] font-medium">All Delivery Types <ChevronDown size={12}/></button>
        <button className="flex items-center gap-1 text-[11px] font-medium text-text-secondary"><Filter size={12}/> Filters</button>
      </div>
      <div className="flex items-center justify-between border-b border-border-light">
        <div className="flex gap-0">{bidTabs.map(t => (
          <button key={t.name} onClick={() => setActiveTab(t.name)} className={`flex items-center gap-1 px-3 py-2 text-[11px] font-medium border-b-2 transition-colors ${activeTab===t.name?"border-sendme text-sendme":"border-transparent text-text-muted"}`}>{t.name}<span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${activeTab===t.name?"bg-sendme-50 text-sendme":"bg-surface-secondary text-text-muted"}`}>{t.count.toLocaleString()}</span></button>
        ))}</div>
        <div className="flex items-center gap-2 pb-2"><button className="flex items-center gap-1 bg-white border border-border-default rounded-lg px-2.5 py-1 text-[11px] font-medium"><Download size={12}/> Export</button><button className="flex items-center gap-1 bg-white border border-border-default rounded-lg px-2.5 py-1 text-[11px] font-medium">Newest First <ChevronDown size={12}/></button></div>
      </div>
      <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full"><thead><tr className="text-left text-[9px] text-text-muted font-semibold uppercase border-b border-border-light bg-surface-secondary/50">
        <th className="px-3 py-2">Order</th><th className="px-3 py-2">Route & Type</th><th className="px-3 py-2">Customer</th><th className="px-3 py-2">Highest Bid</th><th className="px-3 py-2">Winning Bid</th><th className="px-3 py-2">Bids</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Time Left</th><th className="px-3 py-2 text-right">Actions</th>
      </tr></thead><tbody>{bids.map(b => (
        <tr key={b.id} onClick={() => onSelect(b.id)} className="border-b border-border-light last:border-0 hover:bg-surface-secondary/50 cursor-pointer">
          <td className="px-3 py-2.5"><p className="text-[11px] font-semibold text-text-primary">{b.id}</p><p className="text-[9px] text-text-muted">{b.time}</p></td>
          <td className="px-3 py-2.5"><p className="text-[11px] font-medium text-text-primary">{b.route}</p><p className="text-[9px] text-text-muted">{b.type}</p></td>
          <td className="px-3 py-2.5"><p className="text-[11px] font-medium text-text-primary">{b.customer}</p><p className="text-[9px] text-text-muted">{b.customerType}</p></td>
          <td className="px-3 py-2.5"><p className="text-[11px] font-semibold text-text-primary">{b.highestBid}</p><p className="text-[9px] text-text-muted">by {b.highestBy}</p></td>
          <td className="px-3 py-2.5"><p className={`text-[11px] font-semibold ${b.winningBid !== "—" ? "text-sendme" : "text-text-muted"}`}>{b.winningBid}</p>{b.winner !== "—" && <p className="text-[9px] text-text-muted">{b.winner}</p>}</td>
          <td className="px-3 py-2.5"><p className="text-[11px] font-medium text-text-primary">{b.bids}</p></td>
          <td className="px-3 py-2.5"><span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${b.statusColor}`}>{b.status}</span><p className="text-[9px] text-text-muted mt-0.5">{b.statusNote}</p></td>
          <td className="px-3 py-2.5"><p className={`text-[11px] font-medium ${b.timeLeft !== "—" ? "text-danger" : "text-text-muted"}`}>{b.timeLeft}</p></td>
          <td className="px-3 py-2.5 text-right"><button className="p-1 text-text-muted hover:text-text-primary"><MoreHorizontal size={14}/></button></td>
        </tr>
      ))}</tbody></table></div>
      <div className="flex items-center justify-between px-3 py-2 border-t border-border-light"><p className="text-[10px] text-text-muted">Showing 1 to 8 of 1,842 bids</p><div className="flex items-center gap-1"><button className="p-1 text-text-muted"><ChevronLeft size={12}/></button>{[1,2,3].map(p=><button key={p} className={`w-6 h-6 rounded text-[10px] font-medium ${p===1?"bg-sendme text-white":"text-text-muted"}`}>{p}</button>)}<span className="text-text-muted text-[10px]">...</span><button className="w-6 h-6 rounded text-[10px] font-medium text-text-muted">231</button><button className="p-1 text-text-muted"><ChevronRight size={12}/></button></div></div></Card>
    </div>
  )
}

function PriceControlView({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-3">{priceControlStats.map(s => { const I = s.icon; return (
        <Card key={s.label} className="p-3 min-w-0 overflow-hidden"><div className="flex items-start justify-between mb-1.5"><p className="text-[10px] text-text-muted truncate">{s.label}</p><div className={`p-1 rounded-lg ${s.bg} ${s.color} shrink-0`}><I size={14}/></div></div><p className="text-base lg:text-lg font-bold text-text-primary truncate">{s.value}</p><p className={`text-[9px] font-medium truncate ${s.up?"text-sendme":"text-danger"}`}>{s.change}</p></Card>
      )})}</div>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[180px] flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-1.5"><Search size={12} className="text-text-muted"/><input placeholder="Search by rule ID, state, city, vehicle type or delivery type..." className="flex-1 text-[11px] placeholder:text-text-muted focus:outline-none bg-transparent"/></div>
        <button className="flex items-center gap-1 bg-white border border-border-default rounded-lg px-2.5 py-1.5 text-[11px] font-medium">All States <ChevronDown size={12}/></button>
        <button className="flex items-center gap-1 bg-white border border-border-default rounded-lg px-2.5 py-1.5 text-[11px] font-medium">All Cities <ChevronDown size={12}/></button>
        <button className="flex items-center gap-1 bg-white border border-border-default rounded-lg px-2.5 py-1.5 text-[11px] font-medium">All Vehicle Types <ChevronDown size={12}/></button>
        <button className="flex items-center gap-1 bg-white border border-border-default rounded-lg px-2.5 py-1.5 text-[11px] font-medium">All Item Sizes <ChevronDown size={12}/></button>
        <button className="flex items-center gap-1 bg-white border border-border-default rounded-lg px-2.5 py-1.5 text-[11px] font-medium">All Delivery Types <ChevronDown size={12}/></button>
        <button className="flex items-center gap-1 text-[11px] font-medium text-text-secondary"><Filter size={12}/> Filters</button>
      </div>
      <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full"><thead><tr className="text-left text-[9px] text-text-muted font-semibold uppercase border-b border-border-light bg-surface-secondary/50">
        <th className="px-3 py-2">Rule ID</th><th className="px-3 py-2">Coverage</th><th className="px-3 py-2">Vehicle & Item</th><th className="px-3 py-2">Base Fare</th><th className="px-3 py-2">Per KM</th><th className="px-3 py-2">Min. Fare</th><th className="px-3 py-2">Service Fee</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Updated</th><th className="px-3 py-2 text-right">Actions</th>
      </tr></thead><tbody>{priceRules.map(r => (
        <tr key={r.id} onClick={() => onSelect(r.id)} className="border-b border-border-light last:border-0 hover:bg-surface-secondary/50 cursor-pointer">
          <td className="px-3 py-2.5"><p className="text-[11px] font-semibold text-sendme">{r.id}</p></td>
          <td className="px-3 py-2.5"><p className="text-[11px] font-medium text-text-primary">{r.coverage}</p><p className="text-[9px] text-text-muted">{r.coverageSub}</p></td>
          <td className="px-3 py-2.5"><p className="text-[11px] font-medium text-text-primary">{r.vehicle}</p><p className="text-[9px] text-text-muted">{r.item}</p></td>
          <td className="px-3 py-2.5"><p className="text-[11px] font-semibold text-text-primary">{r.base}</p></td>
          <td className="px-3 py-2.5"><p className="text-[11px] font-medium text-text-primary">{r.perKm}</p></td>
          <td className="px-3 py-2.5"><p className="text-[11px] font-medium text-text-primary">{r.min}</p></td>
          <td className="px-3 py-2.5"><p className="text-[11px] font-medium text-text-primary">{r.fee}</p></td>
          <td className="px-3 py-2.5"><span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${r.statusColor}`}>{r.status}</span></td>
          <td className="px-3 py-2.5"><p className="text-[10px] text-text-muted">{r.updated}</p></td>
          <td className="px-3 py-2.5 text-right"><button className="p-1 text-text-muted hover:text-text-primary"><MoreHorizontal size={14}/></button></td>
        </tr>
      ))}</tbody></table></div>
      <div className="flex items-center justify-between px-3 py-2 border-t border-border-light"><p className="text-[10px] text-text-muted">Showing 1 to 8 of 182 rules</p><div className="flex items-center gap-1"><button className="p-1 text-text-muted"><ChevronLeft size={12}/></button>{[1,2,3].map(p=><button key={p} className={`w-6 h-6 rounded text-[10px] font-medium ${p===1?"bg-sendme text-white":"text-text-muted"}`}>{p}</button>)}<span className="text-text-muted text-[10px]">...</span><button className="w-6 h-6 rounded text-[10px] font-medium text-text-muted">23</button><button className="p-1 text-text-muted"><ChevronRight size={12}/></button><span className="text-[10px] text-text-muted ml-2">8 / page</span><ChevronDown size={10} className="text-text-muted"/></div></div></Card>
    </div>
  )
}

function RoutePricingView({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-3">{routePricingStats.map(s => { const I = s.icon; return (
        <Card key={s.label} className="p-3 min-w-0 overflow-hidden"><div className="flex items-start justify-between mb-1.5"><p className="text-[10px] text-text-muted truncate">{s.label}</p><div className={`p-1 rounded-lg ${s.bg} ${s.color} shrink-0`}><I size={14}/></div></div><p className="text-base lg:text-lg font-bold text-text-primary truncate">{s.value}</p><p className={`text-[9px] font-medium truncate ${s.up?"text-sendme":"text-danger"}`}>{s.change}</p></Card>
      )})}</div>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[180px] flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-1.5"><Search size={12} className="text-text-muted"/><input placeholder="Search by route, city, state or route ID..." className="flex-1 text-[11px] placeholder:text-text-muted focus:outline-none bg-transparent"/></div>
        {["All States","All States","All","All","All"].map((l,i) => <button key={i} className="flex items-center gap-1 bg-white border border-border-default rounded-lg px-2.5 py-1.5 text-[11px] font-medium">{["Pickoff State","Dropoff State","Vehicle Type","Route Type","Status"][i]}: {l} <ChevronDown size={12}/></button>)}
        <button className="flex items-center gap-1 text-[11px] font-medium text-text-secondary"><Filter size={12}/> Filters</button>
      </div>
      <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full"><thead><tr className="text-left text-[9px] text-text-muted font-semibold uppercase border-b border-border-light bg-surface-secondary/50">
        <th className="px-3 py-2">Route ID</th><th className="px-3 py-2">Route</th><th className="px-3 py-2">Distance</th><th className="px-3 py-2">Route Type</th><th className="px-3 py-2">Vehicle Type</th><th className="px-3 py-2">Base Fare</th><th className="px-3 py-2">Per KM</th><th className="px-3 py-2">Return Load Rate</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Updated</th><th className="px-3 py-2 text-right">Actions</th>
      </tr></thead><tbody>{routes.map(r => (
        <tr key={r.id} onClick={() => onSelect(r.id)} className="border-b border-border-light last:border-0 hover:bg-surface-secondary/50 cursor-pointer">
          <td className="px-3 py-2.5"><p className="text-[11px] font-semibold text-sendme">{r.id}</p></td>
          <td className="px-3 py-2.5"><p className="text-[11px] font-medium text-text-primary">{r.route}</p><p className="text-[9px] text-text-muted">{r.routeSub}</p></td>
          <td className="px-3 py-2.5"><p className="text-[11px] font-medium text-text-primary">{r.distance}</p></td>
          <td className="px-3 py-2.5"><span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${r.typeColor}`}>{r.type}</span></td>
          <td className="px-3 py-2.5"><p className="text-[11px] font-medium text-text-primary">{r.vehicle}</p></td>
          <td className="px-3 py-2.5"><p className="text-[11px] font-semibold text-text-primary">{r.base}</p></td>
          <td className="px-3 py-2.5"><p className="text-[11px] font-medium text-text-primary">{r.perKm}</p></td>
          <td className="px-3 py-2.5"><p className="text-[11px] font-medium text-text-primary">{r.returnRate}</p></td>
          <td className="px-3 py-2.5"><span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${r.statusColor}`}>{r.status}</span></td>
          <td className="px-3 py-2.5"><p className="text-[10px] text-text-muted">{r.updated}</p></td>
          <td className="px-3 py-2.5 text-right"><button className="p-1 text-text-muted hover:text-text-primary"><MoreHorizontal size={14}/></button></td>
        </tr>
      ))}</tbody></table></div>
      <div className="flex items-center justify-between px-3 py-2 border-t border-border-light"><p className="text-[10px] text-text-muted">Showing 1 to 8 of 68 routes</p><div className="flex items-center gap-1"><button className="p-1 text-text-muted"><ChevronLeft size={12}/></button>{[1,2,3].map(p=><button key={p} className={`w-6 h-6 rounded text-[10px] font-medium ${p===1?"bg-sendme text-white":"text-text-muted"}`}>{p}</button>)}<span className="text-text-muted text-[10px]">...</span><button className="w-6 h-6 rounded text-[10px] font-medium text-text-muted">9</button><button className="p-1 text-text-muted"><ChevronRight size={12}/></button><span className="text-[10px] text-text-muted ml-2">8 / page</span><ChevronDown size={10} className="text-text-muted"/></div></div></Card>
    </div>
  )
}

function OverridesView({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-3">{overrideStats.map(s => { const I = s.icon; return (
        <Card key={s.label} className="p-3 min-w-0 overflow-hidden"><div className="flex items-start justify-between mb-1.5"><p className="text-[10px] text-text-muted truncate">{s.label}</p><div className={`p-1 rounded-lg ${s.bg} ${s.color} shrink-0`}><I size={14}/></div></div><p className="text-base lg:text-lg font-bold text-text-primary truncate">{s.value}</p><p className={`text-[9px] font-medium truncate ${s.up?"text-sendme":"text-danger"}`}>{s.change}</p></Card>
      )})}</div>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[180px] flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-1.5"><Search size={12} className="text-text-muted"/><input placeholder="Search by override name, route, state or reason..." className="flex-1 text-[11px] placeholder:text-text-muted focus:outline-none bg-transparent"/></div>
        {["All Statuses","All Locations","All Types","All Types"].map((l,i) => <button key={i} className="flex items-center gap-1 bg-white border border-border-default rounded-lg px-2.5 py-1.5 text-[11px] font-medium">{["Status","Location","Vehicle Type","Adjustment Type"][i]}: {l} <ChevronDown size={12}/></button>)}
        <button className="flex items-center gap-1 bg-white border border-border-default rounded-lg px-2.5 py-1.5 text-[11px] font-medium">May 20 – Jun 20, 2025 📅</button>
        <button className="flex items-center gap-1 text-[11px] font-medium text-text-secondary"><Filter size={12}/> Filters</button>
      </div>
      <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full"><thead><tr className="text-left text-[9px] text-text-muted font-semibold uppercase border-b border-border-light bg-surface-secondary/50">
        <th className="px-3 py-2">Override ID</th><th className="px-3 py-2">Override Name</th><th className="px-3 py-2">Coverage</th><th className="px-3 py-2">Adjustment</th><th className="px-3 py-2">Applies To</th><th className="px-3 py-2">Duration</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Created By</th><th className="px-3 py-2 text-right">Actions</th>
      </tr></thead><tbody>{overrides.map(o => (
        <tr key={o.id} onClick={() => onSelect(o.id)} className="border-b border-border-light last:border-0 hover:bg-surface-secondary/50 cursor-pointer">
          <td className="px-3 py-2.5"><p className="text-[11px] font-semibold text-sendme">{o.id}</p></td>
          <td className="px-3 py-2.5"><p className="text-[11px] font-medium text-text-primary">{o.name}</p></td>
          <td className="px-3 py-2.5"><p className="text-[11px] font-medium text-text-primary">{o.coverage}</p></td>
          <td className="px-3 py-2.5"><p className={`text-[11px] font-semibold ${o.adjColor}`}>{o.adjustment}</p><p className="text-[9px] text-text-muted">{o.adjType}</p></td>
          <td className="px-3 py-2.5"><p className="text-[11px] font-medium text-text-primary">{o.appliesTo}</p><p className="text-[9px] text-text-muted">{o.appliesDetail}</p></td>
          <td className="px-3 py-2.5"><p className="text-[10px] font-medium text-text-primary">{o.duration}</p><p className="text-[9px] text-text-muted">{o.durationDays}</p></td>
          <td className="px-3 py-2.5"><span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${o.statusColor}`}>{o.status}</span></td>
          <td className="px-3 py-2.5"><p className="text-[10px] font-medium text-text-primary">{o.createdBy}</p><p className="text-[9px] text-text-muted">{o.createdDate}</p></td>
          <td className="px-3 py-2.5 text-right"><button className="p-1 text-text-muted hover:text-text-primary"><MoreHorizontal size={14}/></button></td>
        </tr>
      ))}</tbody></table></div>
      <div className="flex items-center justify-between px-3 py-2 border-t border-border-light"><p className="text-[10px] text-text-muted">Showing 1 to 8 of 14 overrides</p><div className="flex items-center gap-1"><button className="p-1 text-text-muted"><ChevronLeft size={12}/></button>{[1,2].map(p=><button key={p} className={`w-6 h-6 rounded text-[10px] font-medium ${p===1?"bg-sendme text-white":"text-text-muted"}`}>{p}</button>)}<button className="p-1 text-text-muted"><ChevronRight size={12}/></button></div></div></Card>
    </div>
  )
}

function PricingLogsView({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-3">{pricingLogStats.map(s => { const I = s.icon; return (
        <Card key={s.label} className="p-3 min-w-0 overflow-hidden"><div className="flex items-start justify-between mb-1.5"><p className="text-[10px] text-text-muted truncate">{s.label}</p><div className={`p-1 rounded-lg ${s.bg} ${s.color} shrink-0`}><I size={14}/></div></div><p className="text-base lg:text-lg font-bold text-text-primary truncate">{s.value}</p><p className={`text-[9px] font-medium truncate ${s.up?"text-sendme":"text-danger"}`}>{s.change}</p></Card>
      )})}</div>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[180px] flex items-center gap-2 bg-white border border-border-default rounded-lg px-3 py-1.5"><Search size={12} className="text-text-muted"/><input placeholder="Search by log ID, admin, rule ID, route or action..." className="flex-1 text-[11px] placeholder:text-text-muted focus:outline-none bg-transparent"/></div>
        {["All Actions","All Modules","All Admins","All Statuses"].map((l,i) => <button key={i} className="flex items-center gap-1 bg-white border border-border-default rounded-lg px-2.5 py-1.5 text-[11px] font-medium">{["Action Type","Module","Admin","Status"][i]}: {l} <ChevronDown size={12}/></button>)}
        <button className="flex items-center gap-1 bg-white border border-border-default rounded-lg px-2.5 py-1.5 text-[11px] font-medium">May 14 – May 20, 2025 📅</button>
        <button className="flex items-center gap-1 text-[11px] font-medium text-text-secondary"><Filter size={12}/> Filters</button>
      </div>
      <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full"><thead><tr className="text-left text-[9px] text-text-muted font-semibold uppercase border-b border-border-light bg-surface-secondary/50">
        <th className="px-3 py-2">Log ID</th><th className="px-3 py-2">Action</th><th className="px-3 py-2">Module</th><th className="px-3 py-2">Affected Area</th><th className="px-3 py-2">Previous Value</th><th className="px-3 py-2">New Value</th><th className="px-3 py-2">Changed By</th><th className="px-3 py-2">Reason</th><th className="px-3 py-2">Time</th><th className="px-3 py-2">Status</th>
      </tr></thead><tbody>{pricingLogs.map(l => (
        <tr key={l.id} onClick={() => onSelect(l.id)} className="border-b border-border-light last:border-0 hover:bg-surface-secondary/50 cursor-pointer">
          <td className="px-3 py-2.5"><p className="text-[11px] font-semibold text-sendme">{l.id}</p></td>
          <td className="px-3 py-2.5"><div className="flex items-center gap-1.5"><span className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] ${l.actionColor}`}>{l.action==="Update"?"✏️":l.action==="Create"?"➕":l.action.includes("Override")?"📋":l.action==="Disable"?"🚫":l.action==="Revert"?"↩️":"🔄"}</span><div><p className="text-[11px] font-medium text-text-primary">{l.action}</p><p className="text-[9px] text-text-muted">{l.actionDesc}</p></div></div></td>
          <td className="px-3 py-2.5"><p className="text-[10px] font-medium text-text-primary">{l.module}</p></td>
          <td className="px-3 py-2.5"><p className="text-[10px] font-medium text-text-primary whitespace-pre-line">{l.area}</p></td>
          <td className="px-3 py-2.5"><p className="text-[10px] font-medium text-text-muted">{l.prev}</p></td>
          <td className="px-3 py-2.5"><p className="text-[10px] font-semibold text-text-primary">{l.new}</p></td>
          <td className="px-3 py-2.5"><div className="flex items-center gap-1.5"><div className="w-5 h-5 bg-sendme-50 rounded-full flex items-center justify-center text-sendme text-[7px] font-bold">{l.changedBy[0]}</div><div><p className="text-[10px] font-medium text-text-primary">{l.changedBy}</p><p className="text-[8px] text-text-muted">{l.changedByRole}</p></div></div></td>
          <td className="px-3 py-2.5"><p className="text-[10px] text-text-primary max-w-[120px] truncate">{l.reason}</p></td>
          <td className="px-3 py-2.5"><p className="text-[9px] text-text-muted whitespace-pre-line">{l.time}</p></td>
          <td className="px-3 py-2.5"><span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${l.statusColor}`}>{l.status}</span></td>
        </tr>
      ))}</tbody></table></div>
      <div className="flex items-center justify-between px-3 py-2 border-t border-border-light"><p className="text-[10px] text-text-muted">Showing 1 to 10 of 1,248 logs</p><div className="flex items-center gap-1"><button className="p-1 text-text-muted"><ChevronLeft size={12}/></button>{[1,2,3,4,5].map(p=><button key={p} className={`w-6 h-6 rounded text-[10px] font-medium ${p===1?"bg-sendme text-white":"text-text-muted"}`}>{p}</button>)}<span className="text-text-muted text-[10px]">...</span><button className="w-6 h-6 rounded text-[10px] font-medium text-text-muted">125</button><button className="p-1 text-text-muted"><ChevronRight size={12}/></button><span className="text-[10px] text-text-muted ml-2">10 / page</span><ChevronDown size={10} className="text-text-muted"/></div></div></Card>
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
