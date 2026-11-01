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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lglmkxczxeorxhzwcdjv.supabase.co";
export const SENDME_APP_LOGO_URL = "https://senndme.com/logo.png";
export const SENDME_ICON_URL = `${SUPABASE_URL}/storage/v1/object/public/order-photos/branding/sendme-icon.png`;
export const SENDME_BANNER_PARCEL_ILLUS = `${SUPABASE_URL}/storage/v1/object/public/banners/parcel_15_percent.png`;
export const SENDME_BANNER_EARNINGS_ILLUS = `${SUPABASE_URL}/storage/v1/object/public/banners/driver_helmet_earnings.png`;
const LOGO_URL = SENDME_APP_LOGO_URL;

export interface ModernEmailShellOptions {
  bannerBadge?: string;
  bannerTitle: string;
  bannerSubtitle?: string;
  bannerImage?: string;
  bodyHtml: string;
  previewText?: string;
  senderName?: string;
  ctaText?: string;
  ctaUrl?: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Intelligent Markdown & AI Message to Email-Safe HTML Formatter.
 * Handles AI output from ChatGPT / Claude:
 * - Cleans headers (#, ##, ###) into bold styled headers
 * - Highlights (> [!NOTE], :::box, > Note:) into SendMe highlight cards
 * - Warnings (> [!WARN], :::warning) into warning alert cards
 * - Buttons ([button: Label -> URL]) into branded primary pill buttons
 * - Ordered & Unordered lists into clean tables/bullets
 * - Key-value metadata rows
 * - Bold (**text**), italics (*text*), links ([label](url))
 */
export function formatMessageToHtml(rawText: string): string {
  if (!rawText || !rawText.trim()) return "";

  // Strip leading AI intro artifacts like "Certainly! Here is your email draft:"
  let cleaned = rawText
    .replace(/^(Certainly|Here is|Sure|Here's).*?:\s*\n+/i, "")
    .replace(/^Subject:\s*[^\n]+\n+/i, "")
    .trim();

  // Normalize newlines
  cleaned = cleaned.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  const lines = cleaned.split("\n");
  const htmlParts: string[] = [];

  let inBox = false;
  let boxType: "note" | "warning" | "reward" = "note";
  let boxBuffer: string[] = [];

  let inList: "ul" | "ol" | null = null;
  let listIndex = 1;

  const flushList = () => {
    inList = null;
    listIndex = 1;
  };

  const flushBox = () => {
    if (!inBox) return;
    const boxContent = boxBuffer.join("<br/>");
    boxBuffer = [];
    inBox = false;

    if (boxType === "warning") {
      htmlParts.push(`
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFFBEB; border: 1px solid #FED7AA; border-left: 4px solid #F59E0B; border-radius: 12px; margin: 16px 0;">
          <tr>
            <td style="padding: 14px 16px; font-size: 13.5px; line-height: 1.55; color: #92400E;">
              ${boxContent}
            </td>
          </tr>
        </table>
      `);
    } else if (boxType === "reward") {
      htmlParts.push(`
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ECFDF5; border: 1px solid #A7F3D0; border-left: 4px solid #158A5E; border-radius: 12px; margin: 16px 0;">
          <tr>
            <td style="padding: 14px 16px; font-size: 13.5px; line-height: 1.55; color: #065F46;">
              ${boxContent}
            </td>
          </tr>
        </table>
      `);
    } else {
      htmlParts.push(`
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F0FDF8; border: 1px solid #D1F0DD; border-left: 4px solid #158A5E; border-radius: 12px; margin: 16px 0;">
          <tr>
            <td style="padding: 14px 16px; font-size: 13.5px; line-height: 1.55; color: #101828;">
              ${boxContent}
            </td>
          </tr>
        </table>
      `);
    }
  };

  const parseInline = (text: string): string => {
    let t = text;
    // Bold: **text**
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong style="color: #101828; font-weight: 700;">$1</strong>');
    // Italic: *text* (excluding already formatted bold)
    t = t.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
    // Link: [text](url)
    t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" style="color: #158A5E; font-weight: 600; text-decoration: underline;">$1</a>');
    // Code/Pill: `code`
    t = t.replace(/`([^`]+)`/g, '<code style="background-color: #F2F4F7; color: #101828; padding: 2px 6px; border-radius: 4px; font-size: 12px; font-family: monospace;">$1</code>');
    return t;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Box block delimiters: :::box, :::warning, :::reward, :::
    if (trimmed.startsWith(":::box") || trimmed.startsWith(":::note")) {
      flushList();
      flushBox();
      inBox = true;
      boxType = "note";
      continue;
    }
    if (trimmed.startsWith(":::warning") || trimmed.startsWith(":::alert")) {
      flushList();
      flushBox();
      inBox = true;
      boxType = "warning";
      continue;
    }
    if (trimmed.startsWith(":::reward") || trimmed.startsWith(":::success")) {
      flushList();
      flushBox();
      inBox = true;
      boxType = "reward";
      continue;
    }
    if (trimmed === ":::") {
      flushBox();
      continue;
    }

    // Markdown blockquotes: > [!NOTE] or > Note: or generic > text
    if (trimmed.startsWith(">")) {
      flushList();
      let blockText = trimmed.replace(/^>\s*/, "");
      if (blockText.startsWith("[!NOTE]") || blockText.startsWith("[!TIP]")) {
        blockText = blockText.replace(/^\[!(NOTE|TIP)\]\s*/, "");
        boxType = "note";
      } else if (blockText.startsWith("[!WARN]") || blockText.startsWith("[!CAUTION]") || blockText.startsWith("[!IMPORTANT]")) {
        blockText = blockText.replace(/^\[!(WARN|CAUTION|IMPORTANT)\]\s*/, "");
        boxType = "warning";
      }
      if (!inBox) {
        inBox = true;
      }
      boxBuffer.push(parseInline(blockText));
      continue;
    } else if (inBox && trimmed === "") {
      // Empty line after box closes it
      flushBox();
      continue;
    }

    if (inBox) {
      boxBuffer.push(parseInline(trimmed));
      continue;
    }

    // Button shortcode: [button: Label -> URL] or [BUTTON: Label -> URL] or [CTA: Label -> URL]
    const buttonMatch = trimmed.match(/^\[(?:button|BUTTON|cta|CTA):\s*(.+?)\s*->\s*(https?:\/\/[^\s\]]+)\]$/i);
    if (buttonMatch) {
      flushList();
      const label = buttonMatch[1].trim();
      const url = buttonMatch[2].trim();
      htmlParts.push(`
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 22px 0 24px 0;">
          <tr>
            <td align="center">
              <a href="${escapeHtml(url)}" style="display: inline-block; background-color: #158A5E; color: #FFFFFF; font-size: 14px; font-weight: 700; text-decoration: none; padding: 13px 32px; border-radius: 10px; letter-spacing: 0.2px; mso-padding-alt: 0;">
                ${escapeHtml(label)} &rarr;
              </a>
            </td>
          </tr>
        </table>
      `);
      continue;
    }

    // Horizontal divider: --- or ***
    if (/^(\-{3,}|\*{3,})$/.test(trimmed)) {
      flushList();
      htmlParts.push(`<div style="border-top: 1px solid #EAECF0; margin: 20px 0;"></div>`);
      continue;
    }

    // Headings
    if (trimmed.startsWith("### ")) {
      flushList();
      const title = parseInline(trimmed.replace(/^###\s+/, ""));
      htmlParts.push(`<div style="font-size: 15px; font-weight: 700; color: #101828; margin: 18px 0 8px 0; letter-spacing: -0.2px;">${title}</div>`);
      continue;
    }
    if (trimmed.startsWith("## ")) {
      flushList();
      const title = parseInline(trimmed.replace(/^##\s+/, ""));
      htmlParts.push(`<div style="font-size: 17px; font-weight: 700; color: #101828; margin: 22px 0 10px 0; letter-spacing: -0.3px;">${title}</div>`);
      continue;
    }
    if (trimmed.startsWith("# ")) {
      flushList();
      const title = parseInline(trimmed.replace(/^#\s+/, ""));
      htmlParts.push(`<div style="font-size: 20px; font-weight: 800; color: #101828; margin: 24px 0 12px 0; letter-spacing: -0.4px;">${title}</div>`);
      continue;
    }

    // Bullet points: - item, * item, • item
    if (/^[-*•]\s+/.test(trimmed)) {
      inList = "ul";
      const itemText = parseInline(trimmed.replace(/^[-*•]\s+/, ""));
      htmlParts.push(`
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 7px;">
          <tr>
            <td width="20" style="vertical-align: top; color: #158A5E; font-size: 16px; line-height: 20px; font-weight: 800;">&bull;</td>
            <td style="font-size: 14px; line-height: 1.55; color: #475467; vertical-align: top;">${itemText}</td>
          </tr>
        </table>
      `);
      continue;
    }

    // Numbered list: 1. item
    const numMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (numMatch) {
      inList = "ol";
      const num = numMatch[1];
      const itemText = parseInline(numMatch[2]);
      htmlParts.push(`
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 9px;">
          <tr>
            <td width="28" style="vertical-align: top;">
              <div style="width: 22px; height: 22px; border-radius: 11px; background-color: #101828; color: #FFFFFF; font-size: 11px; font-weight: 700; line-height: 22px; text-align: center;">${num}</div>
            </td>
            <td style="vertical-align: top; padding-left: 8px; font-size: 14px; line-height: 1.55; color: #101828;">${itemText}</td>
          </tr>
        </table>
      `);
      continue;
    }

    // Blank line
    if (!trimmed) {
      flushList();
      continue;
    }

    // Standard paragraph
    flushList();
    htmlParts.push(`<p style="font-size: 14px; line-height: 1.6; color: #475467; margin: 0 0 14px 0;">${parseInline(trimmed)}</p>`);
  }

  flushList();
  flushBox();

  return htmlParts.join("");
}

/**
 * Modern SendMe Responsive Email Shell.
 * Matches EXACT SendMe App Dashboard banner styling:
 * - 580px max-width card with clean subtle border (#EAECF0)
 * - Top brand navigation with SendMe logo and "Bid, Track, Confirm and Earn" directly underneath
 * - Smooth Header Banner in exact SendMe Green (#158A5E), rounded 16px card, text left, illustration right
 * - Structured body with card styling, callouts, and clean typography
 * - Clean company footer without city prefixes
 */
export function buildModernEmailShell(options: ModernEmailShellOptions): string {
  const {
    bannerBadge,
    bannerTitle,
    bannerSubtitle,
    bannerImage = SENDME_BANNER_PARCEL_ILLUS,
    bodyHtml,
    previewText,
    senderName,
    ctaText,
    ctaUrl,
  } = options;

  const safeSenderBadge = senderName
    ? `<div style="display: inline-block; background-color: #ECFDF5; border: 1px solid #D1FAE5; color: #158A5E; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 999px; margin-bottom: 14px;">Message from ${escapeHtml(senderName)}</div>`
    : "";

  const ctaButtonHtml = ctaText && ctaUrl
    ? `
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0 10px 0;">
        <tr>
          <td align="center">
            <a href="${escapeHtml(ctaUrl)}" style="display: inline-block; background-color: #158A5E; color: #FFFFFF; font-size: 14px; font-weight: 700; text-decoration: none; padding: 13px 32px; border-radius: 10px; letter-spacing: 0.2px;">
              ${escapeHtml(ctaText)} &rarr;
            </a>
          </td>
        </tr>
      </table>
    `
    : "";

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(bannerTitle)}</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; background-color: #F4F5F7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #101828; }
    @media only screen and (max-width: 540px) {
      .outer-wrap { padding: 10px 0 !important; }
      .main-card { border-radius: 0 !important; border-left: none !important; border-right: none !important; }
      .body-cell { padding: 18px 16px 26px 16px !important; }
      .header-wrap { padding: 14px 14px 6px 14px !important; }
      .banner-text-cell { padding: 18px 10px 18px 16px !important; }
      .banner-img-cell { width: 85px !important; padding: 10px 12px 10px 0 !important; }
      .banner-img { width: 78px !important; height: 78px !important; }
      .banner-title { font-size: 15px !important; line-height: 20px !important; }
      .banner-sub { font-size: 11px !important; line-height: 15px !important; }
      .nav-cell { padding: 16px 16px 12px 16px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F5F7;">

  ${previewText ? `
  <div style="display: none; font-size: 1px; color: #F4F5F7; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${escapeHtml(previewText)}
  </div>` : ""}

  <table border="0" cellpadding="0" cellspacing="0" width="100%" class="outer-wrap" style="background-color: #F4F5F7; padding: 24px 12px;">
    <tr>
      <td align="center">

        <!-- Main Card (Max 580px) -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="main-card" style="max-width: 580px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #EAECF0; overflow: hidden; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);">

          <!-- TOP NAVIGATION / BRANDING (Exact auth/login logo, SendMe, and Bid, Track, Confirm and Earn underneath) -->
          <tr>
            <td class="nav-cell" style="padding: 20px 24px 16px 24px; border-bottom: 1px solid #EAECF0;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="vertical-align: middle;">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align: middle; padding-right: 12px;">
                          <img src="${SENDME_APP_LOGO_URL}" alt="SendMe" width="40" height="40" style="display: block; width: 40px; height: 40px; border-radius: 10px; object-fit: contain;" />
                        </td>
                        <td style="vertical-align: middle; line-height: 1;">
                          <div style="font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: #101828; line-height: 24px;">
                            Send<span style="color: #158A5E;">Me</span>
                          </div>
                          <div style="font-size: 11px; font-weight: 600; color: #158A5E; letter-spacing: 0.2px; line-height: 14px; margin-top: 3px;">
                            Bid, Track, Confirm and Earn
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- HEADER BANNER: Exact SendMe App Dashboard Banner Style (Green #158A5E, 16px Radius) -->
          <tr>
            <td class="header-wrap" style="padding: 16px 20px 8px 20px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #158A5E; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(21, 138, 94, 0.18);">
                <tr>
                  <!-- Left Text Column -->
                  <td class="banner-text-cell" style="padding: 24px 16px 24px 22px; vertical-align: middle;">
                    <div class="banner-title" style="font-size: 18px; font-weight: 800; line-height: 24px; color: #FFFFFF; letter-spacing: -0.3px; margin: 0 0 6px 0;">
                      ${escapeHtml(bannerTitle)}
                    </div>
                    ${bannerSubtitle ? `
                    <div class="banner-sub" style="font-size: 13px; font-weight: 400; line-height: 18px; color: rgba(255, 255, 255, 0.92); margin: 0;">
                      ${escapeHtml(bannerSubtitle)}
                    </div>` : ""}
                  </td>

                  <!-- Right Illustration Column -->
                  <td width="108" align="center" class="banner-img-cell" style="padding: 12px 16px 12px 0; vertical-align: middle;">
                    <img src="${bannerImage}" alt="SendMe" width="96" height="96" class="banner-img" style="display: block; width: 96px; height: 96px; max-width: 96px; object-fit: contain; border: 0;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BODY SECTION -->
          <tr>
            <td class="body-cell" style="padding: 18px 22px 28px 22px;">
              ${safeSenderBadge}
              ${bodyHtml}
              ${ctaButtonHtml}
            </td>
          </tr>

          <!-- FOOTER (Without Abuja & Lagos in front of SendMe Technologies Ltd.) -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 22px 24px; text-align: center; border-top: 1px solid #EAECF0;">
              <div style="font-size: 12px; font-weight: 800; color: #101828; margin-bottom: 4px; letter-spacing: 0.4px;">
                SENDME TECHNOLOGIES
              </div>
              <div style="font-size: 11.5px; line-height: 1.6; color: #667085; margin-bottom: 8px;">
                Nigeria's on-demand bidding delivery platform.<br>
                Questions or support? Reach us at <a href="mailto:support@senndme.com" style="color: #158A5E; text-decoration: none; font-weight: 600;">support@senndme.com</a>
              </div>
              <div style="font-size: 11px; color: #98A2B3;">
                &copy; ${new Date().getFullYear()} SendMe Technologies Ltd. All rights reserved.
              </div>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

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

export function buildEmailTemplate(title: string, body: string, badge = "SENDME ACCOUNT"): string {
  return buildModernEmailShell({
    bannerBadge: badge,
    bannerTitle: title,
    bannerSubtitle: "Account & notification update from SendMe Operations",
    bannerImage: SENDME_BANNER_PARCEL_ILLUS,
    bodyHtml: body,
  });
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

export function buildMarketerSuspendedEmail(data: {
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
    subject: `SendMe Growth Partner - Account Suspended`,
    html: buildEmailTemplate("Account Suspended", `
      <p>Hi ${data.userName},</p>
      <p>Your SendMe Growth Partner account has been <strong>suspended</strong>.</p>
      <div style="text-align: center; margin: 24px 0;">
        <span style="display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; background: #FFF3E0; color: #E65100;">Suspended</span>
      </div>
      <p>During the suspension period:</p>
      <ul style="color: #555; line-height: 2;">
        <li>Your marketer code is temporarily inactive</li>
        <li>New referrals will not be accepted</li>
        <li>Existing commission tracking continues</li>
      </ul>
      ${reasonBlock}
      <p>Contact support if you believe this is an error.</p>
    `),
  };
}

export function buildMarketerReinstatedEmail(data: {
  userName: string;
  marketerId: string;
}): { subject: string; html: string } {
  return {
    subject: `SendMe Growth Partner - Account Reactivated`,
    html: buildEmailTemplate("Welcome Back!", `
      <p>Hi ${data.userName},</p>
      <p>Your SendMe Growth Partner account has been <strong>reactivated</strong>.</p>
      <div style="text-align: center; margin: 24px 0;">
        <span class="badge-success">Active</span>
      </div>
      <div style="background: #f0faf5; border: 2px dashed #158A5E; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
        <p style="margin: 0 0 8px 0; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Your Marketer ID</p>
        <p style="margin: 0; font-size: 28px; font-weight: 700; color: #158A5E; letter-spacing: 2px;">${data.marketerId}</p>
      </div>
      <p>Your marketer code is active again. Start sharing it to earn commissions!</p>
    `),
  };
}

export function buildMarketerDeactivatedEmail(data: {
  userName: string;
}): { subject: string; html: string } {
  return {
    subject: `SendMe Growth Partner - Account Deactivated`,
    html: buildEmailTemplate("Account Deactivated", `
      <p>Hi ${data.userName},</p>
      <p>Your SendMe Growth Partner account has been <strong>deactivated</strong>.</p>
      <div style="text-align: center; margin: 24px 0;">
        <span style="display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; background: #FFEBEE; color: #C62828;">Deactivated</span>
      </div>
      <p>Your marketer code is no longer active. If this was a mistake, please contact support.</p>
    `),
  };
}

export function buildMarketerRemovedEmail(data: {
  userName: string;
}): { subject: string; html: string } {
  return {
    subject: `SendMe Growth Partner - Account Removed`,
    html: buildEmailTemplate("Account Removed", `
      <p>Hi ${data.userName},</p>
      <p>Your SendMe Growth Partner account has been <strong>permanently removed</strong>.</p>
      <div style="text-align: center; margin: 24px 0;">
        <span style="display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; background: #FFEBEE; color: #C62828;">Removed</span>
      </div>
      <p>Your marketer profile and code have been deleted. If you believe this was done in error, please contact support.</p>
    `),
  };
}

export function buildMarketerRoleAssignedEmail(data: {
  userName: string;
  role: string;
}): { subject: string; html: string } {
  return {
    subject: `SendMe - Account Role Updated`,
    html: buildEmailTemplate("Account Role Updated", `
      <p>Hi ${data.userName},</p>
      <p>Your account has been updated with a new role.</p>
      <div style="background: #f0faf5; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
        <p style="margin: 0 0 8px 0; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Your Role</p>
        <p style="margin: 0; font-size: 20px; font-weight: 700; color: #158A5E; text-transform: capitalize;">${data.role}</p>
      </div>
      <p>You can now access all features available to ${data.role}s in the SendMe app.</p>
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

export function getCampaignFromAddress(senderName: string): string {
  const email = process.env.SENDBYTE_FROM_EMAIL || "noreply@senndme.com";
  return `${senderName} <${email}>`;
}

export interface CampaignEmailOptions {
  subject?: string;
  bannerBadge?: string;
  bannerTitle?: string;
  bannerSubtitle?: string;
  bannerImage?: string;
  previewText?: string;
  ctaText?: string;
  ctaUrl?: string;
}

export function buildCampaignEmailHtml(
  senderName: string,
  messageHtml: string,
  options?: CampaignEmailOptions
): string {
  const safeSender = senderName.trim();
  const bannerTitle = options?.bannerTitle || options?.subject || "Update from SendMe Dispatch";
  const bannerSubtitle = options?.bannerSubtitle || `Official dispatch update from ${safeSender} • SendMe Technologies`;
  const bannerBadge = options?.bannerBadge || "SENDME DISPATCH";
  const bannerImage = options?.bannerImage || SENDME_BANNER_PARCEL_ILLUS;

  return buildModernEmailShell({
    bannerBadge,
    bannerTitle,
    bannerSubtitle,
    bannerImage,
    bodyHtml: messageHtml,
    previewText: options?.previewText,
    senderName: safeSender,
    ctaText: options?.ctaText,
    ctaUrl: options?.ctaUrl,
  });
}

export interface OrderDeliveredEmailData {
  orderId: string;
  customerName?: string;
  riderName?: string;
  vehiclePlate?: string;
  pickupAddress: string;
  dropoffAddress: string;
  packageDescription?: string;
  amount: number;
  cashbackEarned?: number;
  deliveredAt?: string;
  trackingUrl?: string;
}

export function buildOrderDeliveredEmail(data: OrderDeliveredEmailData): { subject: string; html: string; text: string } {
  const customer = data.customerName || "Valued Customer";
  const formattedAmount = `₦${(data.amount || 0).toLocaleString()}`;
  const deliveredDate = data.deliveredAt || new Date().toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
  const trackUrl = data.trackingUrl || `https://senndme.com/track?id=${encodeURIComponent(data.orderId)}`;

  const bodyHtml = `
    <div style="font-size: 16px; font-weight: 700; color: #111827; margin: 4px 0 6px 0;">
      Hi ${escapeHtml(customer)},
    </div>
    <p style="font-size: 14px; line-height: 1.6; color: #4B5563; margin: 0 0 18px 0;">
      Your package has been successfully delivered by rider <strong>${escapeHtml(data.riderName || "your assigned rider")}</strong>. Handover was confirmed with your secure 4-digit verification PIN.
    </p>

    <!-- DELIVERY STATUS BADGE -->
    <div style="margin-bottom: 20px; text-align: left;">
      <span style="display: inline-block; background-color: #ECFDF5; border: 1px solid #A7F3D0; color: #065F46; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 999px;">
        ✓ Delivery Completed
      </span>
    </div>

    <!-- ORDER DETAILS CARD -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; margin-bottom: 18px;">
      <tr>
        <td style="padding: 16px 18px;">
          
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 12px;">
            <tr>
              <td style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #6B7280; letter-spacing: 0.5px;">ORDER REFERENCE</td>
              <td align="right" style="font-size: 12.5px; font-weight: 700; color: #111827; font-family: monospace;">#${escapeHtml(data.orderId.slice(0, 10))}</td>
            </tr>
          </table>

          <div style="border-top: 1px solid #E5E7EB; margin-bottom: 12px;"></div>

          <!-- Pickup -->
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 10px;">
            <tr>
              <td width="22" style="vertical-align: top; padding-top: 2px;">
                <div style="width: 10px; height: 10px; border-radius: 5px; background-color: #158A5E;"></div>
              </td>
              <td style="vertical-align: top;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #6B7280;">PICKUP ADDRESS</div>
                <div style="font-size: 13px; font-weight: 600; color: #111827; margin-top: 2px;">${escapeHtml(data.pickupAddress)}</div>
              </td>
            </tr>
          </table>

          <!-- Dropoff -->
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 12px;">
            <tr>
              <td width="22" style="vertical-align: top; padding-top: 2px;">
                <div style="width: 10px; height: 10px; border-radius: 5px; background-color: #111827;"></div>
              </td>
              <td style="vertical-align: top;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #6B7280;">DROPOFF ADDRESS</div>
                <div style="font-size: 13px; font-weight: 600; color: #111827; margin-top: 2px;">${escapeHtml(data.dropoffAddress)}</div>
              </td>
            </tr>
          </table>

          ${data.packageDescription ? `
          <div style="border-top: 1px solid #E5E7EB; margin-bottom: 12px;"></div>
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 8px;">
            <tr>
              <td style="font-size: 12px; color: #6B7280;">Package:</td>
              <td align="right" style="font-size: 12.5px; font-weight: 600; color: #111827;">${escapeHtml(data.packageDescription)}</td>
            </tr>
          </table>` : ""}

          ${data.riderName ? `
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 8px;">
            <tr>
              <td style="font-size: 12px; color: #6B7280;">Delivered By:</td>
              <td align="right" style="font-size: 12.5px; font-weight: 600; color: #111827;">
                ${escapeHtml(data.riderName)}${data.vehiclePlate ? ` &bull; ${escapeHtml(data.vehiclePlate)}` : ""}
              </td>
            </tr>
          </table>` : ""}

          <div style="border-top: 1px solid #E5E7EB; margin: 10px 0 12px 0;"></div>

          <!-- Total Fare -->
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="font-size: 13.5px; font-weight: 700; color: #111827;">Total Paid</td>
              <td align="right" style="font-size: 17px; font-weight: 800; color: #158A5E;">${formattedAmount}</td>
            </tr>
          </table>

        </td>
      </tr>
    </table>

    ${data.cashbackEarned && data.cashbackEarned > 0 ? `
    <!-- CASHBACK REWARD CARD -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-left: 4px solid #158A5E; border-radius: 10px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 12px 16px;">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #158A5E; letter-spacing: 0.5px;">
            🎉 CASHBACK EARNED
          </div>
          <div style="font-size: 14.5px; font-weight: 700; color: #111827; margin-top: 2px;">
            ₦${data.cashbackEarned.toLocaleString()} credited to your SendMe Wallet!
          </div>
        </td>
      </tr>
    </table>` : ""}

    <!-- ACTION BUTTON -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding-top: 4px; padding-bottom: 8px;">
          <a href="${escapeHtml(trackUrl)}" style="display: inline-block; background-color: #158A5E; color: #FFFFFF; font-size: 14px; font-weight: 700; text-decoration: none; padding: 13px 32px; border-radius: 8px; letter-spacing: 0.2px;">
            View Delivery Receipt &amp; Trip Details &rarr;
          </a>
        </td>
      </tr>
    </table>
  `;

  const html = buildModernEmailShell({
    bannerBadge: "DELIVERED",
    bannerTitle: "Package Delivered Successfully",
    bannerSubtitle: `Handover verified with PIN code on ${deliveredDate}.`,
    bannerImage: SENDME_BANNER_PARCEL_ILLUS,
    bodyHtml,
    previewText: `Your package to ${data.dropoffAddress} has been delivered successfully. Total fare: ${formattedAmount}.`,
  });

  const text = `Hi ${customer},\n\nYour package has been successfully delivered by rider ${data.riderName || "your assigned rider"}.\n\nOrder: #${data.orderId}\nPickup: ${data.pickupAddress}\nDropoff: ${data.dropoffAddress}\nTotal Paid: ${formattedAmount}\n\nView details: ${trackUrl}\n\nThank you for choosing SendMe.`;

  return {
    subject: `Delivered: Package Handover Confirmed (Order #${data.orderId.slice(0, 8)})`,
    html,
    text,
  };
}
