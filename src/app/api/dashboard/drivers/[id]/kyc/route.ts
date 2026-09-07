import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { getSession } from "@/lib/auth"

const ALLOWED_ID_TYPES = ["NIN", "Voter's Card", "Driver's License", "International Passport", "Other"]

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { idType, idNumber } = body

    if (!idType || !ALLOWED_ID_TYPES.includes(idType)) {
      return NextResponse.json({ error: "Valid ID type is required" }, { status: 400 })
    }
    if (!idNumber || !String(idNumber).trim()) {
      return NextResponse.json({ error: "ID number is required" }, { status: 400 })
    }

    // Load current profile (may not exist yet) so we preserve existing keys (e.g. document_url)
    const { data: existing } = await supabaseAdmin
      .from("driver_profiles")
      .select("id_details")
      .eq("id", id)
      .single()

    const current = (existing?.id_details && typeof existing.id_details === "object" ? existing.id_details : {}) as Record<string, unknown>

    // Write canonical keys; the UI reads both `type`/`number` and `id_type`/`id_number`
    const merged = {
      ...current,
      type: idType,
      number: String(idNumber).trim(),
      id_type: idType,
      id_number: String(idNumber).trim(),
    }

    const { error } = await supabaseAdmin
      .from("driver_profiles")
      .upsert(
        { id, id_details: merged, updated_at: new Date().toISOString() },
        { onConflict: "id" }
      )

    if (error) {
      console.error("[Driver KYC] Upsert error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, idDetails: merged })
  } catch (err) {
    console.error("[Driver KYC] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
