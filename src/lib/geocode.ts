// Reverse geocoding for the admin dashboard: turn a rider's current lat/lng
// into a short human-readable area (e.g. "Ikeja, Lagos") so admins can see
// where online riders actually are. Fail-safe: returns null on any error so
// the drivers list always loads.

const GEOAPIFY_KEY =
  process.env.GEOAPIFY_KEY || "931ed46e49c743e0a86a0257d3f90894";

export async function reverseGeocodeArea(
  lat: number,
  lng: number,
): Promise<string | null> {
  if (!GEOAPIFY_KEY) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);

  try {
    const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${GEOAPIFY_KEY}&format=json`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;

    const data = await res.json();
    const r = data?.results?.[0];
    if (!r) return null;

    const area = r.suburb || r.city || r.county || r.village || r.town || "";
    const state = r.state || r.country || "";
    if (area && state && area !== state) return `${area}, ${state}`;
    if (area) return area;
    if (state) return state;
    return r.formatted || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
