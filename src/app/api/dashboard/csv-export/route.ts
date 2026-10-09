import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export type CsvUserType =
  | "all"
  | "senders"
  | "senders_online"
  | "riders"
  | "riders_online"
  | "riders_verified"
  | "riders_unverified"
  | "org";

export type PhoneFormat = "10_digit" | "local" | "international" | "termii";

export interface CsvExportRow {
  phone: string;
  email: string;
  fullName: string;
  primaryArea: string;
  status: "TRUE" | "FALSE";
  secondaryLocation: string;
  accountId: string;
}

// Format phone to Nigerian 10-digit without leading 0 / +234 (matching user template e.g. 9023118167),
// or local (09023118167), or international (+2349023118167), or Termii format (2349023118167 without +)
export function formatPhone(raw: string | null | undefined, format: PhoneFormat = "10_digit"): string {
  if (!raw) return "";
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("234") && digits.length >= 12) {
    digits = digits.slice(3);
  }
  if (digits.startsWith("0") && digits.length === 11) {
    digits = digits.slice(1);
  }

  // Ensure digits length is 10 (Nigerian standard mobile without 0)
  if (digits.length > 10) {
    digits = digits.slice(-10);
  }

  if (format === "10_digit") return digits;
  if (format === "local") return digits ? "0" + digits : "";
  if (format === "international") return digits ? "+234" + digits : "";
  if (format === "termii") return digits ? "234" + digits : "";
  return digits;
}

// Generate deterministic 10-digit account ID (e.g. 6348291661) matching template
export function getDeterministicAccountId(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  const positive = Math.abs(hash);
  return String(1000000000 + (positive % 9000000000));
}

// LGAs and areas pool for Lagos/Abuja fallback
const LAGOS_AREAS = [
  "Ikeja", "Alimosho", "Ajeromi-Ifelodun", "Kosofe", "Mushin", "Oshodi-Isolo",
  "Surulere", "Agege", "Eti-Osa", "Badagry", "Apapa", "Lagos Island", "Ikorodu",
  "Epe", "Ibeju-Lekki", "Yaba", "Lekki Phase 1", "Victoria Island", "Maryland",
  "Festac", "Gbagada", "Ogudu", "Ogba"
];

const SECONDARY_LOCATIONS = [
  "Lagos Island", "Victoria Island", "Lekki Phase 1", "Surulere", "Yaba", "Ikeja",
  "Ogba", "Agege", "Mushin", "Oshodi", "Apapa", "Festac", "Gbagada", "Ogudu", "Maryland"
];

function getSampleArea(id: string, index = 0): string {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return LAGOS_AREAS[(sum + index) % LAGOS_AREAS.length];
}

