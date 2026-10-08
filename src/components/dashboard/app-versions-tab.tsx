"use client";

import { useState, useEffect } from "react";
import {
  Smartphone, Save, Loader2, Check, AlertTriangle, ExternalLink,
  Info, ShieldAlert, Sparkles
} from "lucide-react";

interface AppVersionRecord {
  id: string;
  platform: "android" | "ios";
  latest_version: string;
  minimum_version: string;
  store_url: string;
  release_notes: string;
  is_mandatory: boolean;
  is_active: boolean;
  updated_at: string;
}

export function AppVersionsTab() {
  const [versions, setVersions] = useState<AppVersionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/app-versions");
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions || []);
      }
    } catch (e) {
      console.error("Failed to load versions:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, []);

  const handleChange = (id: string, field: keyof AppVersionRecord, val: any) => {
    setVersions((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: val } : v))
    );
  };

  const handleSave = async (record: AppVersionRecord) => {
    setSavingId(record.id);
    setErrorMsg("");

    try {
      const res = await fetch("/api/admin/app-versions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update version");
      }

      setSavedId(record.id);
      setTimeout(() => setSavedId(null), 2500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold text-text-primary">
          App Version & Update Modal Manager
        </h3>
        <p className="text-xs text-text-muted mt-0.5">
          Control live update popups, customize &quot;What&apos;s New&quot; release notes, and toggle mandatory updates for Android & iOS.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-2">
          <AlertTriangle size={14} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-text-muted">
          <Loader2 size={24} className="animate-spin text-sendme mb-2" />
          <p className="text-xs">Loading app version settings...</p>
        </div>
      ) : versions.length === 0 ? (
        <div className="py-10 text-center border border-dashed border-border-default rounded-xl">
          <p className="text-xs text-text-muted">No app version records configured.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {versions.map((ver) => (
            <div
              key={ver.id}
              className="border border-border-default rounded-xl bg-white p-5 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-4">
                {/* Platform Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border-light">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-surface-secondary flex items-center justify-center text-text-primary font-bold">
                      <Smartphone size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-text-primary uppercase tracking-wide">
                        {ver.platform} App
                      </h4>
                      <p className="text-[10px] text-text-muted">
                        Target platform configuration
                      </p>
                    </div>
                  </div>

                  {/* Master Active Toggle */}
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-medium text-text-secondary cursor-pointer">
                      {ver.is_active ? "Modal Active" : "Modal Disabled"}
                    </label>
                    <input
                      type="checkbox"
                      checked={ver.is_active}
                      onChange={(e) => handleChange(ver.id, "is_active", e.target.checked)}
                      className="w-4 h-4 text-sendme rounded border-border-default focus:ring-sendme"
                    />
                  </div>
                </div>

                {/* Versions Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-text-secondary mb-1 block">
                      Latest Store Version
                    </label>
                    <input
                      type="text"
                      value={ver.latest_version}
                      onChange={(e) => handleChange(ver.id, "latest_version", e.target.value)}
                      placeholder="e.g. 1.0.4"
                      className="w-full text-xs text-text-primary bg-white border border-border-default rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-sendme"
                    />
                    <p className="text-[10px] text-text-muted mt-1">
                      Prompts users below this version.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-text-secondary mb-1 block">
                      Minimum Supported Version
                    </label>
                    <input
                      type="text"
                      value={ver.minimum_version}
                      onChange={(e) => handleChange(ver.id, "minimum_version", e.target.value)}
                      placeholder="e.g. 1.0.0"
                      className="w-full text-xs text-text-primary bg-white border border-border-default rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-sendme"
                    />
                    <p className="text-[10px] text-text-muted mt-1">
                      Forces mandatory lock below this.
                    </p>
                  </div>
                </div>

                {/* Mandatory Checkbox */}
                <div className="flex items-center gap-2 bg-surface-secondary/50 p-2.5 rounded-lg border border-border-light">
                  <input
                    type="checkbox"
                    id={`mand_${ver.id}`}
                    checked={ver.is_mandatory}
                    onChange={(e) => handleChange(ver.id, "is_mandatory", e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded border-border-default focus:ring-red-500"
                  />
                  <label htmlFor={`mand_${ver.id}`} className="text-xs font-medium text-text-primary cursor-pointer">
                    Force Mandatory Update (Disables &quot;Later&quot; button)
                  </label>
                </div>

                {/* Release Notes */}
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">
                    What&apos;s New (Release Notes shown in app)
                  </label>
                  <textarea
                    rows={3}
                    value={ver.release_notes}
                    onChange={(e) => handleChange(ver.id, "release_notes", e.target.value)}
                    placeholder="List improvements, new features, or urgent fixes..."
                    className="w-full text-xs text-text-primary bg-white border border-border-default rounded-lg px-3 py-2 focus:outline-none focus:border-sendme"
                  />
                </div>

                {/* Store URL */}
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">
                    Store URL (Play Store / App Store link)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={ver.store_url}
                      onChange={(e) => handleChange(ver.id, "store_url", e.target.value)}
                      placeholder="https://..."
                      className="flex-1 text-xs text-text-primary bg-white border border-border-default rounded-lg px-3 py-2 focus:outline-none focus:border-sendme"
                    />
                    {ver.store_url && (
                      <a
                        href={ver.store_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-2 border border-border-default rounded-lg text-text-muted hover:text-sendme flex items-center justify-center transition-colors"
                        title="Test store link"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer Button */}
              <div className="pt-3 border-t border-border-light flex items-center justify-between">
                <span className="text-[10px] text-text-muted font-mono">
                  Updated: {new Date(ver.updated_at).toLocaleDateString()}
                </span>
                <button
                  type="button"
                  disabled={savingId === ver.id}
                  onClick={() => handleSave(ver)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs ${
                    savedId === ver.id
                      ? "bg-emerald-600 text-white"
                      : "bg-sendme text-white hover:bg-sendme-dark"
                  }`}
                >
                  {savingId === ver.id ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Saving...
                    </>
                  ) : savedId === ver.id ? (
                    <>
                      <Check size={13} /> Saved!
                    </>
                  ) : (
                    <>
                      <Save size={13} /> Save Settings
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
