"use client"

import { useState } from "react"
import {
  X, CheckCircle, Clock, AlertTriangle, Eye, Edit, RotateCcw, Trash2,
  Star, ChevronRight, ArrowRight, TrendingUp, FileText
} from "lucide-react"

interface BidsPricingDetailProps {
  type: "bids" | "price-control" | "route-pricing" | "pricing-logs" | "overrides"
  itemId: string
  onClose: () => void
}

function BidActivityDetail() {
  const [tab, setTab] = useState("Overview")
  const subTabs = ["Overview", "Bids (7)", "Timeline", "Activity"]
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold bg-sendme-50 text-sendme px-1.5 py-0.5 rounded-full">Won</span>
      </div>
      <div className="flex gap-0 overflow-x-auto border-b border-border-light">
        {subTabs.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-2 py-1.5 text-[10px] font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t ? "border-sendme text-sendme" : "border-transparent text-text-muted"}`}>{t}</button>
        ))}
      </div>
      {tab === "Overview" && (
        <div className="space-y-4">
          <div>
            <h4 className="text-[11px] font-semibold text-text-primary mb-2">Order Information <span className="text-sendme font-normal cursor-pointer">View order</span></h4>
            {[["Order ID", "SM-20491"], ["Route", "Lekki → Ikeja"], ["Type", "Small Item • Motorbike"], ["Customer", "Collins Bassie (Individual)"], ["Created", "May 20, 2025, 10:24 AM"]].map(([l, v]) => (
              <div key={l} className="flex justify-between py-1 border-b border-border-light last:border-0">
                <span className="text-[10px] text-text-muted">{l}</span>
                <span className="text-[10px] font-medium text-text-primary">{v}</span>
              </div>
            ))}
          </div>
          <div>
            <h4 className="text-[11px] font-semibold text-text-primary mb-2">Pricing Summary</h4>
            {[["Base Fare", "₦6,500"], ["Customer Offer", "₦6,000"], ["Highest Bid", "₦6,800"], ["Winning Bid", "₦6,800", "green"], ["Platform Fee (15%)", "-₦1,020"], ["Customer Pays", "₦6,800"]].map(([l, v, green]) => (
              <div key={String(l)} className="flex justify-between py-1 border-b border-border-light last:border-0">
                <span className="text-[10px] text-text-muted">{l}</span>
                <span className={`text-[10px] font-medium ${green ? "text-sendme font-bold" : "text-text-primary"}`}>{v}</span>
              </div>
            ))}
          </div>
          <div>
            <h4 className="text-[11px] font-semibold text-text-primary mb-2">Winning Driver</h4>
            <div className="flex items-center gap-2 bg-surface-secondary rounded-lg p-2.5">
              <div className="w-8 h-8 bg-sendme-50 rounded-full flex items-center justify-center text-sendme text-[10px] font-bold">D</div>
              <div>
                <div className="flex items-center gap-1"><span className="text-[11px] font-semibold">Damilare Adegbite</span><Star size={9} className="text-warning fill-warning" /><span className="text-[9px] text-text-muted">4.8 (128)</span><CheckCircle size={9} className="text-sendme" /></div>
                <p className="text-[9px] text-text-muted">Motorbike • ABC 123 DE</p>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-[11px] font-semibold text-text-primary mb-2">Bid Activity</h4>
            {[{name:"Damilare Adegbite",amt:"₦6,800",t:"10:26 AM"},{name:"Chinedu Okeke",amt:"₦6,500",t:"10:25 AM"},{name:"Tosin Adebayo",amt:"₦6,200",t:"10:25 AM"}].map((b,i) => (
              <div key={i} className="flex justify-between py-1.5 border-b border-border-light last:border-0">
                <div className="flex items-center gap-2"><span className="text-[10px] text-text-muted">{b.t}</span><span className="text-[10px] font-medium text-text-primary">{b.name}</span></div>
                <span className="text-[10px] font-semibold text-text-primary">{b.amt}</span>
              </div>
            ))}
            <p className="text-[10px] text-sendme font-medium mt-1 cursor-pointer">+ 4 more bids</p>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button className="px-2 py-2 border border-border-default rounded-lg text-[10px] font-medium flex items-center justify-center gap-1 hover:bg-surface-hover"><Edit size={10}/> Adjust Fare</button>
            <button className="px-2 py-2 border border-border-default rounded-lg text-[10px] font-medium flex items-center justify-center gap-1 hover:bg-surface-hover"><RotateCcw size={10}/> Reopen Bidding</button>
            <button className="col-span-2 px-2 py-2 border border-danger/30 bg-danger-light rounded-lg text-[10px] font-semibold text-danger flex items-center justify-center gap-1 hover:bg-danger/10"><Trash2 size={10}/> Cancel Order</button>
          </div>
        </div>
      )}
      {tab !== "Overview" && <div className="text-center py-8 text-[11px] text-text-muted">Content for {tab}</div>}
    </div>
  )
}

function PriceControlDetail() {
  const [tab, setTab] = useState("Overview")
  const subTabs = ["Overview", "History", "Impact", "Activity"]
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold bg-sendme-50 text-sendme px-1.5 py-0.5 rounded-full">Active</span>
        <span className="text-[10px] font-semibold bg-surface-secondary text-text-muted px-1.5 py-0.5 rounded-full">•••</span>
      </div>
      <div className="flex gap-0 overflow-x-auto border-b border-border-light">
        {subTabs.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-2 py-1.5 text-[10px] font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t ? "border-sendme text-sendme" : "border-transparent text-text-muted"}`}>{t}</button>
        ))}
      </div>
      {tab === "Overview" && (
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2"><h4 className="text-[11px] font-semibold text-text-primary">Coverage</h4><button className="text-[9px] font-semibold text-sendme">Edit</button></div>
            {[["State","Lagos"],["City / Area","All Cities"],["Route Type","Intracity"],["Vehicle Type","Motorbike"],["Delivery Type","Instant Delivery"],["Item Size","Small Item"],["Item Category","General"]].map(([l,v])=>(
              <div key={l} className="flex justify-between py-1 border-b border-border-light last:border-0"><span className="text-[10px] text-text-muted">{l}</span><span className="text-[10px] font-medium text-text-primary">{v}</span></div>
            ))}
          </div>
          <div>
            <h4 className="text-[11px] font-semibold text-text-primary mb-2">Pricing Setup</h4>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              {[["Base Fare","₦1,500"],["Bid Floor","₦1,200"],["Price Per KM","₦250"],["Bid Ceiling","₦3,000"],["Minimum Fare","₦2,000"],["Platform Fee","15%"]].map(([l,v])=>(
                <div key={l} className="flex justify-between py-1 border-b border-border-light"><span className="text-[10px] text-text-muted">{l}</span><span className="text-[10px] font-medium text-text-primary">{v}</span></div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-[11px] font-semibold text-text-primary mb-2">Availability</h4>
            {[["Effective Date","May 10, 2025"],["End Date","—"]].map(([l,v])=>(
              <div key={l} className="flex justify-between py-1 border-b border-border-light last:border-0"><span className="text-[10px] text-text-muted">{l}</span><span className="text-[10px] font-medium text-text-primary">{v}</span></div>
            ))}
            <div className="flex justify-between py-1 border-b border-border-light"><span className="text-[10px] text-text-muted">Active Days</span>
              <div className="flex gap-0.5">{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=><span key={d} className="text-[8px] font-semibold bg-sendme-50 text-sendme px-1 py-0.5 rounded">{d}</span>)}</div>
            </div>
            <div className="flex justify-between py-1"><span className="text-[10px] text-text-muted">Active Hours</span><span className="text-[10px] font-medium text-text-primary">12:00 AM – 11:59 PM</span></div>
          </div>
          <div>
            <h4 className="text-[11px] font-semibold text-text-primary mb-2">Recent Change</h4>
            <div className="bg-surface-secondary rounded-lg p-2.5"><p className="text-[10px] text-text-muted mb-1">Reason</p><p className="text-[10px] text-text-primary">Adjusted to reflect current fuel price and operational cost.</p></div>
            <div className="flex items-center gap-2 mt-2"><div className="w-5 h-5 bg-sendme-50 rounded-full flex items-center justify-center text-sendme text-[8px] font-bold">A</div><div><p className="text-[10px] font-medium text-text-primary">Admin (Super Admin)</p><p className="text-[9px] text-text-muted">May 20, 2025, 10:24 AM</p></div></div>
          </div>
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <button className="px-2 py-2 border border-border-default rounded-lg text-[10px] font-medium flex items-center justify-center gap-1 hover:bg-surface-hover"><Edit size={10}/> Edit Rule</button>
            <button className="px-2 py-2 border border-border-default rounded-lg text-[10px] font-medium flex items-center justify-center gap-1 hover:bg-surface-hover"><FileText size={10}/> Duplicate</button>
            <button className="px-2 py-2 border border-danger/30 bg-danger-light rounded-lg text-[10px] font-semibold text-danger flex items-center justify-center gap-1 hover:bg-danger/10"><X size={10}/> Disable</button>
          </div>
        </div>
      )}
      {tab !== "Overview" && <div className="text-center py-8 text-[11px] text-text-muted">Content for {tab}</div>}
    </div>
  )
}

