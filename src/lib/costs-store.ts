import { supabaseAdmin } from "@/lib/supabase"
import fs from "fs"
import path from "path"

export interface OperationalCost {
  id: string
  category: "sms_otp" | "maps_api" | "cloud_server" | "marketing" | "refunds" | "legal" | "equipment" | "other"
  categoryLabel: string
  title: string
  amount: number
  vendor: string
  date: string
  notes?: string
  recordedBy?: string
  createdAt: string
}

const CATEGORY_LABELS: Record<string, string> = {
  sms_otp: "SMS & OTP Verification",
  maps_api: "Google Maps & Geocoding API",
  cloud_server: "Cloud Hosting & Supabase DB",
  marketing: "Rider/Sender Acquisition & Promos",
  refunds: "Dispute / Customer Refund",
  legal: "Legal, CAC & Compliance",
  equipment: "Branding & Rider Vests/Boxes",
  other: "General Administrative Overhead",
}

// Fallback in-memory / local storage
const FALLBACK_FILE = path.join(process.cwd(), "operational-costs.json")

function getLocalCosts(): OperationalCost[] {
  try {
    if (fs.existsSync(FALLBACK_FILE)) {
      const data = fs.readFileSync(FALLBACK_FILE, "utf-8")
      return JSON.parse(data)
    }
  } catch (e) {
    console.error("[CostsStore] Local read error:", e)
  }
  // Default seed entries for realistic operational visibility
  return [
    {
      id: "cost-1",
      category: "cloud_server",
      categoryLabel: "Cloud Hosting & Supabase DB",
      title: "Supabase Pro + Edge Compute",
      amount: 45000,
      vendor: "Supabase Inc.",
      date: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10),
      recordedBy: "Super Admin",
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: "cost-2",
      category: "maps_api",
      categoryLabel: "Google Maps & Geocoding API",
      title: "Google Cloud Platform Geocoding & Routes",
      amount: 32500,
      vendor: "Google Cloud",
      date: new Date(Date.now() - 8 * 86400000).toISOString().slice(0, 10),
      recordedBy: "Super Admin",
      createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    },
    {
      id: "cost-3",
      category: "sms_otp",
      categoryLabel: "SMS & OTP Verification",
      title: "Termii / Twilio SMS Credits (Driver Auth)",
      amount: 18000,
      vendor: "Termii Technologies",
      date: new Date(Date.now() - 12 * 86400000).toISOString().slice(0, 10),
      recordedBy: "Super Admin",
      createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    },
  ]
}

function saveLocalCosts(costs: OperationalCost[]) {
  try {
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(costs, null, 2), "utf-8")
  } catch (e) {
    console.error("[CostsStore] Local write error:", e)
  }
}

export async function getOperationalCosts(): Promise<OperationalCost[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("operational_costs")
      .select("*")
      .order("date", { ascending: false })

    if (!error && data) {
      return data.map((d: any) => ({
        id: d.id,
        category: d.category,
        categoryLabel: CATEGORY_LABELS[d.category] || d.category,
        title: d.title || d.description,
        amount: Number(d.amount) || 0,
        vendor: d.vendor || "—",
        date: d.date || d.created_at?.slice(0, 10),
        notes: d.notes,
        recordedBy: d.recorded_by || "Admin",
        createdAt: d.created_at,
      }))
    }
  } catch (e) {
    // Fall back to local
  }
  return getLocalCosts()
}

export async function addOperationalCost(cost: Omit<OperationalCost, "id" | "categoryLabel" | "createdAt">): Promise<OperationalCost> {
  const newCost: OperationalCost = {
    ...cost,
    id: `cost-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    categoryLabel: CATEGORY_LABELS[cost.category] || cost.category,
    createdAt: new Date().toISOString(),
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("operational_costs")
      .insert({
        category: cost.category,
        title: cost.title,
        amount: cost.amount,
        vendor: cost.vendor,
        date: cost.date,
        notes: cost.notes,
        recorded_by: cost.recordedBy || "Super Admin",
      })
      .select()
      .single()

    if (!error && data) {
      return {
        id: data.id,
        category: data.category,
        categoryLabel: CATEGORY_LABELS[data.category] || data.category,
        title: data.title,
        amount: Number(data.amount) || 0,
        vendor: data.vendor,
        date: data.date,
        notes: data.notes,
        recordedBy: data.recorded_by,
        createdAt: data.created_at,
      }
    }
  } catch (e) {
    // Fall back to local
  }

  const current = getLocalCosts()
  const updated = [newCost, ...current]
  saveLocalCosts(updated)
  return newCost
}

export async function deleteOperationalCost(id: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from("operational_costs")
      .delete()
      .eq("id", id)
    if (!error) return true
  } catch (e) {
    // Fallback
  }

  const current = getLocalCosts()
  const updated = current.filter((c) => c.id !== id)
  saveLocalCosts(updated)
  return true
}
