"use client"

import { useState, useEffect, useCallback } from "react"
import { X, FileText, Loader2, ExternalLink, Download, AlertTriangle, RefreshCw } from "lucide-react"

interface DocumentPreviewModalProps {
  url: string | null
  label: string
  onClose: () => void
}

function isImageUrl(url: string) {
  return /\.(jpe?g|png|gif|webp|bmp|svg|avif)(\?.*)?$/i.test(url.split("?")[0])
}

function isPdfUrl(url: string) {
  return /\.pdf(\?.*)?$/i.test(url.split("?")[0])
}

export function DocumentPreviewModal({ url, label, onClose }: DocumentPreviewModalProps) {
  const [loadState, setLoadState] = useState<"loading" | "loaded" | "error">("loading")

  // Reset state whenever the url changes (new doc opened in same modal)
  useEffect(() => {
    setLoadState("loading")
  }, [url])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleEscape)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [onClose])

  const handleLoaded = useCallback(() => setLoadState("loaded"), [])
  const handleError = useCallback(() => setLoadState("error"), [])

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-light shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 bg-sendme-50 rounded-lg text-sendme shrink-0">
              <FileText size={14} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-text-primary truncate">{label}</h3>
              <p className="text-[10px] text-text-muted truncate">{url?.split("/").pop()?.split("?")[0] || "Document"}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <a
              href={url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-secondary rounded-lg transition-colors"
              title="Open in new tab"
            >
              <ExternalLink size={16} />
            </a>
            <a
              href={url || "#"}
              download
              className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-secondary rounded-lg transition-colors"
              title="Download"
            >
              <Download size={16} />
            </a>
            <button
              onClick={onClose}
              className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-secondary rounded-lg transition-colors"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto bg-surface-secondary/50 relative flex items-center justify-center min-h-[300px]">
          {!url ? (
            <div className="flex flex-col items-center justify-center text-center p-10">
              <AlertTriangle size={32} className="text-warning mb-2" />
              <p className="text-sm text-text-muted">No document URL available</p>
            </div>
          ) : loadState === "error" ? (
            <div className="flex flex-col items-center justify-center text-center p-10">
              <AlertTriangle size={36} className="text-warning mb-3" />
              <p className="text-sm font-semibold text-text-primary mb-1">Couldn&apos;t load this document</p>
              <p className="text-xs text-text-muted mb-4 max-w-[280px]">
                The inline preview failed. You can retry, or open the document in a new tab.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLoadState("loading")}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-surface-hover border border-border-default rounded-lg text-xs font-semibold text-text-primary hover:bg-surface-secondary transition-colors"
                >
                  <RefreshCw size={14} /> Retry
                </button>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-sendme text-white rounded-lg text-xs font-semibold hover:bg-sendme-dark transition-colors"
                >
                  <ExternalLink size={14} /> Open in new tab
                </a>
              </div>
            </div>
          ) : isImageUrl(url) ? (
            <>
              {loadState === "loading" && (
                <div className="absolute inset-0 flex items-center justify-center text-text-muted gap-2 text-xs">
                  <Loader2 size={16} className="animate-spin" /> Loading document...
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={label}
                onLoad={handleLoaded}
                onError={handleError}
                className={`max-w-full max-h-[calc(92vh-120px)] object-contain ${loadState === "loading" ? "opacity-0" : "opacity-100"}`}
              />
            </>
          ) : isPdfUrl(url) ? (
            <>
              {loadState === "loading" && (
                <div className="absolute inset-0 flex items-center justify-center text-text-muted gap-2 text-xs">
                  <Loader2 size={16} className="animate-spin" /> Loading PDF...
                </div>
              )}
              <iframe
                key={url}
                src={url}
                title={label}
                className={`w-full h-[calc(92vh-120px)] border-0 ${loadState === "loading" ? "opacity-0" : "opacity-100"}`}
                onLoad={handleLoaded}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-10">
              <FileText size={40} className="text-text-muted/40 mb-3" />
              <p className="text-sm font-medium text-text-primary mb-1">This document type can&apos;t be previewed inline</p>
              <p className="text-xs text-text-muted mb-4">It will be opened in a new tab instead.</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-sendme text-white rounded-lg text-xs font-semibold hover:bg-sendme-dark transition-colors"
              >
                <ExternalLink size={14} /> Open document
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
