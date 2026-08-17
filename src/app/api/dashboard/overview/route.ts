import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

type GU = "h" | "d" | "m"

function parsePeriod(req: NextRequest) {
  const sp = new URL(req.url).searchParams
  const id = sp.get("period") || "this_week"
  const from = sp.get("from"), to = sp.get("to")
  const now = new Date()
  const t = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const ms = 864e5
  let cs: Date, ce: Date, ps: Date, pe: Date, g: GU = "d"
  let pl = "", ppl = ""
  const dow = now.getDay(), monOff = dow === 0 ? 6 : dow - 1

  switch (id) {
    case "today":
      cs = t; ce = now; ps = new Date(t.getTime() - ms); pe = new Date(t.getTime() - 1); g = "h"
      pl = "Today"; ppl = "Yesterday"; break
    case "yesterday":
      cs = new Date(t.getTime() - ms); ce = new Date(t.getTime() - 1)
      ps = new Date(t.getTime() - 2 * ms); pe = new Date(t.getTime() - ms - 1); g = "h"
      pl = "Yesterday"; ppl = "Day Before"; break
    case "this_week": {
      const m = new Date(t.getTime() - monOff * ms)
      cs = m; ce = now; ps = new Date(m.getTime() - 7 * ms); pe = new Date(m.getTime() - 1)
      pl = "This Week"; ppl = "Last Week"; break
    }
    case "last_week": {
      const m = new Date(t.getTime() - monOff * ms)
      cs = new Date(m.getTime() - 7 * ms); ce = new Date(m.getTime() - 1)
      ps = new Date(cs.getTime() - 7 * ms); pe = new Date(cs.getTime() - 1)
      pl = "Last Week"; ppl = "Week Before"; break
    }
    case "this_month": {
      cs = new Date(now.getFullYear(), now.getMonth(), 1); ce = now
      const e = new Date(cs.getTime() - ms)
      ps = new Date(e.getFullYear(), e.getMonth(), 1); pe = e
      pl = "This Month"; ppl = "Last Month"; break
    }
    case "last_month":
      cs = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      ce = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
      ps = new Date(now.getFullYear(), now.getMonth() - 2, 1)
      pe = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59)
      pl = "Last Month"; ppl = "Month Before"; break
    case "this_year":
      cs = new Date(now.getFullYear(), 0, 1); ce = now
      ps = new Date(now.getFullYear() - 1, 0, 1)
      pe = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59)
      g = "m"; pl = "This Year"; ppl = "Last Year"; break
    default:
      if (id === "custom" && from && to) {
        cs = new Date(from + "T00:00:00"); ce = new Date(to + "T23:59:59")
        const dur = ce.getTime() - cs.getTime()
        ps = new Date(cs.getTime() - dur); pe = new Date(cs.getTime() - 1)
        pl = "Custom Range"; ppl = "Previous Range"
      } else {
        const m = new Date(t.getTime() - monOff * ms)
        cs = m; ce = now; ps = new Date(m.getTime() - 7 * ms); pe = new Date(m.getTime() - 1)
        pl = "This Week"; ppl = "Last Week"
      }
  }
  return { cs: cs!, ce: ce!, ps: ps!, pe: pe!, g, pl, ppl }
}

