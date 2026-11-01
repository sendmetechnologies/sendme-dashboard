import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

async function broadcastPushToAll(title: string, bodyText: string, versionData: any) {
  try {
    const { data: tokenRows } = await supabaseAdmin
      .from("user_push_tokens")
      .select("user_id, token")
      .eq("is_active", true);

    if (!tokenRows || tokenRows.length === 0) return { sent: 0 };

    const uniqueTokens = Array.from(
      new Set(
        tokenRows
          .map((r: any) => r.token)
          .filter((t: any) => t && t.startsWith("ExponentPushToken"))
      )
    );

    const chunkSize = 100;
    for (let i = 0; i < uniqueTokens.length; i += chunkSize) {
      const chunk = uniqueTokens.slice(i, i + chunkSize);
      const messages = chunk.map((token) => ({
        to: token,
        sound: "default",
        title: title,
        body: bodyText,
        data: {
          event: "APP_UPDATE",
          version: versionData.latest_version,
          force: Boolean(versionData.is_mandatory),
        },
        priority: "high",
        channelId: "new-order",
      }));

      await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      });
    }

    // Also log in-app messages
    const uniqueUserIds = Array.from(new Set(tokenRows.map((r: any) => r.user_id).filter(Boolean)));
    const inAppChunks = 50;
    for (let i = 0; i < uniqueUserIds.length; i += inAppChunks) {
      const userChunk = uniqueUserIds.slice(i, i + inAppChunks);
      const rows = userChunk.map((userId) => ({
        user_id: userId,
        title: title,
        body: bodyText,
        type: "SYSTEM",
        priority: "HIGH",
        status: "UNREAD",
        in_app_sent: true,
        in_app_sent_at: new Date().toISOString(),
      }));
      await supabaseAdmin.from("messages").insert(rows);
    }

    return { sent: uniqueTokens.length };
  } catch (err) {
    console.error("[BroadcastPush] Failed:", err);
    return { error: err };
  }
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("app_versions")
    .select("*")
    .order("platform", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ versions: data || [] });
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, latest_version, minimum_version, release_notes, store_url, is_mandatory, is_active, broadcast } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (latest_version !== undefined) updates.latest_version = latest_version.trim();
  if (minimum_version !== undefined) updates.minimum_version = minimum_version.trim();
  if (release_notes !== undefined) updates.release_notes = release_notes.trim();
  if (store_url !== undefined) updates.store_url = store_url.trim();
  if (is_mandatory !== undefined) updates.is_mandatory = Boolean(is_mandatory);
  if (is_active !== undefined) updates.is_active = Boolean(is_active);

  const { data, error } = await supabaseAdmin
    .from("app_versions")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Automatic broadcast on update if requested or if release notes / version changed
  let broadcastResult = null;
  if (broadcast !== false) {
    const title = "SendMe Alert 💰";
    const bodyText = updates.release_notes || "10,000 just landed on sendme, update your appnow, let's make money together";
    broadcastResult = await broadcastPushToAll(title, bodyText, data);
  }

  return NextResponse.json({ version: data, broadcast: broadcastResult });
}