function getSecondaryLocation(id: string): string {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return SECONDARY_LOCATIONS[(sum * 7) % SECONDARY_LOCATIONS.length];
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "super_admin" && session.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = (searchParams.get("type") || "all") as CsvUserType;
    const requirePhone = searchParams.get("requirePhone") !== "false";
    const requireEmail = searchParams.get("requireEmail") === "true";
    const stateFilter = searchParams.get("state")?.trim() || null;
    const search = searchParams.get("search")?.trim().toLowerCase() || null;
    const phoneFormat = (searchParams.get("phoneFormat") || "10_digit") as PhoneFormat;
    const includeHeaders = searchParams.get("includeHeaders") === "true";
    const outputFormat = searchParams.get("format") || "json";

    const rows: CsvExportRow[] = [];

    // 1. Fetch data based on user type
    if (type === "org") {
      // Organizations only
      const { data: orgs, error } = await supabaseAdmin
        .from("organization_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[CsvExport] Org fetch error:", error);
      }

      for (const org of orgs || []) {
        const rawPhone = org.business_phone || org.contact_phone || "";
        const formattedPhone = formatPhone(rawPhone, phoneFormat);
        const email = org.business_email || "";
        const name = org.business_name || "";
        const primaryArea = org.city || org.state || "Lagos Island";
        const secondaryLocation = org.state || "Lagos";
        const status: "TRUE" | "FALSE" = org.is_verified ? "TRUE" : "FALSE";
        const accountId = getDeterministicAccountId(org.id);

        rows.push({
          phone: formattedPhone,
          email,
          fullName: name,
          primaryArea,
          status,
          secondaryLocation,
          accountId,
        });
      }
    } else {
      // Users query (customers or drivers or all)
      let roleFilter: "customer" | "driver" | null = null;
      if (type === "senders" || type === "senders_online") {
        roleFilter = "customer";
      } else if (
        type === "riders" ||
        type === "riders_online" ||
        type === "riders_verified" ||
        type === "riders_unverified"
      ) {
        roleFilter = "driver";
      }

      let q = supabaseAdmin
        .from("users")
        .select(`
          id, full_name, phone, email, state, role, is_suspended, is_deleted, created_at,
          driver_profiles(verification_status, is_online, vehicle_info, rating, is_suspended)
        `)
        .order("created_at", { ascending: false });

      if (roleFilter) {
        q = q.eq("role", roleFilter);
      }

      const { data: users, error } = await q;

      if (error) {
        console.error("[CsvExport] Users fetch error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // If senders_online is selected, also find customers who have orders recently
      let activeSenderIds = new Set<string>();
      if (type === "senders_online") {
        const { data: recentOrders } = await supabaseAdmin
          .from("orders")
          .select("customer_id")
          .order("created_at", { ascending: false })
          .limit(500);
        activeSenderIds = new Set((recentOrders || []).map((o) => o.customer_id));
      }

      for (const u of users || []) {
        if (u.is_deleted) continue;

        const p = Array.isArray(u.driver_profiles) ? u.driver_profiles[0] : u.driver_profiles || null;

        // Sub-type filtering
        if (type === "senders_online" && !activeSenderIds.has(u.id)) {
          continue;
        }

        if (type === "riders_online") {
          if (!p || p.is_online !== true) continue;
        }

        if (type === "riders_verified") {
          if (!p || p.verification_status !== "verified") continue;
        }

        if (type === "riders_unverified") {
          if (!p || p.verification_status === "verified") continue;
        }

        const formattedPhone = formatPhone(u.phone, phoneFormat);
        const email = u.email || "";
        const fullName = u.full_name || "User";
        const primaryArea = u.state && u.state !== "Lagos" ? u.state : getSampleArea(u.id);

        let status: "TRUE" | "FALSE" = "FALSE";
        if (u.role === "driver") {
          if (type === "riders_verified") status = "TRUE";
          else if (type === "riders_unverified") status = "FALSE";
          else if (type === "riders_online") status = p?.is_online ? "TRUE" : "FALSE";
          else status = p?.verification_status === "verified" ? "TRUE" : "FALSE";
        } else {
          status = u.is_suspended ? "FALSE" : "TRUE";
        }

        const secondaryLocation = getSecondaryLocation(u.id);
        const accountId = getDeterministicAccountId(u.id);

        rows.push({
          phone: formattedPhone,
          email,
          fullName,
          primaryArea,
          status,
          secondaryLocation,
          accountId,
        });
      }

      // If type === 'all', also append organizations
      if (type === "all") {
        const { data: orgs } = await supabaseAdmin
          .from("organization_profiles")
          .select("*")
          .limit(300);

        for (const org of orgs || []) {
          const rawPhone = org.business_phone || org.contact_phone || "";
          const formattedPhone = formatPhone(rawPhone, phoneFormat);
          const email = org.business_email || "";
          const name = org.business_name || "";
          const primaryArea = org.city || org.state || "Lagos Island";
          const secondaryLocation = org.state || "Lagos";
          const status: "TRUE" | "FALSE" = org.is_verified ? "TRUE" : "FALSE";
          const accountId = getDeterministicAccountId(org.id);

          rows.push({
            phone: formattedPhone,
            email,
            fullName: name,
            primaryArea,
            status,
            secondaryLocation,
            accountId,
          });
        }
      }
    }

    // 2. Apply filters (requirePhone, requireEmail, state, search)
    let filtered = rows.filter((r) => {
      if (requirePhone && (!r.phone || r.phone.length < 7)) {
        return false;
      }
      if (requireEmail && (!r.email || !r.email.includes("@"))) {
        return false;
      }
      if (stateFilter && stateFilter !== "all") {
        const sf = stateFilter.toLowerCase();
        const p1 = r.primaryArea.toLowerCase();
        const p2 = r.secondaryLocation.toLowerCase();
        if (!p1.includes(sf) && !p2.includes(sf)) {
          return false;
        }
      }
      if (search) {
        const s = search.toLowerCase();
        const match =
          r.fullName.toLowerCase().includes(s) ||
          r.email.toLowerCase().includes(s) ||
          r.phone.includes(s) ||
          r.primaryArea.toLowerCase().includes(s) ||
          r.secondaryLocation.toLowerCase().includes(s) ||
          r.accountId.includes(s);
        if (!match) return false;
      }
      return true;
    });

    // 3. Format into CSV lines matching the template
    // Termii auto-detects `phone_number` or `Phone Number`
    const headerStyle = searchParams.get("headerStyle") || "termii";
    const csvLines: string[] = [];
    if (includeHeaders) {
      if (headerStyle === "termii") {
        csvLines.push("phone_number,email,name,primary_area,status,secondary_location,account_id");
      } else if (headerStyle === "standard") {
        csvLines.push("Phone Number,Email,Full Name,Primary Area,Status,Secondary Location,Account ID");
      } else {
        csvLines.push("Phone,Email,Name,Area,Status,Location,AccountID");
      }
    }

    for (const r of filtered) {
      // Escape commas or quotes in values
      const escape = (val: string) => {
        if (!val) return "";
        if (val.includes(",") || val.includes('"') || val.includes("\n")) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      };

      csvLines.push([
        escape(r.phone),
        escape(r.email),
        escape(r.fullName),
        escape(r.primaryArea),
        r.status,
        escape(r.secondaryLocation),
        r.accountId,
      ].join(","));
    }

    const csvContent = csvLines.join("\n");

    // Return as CSV file download if requested
    if (outputFormat === "csv") {
      const filename = `sendme-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    // Otherwise return JSON preview payload
    return NextResponse.json({
      success: true,
      type,
      totalCount: filtered.length,
      stats: {
        total: filtered.length,
        withPhone: filtered.filter((r) => r.phone && r.phone.length >= 7).length,
        withEmail: filtered.filter((r) => r.email && r.email.includes("@")).length,
      },
      previewRows: filtered.slice(0, 50),
      csvContent,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[CsvExport] GET error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
