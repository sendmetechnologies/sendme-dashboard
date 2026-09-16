import { supabaseAdmin } from "./supabase";

export type TargetAudience = "all" | "marketers" | "senders" | "riders" | "organizations" | "individuals";

export interface CampaignRecipient {
  user_id: string | null;
  email: string;
  name: string;
}

const notDeleted = (row: { is_deleted?: boolean | null }) => row.is_deleted !== true;

function dedupe(rows: CampaignRecipient[]): CampaignRecipient[] {
  const seen = new Set<string>();
  const out: CampaignRecipient[] = [];
  for (const r of rows) {
    const key = r.email.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push({ ...r, email: key });
  }
  return out;
}

async function fetchUsers(role: "customer" | "driver"): Promise<CampaignRecipient[]> {
  const { data } = await supabaseAdmin
    .from("users")
    .select("id, email, full_name, is_deleted, is_suspended")
    .eq("role", role)
    .not("email", "is", null)
    .neq("email", "");

  return (data || [])
    .filter(notDeleted)
    .map((u: any) => ({
      user_id: u.id,
      email: u.email,
      name: u.full_name || "",
    }));
}

async function fetchRiders(): Promise<
  (CampaignRecipient & {
    verification_status: string;
    id_details: Record<string, unknown> | null;
    is_suspended: boolean;
  })[]
> {
  const { data } = await supabaseAdmin
    .from("users")
    .select(
      "id, email, full_name, is_deleted, is_suspended, driver_profiles(verification_status, id_details, is_suspended)"
    )
    .eq("role", "driver")
    .not("email", "is", null)
    .neq("email", "");

  return (data || [])
    .filter(notDeleted)
    .map((u: any) => {
      const p = Array.isArray(u.driver_profiles) ? u.driver_profiles[0] : u.driver_profiles || {};
      return {
        user_id: u.id,
        email: u.email,
        name: u.full_name || "",
        verification_status: p.verification_status || "pending",
        id_details: p.id_details ?? null,
        is_suspended: u.is_suspended === true || p.is_suspended === true,
      };
    });
}

async function fetchOrganizations(): Promise<
  (CampaignRecipient & {
    is_verified: boolean;
    is_suspended: boolean;
    verification_status: string;
  })[]
> {
  const { data } = await supabaseAdmin
    .from("organization_profiles")
    .select("id, business_email, business_name, is_verified, is_suspended, verification_status")
    .not("business_email", "is", null)
    .neq("business_email", "");

  return (data || []).map((o: any) => ({
    user_id: o.id,
    email: o.business_email,
    name: o.business_name || "",
    is_verified: o.is_verified === true,
    is_suspended: o.is_suspended === true,
    verification_status: o.verification_status || (o.is_verified ? "verified" : "pending"),
  }));
}

async function fetchMarketers(): Promise<
  (CampaignRecipient & { status: string })[]
> {
  const { data: profiles } = await supabaseAdmin
    .from("marketer_profiles")
    .select("user_id, status");

  if (!profiles || profiles.length === 0) return [];

  const userIds = profiles.map((m: any) => m.user_id);
  const { data: users } = await supabaseAdmin
    .from("users")
    .select("id, email, full_name, is_deleted")
    .in("id", userIds)
    .not("email", "is", null)
    .neq("email", "");

  const userMap = new Map<string, any>();
  (users || []).forEach((u: any) => {
    if (notDeleted(u)) userMap.set(u.id, u);
  });

  const statusMap = new Map<string, string>();
  profiles.forEach((m: any) => statusMap.set(m.user_id, m.status));

  const out: (CampaignRecipient & { status: string })[] = [];
  userMap.forEach((u) => {
    out.push({
      user_id: u.id,
      email: u.email,
      name: u.full_name || "",
      status: statusMap.get(u.id) || "pending",
    });
  });
  return out;
}

