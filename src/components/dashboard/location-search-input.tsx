"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MapPin, X, Loader2, Navigation, Compass, ChevronDown, Check } from "lucide-react";
import { NIGERIAN_HUBS } from "./filters";

export interface SelectedLocation {
  label: string;
  address: string;
  lat: number;
  lng: number;
  state?: string;
}

interface LocationSearchInputProps {
  selectedLocation: SelectedLocation | null;
  onSelectLocation: (loc: SelectedLocation | null) => void;
  radius: string;
  onRadiusChange: (radius: string) => void;
  stateFilter?: string;
  className?: string;
}

export function LocationSearchInput({
  selectedLocation,
  onSelectLocation,
  radius,
  onRadiusChange,
  stateFilter,
  className,
}: LocationSearchInputProps) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<
    { label: string; address: string; lat: number; lng: number; state?: string }[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showHubsDropdown, setShowHubsDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setShowHubsDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions when query changes (debounced 300ms)
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}&mode=autocomplete`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.results || []);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.warn("[LocationSearch] Suggestion error:", err);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query]);

  // Execute full geocode search on Enter or submit
  const handleExecuteSearch = async (searchTarget?: string) => {
    const textToSearch = searchTarget || query;
    if (!textToSearch || !textToSearch.trim()) return;

    setIsSearching(true);
    setShowSuggestions(false);
    setShowHubsDropdown(false);

    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(textToSearch)}&mode=search`);
      if (res.ok) {
        const data = await res.json();
        if (data.result && data.result.lat && data.result.lng) {
          const loc: SelectedLocation = {
            label: data.result.name || data.result.formatted || textToSearch,
            address: data.result.formatted || textToSearch,
            lat: data.result.lat,
            lng: data.result.lng,
            state: data.result.state,
          };
          onSelectLocation(loc);
          if (!radius) {
            onRadiusChange("15"); // Default to 15km if none selected
          }
          setQuery("");
        } else {
          alert(`Could not pinpoint location: "${textToSearch}". Try adding the city name, e.g. "Maitama, Abuja".`);
        }
      }
    } catch (err) {
      console.error("[LocationSearch] Geocode search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSuggestion = (s: { label: string; address: string; lat: number; lng: number; state?: string }) => {
    onSelectLocation({
      label: s.label,
      address: s.address,
      lat: s.lat,
      lng: s.lng,
      state: s.state,
    });
    if (!radius) {
      onRadiusChange("15");
    }
    setQuery("");
    setShowSuggestions(false);
  };

  const handleSelectHub = (hub: { name: string; state: string; lat: number; lng: number }) => {
    onSelectLocation({
      label: hub.name,
      address: `${hub.name}, ${hub.state}`,
      lat: hub.lat,
      lng: hub.lng,
      state: hub.state,
    });
    if (!radius) {
      onRadiusChange("15");
    }
    setShowHubsDropdown(false);
    setShowSuggestions(false);
  };

  const handleClearLocation = () => {
    onSelectLocation(null);
    setQuery("");
  };

  // Filter preset hubs by state if stateFilter is active
  const filteredHubs = stateFilter
    ? NIGERIAN_HUBS.filter(
        (h) =>
          h.state.toLowerCase() === stateFilter.toLowerCase() ||
          (stateFilter.toLowerCase() === "fct" && h.state === "FCT") ||
          (stateFilter.toLowerCase() === "abuja" && h.state === "FCT")
      )
    : NIGERIAN_HUBS;

  return (
    <div ref={containerRef} className={`relative flex items-center gap-2 flex-wrap sm:flex-nowrap ${className || ""}`}>
      {/* If a location is currently selected, show the active badge */}
      {selectedLocation ? (
        <div className="flex items-center gap-2 bg-sendme-50 border border-sendme/30 rounded-lg px-3 py-1.5 text-xs text-sendme font-medium shrink-0 max-w-full">
          <MapPin size={13} className="text-sendme shrink-0" />
          <span className="truncate max-w-[200px] sm:max-w-[280px]" title={selectedLocation.address}>
            {selectedLocation.label}
          </span>
          <button
            onClick={handleClearLocation}
            className="text-sendme/70 hover:text-danger hover:bg-white rounded-full p-0.5 transition-colors ml-1"
            title="Clear location search"
          >
            <X size={13} />
          </button>
        </div>
      ) : (
        /* Address Search Input */
        <div className="relative flex-1 min-w-[240px] max-w-[420px]">
          <div className="flex items-center gap-1.5 bg-white border border-border-default rounded-lg px-2.5 py-1.5 shadow-xs focus-within:border-sendme focus-within:ring-1 focus-within:ring-sendme/20 transition-all">
            <MapPin size={14} className="text-sendme shrink-0" />
            <input
              type="text"
              placeholder="Paste pickup address or type location..."
              className="flex-1 text-xs text-text-primary placeholder:text-text-muted bg-transparent focus:outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleExecuteSearch();
                }
              }}
            />
            {isSearching ? (
              <Loader2 size={13} className="animate-spin text-sendme shrink-0" />
            ) : query ? (
              <button
                onClick={() => setQuery("")}
                className="text-text-muted hover:text-text-primary p-0.5 text-xs"
              >
                ✕
              </button>
            ) : null}

            <button
              onClick={() => handleExecuteSearch()}
              disabled={!query.trim() || isSearching}
              className="bg-sendme text-white text-[11px] font-semibold px-2 py-1 rounded hover:bg-sendme-dark transition-colors disabled:opacity-40 disabled:pointer-events-none shrink-0"
            >
              Search
            </button>

            {/* Quick Hubs Dropdown Trigger */}
            <button
              type="button"
              onClick={() => {
                setShowHubsDropdown(!showHubsDropdown);
                setShowSuggestions(false);
              }}
              className="border-l border-border-default pl-1.5 text-text-muted hover:text-text-primary text-[11px] flex items-center gap-0.5 shrink-0"
              title="Select popular hub"
            >
              <Compass size={13} />
              <ChevronDown size={11} />
            </button>
          </div>

          {/* Autocomplete Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border-default rounded-lg shadow-lg z-50 overflow-hidden divide-y divide-border-light max-h-60 overflow-y-auto">
              <div className="px-2.5 py-1.5 bg-surface-secondary text-[10px] font-semibold uppercase tracking-wider text-text-muted flex items-center justify-between">
                <span>Matching Locations (Nigeria)</span>
                <span className="text-[9px]">Click to pinpoint</span>
              </div>
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSuggestion(s)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-sendme-50 transition-colors flex items-start gap-2 group"
                >
                  <MapPin size={13} className="text-sendme mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary group-hover:text-sendme truncate">{s.label}</p>
                    <p className="text-[11px] text-text-muted truncate">{s.address}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Preset Hubs Dropdown */}
          {showHubsDropdown && (
            <div className="absolute top-full right-0 w-64 mt-1 bg-white border border-border-default rounded-lg shadow-lg z-50 overflow-hidden divide-y divide-border-light max-h-64 overflow-y-auto">
              <div className="px-2.5 py-1.5 bg-surface-secondary text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                Popular Delivery Hubs
              </div>
              {filteredHubs.map((hub, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectHub(hub)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-sendme-50 transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <Navigation size={12} className="text-sendme shrink-0" />
                    <span className="font-medium text-text-primary group-hover:text-sendme truncate">{hub.name}</span>
                  </div>
                  <span className="text-[10px] text-text-muted bg-surface-secondary px-1.5 py-0.5 rounded shrink-0">{hub.state}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Radius Selector (linked with location) */}
      <div className="flex items-center gap-1">
        <select
          value={radius}
          onChange={(e) => onRadiusChange(e.target.value)}
          disabled={!selectedLocation}
          className={`appearance-none bg-white border border-border-default rounded-lg pl-2.5 pr-7 py-2 text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors cursor-pointer focus:outline-none focus:border-sendme ${
            !selectedLocation ? "opacity-50 cursor-not-allowed bg-surface-secondary" : ""
          }`}
          title={selectedLocation ? "Search radius around selected location" : "Select a location first to filter by radius"}
        >
          <option value="">{selectedLocation ? "Choose Radius" : "Radius (Select Location First)"}</option>
          <option value="5">Within 5 km</option>
          <option value="10">Within 10 km</option>
          <option value="15">Within 15 km</option>
          <option value="20">Within 20 km</option>
          <option value="30">Within 30 km</option>
          <option value="50">Within 50 km</option>
          <option value="100">Within 100 km</option>
        </select>
      </div>
    </div>
  );
}
