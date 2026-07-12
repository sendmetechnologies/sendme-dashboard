interface SendSMSParams {
  phone: string;
  message: string;
}

interface TermiiResponse {
  code?: string;
  message_id?: string;
  message?: string;
  balance?: number;
  user?: string;
}

const TERMII_API_URL = "https://api.ng.termii.com/api/sms/send";

export async function sendSMS({
  phone,
  message,
}: SendSMSParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = process.env.TERMII_API_KEY;
  const senderId = process.env.TERMII_SENDER_ID;

  if (!apiKey) {
    console.warn("[Termii] No API key configured");
    return { success: false, error: "No API key configured" };
  }

  // Format to E.164 digits only (e.g. 2348123456789)
  let formattedPhone = phone.replace(/[^\d]/g, "");

  // Common Nigerian mismatch: +234080... should be 23480...
  if (formattedPhone.startsWith("2340")) {
    formattedPhone = "234" + formattedPhone.slice(4);
  }

  try {
    const response = await fetch(TERMII_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: formattedPhone,
        from: senderId,
        sms: message,
        type: "plain",
        channel: "dnd",
        api_key: apiKey,
      }),
    });

    const data: TermiiResponse = await response.json();

    if (!response.ok) {
      console.error("[Termii] API error:", data);
      return { success: false, error: data.message || `HTTP ${response.status}` };
    }

    return { success: true, messageId: data.message_id };
  } catch (err) {
    console.error("[Termii] Network error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

export function buildOTPMessage(otp: string): string {
  return `Your SendMe secure verification code is: ${otp}. Do not share this with anyone.`;
}