function RoutePricingDetail() {
  const [tab, setTab] = useState("Overview")
  const subTabs = ["Overview", "Vehicles & Pricing", "Return Load", "Activity"]
  const vehicles = [
    {type:"Motorbike",base:"₦1,500",perKm:"₦250",min:"₦2,000"},
    {type:"Car",base:"₦3,500",perKm:"₦450",min:"₦4,500"},
    {type:"Pickup",base:"₦15,000",perKm:"₦650",min:"₦18,000"},
    {type:"Truck (1-3 Tons)",base:"₦45,000",perKm:"₦950",min:"₦50,000"},
    {type:"Truck (4-7 Tons)",base:"₦85,000",perKm:"₦1,200",min:"₦90,000"},
    {type:"Truck (8-15 Tons)",base:"₦140,000",perKm:"₦1,600",min:"₦150,000"},
  ]
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><span className="text-[10px] font-semibold bg-sendme-50 text-sendme px-1.5 py-0.5 rounded-full">Active</span></div>
      <div className="flex items-center justify-between">
        <div><h3 className="text-xs font-bold text-text-primary">Lagos → Ibadan</h3><p className="text-[9px] text-text-muted">Lagos State → Oyo State • 136 km</p></div>
        <span className="text-[10px] font-semibold bg-surface-secondary text-text-muted px-1.5 py-0.5 rounded-full">•••</span>
      </div>
      <div className="flex gap-0 overflow-x-auto border-b border-border-light">
        {subTabs.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-2 py-1.5 text-[10px] font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t ? "border-sendme text-sendme" : "border-transparent text-text-muted"}`}>{t}</button>
        ))}
      </div>
      {tab === "Overview" && (
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2"><h4 className="text-[11px] font-semibold text-text-primary">Route Details</h4><button className="text-[9px] font-semibold text-sendme">Edit Route</button></div>
            {[["Route Type","Interstate"],["Default Currency","NGN"],["Distance","136 km"],["Toll & Charges","Included"],["Estimated Duration","2h 30m"],["Fuel Factor","Standard"],["Road Condition","• Good"],["Last Updated","May 20, 2025"]].map(([l,v])=>(
              <div key={l} className="flex justify-between py-1 border-b border-border-light last:border-0"><span className="text-[10px] text-text-muted">{l}</span><span className="text-[10px] font-medium text-text-primary">{v}</span></div>
            ))}
          </div>
          <div>
            <h4 className="text-[11px] font-semibold text-text-primary mb-2">Vehicle Pricing Preview</h4>
            <div className="space-y-0">
              <div className="grid grid-cols-4 gap-1 text-[8px] font-semibold text-text-muted uppercase py-1 border-b border-border-light"><span>Vehicle Type</span><span>Base Fare</span><span>Per KM</span><span>Min. Fare</span></div>
              {vehicles.map(v=>(
                <div key={v.type} className="grid grid-cols-4 gap-1 py-1.5 border-b border-border-light last:border-0 text-[10px]"><span className="font-medium text-text-primary">{v.type}</span><span className="text-text-primary">{v.base}</span><span className="text-text-primary">{v.perKm}</span><span className="text-text-primary">{v.min}</span></div>
              ))}
            </div>
            <p className="text-[10px] text-sendme font-medium mt-1.5 cursor-pointer">View All Pricing →</p>
          </div>
          <div>
            <h4 className="text-[11px] font-semibold text-text-primary mb-2">Performance (Last 30 Days)</h4>
            <div className="grid grid-cols-2 gap-2">
              {[["Orders","312","↑ 18%"],["Avg. Winning Bid","₦89,450","↑ 12%"],["No-Bid Rate","8.6%","↑ 2%"],["Completion Rate","96.2%","↑ 3%"]].map(([l,v,c])=>(
                <div key={l} className="bg-surface-secondary rounded-lg p-2 text-center"><p className="text-[8px] text-text-muted">{l}</p><p className="text-sm font-bold text-text-primary">{v}</p><p className="text-[9px] font-medium text-sendme">{c}</p></div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <button className="px-2 py-2 border border-border-default rounded-lg text-[10px] font-medium flex items-center justify-center gap-1 hover:bg-surface-hover"><Edit size={10}/> Edit Pricing</button>
            <button className="px-2 py-2 border border-border-default rounded-lg text-[10px] font-medium flex items-center justify-center gap-1 hover:bg-surface-hover"><RotateCcw size={10}/> Override</button>
            <button className="px-2 py-2 border border-danger/30 bg-danger-light rounded-lg text-[10px] font-semibold text-danger flex items-center justify-center gap-1 hover:bg-danger/10"><X size={10}/> Deactivate</button>
          </div>
        </div>
      )}
      {tab !== "Overview" && <div className="text-center py-8 text-[11px] text-text-muted">Content for {tab}</div>}
    </div>
  )
}

function PricingLogsDetail() {
  const [tab, setTab] = useState("Details")
  const subTabs = ["Details", "Approval Trail", "Affected Pricing", "History"]
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><span className="text-[10px] font-semibold bg-sendme-50 text-sendme px-1.5 py-0.5 rounded-full">Approved</span></div>
      <div className="flex gap-0 overflow-x-auto border-b border-border-light">
        {subTabs.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-2 py-1.5 text-[10px] font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t ? "border-sendme text-sendme" : "border-transparent text-text-muted"}`}>{t}</button>
        ))}
      </div>
      {tab === "Details" && (
        <div className="space-y-4">
          <div>
            <h4 className="text-[11px] font-semibold text-text-primary mb-2">Log Details</h4>
            {[["Log ID","PL-1248"],["Action","Update"],["Module","Price Control"],["Timestamp","May 20, 2025, 10:24 AM"],["Changed By","Admin (Super Admin)"]].map(([l,v])=>(
              <div key={l} className="flex justify-between py-1 border-b border-border-light last:border-0"><span className="text-[10px] text-text-muted">{l}</span><span className="text-[10px] font-medium text-text-primary">{v}</span></div>
            ))}
          </div>
          <div>
            <h4 className="text-[11px] font-semibold text-text-primary mb-2">Affected Area</h4>
            {[["State / City","Lagos + All Cities"],["Vehicle Type","Motorbike"],["Item Size","Small Item"],["Delivery Type","Instant Delivery"]].map(([l,v])=>(
              <div key={l} className="flex justify-between py-1 border-b border-border-light last:border-0"><span className="text-[10px] text-text-muted">{l}</span><span className="text-[10px] font-medium text-text-primary">{v}</span></div>
            ))}
          </div>
          <div>
            <h4 className="text-[11px] font-semibold text-text-primary mb-2">Change Summary</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-secondary rounded-lg p-2.5"><p className="text-[9px] font-semibold text-text-muted mb-1.5">Previous Value</p>
                {[["Base Fare","₦1,300"],["Per KM","₦220"],["Min. Fare","₦1,800"],["Platform Fee","12%"]].map(([l,v])=>(
                  <div key={l} className="flex justify-between py-0.5"><span className="text-[9px] text-text-muted">{l}</span><span className="text-[9px] font-medium text-text-primary">{v}</span></div>
                ))}
              </div>
              <div className="bg-sendme-50 rounded-lg p-2.5"><p className="text-[9px] font-semibold text-sendme mb-1.5">New Value</p>
                {[["Base Fare","₦1,500"],["Per KM","₦250"],["Min. Fare","₦2,000"],["Platform Fee","15%"]].map(([l,v])=>(
                  <div key={l} className="flex justify-between py-0.5"><span className="text-[9px] text-text-muted">{l}</span><span className="text-[9px] font-bold text-sendme">{v}</span></div>
                ))}
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-[11px] font-semibold text-text-primary mb-1">Reason</h4>
            <p className="text-[10px] text-text-primary bg-surface-secondary rounded-lg p-2.5">Adjust for fuel price increase and rising operational costs.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button className="px-2 py-2 border border-border-default rounded-lg text-[10px] font-medium flex items-center justify-center gap-1 hover:bg-surface-hover"><Eye size={10}/> View Rule</button>
            <button className="px-2 py-2 border border-danger/30 bg-danger-light rounded-lg text-[10px] font-semibold text-danger flex items-center justify-center gap-1 hover:bg-danger/10"><RotateCcw size={10}/> Revert Change</button>
          </div>
        </div>
      )}
      {tab !== "Details" && <div className="text-center py-8 text-[11px] text-text-muted">Content for {tab}</div>}
    </div>
  )
}

