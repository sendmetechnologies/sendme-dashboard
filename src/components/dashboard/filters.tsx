"use client"

import { ChevronDown } from "lucide-react"

export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT",
  "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi",
  "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
  "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
]

export const NIGERIAN_HUBS: { name: string; state: string; lat: number; lng: number }[] = [
  { name: "Lagos - Ikeja (Capital / Mainland)", state: "Lagos", lat: 6.6018, lng: 3.3515 },
  { name: "Lagos - Lekki Phase 1 / Island", state: "Lagos", lat: 6.4474, lng: 3.4723 },
  { name: "Lagos - Victoria Island", state: "Lagos", lat: 6.4281, lng: 3.4219 },
  { name: "Lagos - Yaba / Tech Cluster", state: "Lagos", lat: 6.5167, lng: 3.3833 },
  { name: "Lagos - Surulere / Stadium", state: "Lagos", lat: 6.4984, lng: 3.3564 },
  { name: "Lagos - Alaba / Ojo International", state: "Lagos", lat: 6.4608, lng: 3.1952 },
  { name: "Abuja - Central Area (FCT)", state: "FCT", lat: 9.0579, lng: 7.4951 },
  { name: "Abuja - Garki District", state: "FCT", lat: 9.0306, lng: 7.4878 },
  { name: "Abuja - Wuse 2 Zone", state: "FCT", lat: 9.0765, lng: 7.4721 },
  { name: "Abuja - Maitama Diplomatic Zone", state: "FCT", lat: 9.0882, lng: 7.4934 },
  { name: "Abuja - Gwarinpa Estate", state: "FCT", lat: 9.1108, lng: 7.3941 },
  { name: "Rivers - Port Harcourt (GRA / Trans-Amadi)", state: "Rivers", lat: 4.8156, lng: 7.0498 },
  { name: "Kano - Sabon Gari / Fagge Hub", state: "Kano", lat: 12.0022, lng: 8.5920 },
  { name: "Oyo - Ibadan (Bodija / Dugbe)", state: "Oyo", lat: 7.3775, lng: 3.9470 },
  { name: "Enugu - Independence Layout", state: "Enugu", lat: 6.4413, lng: 7.4988 },
  { name: "Delta - Asaba International Hub", state: "Delta", lat: 6.1984, lng: 6.7327 },
  { name: "Ogun - Abeokuta / Sagamu", state: "Ogun", lat: 7.1475, lng: 3.3619 },
]

export const VEHICLE_OPTIONS = [
  { value: "bike", label: "Motorbike / Okada" },
  { value: "car", label: "Car (Sedan / Hatchback)" },
  { value: "van", label: "Van / Bus" },
  { value: "truck", label: "Truck (1 - 3 Tons)" },
  { value: "truck_medium", label: "Truck (4 - 7 Tons)" },
  { value: "truck_heavy", label: "Truck (8 - 15 Tons)" },
]

export const DATE_RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "last_30", label: "Last 30 Days" },
  { value: "year", label: "This Year" },
  { value: "all", label: "All Time" },
]

export const RADIUS_OPTIONS = [
  { value: "5", label: "Within 5 km" },
  { value: "10", label: "Within 10 km" },
  { value: "15", label: "Within 15 km" },
  { value: "20", label: "Within 20 km" },
  { value: "30", label: "Within 30 km" },
  { value: "50", label: "Within 50 km" },
  { value: "100", label: "Within 100 km" },
]

interface FilterSelectProps {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function FilterSelect({ value, onChange, options, placeholder, className, disabled }: FilterSelectProps) {
  return (
    <div className={`relative ${className || ""}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`appearance-none bg-white border border-border-default rounded-lg pl-3 pr-8 py-2 text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors cursor-pointer focus:outline-none focus:border-sendme ${
          disabled ? "opacity-50 cursor-not-allowed bg-surface-secondary" : ""
        }`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
    </div>
  )
}

export function StateFilter({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <FilterSelect
      value={value}
      onChange={onChange}
      className={className}
      placeholder="All States"
      options={NIGERIAN_STATES.map((s) => ({ value: s, label: s === "FCT" ? "FCT - Abuja" : s }))}
    />
  )
}

export function VehicleFilter({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <FilterSelect
      value={value}
      onChange={onChange}
      className={className}
      placeholder="All Vehicles"
      options={VEHICLE_OPTIONS}
    />
  )
}

export function DateRangeFilter({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <FilterSelect
      value={value}
      onChange={onChange}
      className={className}
      placeholder="Date Range: All"
      options={DATE_RANGE_OPTIONS}
    />
  )
}

export function RadiusFilter({ value, onChange, className, disabled }: { value: string; onChange: (v: string) => void; className?: string; disabled?: boolean }) {
  return (
    <FilterSelect
      value={value}
      onChange={onChange}
      className={className}
      disabled={disabled}
      placeholder="Radius: Any Distance"
      options={RADIUS_OPTIONS}
    />
  )
}

export function LocationHubFilter({ value, onChange, stateFilter, className }: { value: string; onChange: (v: string) => void; stateFilter?: string; className?: string }) {
  const filteredHubs = stateFilter
    ? NIGERIAN_HUBS.filter((h) => h.state.toLowerCase() === stateFilter.toLowerCase())
    : NIGERIAN_HUBS

  return (
    <FilterSelect
      value={value}
      onChange={onChange}
      className={className}
      placeholder="Reference Hub / Area"
      options={filteredHubs.map((h) => ({ value: `${h.lat},${h.lng}`, label: h.name }))}
    />
  )
}
