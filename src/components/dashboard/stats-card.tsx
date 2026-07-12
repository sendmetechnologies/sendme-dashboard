import type { LucideIcon } from "lucide-react"

interface StatsCardProps {
  label: string
  value: string | number
  change?: string
  changeType?: "up" | "down" | "neutral"
  icon: LucideIcon
  color?: string
  bgColor?: string
}

export function StatsCard({ label, value, change, changeType, icon: Icon, color = "text-sendme", bgColor = "bg-sendme-50" }: StatsCardProps) {
  return (
    <div className="bg-white border border-border-default rounded-xl p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${bgColor} ${color}`}>
          <Icon size={18} />
        </div>
        {change && (
          <span
            className={`text-xs font-medium ${
              changeType === "up"
                ? "text-sendme"
                : changeType === "down"
                  ? "text-danger"
                  : "text-text-muted"
            }`}
          >
            {changeType === "up" ? "↑" : changeType === "down" ? "↓" : ""} {change}
          </span>
        )}
      </div>
      <div>
        <p className="text-xs text-text-muted font-medium mb-1">{label}</p>
        <p className="text-2xl font-bold text-text-primary">{value}</p>
      </div>
    </div>
  )
}
