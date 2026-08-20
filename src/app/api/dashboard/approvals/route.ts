import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tab = searchParams.get("tab") || "all";
  const type = searchParams.get("type") || "";
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  // Fetch driver verifications (under_review = pending approval)
  const driverQuery = supabaseAdmin
    .from("driver_profiles")
    .select(`
      id,
      verification_status,
      review_reason,
      id_details,
      vehicle_info,
      avatar_url,
      created_at,
      updated_at,
      user:users!driver_profiles_id_fkey (id, full_name, phone, email, state, created_at)
    `)
    .in("verification_status", ["under_review", "verified", "rejected"]);

  // Fetch organization verifications
  const orgQuery = supabaseAdmin
    .from("organization_profiles")
    .select(`
      id,
      business_name,
      business_address,
      business_phone,
      business_email,
      registration_number,
      verification_status,
      review_reason,
      verification_documents,
      is_verified,
      created_at,
      updated_at,
      user:users!organization_profiles_id_fkey (id, full_name, phone, email, state, created_at)
    `)
    .in("verification_status", ["under_review", "verified", "rejected"]);

  // Fetch organization payout requests
  const payoutQuery = supabaseAdmin
    .from("organization_payout_requests")
    .select(`
      id,
      organization_id,
      amount,
      bank_name,
      account_number,
      account_name,
      status,
      created_at,
      processed_at,
      org:users!organization_payout_requests_organization_id_fkey (id, full_name, phone, email)
    `);

  // Fetch marketer verification requests
  const marketerQuery = supabaseAdmin
    .from("marketer_profiles")
    .select(`
      id,
      user_id,
      phone,
      state,
      city,
      occupation,
      has_sales_experience,
      experience_description,
      marketer_id,
      status,
      review_reason,
      total_referrals,
      total_earnings,
      created_at,
      updated_at,
      user:users!marketer_profiles_user_id_fkey (id, full_name, phone, email, created_at)
    `)
    .in("status", ["pending", "approved", "rejected"]);

  const [driverResult, orgResult, payoutResult, marketerResult] = await Promise.all([
    driverQuery,
    orgQuery,
    payoutQuery,
    marketerQuery,
  ]);

  type ApprovalItem = {
    id: string;
    type: string;
    status: string;
    priority: string;
    requested_by: string;
    requested_by_role: string;
    avatar: string;
    created_at: string;
    details: Record<string, any>;
  };

  const items: ApprovalItem[] = [];

  // Process driver verifications
  if (driverResult.data) {
    for (const d of driverResult.data) {
      const user = d.user as any;
      const name = user?.full_name || "Unknown Driver";
      const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
      items.push({
        id: `DRV-${d.id.slice(0, 8).toUpperCase()}`,
        type: "driver_verification",
        status: d.verification_status === "verified" ? "approved" : d.verification_status === "rejected" ? "rejected" : "pending",
        priority: "high",
        requested_by: name,
        requested_by_role: "Driver",
        avatar: initials,
        created_at: d.updated_at || d.created_at,
        details: {
          user_id: d.id,
          phone: user?.phone || "—",
          email: user?.email || "—",
          state: user?.state || "—",
          id_details: d.id_details,
          vehicle_info: d.vehicle_info,
          avatar_url: d.avatar_url,
          review_reason: d.review_reason,
        },
      });
    }
  }

  // Process organization verifications
  if (orgResult.data) {
    for (const o of orgResult.data) {
      const user = o.user as any;
      const name = o.business_name || user?.full_name || "Unknown Org";
      const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
      items.push({
        id: `ORG-${o.id.slice(0, 8).toUpperCase()}`,
        type: "org_verification",
        status: o.verification_status === "verified" ? "approved" : o.verification_status === "rejected" ? "rejected" : "pending",
        priority: "medium",
        requested_by: name,
        requested_by_role: "Organization",
        avatar: initials,
        created_at: o.updated_at || o.created_at,
        details: {
          user_id: o.id,
          phone: o.business_phone || user?.phone || "—",
          email: o.business_email || user?.email || "—",
          business_address: o.business_address || "—",
          registration_number: o.registration_number || "—",
          verification_documents: o.verification_documents,
          review_reason: o.review_reason,
        },
      });
    }
  }

  // Process payout requests
  if (payoutResult.data) {
    for (const p of payoutResult.data) {
      const org = p.org as any;
      const name = org?.full_name || "Unknown Organization";
      const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
      items.push({
        id: `PAYOUT-${p.id.slice(0, 8).toUpperCase()}`,
        type: "payout_request",
        status: p.status === "completed" ? "approved" : p.status === "failed" ? "rejected" : "pending",
        priority: "medium",
        requested_by: name,
        requested_by_role: "Organization",
        avatar: initials,
        created_at: p.created_at,
        details: {
          payout_id: p.id,
          amount: p.amount,
          bank_name: p.bank_name,
          account_number: p.account_number,
          account_name: p.account_name,
          organization_id: p.organization_id,
          processed_at: p.processed_at,
        },
      });
    }
  }

  // Process marketer verifications
  if (marketerResult.data) {
    for (const m of marketerResult.data) {
      const user = m.user as any;
      const name = user?.full_name || "Unknown Marketer";
      const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
      items.push({
        id: `MRK-${m.id.slice(0, 8).toUpperCase()}`,
        type: "marketer_verification",
        status: m.status === "approved" ? "approved" : m.status === "rejected" ? "rejected" : "pending",
        priority: m.has_sales_experience ? "medium" : "high",
        requested_by: name,
        requested_by_role: "Marketer",
        avatar: initials,
        created_at: m.created_at,
        details: {
          user_id: m.user_id,
          phone: m.phone || user?.phone || "—",
          email: user?.email || "—",
          state: m.state || "—",
          city: m.city || "—",
          occupation: m.occupation || "—",
          has_sales_experience: m.has_sales_experience,
          experience_description: m.experience_description,
          marketer_id: m.marketer_id,
          review_reason: m.review_reason,
        },
      });
    }
  }

  // Sort by created_at descending
  items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Filter by tab (status)
  let filtered = items;
  if (tab === "pending") filtered = items.filter((i) => i.status === "pending");
  else if (tab === "approved") filtered = items.filter((i) => i.status === "approved");
  else if (tab === "rejected") filtered = items.filter((i) => i.status === "rejected");

  // Filter by type
  if (type) filtered = filtered.filter((i) => i.type === type);

  // Search
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (i) =>
        i.id.toLowerCase().includes(q) ||
        i.requested_by.toLowerCase().includes(q) ||
        i.type.toLowerCase().includes(q)
    );
  }

  // Stats
  const stats = {
    total: items.length,
    pending: items.filter((i) => i.status === "pending").length,
    approved: items.filter((i) => i.status === "approved").length,
    rejected: items.filter((i) => i.status === "rejected").length,
    by_type: {
      driver_verification: items.filter((i) => i.type === "driver_verification").length,
      org_verification: items.filter((i) => i.type === "org_verification").length,
      payout_request: items.filter((i) => i.type === "payout_request").length,
      marketer_verification: items.filter((i) => i.type === "marketer_verification").length,
    },
  };

  // Pagination
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const paged = filtered.slice(start, start + limit);

  return NextResponse.json({
    items: paged,
    stats,
    pagination: { page, limit, total, totalPages },
  });
}
