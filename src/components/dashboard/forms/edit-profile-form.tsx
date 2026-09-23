"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export interface EditField {
  key: string
  label: string
  type?: string
}

interface EditProfileFormProps {
  title: string
  fields: EditField[]
  initialValues: Record<string, string>
  onSubmit: (values: Record<string, string>) => Promise<void>
  onClose: () => void
}

export function EditProfileForm({ title, fields, initialValues, onSubmit, onClose }: EditProfileFormProps) {
  const [values, setValues] = useState<Record<string, string>>({ ...initialValues })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSubmit(values)
    } catch {
      toast.error("Failed to save changes")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={title} size="md">
      <div className="space-y-4">
        {fields.map((f) => (
          <Input
            key={f.key}
            label={f.label}
            type={f.type || "text"}
            value={values[f.key] || ""}
            onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
          />
        ))}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>Save changes</Button>
        </div>
      </div>
    </Modal>
  )
}