export async function getCampaignRecipients(
  targetAudience: TargetAudience,
  subAudience: string
): Promise<CampaignRecipient[]> {
  switch (targetAudience) {
    case "senders": {
      const users = await fetchUsers("customer");
      if (subAudience === "suspended") {
        return users.filter((u: any) => u.is_suspended === true);
      }
      if (subAudience === "active") {
        return users.filter((u: any) => u.is_suspended !== true);
      }
      return users;
    }

    case "riders": {
      const riders = await fetchRiders();
      switch (subAudience) {
        case "verified":
          return riders.filter((r) => r.verification_status === "verified");
        case "under_review":
          return riders.filter((r) => ["pending", "under_review"].includes(r.verification_status));
        case "incomplete_documents":
          return riders.filter(
            (r) =>
              (!r.id_details || Object.keys(r.id_details).length === 0) &&
              !["verified", "rejected"].includes(r.verification_status)
          );
        case "rejected":
          return riders.filter((r) => r.verification_status === "rejected");
        case "suspended":
          return riders.filter((r) => r.is_suspended);
        default:
          return riders;
      }
    }

    case "organizations": {
      const orgs = await fetchOrganizations();
      switch (subAudience) {
        case "verified":
          return orgs.filter((o) => o.is_verified && !o.is_suspended);
        case "unverified":
          return orgs.filter((o) => !o.is_verified && !o.is_suspended);
        case "rejected":
          return orgs.filter((o) => o.verification_status === "rejected");
        case "suspended":
          return orgs.filter((o) => o.is_suspended);
        default:
          return orgs;
      }
    }

    case "marketers": {
      const marketers = await fetchMarketers();
      if (subAudience !== "all") {
        return marketers.filter((m) => m.status === subAudience);
      }
      return marketers;
    }

    case "individuals":
      return [];

    case "all":
    default: {
      const [senders, riders, orgs, marketers] = await Promise.all([
        fetchUsers("customer"),
        fetchRiders(),
        fetchOrganizations(),
        fetchMarketers(),
      ]);
      return dedupe([
        ...senders,
        ...riders,
        ...orgs,
        ...marketers,
      ]);
    }
  }
}

export interface AudienceCounts {
  [target: string]: {
    [sub: string]: number;
  };
}

export async function getAudienceCounts(): Promise<AudienceCounts> {
  const [senders, riders, orgs, marketers] = await Promise.all([
    fetchUsers("customer"),
    fetchRiders(),
    fetchOrganizations(),
    fetchMarketers(),
  ]);

  const all = dedupe([...senders, ...riders, ...orgs, ...marketers]);

  return {
    all: { all: all.length },
    senders: {
      all: senders.length,
      active: senders.filter((u: any) => u.is_suspended !== true).length,
      suspended: senders.filter((u: any) => u.is_suspended === true).length,
    },
    riders: {
      all: riders.length,
      verified: riders.filter((r) => r.verification_status === "verified").length,
      under_review: riders.filter((r) =>
        ["pending", "under_review"].includes(r.verification_status)
      ).length,
      incomplete_documents: riders.filter(
        (r) =>
          (!r.id_details || Object.keys(r.id_details).length === 0) &&
          !["verified", "rejected"].includes(r.verification_status)
      ).length,
      rejected: riders.filter((r) => r.verification_status === "rejected").length,
      suspended: riders.filter((r) => r.is_suspended).length,
    },
    organizations: {
      all: orgs.length,
      verified: orgs.filter((o) => o.is_verified && !o.is_suspended).length,
      unverified: orgs.filter((o) => !o.is_verified && !o.is_suspended).length,
      rejected: orgs.filter((o) => o.verification_status === "rejected").length,
      suspended: orgs.filter((o) => o.is_suspended).length,
    },
    marketers: {
      all: marketers.length,
      approved: marketers.filter((m) => m.status === "approved").length,
      pending: marketers.filter((m) => m.status === "pending").length,
      rejected: marketers.filter((m) => m.status === "rejected").length,
      suspended: marketers.filter((m) => m.status === "suspended").length,
    },
  };
}
