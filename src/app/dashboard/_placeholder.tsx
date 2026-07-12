"use client"

import { Card } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface PlaceholderPageProps {
  title: string
  subtitle: string
  icon: LucideIcon
}

export default function PlaceholderPage({ title, subtitle, icon: Icon }: PlaceholderPageProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-xl font-bold text-text-primary">{title}</h1>
        <p className="text-sm text-text-muted mt-0.5">{subtitle}</p>
      </div>
      <Card className="p-8 flex flex-col items-center justify-center text-center">
        <Icon size={40} className="text-text-muted mb-3" />
        <p className="text-sm font-medium text-text-primary">{title}</p>
        <p className="text-xs text-text-muted mt-1">Coming soon</p>
      </Card>
    </div>
  )
}
