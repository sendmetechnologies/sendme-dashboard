"use client"

import { ChevronDown } from "lucide-react"

export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT",
  "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi",
  "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
  "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
]

interface FilterSelectProps {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  className?: string
}

export function FilterSelect({ value, onChange, options, placeholder, className }: FilterSelectProps) {
  return (
    <div className={`relative ${className || ""}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-white border border-border-default rounded-lg pl-3 pr-8 py-2 text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors cursor-pointer focus:outline-none focus:border-sendme"
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

export function StateFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <FilterSelect
      value={value}
      onChange={onChange}
      placeholder="All States"
      options={NIGERIAN_STATES.map((s) => ({ value: s, label: s }))}
    />
  )
}
