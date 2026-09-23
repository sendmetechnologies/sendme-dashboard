import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { getSession } from "@/lib/auth"

const BUCKET = "org_documents"

// Storage folder -> key inside organization_profiles.verification_documents.
const ORG_DOC_MAP: Record<string, string> = {
  business_registration: "business_registration_doc_url",
  tax_certificate: "tax_certificate_url",
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 })
  }

  const file = form.get("file")
  const docKey = String(form.get("docKey") || "")

  if (!file || typeof file === "string" || (file as File).size === 0) {
    return NextResponse.json({ error: "A file is required" }, { status: 400 })
  }
  const jsonKey = ORG_DOC_MAP[docKey]
  if (!jsonKey) {
    return NextResponse.json({ error: "Unknown document type" }, { status: 400 })
  }

  try {
    const f = file as File
    const bytes = await f.arrayBuffer()
    const contentType = f.type || "application/octet-stream"
    const safeName = (f.name || `doc-${Date.now()}`).replace(/[^a-zA-Z0-9._-]/g, "_")
    const path = `${id}/${docKey}/${Date.now()}_${safeName}`

    const { error: upErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType, upsert: true })

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 })
    }

    const { data: pub } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)
    const url = pub.publicUrl

    const { data: profile } = await supabaseAdmin
      .from("organization_profiles")
      .select("verification_documents")
      .eq("id", id)
      .maybeSingle()

    const current = (profile?.verification_documents && typeof profile.verification_documents === "object"
      ? profile.verification_documents
      : {}) as Record<string, unknown>
    const merged = { ...current, [jsonKey]: url }

    const { error: dbErr } = await supabaseAdmin
      .from("organization_profiles")
      .upsert(
        { id, verification_documents: merged, updated_at: new Date().toISOString() },
        { onConflict: "id" }
      )

    if (dbErr) {
      return NextResponse.json({ error: dbErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, url, docKey })
  } catch (err) {
    console.error("[Org Upload] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