function OverrideDetail() {
  const [tab, setTab] = useState("Overview")
  const subTabs = ["Overview", "Impact", "Activity", "History"]
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><span className="text-[10px] font-semibold bg-sendme-50 text-sendme px-1.5 py-0.5 rounded-full">Active</span><span className="text-[10px] font-semibold bg-surface-secondary text-text-muted px-1.5 py-0.5 rounded-full">•••</span></div>
      <div className="flex gap-0 overflow-x-auto border-b border-border-light">
        {subTabs.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-2 py-1.5 text-[10px] font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t ? "border-sendme text-sendme" : "border-transparent text-text-muted"}`}>{t}</button>
        ))}
      </div>
      {tab === "Overview" && (
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2"><h4 className="text-[11px] font-semibold text-text-primary">Override Summary</h4><button className="text-[9px] font-semibold text-sendme">Edit Override</button></div>
            {[["Override Name","Fuel Price Adjustment"],["Status","Active"],["Coverage","Lagos State + All Cities"],["Vehicle Type","All Vehicles"],["Adjustment Type","Percentage Increase"],["Applies To","Base Fare & Per KM"],["Created By","Admin (Super Admin)"],["Created On","May 20, 2025, 10:24 AM"]].map(([l,v])=>(
              <div key={l} className="flex justify-between py-1 border-b border-border-light last:border-0"><span className="text-[10px] text-text-muted">{l}</span><span className="text-[10px] font-medium text-text-primary">{v}</span></div>
            ))}
          </div>
          <div>
            <h4 className="text-[11px] font-semibold text-text-primary mb-2">Adjustment Details</h4>
            {[["Adjustment","+ 8%"],["Calculation","Increase"],["Applied To","Base Fare, Price Per KM"],["Applies To","All Vehicle Types"]].map(([l,v])=>(
              <div key={l} className="flex justify-between py-1 border-b border-border-light last:border-0"><span className="text-[10px] text-text-muted">{l}</span><span className="text-[10px] font-medium text-text-primary">{v}</span></div>
            ))}
            <div className="bg-info-light border border-info/20 rounded-lg p-2.5 mt-2"><p className="text-[10px] text-text-primary">This override increases the base fare and per KM price by 8% within the selected coverage.</p></div>
          </div>
          <div>
            <h4 className="text-[11px] font-semibold text-text-primary mb-2">Duration</h4>
            {[["Start Date","May 20, 2025, 12:00 AM"],["End Date","May 31, 2025, 11:59 PM"],["Duration","11 days"],["Auto Expire","✓ Yes"]].map(([l,v])=>(
              <div key={l} className="flex justify-between py-1 border-b border-border-light last:border-0"><span className="text-[10px] text-text-muted">{l}</span><span className="text-[10px] font-medium text-text-primary">{v}</span></div>
            ))}
          </div>
          <div>
            <h4 className="text-[11px] font-semibold text-text-primary mb-1">Reason</h4>
            <p className="text-[10px] text-text-primary bg-surface-secondary rounded-lg p-2.5">Adjustment to reflect recent fuel price increase and operational cost escalation.</p>
          </div>
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <button className="px-2 py-2 border border-border-default rounded-lg text-[10px] font-medium flex items-center justify-center gap-1 hover:bg-surface-hover"><Edit size={10}/> Edit</button>
            <button className="px-2 py-2 border border-warning/30 bg-warning-light rounded-lg text-[10px] font-semibold text-warning flex items-center justify-center gap-1 hover:bg-warning/10"><Clock size={10}/> Pause</button>
            <button className="px-2 py-2 border border-danger/30 bg-danger-light rounded-lg text-[10px] font-semibold text-danger flex items-center justify-center gap-1 hover:bg-danger/10"><X size={10}/> End Now</button>
          </div>
        </div>
      )}
      {tab !== "Overview" && <div className="text-center py-8 text-[11px] text-text-muted">Content for {tab}</div>}
    </div>
  )
}

export function BidsPricingDetail({ type, itemId, onClose }: BidsPricingDetailProps) {
  const titles: Record<string, string> = {
    "bids": "SM-20491",
    "price-control": "PR-1042",
    "route-pricing": "RT-1001",
    "pricing-logs": "PL-1248",
    "overrides": "OV-1024",
  }

  return (
    <div className="w-[340px] bg-white border-l border-border-default flex flex-col shrink-0 h-full overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-border-light">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold text-text-primary">{titles[type]}</h3>
          <button onClick={onClose} className="p-1 text-text-muted hover:text-text-primary transition-colors"><X size={16} /></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {type === "bids" && <BidActivityDetail />}
        {type === "price-control" && <PriceControlDetail />}
        {type === "route-pricing" && <RoutePricingDetail />}
        {type === "pricing-logs" && <PricingLogsDetail />}
        {type === "overrides" && <OverrideDetail />}
      </div>
    </div>
  )
}
