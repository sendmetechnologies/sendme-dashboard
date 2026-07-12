interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

interface SendByteResponse {
  id?: string;
  status?: string;
  error?: { code: string; message: string };
}

const API_BASE = "https://api.sendbyte.africa/v1";

export async function sendEmail({
  to,
  subject,
  html,
  text,
  from,
}: SendEmailParams & { from?: string }): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = process.env.SENDBYTE_API_KEY;
  const defaultFromEmail = process.env.SENDBYTE_FROM_EMAIL || "noreply@SendMe.com";
  const defaultFromName = process.env.SENDBYTE_FROM_NAME || "SendMe";

  if (!apiKey) {
    console.warn("[SendByte] No API key configured");
    return { success: false, error: "No API key configured" };
  }

  const fromAddr = from || `${defaultFromName} <${defaultFromEmail}>`;

  try {
    const response = await fetch(`${API_BASE}/emails`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddr,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ""),
      }),
    });

    const data: SendByteResponse = await response.json();

    if (!response.ok) {
      console.error("[SendByte] API error:", data);
      return { success: false, error: data.error?.message || `HTTP ${response.status}` };
    }

    return { success: true, id: data.id };
  } catch (err) {
    console.error("[SendByte] Network error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

export function buildEmailTemplate(title: string, body: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: #158A5E; padding: 32px 24px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 22px; font-weight: 700; }
    .content { padding: 32px 24px; color: #333; line-height: 1.6; }
    .footer { background: #fafafa; padding: 24px; text-align: center; color: #888; font-size: 12px; }
    .badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; }
    .badge-success { background: #E8F5E9; color: #158A5E; }
    .badge-error { background: #FFEBEE; color: #C62828; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SendMe</h1>
    </div>
    <div class="content">
      <h2 style="font-size: 18px; color: #000; margin-bottom: 16px;">${title}</h2>
      ${body}
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} SendMe Delivery. All rights reserved.
    </div>
  </div>
</body>
</html>`;
}

export function buildReviewNotificationEmail(
  type: "admin" | "user",
  data: {
    userName?: string;
    userEmail?: string;
    userRole?: string;
    status?: string;
    reason?: string;
  }
): { subject: string; html: string } {
  if (type === "admin") {
    return {
      subject: `New Review Submission: ${data.userRole} - ${data.userName}`,
      html: buildEmailTemplate(
        "New Verification Submission",
        `
        <p>A new user has submitted their verification documents.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px 12px; background: #f9f9f9; font-weight: 600;">Name</td><td style="padding: 8px 12px;">${data.userName || "N/A"}</td></tr>
          <tr><td style="padding: 8px 12px; background: #f9f9f9; font-weight: 600;">Email</td><td style="padding: 8px 12px;">${data.userEmail || "N/A"}</td></tr>
          <tr><td style="padding: 8px 12px; background: #f9f9f9; font-weight: 600;">Role</td><td style="padding: 8px 12px;">${data.userRole || "N/A"}</td></tr>
        </table>
        <p>Please review their documents in the admin dashboard and approve or reject them.</p>
      `
      ),
    };
  }

  const isApproved = data.status === "verified" || data.status === "approved";
  const badgeClass = isApproved ? "badge-success" : "badge-error";
  const badgeText = isApproved ? "Approved" : "Rejected";

  return {
    subject: `SendMe Account ${isApproved ? "Approved" : "Update"} - ${data.userName}`,
    html: buildEmailTemplate(
      "Verification Status Update",
      `
      <p>Hi ${data.userName},</p>
      <p>Your account verification has been updated.</p>
      <div style="text-align: center; margin: 24px 0;">
        <span class="${badgeClass}">${badgeText}</span>
      </div>
      ${data.reason ? `<div style="background: #f9f9f9; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0; font-weight: 600; color: #333;">Admin Note:</p>
        <p style="margin: 8px 0 0 0; color: #666;">${data.reason}</p>
      </div>` : ""}
      ${isApproved ? "<p>You can now start using the SendMe app. Log in to access your dashboard.</p>" : "<p>Please update your documents and resubmit for review. You can do this from the verification screen in the app.</p>"}
    `
    ),
  };
}
