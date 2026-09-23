"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"
import { Upload, Loader2 } from "lucide-react"

interface DocumentUploadButtonProps {
  endpoint: string
  docKey: string
  label: string
  onUploaded: () => void
}

export function DocumentUploadButton({ endpoint, docKey, label, onUploaded }: DocumentUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const form = new FormData()
    form.append("file", file)
    form.append("docKey", docKey)
    setUploading(true)
    try {
      const res = await fetch(endpoint, { method: "POST", body: form })
      const result = await res.json()
      if (!result.success) throw new Error(result.error || "Upload failed")
      toast.success("Document uploaded")
      onUploaded()
    } catch (err: any) {
      toast.error(err.message || "Upload failed")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".jpg,.jpeg,.png,.webp,.pdf,image/*,application/pdf"
        onChange={handleFile}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="px-2.5 py-1.5 border border-sendme/30 bg-sendme-50 rounded-lg text-[10px] font-semibold text-sendme hover:bg-sendme/10 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
      >
        {uploading ? <Loader2 size={10} className="animate-spin" /> : <Upload size={10} />}
        {uploading ? "Uploading..." : label}
      </button>
    </>
  )
}
