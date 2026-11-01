/**
 * Privacy & PII Redaction Utilities for SendMe Marketing Dashboard.
 *
 * Ensures marketing personnel can monitor campaigns, conversion rates,
 * and live ad-event traffic without accessing identifiable customer PII.
 */

export function maskName(name?: string | null): string {
  if (!name || !name.trim()) return "User***";
  const trimmed = name.trim();
  const words = trimmed.split(/\s+/);
  return words
    .map((word) => {
      if (word.length <= 2) return `${word[0]}***`;
      return `${word.slice(0, 3)}***`;
    })
    .join(" ");
}

export function maskEmail(email?: string | null): string {
  if (!email || !email.includes("@")) return "masked***@***.com";
  const [local, domain] = email.split("@");
  const prefix = local.length <= 3 ? `${local[0]}***` : `${local.slice(0, 3)}***`;
  return `${prefix}@${domain}`;
}

export function maskPhone(phone?: string | null): string {
  if (!phone) return "••••••••••";
  const clean = phone.replace(/[^\d+]/g, "");
  if (clean.length <= 6) return "+234 ***";
  const start = clean.slice(0, 5);
  const end = clean.slice(-2);
  return `${start}***${end}`;
}

const NIGERIAN_CITIES = [
  "Lagos", "Ikeja", "Lekki", "Yaba", "Victoria Island", "Surulere", "Ikorodu",
  "Abuja", "Garki", "Wuse", "Maitama", "Gwarinpa", "Kubwa",
  "Port Harcourt", "Ibadan", "Kano", "Benin City", "Enugu", "Kaduna",
  "Calabar", "Warri", "Uyo", "Owerri", "Asaba", "Ilorin", "Abeokuta",
  "Akure", "Jos", "Makurdi", "Minna", "Zaria", "Sokoto", "Osogbo"
];

export function extractCityOnly(address?: string | null): string {
  if (!address || !address.trim()) return "Lagos";
  const text = address.trim();

  for (const city of NIGERIAN_CITIES) {
    if (new RegExp(`\\b${city}\\b`, "i").test(text)) {
      return city;
    }
  }

  // If comma separated, take the state/city portion
  const parts = text.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return parts[parts.length - 1];
  }

  return "Nigeria";
}

export function maskOrderId(orderId?: string | null): string {
  if (!orderId) return "ORD-****";
  const clean = orderId.replace(/-/g, "");
  return `ORD-${clean.slice(0, 4)}***`;
}
