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

export function buildWithdrawalRequestEmail(data: {
  userName: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  fee?: number;
}): { subject: string; html: string } {
  const feeNote = data.fee && data.fee > 0
    ? `<tr><td style="padding: 8px 12px; background: #f9f9f9; font-weight: 600;">Fee</td><td style="padding: 8px 12px;">₦${data.fee.toLocaleString()}</td></tr>`
    : "";
  const total = data.amount + (data.fee || 0);

  return {
    subject: `Withdrawal Request - ₦${data.amount.toLocaleString()}`,
    html: buildEmailTemplate("Withdrawal Request Received", `
      <p>Hi ${data.userName},</p>
      <p>We have received your withdrawal request. Here are the details:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 8px 12px; background: #f9f9f9; font-weight: 600;">Amount</td><td style="padding: 8px 12px;">₦${data.amount.toLocaleString()}</td></tr>
        ${feeNote}
        <tr><td style="padding: 8px 12px; background: #f9f9f9; font-weight: 600;">Total Deducted</td><td style="padding: 8px 12px; font-weight: 600;">₦${total.toLocaleString()}</td></tr>
        <tr><td style="padding: 8px 12px; background: #f9f9f9; font-weight: 600;">Bank</td><td style="padding: 8px 12px;">${data.bankName}</td></tr>
        <tr><td style="padding: 8px 12px; background: #f9f9f9; font-weight: 600;">Account Number</td><td style="padding: 8px 12px;">${data.accountNumber}</td></tr>
        <tr><td style="padding: 8px 12px; background: #f9f9f9; font-weight: 600;">Account Name</td><td style="padding: 8px 12px;">${data.accountName}</td></tr>
      </table>
      <p>Your withdrawal is being processed. This may take up to 2 business days.</p>
    `),
  };
}

export function buildPayoutApprovedEmail(data: {
  userName: string;
  amount: number;
  bankName: string;
}): { subject: string; html: string } {
  return {
    subject: `Payout Approved - ₦${data.amount.toLocaleString()}`,
    html: buildEmailTemplate("Payout Approved", `
      <p>Hi ${data.userName},</p>
      <p>Your payout has been approved and is on its way!</p>
      <div style="text-align: center; margin: 24px 0;">
        <span class="badge-success">Approved</span>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 8px 12px; background: #f9f9f9; font-weight: 600;">Amount</td><td style="padding: 8px 12px;">₦${data.amount.toLocaleString()}</td></tr>
        <tr><td style="padding: 8px 12px; background: #f9f9f9; font-weight: 600;">Bank</td><td style="padding: 8px 12px;">${data.bankName}</td></tr>
      </table>
      <p>The funds will be credited to your bank account shortly.</p>
    `),
  };
}

export function buildMarketerApprovalEmail(data: {
  userName: string;
  marketerId: string;
}): { subject: string; html: string } {
  return {
    subject: `Welcome to SendMe Growth Partners!`,
    html: buildEmailTemplate("You're Approved!", `
      <p>Hi ${data.userName},</p>
      <p>Congratulations! Your application to become a SendMe Growth Partner has been approved.</p>
      <div style="text-align: center; margin: 24px 0;">
        <span class="badge-success">Approved</span>
      </div>
      <div style="background: #f0faf5; border: 2px dashed #158A5E; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
        <p style="margin: 0 0 8px 0; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Your Marketer ID</p>
        <p style="margin: 0; font-size: 28px; font-weight: 700; color: #158A5E; letter-spacing: 2px;">${data.marketerId}</p>
      </div>
      <p>Here's what you can do now:</p>
      <ul style="color: #555; line-height: 2;">
        <li>Share your Marketer ID with friends and family</li>
        <li>Earn commissions on every delivery they make</li>
        <li>Track your referrals and earnings in the app</li>
        <li>Withdraw your earnings anytime</li>
      </ul>
      <p style="margin-top: 24px;">Open the SendMe app, go to <strong>Growth Partner</strong> in your profile to see your dashboard and start earning.</p>
    `),
  };
}

export function buildMarketerRejectionEmail(data: {
  userName: string;
  reason?: string;
}): { subject: string; html: string } {
  const reasonBlock = data.reason
    ? `<div style="background: #f9f9f9; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0; font-weight: 600; color: #333;">Reason:</p>
        <p style="margin: 8px 0 0 0; color: #666;">${data.reason}</p>
      </div>`
    : "";

  return {
    subject: `SendMe Growth Partner Application Update`,
    html: buildEmailTemplate("Application Update", `
      <p>Hi ${data.userName},</p>
      <p>Thank you for applying to become a SendMe Growth Partner.</p>
      <div style="text-align: center; margin: 24px 0;">
        <span class="badge-error">Not Approved</span>
      </div>
      ${reasonBlock}
      <p>You can reapply after addressing the above feedback. If you have questions, please contact our support team.</p>
    `),
  };
}

export function buildPayoutRejectedEmail(data: {
  userName: string;
  amount: number;
  reason?: string;
  feeRefunded?: number;
}): { subject: string; html: string } {
  const reasonBlock = data.reason
    ? `<div style="background: #f9f9f9; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0; font-weight: 600; color: #333;">Reason:</p>
        <p style="margin: 8px 0 0 0; color: #666;">${data.reason}</p>
      </div>`
    : "";
  const refundNote = data.feeRefunded && data.feeRefunded > 0
    ? `<p>Your withdrawal fee of ₦${data.feeRefunded.toLocaleString()} has been refunded to your wallet.</p>`
    : "";

  return {
    subject: `Payout Not Approved - ₦${data.amount.toLocaleString()}`,
    html: buildEmailTemplate("Payout Not Approved", `
      <p>Hi ${data.userName},</p>
      <p>Your payout request could not be approved at this time.</p>
      <div style="text-align: center; margin: 24px 0;">
        <span class="badge-error">Not Approved</span>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 8px 12px; background: #f9f9f9; font-weight: 600;">Amount</td><td style="padding: 8px 12px;">₦${data.amount.toLocaleString()}</td></tr>
      </table>
      ${reasonBlock}
      <p>Your wallet has been refunded${data.feeRefunded && data.feeRefunded > 0 ? ` (including ₦${data.feeRefunded.toLocaleString()} fee)` : ""}.</p>
      ${refundNote}
      <p>Please try again or contact support if you need assistance.</p>
    `),
  };
}
