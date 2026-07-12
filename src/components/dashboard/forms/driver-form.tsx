"use client"

import { useState } from "react"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Upload, User, FileText, Car } from "lucide-react"

interface DriverFormProps {
  isOpen: boolean
  onClose: () => void
}

const genderOptions = ["Male", "Female"]
const idTypes = ["NIN", "Driver's License", "Voter's Card"]

export function DriverForm({ isOpen, onClose }: DriverFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    gender: "",
    dob: "",
    city: "Lagos",
    idType: "",
    idNumber: "",
    idDocument: null as File | null,
    licenseDocument: null as File | null,
    photo: null as File | null,
  })

  const handleSubmit = async () => {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setLoading(false)
    onClose()
  }

  const updateFormData = (field: string, value: string | File | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (field: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      updateFormData(field, e.target.files[0])
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Driver" size="lg">
      <div className="space-y-6">
        {/* Photo Upload */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-surface-secondary flex items-center justify-center border-2 border-dashed border-border-default hover:border-sendme transition-colors cursor-pointer">
            {formData.photo ? (
              <img
                src={URL.createObjectURL(formData.photo)}
                alt="Preview"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User size={24} className="text-text-muted" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">Profile Photo</p>
            <p className="text-xs text-text-muted">Optional - Click to upload</p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange("photo", e)}
              className="hidden"
              id="driver-photo"
            />
            <label
              htmlFor="driver-photo"
              className="text-xs font-semibold text-sendme hover:text-sendme-dark cursor-pointer"
            >
              Upload Photo
            </label>
          </div>
        </div>

        {/* Personal Information */}
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <User size={16} className="text-sendme" /> Personal Information
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Input
                label="Full Name"
                placeholder="Enter driver's full name"
                value={formData.fullName}
                onChange={(e) => updateFormData("fullName", e.target.value)}
              />
            </div>
            <Input
              label="Phone Number"
              placeholder="+234 XXX XXX XXXX"
              value={formData.phone}
              onChange={(e) => updateFormData("phone", e.target.value)}
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-text-secondary">Gender</label>
              <div className="flex gap-2">
                {genderOptions.map((g) => (
                  <button
                    key={g}
                    onClick={() => updateFormData("gender", g)}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-all ${
                      formData.gender === g
                        ? "bg-sendme text-white"
                        : "bg-surface-secondary text-text-secondary hover:bg-surface-hover"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <Input
              label="Date of Birth"
              placeholder="DD/MM/YYYY"
              value={formData.dob}
              onChange={(e) => updateFormData("dob", e.target.value)}
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-text-secondary">Default City</label>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-secondary rounded-lg">
                <span className="text-sm text-text-primary">{formData.city}</span>
                <button className="text-xs font-semibold text-sendme ml-auto">Change</button>
              </div>
            </div>
          </div>
        </div>

        {/* Identification */}
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <FileText size={16} className="text-sendme" /> Identification
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-text-secondary">ID Type</label>
              <div className="flex gap-2">
                {idTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => updateFormData("idType", type)}
                    className={`flex-1 py-2 px-2 rounded-lg text-[10px] font-medium transition-all ${
                      formData.idType === type
                        ? "bg-sendme text-white"
                        : "bg-surface-secondary text-text-secondary hover:bg-surface-hover"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <Input
              label="ID Number"
              placeholder="Enter ID number"
              value={formData.idNumber}
              onChange={(e) => updateFormData("idNumber", e.target.value)}
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-text-secondary">ID Document</label>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => handleFileChange("idDocument", e)}
                  className="hidden"
                  id="id-doc"
                />
                <label
                  htmlFor="id-doc"
                  className="flex items-center justify-center gap-2 w-full py-6 border-2 border-dashed border-border-default rounded-lg cursor-pointer hover:border-sendme transition-colors"
                >
                  <Upload size={16} className="text-text-muted" />
                  <span className="text-xs text-text-muted">
                    {formData.idDocument ? formData.idDocument.name : "Upload ID"}
                  </span>
                </label>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-text-secondary">Driver's License</label>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => handleFileChange("licenseDocument", e)}
                  className="hidden"
                  id="license-doc"
                />
                <label
                  htmlFor="license-doc"
                  className="flex items-center justify-center gap-2 w-full py-6 border-2 border-dashed border-border-default rounded-lg cursor-pointer hover:border-sendme transition-colors"
                >
                  <Upload size={16} className="text-text-muted" />
                  <span className="text-xs text-text-muted">
                    {formData.licenseDocument ? formData.licenseDocument.name : "Upload License"}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border-light">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} loading={loading}>
          Add Driver
        </Button>
      </div>
    </Modal>
  )
}