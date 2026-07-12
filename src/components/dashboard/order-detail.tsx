"use client"

import { useState, useEffect } from "react"
import { X, MapPin, Phone, Loader2, Trash2, Ban, AlertTriangle } from "lucide-react"

interface OrderDetailProps {
  orderId: string
  onClose: () => void
}

interface OrderData {
  order: {
    id: string
    fullId: string
    status: string
    statusColor: string
    statusRaw: string
    pickupAddress: string
    dropoffAddress: string
    created_at: string
    updated_at: string
  }
  customer: {
    id: string | null
    name: string
    email: string
    phone: string
  }
  driver: {
    id: string
    name: string
    phone: string
    vehicle: string
  } | null
  item: {
    type: string
    typeColor: string
    category: string
    size: string
    handling: string | null
    value: string
    instructions: string | null
  }
  pricing: {
    fare: number
    fareFormatted: string
    commission: number
    commissionFormatted: string
    driverEarning: number
    driverEarningFormatted: string
    paymentMethod: string
    paymentStatus: string
    paymentStatusColor: string
  }
  contacts: {
    senderName: string
    senderPhone: string
    receiverName: string
    receiverPhone: string
  }
  pickup: {
    address: string
    building: string | null
    floor: string | null
    note: string | null
  }
  dropoff: {
    address: string
    building: string | null
    floor: string | null
    note: string | null
  }
  schedule: {
    date: string
    startTime: string
    endTime: string
  } | null
  activityLog: {
    time: string
    title: string
    desc: string
    icon: string
    color: string
  }[]
}

const tabs = ["Overview", "Timeline", "Details", "Activity"]

