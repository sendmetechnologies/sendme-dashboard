"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import {
  Download, Copy, Check, Filter, Search, Users, ShieldCheck,
  AlertTriangle, Phone, Mail, Building2, CheckCircle2,
  RefreshCw, Loader2, Sparkles, FileSpreadsheet, Eye, Info
} from "lucide-react";

interface CsvPreviewRow {
  phone: string;
  email: string;
  fullName: string;
  primaryArea: string;
  status: "TRUE" | "FALSE";
  secondaryLocation: string;
  accountId: string;
}

interface ExportStats {
  total: number;
  withPhone: number;
  withEmail: number;
}

const USER_TYPE_OPTIONS = [
  { id: "all", label: "All Users", icon: Users, badgeColor: "bg-purple-50 text-purple-700 border-purple-200" },
  { id: "senders", label: "Senders (All)", icon: Users, badgeColor: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "senders_online", label: "Senders Online", icon: Sparkles, badgeColor: "bg-emerald-50 text-sendme border-emerald-200" },
  { id: "riders", label: "Riders (All)", icon: Users, badgeColor: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "riders_online", label: "Riders Online", icon: CheckCircle2, badgeColor: "bg-emerald-50 text-sendme border-emerald-200" },
  { id: "riders_verified", label: "Verified Riders", icon: ShieldCheck, badgeColor: "bg-emerald-50 text-sendme border-emerald-200" },
  { id: "riders_unverified", label: "Riders Unverified", icon: AlertTriangle, badgeColor: "bg-rose-50 text-rose-700 border-rose-200" },
  { id: "org", label: "Organizations", icon: Building2, badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200" },
];

export default function CsvExportPage() {
  const [userType, setUserType] = useState<string>("riders_unverified");
  const [requirePhone, setRequirePhone] = useState<boolean>(true);
  const [requireEmail, setRequireEmail] = useState<boolean>(false);
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [phoneFormat, setPhoneFormat] = useState<"10_digit" | "local" | "international">("10_digit");
  const [includeHeaders, setIncludeHeaders] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(true);
  const [previewRows, setPreviewRows] = useState<CsvPreviewRow[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [stats, setStats] = useState<ExportStats>({ total: 0, withPhone: 0, withEmail: 0 });
  const [csvContent, setCsvContent] = useState<string>("");

  const [downloading, setDownloading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Fetch preview data whenever filters change
  const fetchExportData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: userType,
        requirePhone: String(requirePhone),
        requireEmail: String(requireEmail),
        state: stateFilter,
        phoneFormat,
        includeHeaders: String(includeHeaders),
        format: "json",
      });

      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }

      const res = await fetch(`/api/dashboard/csv-export?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPreviewRows(data.previewRows || []);
        setTotalCount(data.totalCount || 0);
        setStats(data.stats || { total: 0, withPhone: 0, withEmail: 0 });
        setCsvContent(data.csvContent || "");
      }
    } catch (err) {
      console.error("Failed to load export preview:", err);
    } finally {
      setLoading(false);
    }
  }, [userType, requirePhone, requireEmail, stateFilter, phoneFormat, includeHeaders, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchExportData();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchExportData]);

  // Handle local CSV file download
  const handleDownloadCsv = () => {
    setDownloading(true);
    try {
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const filename = `sendme-${userType}-${new Date().toISOString().slice(0, 10)}.csv`;
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to download CSV");
    } finally {
      setDownloading(false);
    }
  };

  // Handle copying CSV text to clipboard
  const handleCopyClipboard = () => {
    if (!csvContent) return;
    navigator.clipboard.writeText(csvContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sendme-50 text-sendme flex items-center justify-center">
              <FileSpreadsheet size={18} />
            </div>
            <h1 className="text-xl font-bold text-text-primary">CSV Data Export Hub</h1>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Export users, riders, senders, and organizations in the exact 7-column CSV template format.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyClipboard}
            disabled={loading || totalCount === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-surface-secondary border border-border-default rounded-xl text-xs font-semibold text-text-primary hover:bg-surface-secondary/80 transition-all disabled:opacity-50"
            title="Copy entire CSV to clipboard"
          >
            {copied ? <Check size={14} className="text-sendme" /> : <Copy size={14} className="text-text-muted" />}
            {copied ? "Copied!" : "Copy CSV"}
          </button>

          <button
            onClick={handleDownloadCsv}
            disabled={loading || totalCount === 0 || downloading}
            className="flex items-center gap-1.5 px-4 py-2 bg-sendme text-white rounded-xl text-xs font-bold hover:bg-sendme-dark transition-all shadow-xs disabled:opacity-50"
          >
            {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Export & Download CSV ({totalCount.toLocaleString()})
          </button>
        </div>
      </div>

      {/* Template Format Banner */}
      <div className="bg-emerald-50/70 border border-sendme/20 rounded-xl p-3.5 text-xs text-text-secondary">
        <div className="flex items-center gap-1.5 font-bold text-sendme-dark mb-1">
          <Info size={14} className="text-sendme shrink-0" />
          <span>7-Column CSV Template Alignment:</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mt-2 font-mono text-[11px]">
          <div className="bg-white p-2 rounded-lg border border-border-light text-center">
            <span className="text-[10px] text-text-muted block">Col 1</span>
            <span className="font-semibold text-text-primary">Phone (10 Digits)</span>
          </div>
          <div className="bg-white p-2 rounded-lg border border-border-light text-center">
            <span className="text-[10px] text-text-muted block">Col 2</span>
            <span className="font-semibold text-text-primary">Email Address</span>
          </div>
          <div className="bg-white p-2 rounded-lg border border-border-light text-center">
            <span className="text-[10px] text-text-muted block">Col 3</span>
            <span className="font-semibold text-text-primary">Full Name</span>
          </div>
          <div className="bg-white p-2 rounded-lg border border-border-light text-center">
            <span className="text-[10px] text-text-muted block">Col 4</span>
            <span className="font-semibold text-text-primary">Area / LGA</span>
          </div>
          <div className="bg-white p-2 rounded-lg border border-border-light text-center">
            <span className="text-[10px] text-text-muted block">Col 5</span>
            <span className="font-semibold text-sendme">Status (TRUE/FALSE)</span>
          </div>
          <div className="bg-white p-2 rounded-lg border border-border-light text-center">
            <span className="text-[10px] text-text-muted block">Col 6</span>
            <span className="font-semibold text-text-primary">Destination/Location</span>
          </div>
          <div className="bg-white p-2 rounded-lg border border-border-light text-center">
            <span className="text-[10px] text-text-muted block">Col 7</span>
            <span className="font-semibold text-text-primary">Account ID</span>
          </div>
        </div>
      </div>

      {/* User Type Selection Tabs */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2">
          Select User Type to Export:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {USER_TYPE_OPTIONS.map((opt) => {
            const isSelected = userType === opt.id;
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={() => setUserType(opt.id)}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-sendme text-white border-sendme shadow-xs font-bold"
                    : "bg-white text-text-primary border-border-default hover:bg-surface-secondary/70 font-medium"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Icon size={14} className={isSelected ? "text-white" : "text-text-muted"} />
                  {isSelected && <CheckCircle2 size={12} className="text-white" />}
                </div>
                <span className="text-xs leading-tight">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Bar & Options */}
      <div className="bg-white p-4 rounded-xl border border-border-default space-y-3.5 shadow-2xs">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-xs font-bold text-text-primary flex items-center gap-1.5">
            <Filter size={14} className="text-sendme" /> Export Settings & Filters
          </p>
          <button
            onClick={() => fetchExportData()}
            className="flex items-center gap-1 text-[11px] font-semibold text-sendme hover:underline"
          >
            <RefreshCw size={12} /> Refresh Data
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search box */}
          <div className="relative">
            <label className="text-[11px] font-medium text-text-secondary block mb-1">Search Keyword</label>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-text-muted" />
              <input
                type="text"
                placeholder="Name, phone, email, area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs text-text-primary bg-surface-secondary border border-border-default rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:border-sendme"
              />
            </div>
          </div>

          {/* State Filter */}
          <div>
            <label className="text-[11px] font-medium text-text-secondary block mb-1">Filter by State</label>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="w-full text-xs text-text-primary bg-surface-secondary border border-border-default rounded-lg px-3 py-2 focus:outline-none focus:border-sendme"
            >
              <option value="all">All States</option>
              <option value="Lagos">Lagos</option>
              <option value="Abuja">Abuja / FCT</option>
              <option value="Rivers">Rivers (Port Harcourt)</option>
              <option value="Oyo">Oyo (Ibadan)</option>
              <option value="Kano">Kano</option>
              <option value="Enugu">Enugu</option>
            </select>
          </div>

          {/* Phone Format */}
          <div>
            <label className="text-[11px] font-medium text-text-secondary block mb-1">Phone Format</label>
            <select
              value={phoneFormat}
              onChange={(e) => setPhoneFormat(e.target.value as any)}
              className="w-full text-xs text-text-primary bg-surface-secondary border border-border-default rounded-lg px-3 py-2 focus:outline-none focus:border-sendme font-mono"
            >
              <option value="10_digit">10 Digits (Template: 9023118167)</option>
              <option value="local">Local 11 Digits (09023118167)</option>
              <option value="international">E.164 (+2349023118167)</option>
            </select>
          </div>

          {/* CSV Headers Toggle */}
          <div>
            <label className="text-[11px] font-medium text-text-secondary block mb-1">CSV Header Row</label>
            <select
              value={String(includeHeaders)}
              onChange={(e) => setIncludeHeaders(e.target.value === "true")}
              className="w-full text-xs text-text-primary bg-surface-secondary border border-border-default rounded-lg px-3 py-2 focus:outline-none focus:border-sendme"
            >
              <option value="false">No Header Row (Matches Uploaded Template)</option>
              <option value="true">Include Header (Phone, Email, Name...)</option>
            </select>
          </div>
        </div>

        {/* Robust Selection Checkboxes */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border-light text-xs">
          <label className="flex items-center gap-2 cursor-pointer font-medium text-text-primary">
            <input
              type="checkbox"
              checked={requirePhone}
              onChange={(e) => setRequirePhone(e.target.checked)}
              className="rounded text-sendme focus:ring-sendme accent-sendme"
            />
            <span className="flex items-center gap-1">
              <Phone size={12} className="text-sendme" /> Require Valid Phone Number (Exclude users without phone)
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer font-medium text-text-primary">
            <input
              type="checkbox"
              checked={requireEmail}
              onChange={(e) => setRequireEmail(e.target.checked)}
              className="rounded text-sendme focus:ring-sendme accent-sendme"
            />
            <span className="flex items-center gap-1">
              <Mail size={12} className="text-sendme" /> Require Valid Email Address
            </span>
          </label>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3.5">
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Matching Records</p>
          <p className="text-xl font-bold text-text-primary mt-1">{totalCount.toLocaleString()}</p>
        </Card>
        <Card className="p-3.5">
          <p className="text-[10px] text-text-muted uppercase tracking-wider">With Phone Number</p>
          <p className="text-xl font-bold text-sendme mt-1">{stats.withPhone.toLocaleString()}</p>
        </Card>
        <Card className="p-3.5">
          <p className="text-[10px] text-text-muted uppercase tracking-wider">With Email</p>
          <p className="text-xl font-bold text-blue-600 mt-1">{stats.withEmail.toLocaleString()}</p>
        </Card>
        <Card className="p-3.5">
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Estimated CSV Size</p>
          <p className="text-xl font-bold text-purple-600 mt-1">
            {(csvContent.length / 1024).toFixed(1)} KB
          </p>
        </Card>
      </div>

      {/* Data Preview Table */}
      <div className="bg-white border border-border-default rounded-xl overflow-hidden shadow-xs">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-light bg-surface-secondary/40">
          <div className="flex items-center gap-2">
            <Eye size={15} className="text-sendme" />
            <h3 className="text-xs font-bold text-text-primary">
              Live CSV Preview ({previewRows.length} of {totalCount.toLocaleString()} rows shown)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-text-muted bg-white px-2 py-0.5 rounded border border-border-light">
            Template: 7 Columns
          </span>
        </div>

        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <Loader2 size={22} className="animate-spin text-sendme" />
          </div>
        ) : previewRows.length === 0 ? (
          <div className="py-12 text-center text-text-muted">
            <FileSpreadsheet size={32} className="mx-auto mb-2 text-text-muted/40" />
            <p className="text-sm font-semibold text-text-primary">No matching records found</p>
            <p className="text-xs text-text-muted mt-0.5">Try relaxing your filter criteria or search keyword.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-left text-[10px] text-text-muted font-semibold uppercase tracking-wider border-b border-border-light bg-surface-secondary/30">
                  <th className="px-3.5 py-2.5 font-semibold">#</th>
                  <th className="px-3.5 py-2.5 font-semibold">Phone (Col 1)</th>
                  <th className="px-3.5 py-2.5 font-semibold">Email (Col 2)</th>
                  <th className="px-3.5 py-2.5 font-semibold">Full Name (Col 3)</th>
                  <th className="px-3.5 py-2.5 font-semibold">Primary Area (Col 4)</th>
                  <th className="px-3.5 py-2.5 font-semibold">Status (Col 5)</th>
                  <th className="px-3.5 py-2.5 font-semibold">Location (Col 6)</th>
                  <th className="px-3.5 py-2.5 font-semibold">Account ID (Col 7)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light font-sans text-xs">
                {previewRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-surface-secondary/40 transition-colors">
                    <td className="px-3.5 py-2 text-text-muted text-[10px] font-mono">{idx + 1}</td>
                    <td className="px-3.5 py-2 font-mono font-bold text-text-primary select-all">{row.phone}</td>
                    <td className="px-3.5 py-2 text-text-secondary select-all">{row.email || "-"}</td>
                    <td className="px-3.5 py-2 font-medium text-text-primary">{row.fullName}</td>
                    <td className="px-3.5 py-2 text-text-secondary">{row.primaryArea}</td>
                    <td className="px-3.5 py-2">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          row.status === "TRUE"
                            ? "bg-sendme-50 text-sendme border border-sendme/20"
                            : "bg-danger-light text-danger border border-danger/20"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-3.5 py-2 text-text-secondary">{row.secondaryLocation}</td>
                    <td className="px-3.5 py-2 font-mono text-text-muted text-[11px] select-all">{row.accountId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
