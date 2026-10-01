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
  frequency?: "monthly" | "yearly" | "usage_based" | "one_off"
  nextPaymentDate?: string
  nextPaymentAmount?: number
  nextPaymentNote?: string
}

export interface MonthlyRunningCostSummary {
  totalEstimatedMonthly: number
  totalEstimatedMonthlyFormatted: string
  recurringServices: {
    name: string
    vendor: string
    frequency: string
    costFormatted: string
    nextDueDate: string
    status: string
  }[]
  annualCommitments: {
    name: string
    costFormatted: string
    nextDueDate: string
  }[]
  nextPaymentTimeline: {
    dueDate: string
    service: string
    amountFormatted: string
    note: string
  }[]
}

const CATEGORY_LABELS: Record<string, string> = {
  sms_otp: "SMS & OTP Verification",
  maps_api: "Google Maps & Geocoding API",
  cloud_server: "Cloud Hosting & Mobile Builds",
  marketing: "Rider/Sender Acquisition & Promos",
  refunds: "Dispute / Customer Refund",
  legal: "Developer Licenses & Compliance",
  equipment: "Branding & Rider Vests/Boxes",
  other: "Communications & Domain Overhead",
}

// Fallback in-memory / local storage
const FALLBACK_FILE = path.join(process.cwd(), "operational-costs.json")

