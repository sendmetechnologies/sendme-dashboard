// Geocoding service for SendMe Admin Dashboard
// Supports reverse geocoding, forward address search, and autocomplete suggestions.

const GEOAPIFY_KEY =
  process.env.GEOAPIFY_KEY ||
  process.env.NEXT_PUBLIC_GEOAPIFY_KEY ||
  "931ed46e49c743e0a86a0257d3f90894";

export interface GeocodeResult {
  lat: number;
  lng: number;
  formatted: string;
  name?: string;
  state?: string;
  city?: string;
}

export interface LocationSuggestion {
  label: string;
  address: string;
  lat: number;
  lng: number;
  state?: string;
}

/**
 * Parse raw coordinate string like "9.0579, 7.4951" or "lat: 9.0579, lng: 7.4951"
 */
export function parseCoordinates(query: string): { lat: number; lng: number } | null {
  if (!query) return null;
  const trimmed = query.trim();
  const match = trimmed.match(/^(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)$/);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[3]);
    if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng };
    }
  }
  return null;
}

/**
 * Reverse geocode a rider's lat/lng into a readable area (e.g. "Ikeja, Lagos")
 */
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

/**
 * Forward geocode an address string (e.g. copied from an order pickup location)
 * into precise lat/lng coordinates and formatted address.
 */
export async function forwardGeocode(query: string): Promise<GeocodeResult | null> {
  if (!query || !query.trim()) return null;
  const q = query.trim();

  // Check if query is already raw coordinates (e.g. "9.0579, 7.4951")
  const rawCoords = parseCoordinates(q);
  if (rawCoords) {
    const area = await reverseGeocodeArea(rawCoords.lat, rawCoords.lng);
    return {
      lat: rawCoords.lat,
      lng: rawCoords.lng,
      formatted: area || `${rawCoords.lat.toFixed(5)}, ${rawCoords.lng.toFixed(5)}`,
      name: area || `${rawCoords.lat.toFixed(5)}, ${rawCoords.lng.toFixed(5)}`,
    };
  }

  // 1. Primary: Geoapify Forward Geocoding with country=ng
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);

    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(q)}&country=ng&apiKey=${GEOAPIFY_KEY}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      const feature = data?.features?.[0];
      if (feature) {
        const props = feature.properties || {};
        return {
          lat: props.lat,
          lng: props.lon,
          formatted: props.formatted || q,
          name: props.name || props.street || props.suburb || props.formatted,
          state: props.state || props.county,
          city: props.city || props.suburb,
        };
      }
    }
  } catch (err) {
    console.warn("[Geocode] Geoapify forward search failed, trying fallback:", err);
  }

  // 2. Fallback: Komoot Photon (OpenStreetMap) with Nigeria bias
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);

    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lat=9.08&lon=7.4&countrycode=ng`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      const feature = data?.features?.[0];
      if (feature) {
        const coords = feature.geometry?.coordinates;
        const props = feature.properties || {};
        if (Array.isArray(coords) && coords.length >= 2) {
          const [lng, lat] = coords;
          const formatted = [props.name, props.city, props.state, props.country].filter(Boolean).join(", ");
          return {
            lat,
            lng,
            formatted: formatted || q,
            name: props.name || formatted,
            state: props.state,
            city: props.city,
          };
        }
      }
    }
  } catch (fallbackErr) {
    console.warn("[Geocode] Photon fallback failed:", fallbackErr);
  }

  return null;
}

/**
 * Autocomplete suggestions for real-time address search
 */
export async function fetchLocationSuggestions(query: string): Promise<LocationSuggestion[]> {
  if (!query || query.trim().length < 2) return [];
  const q = query.trim();

  // If raw coordinates, return single suggestion
  const rawCoords = parseCoordinates(q);
  if (rawCoords) {
    return [
      {
        label: `Coordinates: ${rawCoords.lat}, ${rawCoords.lng}`,
        address: `${rawCoords.lat}, ${rawCoords.lng}`,
        lat: rawCoords.lat,
        lng: rawCoords.lng,
      },
    ];
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(q)}&country=ng&apiKey=${GEOAPIFY_KEY}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) return [];

    const data = await res.json();
    const features = data?.features || [];

    return features.slice(0, 5).map((f: any) => {
      const p = f.properties || {};
      const label = p.name || p.street || p.suburb || p.city || p.formatted;
      return {
        label: label,
        address: p.formatted,
        lat: p.lat,
        lng: p.lon,
        state: p.state || p.county,
      };
    });
  } catch {
    return [];
  }
}