function gk(d: Date, u: GU): string {
  if (u === "h") return String(d.getHours())
  if (u === "d") return d.toISOString().split("T")[0]
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function lb(k: string, u: GU): string {
  if (u === "h") { const h = +k; return h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p` }
  if (u === "d") return new Date(k + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
  const [y, m] = k.split("-")
  return new Date(+y, +m - 1).toLocaleDateString("en-US", { month: "short" })
}

function slots(s: Date, e: Date, u: GU): string[] {
  const r: string[] = []
  if (u === "h") { const sh = s.getHours(), eh = e.getHours(); for (let h = sh; h <= eh; h++) r.push(String(h)) }
  else if (u === "d") { const c = new Date(s); while (c <= e) { r.push(gk(c, "d")); c.setDate(c.getDate() + 1) } }
  else { const c = new Date(s.getFullYear(), s.getMonth(), 1); const em = new Date(e.getFullYear(), e.getMonth(), 1); while (c <= em) { r.push(gk(c, "m")); c.setMonth(c.getMonth() + 1) } }
  return r
}

function cnt<T>(items: T[], pick: (t: T) => string | null, u: GU, sl: string[]): Record<string, number> {
  const m: Record<string, number> = {}; for (const s of sl) m[s] = 0
  for (const i of items) { const ds = pick(i); if (!ds) continue; const k = gk(new Date(ds), u); if (k in m) m[k]++ }
  return m
}

function sum<T>(items: T[], pick: (t: T) => { val: number; date: string | null }, u: GU, sl: string[]): Record<string, number> {
  const m: Record<string, number> = {}; for (const s of sl) m[s] = 0
  for (const i of items) { const { val, date } = pick(i); if (!date) continue; const k = gk(new Date(date), u); if (k in m) m[k] += val }
  return m
}

function delta(c: number, p: number) {
  const d = c - p
  const pct = p > 0 ? Math.round((d / p) * 1000) / 10 : c > 0 ? 100 : 0
  return { current: c, previous: p, delta: d, deltaPercent: pct, direction: (d > 0 ? "up" : d < 0 ? "down" : "flat") as "up" | "down" | "flat" }
}

function fmtAmt(v: number) {
  if (v >= 1e9) return `₦${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `₦${(v / 1e6).toFixed(1)}M`
  if (v >= 1e3) return `₦${(v / 1e3).toFixed(1)}K`
  return `₦${v.toLocaleString()}`
}

export async function GET(req: NextRequest) {
  try {
    const { cs, ce, ps, pe, g, pl, ppl } = parsePeriod(req)
    const cSI = cs.toISOString(), cEI = ce.toISOString()
    const pSI = ps.toISOString(), pEI = pe.toISOString()
    const cSl = slots(cs, ce, g), pSl = slots(ps, pe, g)

    const [
      curOrders, prevOrders, curUsers, prevUsers, curTx, prevTx,
      allOrders, allPayouts, wallets,
      rv, rp, rs, ov, op,
      rOrders, rRiders, rSenders, rOrgs,
      curOrgs, prevOrgs, curMarketers, prevMarketers,
    ] = await Promise.all([
      supabaseAdmin.from("orders").select("id, status, final_price, created_at, pickup_address, dropoff_address, customer_id, accepted_driver_id").gte("created_at", cSI).lte("created_at", cEI),
      supabaseAdmin.from("orders").select("id, status, final_price, created_at").gte("created_at", pSI).lte("created_at", pEI),
      supabaseAdmin.from("users").select("id, role, created_at").gte("created_at", cSI).lte("created_at", cEI),
      supabaseAdmin.from("users").select("id, role, created_at").gte("created_at", pSI).lte("created_at", pEI),
      supabaseAdmin.from("transactions").select("amount, created_at").eq("type", "payout").gte("created_at", cSI).lte("created_at", cEI),
      supabaseAdmin.from("transactions").select("amount, created_at").eq("type", "payout").gte("created_at", pSI).lte("created_at", pEI),
      supabaseAdmin.from("orders").select("id, status, final_price, created_at, pickup_address, dropoff_address, customer_id, accepted_driver_id").order("created_at", { ascending: false }),
      supabaseAdmin.from("payout_requests").select("id, amount, status"),
      supabaseAdmin.from("wallets").select("balance"),
      supabaseAdmin.from("driver_profiles").select("id", { count: "exact", head: true }).eq("verification_status", "verified"),
      supabaseAdmin.from("driver_profiles").select("id", { count: "exact", head: true }).eq("verification_status", "pending"),
      supabaseAdmin.from("driver_profiles").select("id", { count: "exact", head: true }).eq("verification_status", "rejected"),
      supabaseAdmin.from("organization_profiles").select("id", { count: "exact", head: true }).eq("is_verified", true),
      supabaseAdmin.from("organization_profiles").select("id", { count: "exact", head: true }).eq("is_verified", false),
      supabaseAdmin.from("orders").select("id, status, final_price, pickup_address, dropoff_address, created_at, customer_id, accepted_driver_id").order("created_at", { ascending: false }).limit(5),
      supabaseAdmin.from("users").select("id, full_name, phone, email, created_at, driver_profiles(verification_status, rating, vehicle_info)").eq("role", "driver").order("created_at", { ascending: false }).limit(5),
      supabaseAdmin.from("users").select("id, full_name, phone, email, created_at").eq("role", "customer").order("created_at", { ascending: false }).limit(5),
      supabaseAdmin.from("organization_profiles").select("id, business_name, business_email, contact_person_name, is_verified, created_at").order("created_at", { ascending: false }).limit(5),
      supabaseAdmin.from("organization_profiles").select("id, created_at").gte("created_at", cSI).lte("created_at", cEI),
      supabaseAdmin.from("organization_profiles").select("id, created_at").gte("created_at", pSI).lte("created_at", pEI),
      supabaseAdmin.from("marketers").select("id, created_at").gte("created_at", cSI).lte("created_at", cEI),
      supabaseAdmin.from("marketers").select("id, created_at").gte("created_at", pSI).lte("created_at", pEI),
    ])

    const cO = curOrders.data || [], pO = prevOrders.data || []
    const cU = curUsers.data || [], pU = prevUsers.data || []
    const cT = curTx.data || [], pT = prevTx.data || []
    const aO = allOrders.data || []

    const totalSenders = (await supabaseAdmin.from("users").select("id", { count: "exact", head: true }).eq("role", "customer")).count || 0
    const totalRiders = (await supabaseAdmin.from("users").select("id", { count: "exact", head: true }).eq("role", "driver")).count || 0
    const totalOrgs = (await supabaseAdmin.from("organization_profiles").select("id", { count: "exact", head: true })).count || 0

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    function fmtSlot(k: string): string {
      if (g === "h") return lb(k, "h")
      if (g === "m") return lb(k, "m")
      const d = new Date(k + "T12:00:00")
      return `${dayNames[d.getDay()]} ${d.getDate()}`
    }

    const cDel = cnt(cO, o => o.created_at, g, cSl)
    const pDel = cnt(pO, o => o.created_at, g, pSl)
    const cRev = sum(cO, o => ({ val: Number(o.final_price) || 0, date: o.created_at }), g, cSl)
    const pRev = sum(pO, o => ({ val: Number(o.final_price) || 0, date: o.created_at }), g, pSl)
    const cSend = cnt(cU.filter(u => u.role === "customer"), u => u.created_at, g, cSl)
    const pSend = cnt(pU.filter(u => u.role === "customer"), u => u.created_at, g, pSl)
    const cRid = cnt(cU.filter(u => u.role === "driver"), u => u.created_at, g, cSl)
    const pRid = cnt(pU.filter(u => u.role === "driver"), u => u.created_at, g, pSl)
    const cOrg = cnt(curOrgs.data || [], (o: any) => o.created_at, g, cSl)
    const pOrg = cnt(prevOrgs.data || [], (o: any) => o.created_at, g, pSl)
    const cMkt = cnt(curMarketers.data || [], (m: any) => m.created_at, g, cSl)
    const pMkt = cnt(prevMarketers.data || [], (m: any) => m.created_at, g, pSl)
    const cPay = sum(cT, t => ({ val: Number(t.amount) || 0, date: t.created_at }), g, cSl)
    const pPay = sum(pT, t => ({ val: Number(t.amount) || 0, date: t.created_at }), g, pSl)

    const curDelTotal = cO.length, prevDelTotal = pO.length
    const curRevTotal = cO.reduce((s, o) => s + (Number(o.final_price) || 0), 0)
    const prevRevTotal = pO.reduce((s, o) => s + (Number(o.final_price) || 0), 0)
    const curSendTotal = cU.filter(u => u.role === "customer").length
    const prevSendTotal = pU.filter(u => u.role === "customer").length
    const curRidTotal = cU.filter(u => u.role === "driver").length
    const prevRidTotal = pU.filter(u => u.role === "driver").length
    const curOrgTotal = (curOrgs.data || []).length
    const prevOrgTotal = (prevOrgs.data || []).length
    const curMktTotal = (curMarketers.data || []).length
    const prevMktTotal = (prevMarketers.data || []).length
    const curPayTotal = cT.reduce((s, t) => s + (Number(t.amount) || 0), 0)
    const prevPayTotal = pT.reduce((s, t) => s + (Number(t.amount) || 0), 0)

    const comp = {
      deliveries: delta(curDelTotal, prevDelTotal),
      revenue: delta(curRevTotal, prevRevTotal),
      newSenders: delta(curSendTotal, prevSendTotal),
      newRiders: delta(curRidTotal, prevRidTotal),
      newOrgs: delta(curOrgTotal, prevOrgTotal),
      newMarketers: delta(curMktTotal, prevMktTotal),
      payouts: delta(curPayTotal, prevPayTotal),
    }

    const allPayoutsData = allPayouts.data || []
    const walletsData = wallets.data || []
    const riders = (rRiders.data || [])
    const orgVerified = ov.count || 0, orgPending = op.count || 0

    return NextResponse.json({
      period: { current: pl, previous: ppl, groupBy: g },
      stats: {
        senders: {
          total: totalSenders,
          active: totalSenders,
          verified: aO.filter(o => o.status === "delivered").length > 0 ? Math.min(aO.filter(o => o.status === "delivered").length, totalSenders) : 0,
          suspended: 0,
        },
        riders: { total: totalRiders, verified: rv.count || 0, pending: rp.count || 0, suspended: rs.count || 0 },
        organizations: { total: totalOrgs, verified: orgVerified, pending: orgPending, suspended: totalOrgs - orgVerified - orgPending },
        payouts: {
          total: allPayoutsData.length,
          totalFunds: walletsData.reduce((s, w) => s + (Number(w.balance) || 0), 0),
          totalRequests: allPayoutsData.reduce((s, p) => s + (Number(p.amount) || 0), 0),
          recent: allPayoutsData.filter(p => p.status === "completed" || p.status === "paid").length,
          pending: allPayoutsData.filter(p => p.status === "pending").length,
        },
        deliveries: {
          total: aO.length,
          completed: aO.filter(o => o.status === "delivered").length,
          searching: aO.filter(o => o.status === "searching").length,
          inTransit: aO.filter(o => ["accepted", "picked_up", "bidding"].includes(o.status)).length,
          failed: aO.filter(o => o.status === "canceled").length,
        },
      },
      comparison: comp,
      charts: {
        deliveries: cSl.map((k, i) => ({ label: fmtSlot(k), value: cDel[k] ?? 0, prevValue: i < pSl.length ? (pDel[pSl[i]] ?? 0) : 0 })),
        revenue: cSl.map((k, i) => ({ label: fmtSlot(k), value: cRev[k] ?? 0, prevValue: i < pSl.length ? (pRev[pSl[i]] ?? 0) : 0 })),
        userGrowth: cSl.map((k, i) => ({ label: fmtSlot(k), senders: cSend[k] ?? 0, riders: cRid[k] ?? 0, orgs: cOrg[k] ?? 0, marketers: cMkt[k] ?? 0, prevSenders: i < pSl.length ? (pSend[pSl[i]] ?? 0) : 0, prevRiders: i < pSl.length ? (pRid[pSl[i]] ?? 0) : 0, prevOrgs: i < pSl.length ? (pOrg[pSl[i]] ?? 0) : 0, prevMarketers: i < pSl.length ? (pMkt[pSl[i]] ?? 0) : 0 })),
        payoutTrend: cSl.map((k, i) => ({ label: fmtSlot(k), amount: cPay[k] ?? 0, prevAmount: i < pSl.length ? (pPay[pSl[i]] ?? 0) : 0 })),
      },
      recent: {
        deliveries: (rOrders.data || []).map(o => ({ id: o.id.slice(0, 8).toUpperCase(), status: o.status, from: o.pickup_address || "—", to: o.dropoff_address || "—", price: o.final_price, created_at: o.created_at })),
        riders: riders.map((r: any) => ({ id: r.id, name: r.full_name || "—", phone: r.phone || "—", status: r.driver_profiles?.verification_status || "pending", rating: r.driver_profiles?.rating || 0, vehicle: r.driver_profiles?.vehicle_info?.type || "—", created_at: r.created_at })),
        senders: (rSenders.data || []).map(s => ({ id: s.id, name: s.full_name || "—", email: s.email || "—", phone: s.phone || "—", created_at: s.created_at })),
        organizations: (rOrgs.data || []).map(o => ({ id: o.id, name: o.business_name || "—", contact: o.contact_person_name || "—", email: o.business_email || "—", verified: o.is_verified, created_at: o.created_at })),
      },
    })
  } catch (err) {
    console.error("[Dashboard] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