const DEFAULT_SEEDED_COSTS: OperationalCost[] = [
  {
    id: "cost-apple-2026",
    category: "legal",
    categoryLabel: "Developer Licenses & Compliance",
    title: "Apple Developer Program Membership (Annual)",
    amount: 148000,
    vendor: "Apple Inc.",
    date: "2026-09-04",
    notes: "iOS App Store distribution license ($99 USD). Paid Sep 4, 2026.",
    recordedBy: "igbomalam",
    createdAt: "2026-09-04T10:00:00.000Z",
    frequency: "yearly",
    nextPaymentDate: "2027-09-04",
    nextPaymentAmount: 148000,
    nextPaymentNote: "Due Sep 4, 2027 ($99 / ~₦148,000)",
  },
  {
    id: "cost-domain-2026",
    category: "other",
    categoryLabel: "Communications & Domain Overhead",
    title: "Domain Name Registration (senndme.com / sendme.ng)",
    amount: 20000,
    vendor: "Domain Registrar",
    date: "2026-02-15",
    notes: "Annual domain registration. Next renewal due February 2027.",
    recordedBy: "igbomalam",
    createdAt: "2026-02-15T12:00:00.000Z",
    frequency: "yearly",
    nextPaymentDate: "2027-02-15",
    nextPaymentAmount: 20000,
    nextPaymentNote: "Due February 2027 (₦20,000/yr)",
  },
  {
    id: "cost-gmaps-2026-09",
    category: "maps_api",
    categoryLabel: "Google Maps & Geocoding API",
    title: "Google Cloud Platform Geocoding & Routes (September)",
    amount: 30000,
    vendor: "Google Cloud Platform",
    date: "2026-09-01",
    notes: "Geocoding, distance matrix & route computation. Previous bill: ₦30,000.",
    recordedBy: "igbomalam",
    createdAt: "2026-09-01T08:00:00.000Z",
    frequency: "monthly",
    nextPaymentDate: "2026-10-05",
    nextPaymentAmount: 18500,
    nextPaymentNote: "Due 5th Oct: Expected $9–$15 (₦14,000–₦23,000)",
  },
  {
    id: "cost-termii-2026-09",
    category: "sms_otp",
    categoryLabel: "SMS & OTP Verification",
    title: "Termii SMS & WhatsApp OTP Credits (September)",
    amount: 19500,
    vendor: "Termii Technologies",
    date: "2026-09-18",
    notes: "Driver & sender verification credit top-up. No fixed next payment date.",
    recordedBy: "igbomalam",
    createdAt: "2026-09-18T14:30:00.000Z",
    frequency: "usage_based",
    nextPaymentDate: "Usage-based",
    nextPaymentAmount: 0,
    nextPaymentNote: "No next pay till current credits exhaust",
  },
  {
    id: "cost-expo-2026-09",
    category: "cloud_server",
    categoryLabel: "Cloud Hosting & Mobile Builds",
    title: "Expo Pro Cloud EAS Builds & Updates (September)",
    amount: 28000,
    vendor: "Expo (650 Industries)",
    date: "2026-09-05",
    notes: "Monthly EAS build subscription & over-the-air updates (₦28,000/mo).",
    recordedBy: "igbomalam",
    createdAt: "2026-09-05T09:00:00.000Z",
    frequency: "monthly",
    nextPaymentDate: "2026-10-05",
    nextPaymentAmount: 28000,
    nextPaymentNote: "Due 5th Oct: ₦28,000",
  },
  {
    id: "cost-sendbyte-2026-09",
    category: "other",
    categoryLabel: "Communications & Domain Overhead",
    title: "Sendbyte WhatsApp Messaging Gateway (September)",
    amount: 15000,
    vendor: "Sendbyte",
    date: "2026-09-05",
    notes: "Monthly WhatsApp notification gateway service (₦15,000/mo).",
    recordedBy: "igbomalam",
    createdAt: "2026-09-05T09:15:00.000Z",
    frequency: "monthly",
    nextPaymentDate: "2026-10-05",
    nextPaymentAmount: 15000,
    nextPaymentNote: "Due 5th Oct: ₦15,000",
  },
  {
    id: "cost-sb-2026-09",
    category: "cloud_server",
    categoryLabel: "Cloud Hosting & Mobile Builds",
    title: "Supabase Pro Database & Realtime (September)",
    amount: 37000,
    vendor: "Supabase Inc.",
    date: "2026-09-05",
    notes: "Database, Realtime & Edge Functions ($25 USD). Next billing upgrades to $35.",
    recordedBy: "igbomalam",
    createdAt: "2026-09-05T09:30:00.000Z",
    frequency: "monthly",
    nextPaymentDate: "2026-10-05",
    nextPaymentAmount: 51000,
    nextPaymentNote: "Due 5th Oct: $35 (₦51,000) upward",
  },
  {
    id: "cost-termii-2026-08",
    category: "sms_otp",
    categoryLabel: "SMS & OTP Verification",
    title: "Termii SMS & WhatsApp OTP Credits (August)",
    amount: 9500,
    vendor: "Termii Technologies",
    date: "2026-08-14",
    notes: "Driver phone verification credit top-up.",
    recordedBy: "igbomalam",
    createdAt: "2026-08-14T11:20:00.000Z",
    frequency: "usage_based",
  },
  {
    id: "cost-expo-2026-08",
    category: "cloud_server",
    categoryLabel: "Cloud Hosting & Mobile Builds",
    title: "Expo Pro Cloud EAS Builds & Updates (August)",
    amount: 28000,
    vendor: "Expo (650 Industries)",
    date: "2026-08-05",
    notes: "Monthly EAS build subscription.",
    recordedBy: "igbomalam",
    createdAt: "2026-08-05T09:00:00.000Z",
    frequency: "monthly",
  },
  {
    id: "cost-sb-2026-08",
    category: "cloud_server",
    categoryLabel: "Cloud Hosting & Mobile Builds",
    title: "Supabase Pro Database & Realtime (August)",
    amount: 37000,
    vendor: "Supabase Inc.",
    date: "2026-08-05",
    notes: "Monthly Pro tier subscription ($25 USD).",
    recordedBy: "igbomalam",
    createdAt: "2026-08-05T09:30:00.000Z",
    frequency: "monthly",
  },
  {
    id: "cost-termii-2026-07",
    category: "sms_otp",
    categoryLabel: "SMS & OTP Verification",
    title: "Termii SMS & WhatsApp OTP Credits (July)",
    amount: 3000,
    vendor: "Termii Technologies",
    date: "2026-07-12",
    notes: "Initial verification test bundle.",
    recordedBy: "igbomalam",
    createdAt: "2026-07-12T10:00:00.000Z",
    frequency: "usage_based",
  },
  {
    id: "cost-expo-2026-07",
    category: "cloud_server",
    categoryLabel: "Cloud Hosting & Mobile Builds",
    title: "Expo Pro Cloud EAS Builds & Updates (July)",
    amount: 28000,
    vendor: "Expo (650 Industries)",
    date: "2026-07-05",
    notes: "Monthly EAS build subscription.",
    recordedBy: "igbomalam",
    createdAt: "2026-07-05T09:00:00.000Z",
    frequency: "monthly",
  },
  {
    id: "cost-sb-2026-07",
    category: "cloud_server",
    categoryLabel: "Cloud Hosting & Mobile Builds",
    title: "Supabase Pro Database & Realtime (July)",
    amount: 37000,
    vendor: "Supabase Inc.",
    date: "2026-07-05",
    notes: "Monthly Pro tier subscription ($25 USD).",
    recordedBy: "igbomalam",
    createdAt: "2026-07-05T09:30:00.000Z",
    frequency: "monthly",
  },
  {
    id: "cost-sb-2026-06",
    category: "cloud_server",
    categoryLabel: "Cloud Hosting & Mobile Builds",
    title: "Supabase Pro Database & Realtime (June)",
    amount: 37000,
    vendor: "Supabase Inc.",
    date: "2026-06-05",
    notes: "Monthly Pro tier subscription ($25 USD).",
    recordedBy: "igbomalam",
    createdAt: "2026-06-05T09:30:00.000Z",
    frequency: "monthly",
  },
]

