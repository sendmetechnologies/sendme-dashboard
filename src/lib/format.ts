function fmtUnit(x: number): string {
  if (x >= 100) return Math.round(x).toString()
  const t = x.toFixed(1)
  return t.endsWith(".0") ? t.slice(0, -2) : t
}

export function formatCompactCount(n: number): string {
  const sign = n < 0 ? "-" : ""
  const abs = Math.abs(n)
  if (abs >= 1_000_000_000) return `${sign}${fmtUnit(abs / 1e9)}B`
  if (abs >= 1_000_000) return `${sign}${fmtUnit(abs / 1e6)}M`
  if (abs >= 100_000) return `${sign}${fmtUnit(abs / 1e3)}K`
  return n.toLocaleString("en-NG")
}

export function formatCompactCurrency(n: number): string {
  const sign = n < 0 ? "-" : ""
  const abs = Math.abs(n)
  const prefix = `${sign}₦`
  if (abs >= 1_000_000_000) return `${prefix}${fmtUnit(abs / 1e9)}B`
  if (abs >= 1_000_000) return `${prefix}${fmtUnit(abs / 1e6)}M`
  if (abs >= 10_000) return `${prefix}${fmtUnit(abs / 1e3)}K`
  return `${prefix}${Math.round(abs).toLocaleString("en-NG")}`
}

const NAIRA_RE = /₦\s?(-?[\d,]+(?:\.\d+)?)/

export function formatCardValue(v: string | number): string {
  if (typeof v === "number") return formatCompactCount(v)
  const m = v.match(NAIRA_RE)
  if (m) {
    const num = Number(m[1].replace(/,/g, ""))
    if (!Number.isNaN(num)) return formatCompactCurrency(num)
  }
  return v
}