function OverviewTab({ data }: { data: OrderData }) {
  const { order, customer, driver, item, pricing } = data
  const created = new Date(order.created_at)
  const pickupTime = created.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
  const updated = new Date(order.updated_at)
  const dropoffTime = order.statusRaw === "delivered"
    ? updated.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    : "—"

  return (
    <div className="space-y-5">
      {/* Route */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-text-primary">Route</h4>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-sendme mt-1.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-text-primary">Pickup</p>
              <p className="text-xs text-text-muted">{order.pickupAddress}</p>
              <p className="text-[10px] text-text-muted">{pickupTime}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-text-muted mt-1.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-text-primary">Dropoff</p>
              <p className="text-xs text-text-muted">{order.dropoffAddress}</p>
              <p className="text-[10px] text-text-muted">{dropoffTime}</p>
            </div>
          </div>
        </div>
        <div className="mt-3 h-24 bg-surface-secondary rounded-lg border border-border-light flex items-center justify-center">
          <div className="text-center">
            <MapPin size={16} className="text-sendme/40 mx-auto mb-1" />
            <p className="text-[10px] text-text-muted">Map preview</p>
          </div>
        </div>
      </div>

      {/* Parties */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-text-primary">Parties</h4>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-sendme-50 rounded-full flex items-center justify-center text-sendme text-xs font-bold">
                {customer.name[0]}
              </div>
              <div>
                <p className="text-xs font-medium text-text-primary">{customer.name}</p>
                <p className="text-[10px] text-text-muted">Customer • {customer.phone}</p>
              </div>
            </div>
            <button className="p-1.5 text-text-muted hover:text-sendme transition-colors">
              <Phone size={14} />
            </button>
          </div>
          {driver ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-sendme-50 rounded-full flex items-center justify-center text-sendme text-xs font-bold">
                  {driver.name[0]}
                </div>
                <div>
                  <p className="text-xs font-medium text-text-primary">{driver.name}</p>
                  <p className="text-[10px] text-text-muted">Driver • {driver.phone}</p>
                </div>
              </div>
              <button className="p-1.5 text-text-muted hover:text-sendme transition-colors">
                <Phone size={14} />
              </button>
            </div>
          ) : (
            <p className="text-[10px] text-text-muted italic">No driver assigned yet</p>
          )}
        </div>
      </div>

      {/* Order Summary */}
      <div>
        <h4 className="text-sm font-semibold text-text-primary mb-3">Order Summary</h4>
        <div className="space-y-2">
          {[
            ["Delivery Type", item.type],
            ["Payment Method", pricing.paymentMethod],
            ["Fare", pricing.fareFormatted],
            ["Platform Fee", pricing.commissionFormatted],
            ["Driver Earning", pricing.driverEarningFormatted],
            ["Item Category", item.category],
            ["Market Value", item.value !== "—" ? `₦${Number(item.value).toLocaleString()}` : "—"],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between py-1.5 border-b border-border-light last:border-0">
              <p className="text-xs text-text-muted">{label}</p>
              <p className={`text-xs font-medium ${label === "Settlement" ? "text-danger" : "text-text-primary"}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h4 className="text-sm font-semibold text-text-primary mb-3">Quick Actions</h4>
        <div className="grid grid-cols-2 gap-2">
          <button className="px-3 py-2 border border-border-default rounded-lg text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors">Reassign Driver</button>
          <button className="px-3 py-2 border border-border-default rounded-lg text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors">Contact Driver</button>
          <button className="px-3 py-2 border border-border-default rounded-lg text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors">Contact Customer</button>
          <button className="px-3 py-2 border border-danger/30 bg-danger-light rounded-lg text-xs font-medium text-danger hover:bg-danger/10 transition-colors">Open Dispute</button>
        </div>
      </div>
    </div>
  )
}

function DetailsTab({ data }: { data: OrderData }) {
  const { order, customer, driver, item, pricing, contacts, pickup, dropoff, schedule } = data
  const created = new Date(order.created_at)
  const pickupTime = created.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })

  return (
    <div className="space-y-5">
      {/* Route */}
      <div>
        <h4 className="text-sm font-semibold text-text-primary mb-3">Route</h4>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-sendme mt-1.5 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-medium text-text-primary">{pickup.address}</p>
              {pickup.building && <p className="text-[10px] text-text-muted">Building: {pickup.building}{pickup.floor ? `, Floor ${pickup.floor}` : ""}</p>}
              {pickup.note && <p className="text-[10px] text-text-muted">Note: {pickup.note}</p>}
            </div>
            <span className="text-[10px] text-text-muted">{pickupTime}</span>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-text-muted mt-1.5 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-medium text-text-primary">{dropoff.address}</p>
              {dropoff.building && <p className="text-[10px] text-text-muted">Building: {dropoff.building}{dropoff.floor ? `, Floor ${dropoff.floor}` : ""}</p>}
              {dropoff.note && <p className="text-[10px] text-text-muted">Note: {dropoff.note}</p>}
            </div>
            <span className="text-[10px] text-text-muted">—</span>
          </div>
        </div>
      </div>

      {/* Parties */}
      <div>
        <h4 className="text-sm font-semibold text-text-primary mb-3">Parties</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-sendme-50 rounded-full flex items-center justify-center text-sendme text-xs font-bold">
                {contacts.senderName[0]}
              </div>
              <div>
                <p className="text-xs font-medium text-text-primary">{contacts.senderName}</p>
                <p className="text-[10px] text-text-muted">{contacts.senderPhone}</p>
              </div>
            </div>
            <span className="text-[10px] font-medium text-sendme bg-sendme-50 px-2 py-0.5 rounded-full">Sender</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-info-light rounded-full flex items-center justify-center text-info text-xs font-bold">
                {contacts.receiverName[0]}
              </div>
              <div>
                <p className="text-xs font-medium text-text-primary">{contacts.receiverName}</p>
                <p className="text-[10px] text-text-muted">{contacts.receiverPhone}</p>
              </div>
            </div>
            <span className="text-[10px] font-medium text-info bg-info-light px-2 py-0.5 rounded-full">Receiver</span>
          </div>
          {driver && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-sendme-50 rounded-full flex items-center justify-center text-sendme text-xs font-bold">
                  {driver.name[0]}
                </div>
                <div>
                  <p className="text-xs font-medium text-text-primary">{driver.name}</p>
                  <p className="text-[10px] text-text-muted">{driver.phone}</p>
                </div>
              </div>
              <span className="text-[10px] font-medium text-sendme bg-sendme-50 px-2 py-0.5 rounded-full">{driver.vehicle}</span>
            </div>
          )}
        </div>
      </div>

      {/* Item Details */}
      <div>
        <h4 className="text-sm font-semibold text-text-primary mb-3">Item Details</h4>
        <div className="space-y-2">
          {[
            ["Type", item.type],
            ["Category", item.category],
            ["Size", item.size.charAt(0).toUpperCase() + item.size.slice(1)],
            ["Payment Method", pricing.paymentMethod],
            ...(item.handling ? [["Handling", item.handling]] : []),
            ...(item.instructions ? [["Special Instructions", item.instructions]] : []),
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between py-1.5 border-b border-border-light last:border-0">
              <p className="text-xs text-text-muted">{label}</p>
              <p className="text-xs font-medium text-text-primary text-right max-w-[60%]">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing / Settlement */}
      <div>
        <h4 className="text-sm font-semibold text-text-primary mb-3">Pricing / Settlement</h4>
        <div className="space-y-2">
          {[
            ["Total Fare", pricing.fareFormatted],
            ["Platform Fee", pricing.commissionFormatted],
            ["Driver Earning", pricing.driverEarningFormatted],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between py-1.5 border-b border-border-light last:border-0">
              <p className="text-xs text-text-muted">{label}</p>
              <p className="text-xs font-semibold text-text-primary">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-2">
          {[
            ["Paid By", "Customer"],
            ["Payment Method", pricing.paymentMethod],
            ["Payment Status", pricing.paymentStatus],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between py-1.5 border-b border-border-light last:border-0">
              <p className="text-xs text-text-muted">{label}</p>
              <p className={`text-xs font-medium ${label === "Payment Status" ? pricing.paymentStatusColor : "text-text-primary"}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule (if scheduled) */}
      {schedule && (
        <div>
          <h4 className="text-sm font-semibold text-text-primary mb-3">Schedule</h4>
          <div className="space-y-2">
            {[
              ["Date", schedule.date],
              ["Start Time", schedule.startTime],
              ["End Time", schedule.endTime],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-border-light last:border-0">
                <p className="text-xs text-text-muted">{label}</p>
                <p className="text-xs font-medium text-text-primary">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h4 className="text-sm font-semibold text-text-primary mb-3">Quick Actions</h4>
        <div className="grid grid-cols-2 gap-2">
          <button className="px-3 py-2 border border-border-default rounded-lg text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors">Contact Driver</button>
          <button className="px-3 py-2 border border-border-default rounded-lg text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors">Send Message</button>
          <button className="px-3 py-2 border border-border-default rounded-lg text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors">Update ETA</button>
          <button className="px-3 py-2 border border-danger/30 bg-danger-light rounded-lg text-xs font-medium text-danger hover:bg-danger/10 transition-colors">Cancel Order</button>
        </div>
      </div>
    </div>
  )
}

function ActivityTab({ data }: { data: OrderData }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-text-primary">Activity Log</h4>
      </div>
      <div className="space-y-0">
        {data.activityLog.map((item, i) => (
          <div key={i} className="flex gap-3 pb-4 relative">
            {i < data.activityLog.length - 1 && (
              <div className="absolute left-[15px] top-[30px] bottom-0 w-px bg-border-light" />
            )}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${item.color} relative z-10`}>
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-text-primary">{item.title}</p>
                <span className="text-[10px] text-text-muted whitespace-nowrap">{item.time}</span>
              </div>
              <p className="text-[10px] text-text-muted mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-text-muted text-center pt-2 border-t border-border-light">
        All times shown in Africa/Lagos (WAT). Updates appear in real time.
      </p>
    </div>
  )
}

export function OrderDetail({ orderId, onClose }: OrderDetailProps) {
  const [activeTab, setActiveTab] = useState("Overview")
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<OrderData | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) return
    setLoading(true)
    fetch(`/api/dashboard/deliveries/${orderId}`)
      .then((r) => r.json())
      .then((result) => {
        setData(result)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [orderId])

  const handleAction = async (action: string) => {
    setActionLoading(action)
    try {
      const res = await fetch(`/api/dashboard/deliveries/${orderId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      const result = await res.json()
      if (result.success) {
        setConfirmAction(null)
        if (action === "delete_order") {
          onClose()
        } else {
          const r = await fetch(`/api/dashboard/deliveries/${orderId}`)
          const updated = await r.json()
          setData(updated)
        }
      } else {
        alert(result.error || "Action failed")
      }
    } catch {
      alert("Action failed")
    } finally {
      setActionLoading(null)
    }
  }

  const statusRaw = data?.order?.statusRaw

  return (
    <div className="w-[340px] bg-white border-l border-border-default flex flex-col shrink-0 h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border-light">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-text-primary">{data?.order?.id || orderId}</h3>
            {data?.order && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${data.order.statusColor}`}>
                {data.order.status}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1 text-text-muted hover:text-text-primary transition-colors">
            <X size={16} />
          </button>
        </div>
        {/* Tabs */}
        <div className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-xs font-medium transition-colors border-b-2 ${
                activeTab === tab
                  ? "border-sendme text-sendme"
                  : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={24} className="animate-spin text-sendme" />
          </div>
        ) : !data ? (
          <div className="flex items-center justify-center h-48">
            <p className="text-xs text-text-muted">Failed to load order details</p>
          </div>
        ) : (
          <>
            {activeTab === "Overview" && <OverviewTab data={data} />}
            {activeTab === "Details" && <DetailsTab data={data} />}
            {activeTab === "Activity" && <ActivityTab data={data} />}
            {activeTab === "Timeline" && (
              <div className="flex items-center justify-center h-32">
                <p className="text-xs text-text-muted">Timeline view coming soon</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Action Buttons */}
      {!loading && data && statusRaw && !["delivered", "canceled"].includes(statusRaw) && (
        <div className="px-4 py-3 border-t border-border-light space-y-2">
          {confirmAction ? (
            <div className="space-y-2">
              <p className="text-[11px] text-text-muted text-center">
                {confirmAction === "delete_order" ? "Permanently delete this order?" : "Cancel this order?"}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 px-3 py-2 border border-border-default rounded-lg text-[11px] font-medium text-text-primary hover:bg-surface-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAction(confirmAction)}
                  disabled={!!actionLoading}
                  className="flex-1 px-3 py-2 bg-danger text-white rounded-lg text-[11px] font-semibold hover:bg-danger/90 transition-colors flex items-center justify-center gap-1"
                >
                  {actionLoading && <Loader2 size={12} className="animate-spin" />}
                  Confirm
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setConfirmAction("cancel_order")}
                className="px-2 py-2 border border-warning/30 bg-warning-light rounded-lg text-[10px] font-semibold text-warning hover:bg-warning/10 transition-colors flex items-center justify-center gap-1"
              >
                <Ban size={10} /> Cancel Order
              </button>
              <button
                onClick={() => setConfirmAction("delete_order")}
                className="px-2 py-2 border border-danger/30 bg-danger-light rounded-lg text-[10px] font-semibold text-danger hover:bg-danger/10 transition-colors flex items-center justify-center gap-1"
              >
                <AlertTriangle size={10} /> Delete Permanently
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