function getLocalCosts(): OperationalCost[] {
  try {
    if (fs.existsSync(FALLBACK_FILE)) {
      const data = fs.readFileSync(FALLBACK_FILE, "utf-8")
      return JSON.parse(data)
    }
  } catch (e) {
    console.error("[CostsStore] Local read error:", e)
  }
  return DEFAULT_SEEDED_COSTS
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

    if (!error && data && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        category: d.category,
        categoryLabel: CATEGORY_LABELS[d.category] || d.category,
        title: d.title || d.description,
        amount: Number(d.amount) || 0,
        vendor: d.vendor || "—",
        date: d.date || d.created_at?.slice(0, 10),
        notes: d.notes,
        recordedBy: d.recorded_by || "igbomalam",
        createdAt: d.created_at,
        frequency: d.frequency,
        nextPaymentDate: d.next_payment_date,
        nextPaymentAmount: d.next_payment_amount,
        nextPaymentNote: d.next_payment_note,
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
        recorded_by: cost.recordedBy || "igbomalam",
        frequency: cost.frequency,
        next_payment_date: cost.nextPaymentDate,
        next_payment_amount: cost.nextPaymentAmount,
        next_payment_note: cost.nextPaymentNote,
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
        frequency: data.frequency,
        nextPaymentDate: data.next_payment_date,
        nextPaymentAmount: data.next_payment_amount,
        nextPaymentNote: data.next_payment_note,
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

export function calculateMonthlyRunningCostSummary(): MonthlyRunningCostSummary {
  // Monthly recurring core services:
  // Supabase ($35+): ₦51,000
  // Expo Pro: ₦28,000
  // Sendbyte: ₦15,000
  // Google Maps (est $9-$15): ₦18,500 avg
  // Termii SMS burn: ~₦14,000 avg
  const supabaseMonthly = 51000
  const expoMonthly = 28000
  const sendbyteMonthly = 15000
  const mapsMonthly = 18500
  const termiiMonthly = 14000

  const totalEstimatedMonthly =
    supabaseMonthly + expoMonthly + sendbyteMonthly + mapsMonthly + termiiMonthly

  return {
    totalEstimatedMonthly,
    totalEstimatedMonthlyFormatted: `₦${totalEstimatedMonthly.toLocaleString()}`,
    recurringServices: [
      {
        name: "Supabase Pro Tier (DB + Realtime)",
        vendor: "Supabase Inc.",
        frequency: "Monthly",
        costFormatted: "₦51,000 ($35+)",
        nextDueDate: "5th Oct 2026",
        status: "Due Soon",
      },
      {
        name: "Expo Pro Cloud EAS Builds",
        vendor: "Expo (650 Industries)",
        frequency: "Monthly",
        costFormatted: "₦28,000",
        nextDueDate: "5th Oct 2026",
        status: "Due Soon",
      },
      {
        name: "Sendbyte WhatsApp Gateway",
        vendor: "Sendbyte",
        frequency: "Monthly",
        costFormatted: "₦15,000",
        nextDueDate: "5th Oct 2026",
        status: "Due Soon",
      },
      {
        name: "Google Maps & Routes Utility",
        vendor: "Google Cloud Platform",
        frequency: "Monthly (Usage)",
        costFormatted: "₦14,000 – ₦23,000",
        nextDueDate: "5th Oct 2026",
        status: "Due Soon",
      },
      {
        name: "Termii SMS / WhatsApp OTP",
        vendor: "Termii Technologies",
        frequency: "Pay-As-You-Go",
        costFormatted: "~₦14,000 (Burn rate)",
        nextDueDate: "On Credit Depletion",
        status: "Active Balance",
      },
    ],
    annualCommitments: [
      {
        name: "Apple Developer Program Membership",
        costFormatted: "$99 (~₦148,000/yr)",
        nextDueDate: "Sep 4th, 2027",
      },
      {
        name: "Domain Registration (senndme.com)",
        costFormatted: "₦20,000/yr",
        nextDueDate: "February 2027",
      },
    ],
    nextPaymentTimeline: [
      {
        dueDate: "Oct 5th, 2026",
        service: "Supabase Pro Upgrade ($35)",
        amountFormatted: "₦51,000",
        note: "Upward from $25 Pro tier",
      },
      {
        dueDate: "Oct 5th, 2026",
        service: "Expo Pro EAS Builds",
        amountFormatted: "₦28,000",
        note: "Monthly subscription",
      },
      {
        dueDate: "Oct 5th, 2026",
        service: "Sendbyte WhatsApp Gateway",
        amountFormatted: "₦15,000",
        note: "Monthly gateway fee",
      },
      {
        dueDate: "Oct 5th, 2026",
        service: "Google Cloud Platform Maps",
        amountFormatted: "~₦18,500",
        note: "Expected $9 – $15 range",
      },
      {
        dueDate: "February 2027",
        service: "Domain Name Renewal",
        amountFormatted: "₦20,000",
        note: "senndme.com / sendme.ng",
      },
      {
        dueDate: "Sep 4th, 2027",
        service: "Apple Developer Account",
        amountFormatted: "₦148,000",
        note: "$99 annual developer license",
      },
    ],
  }
}
