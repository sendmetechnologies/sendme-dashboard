"use client"

import { useState } from "react"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Building2, User, MapPin } from "lucide-react"

interface OrganizationFormProps {
  isOpen: boolean
  onClose: () => void
}

const orgTypes = ["Logistics", "E-commerce", "Retail", "Manufacturing", "Other"]
const nigerianStates = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo",
  "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nassarawa",
  "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
]

export function OrganizationForm({ isOpen, onClose }: OrganizationFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    orgName: "",
    orgType: "",
    regNumber: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    address: "",
    state: "",
    logo: null as File | null,
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Organization" size="lg">
      <div className="space-y-6">
        {/* Organization Details */}
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Building2 size={16} className="text-sendme" /> Organization Details
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Input
                label="Organization Name"
                placeholder="Enter organization name"
                value={formData.orgName}
                onChange={(e) => updateFormData("orgName", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-text-secondary">Organization Type</label>
              <div className="flex flex-wrap gap-2">
                {orgTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => updateFormData("orgType", type)}
                    className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                      formData.orgType === type
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
              label="Registration Number (Optional)"
              placeholder="Enter RC number"
              value={formData.regNumber}
              onChange={(e) => updateFormData("regNumber", e.target.value)}
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-text-secondary">Logo (Optional)</label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      updateFormData("logo", e.target.files[0])
                    }
                  }}
                  className="hidden"
                  id="org-logo"
                />
                <label
                  htmlFor="org-logo"
                  className="flex items-center justify-center gap-2 w-full py-6 border-2 border-dashed border-border-default rounded-lg cursor-pointer hover:border-sendme transition-colors"
                >
                  {formData.logo ? (
                    <img
                      src={URL.createObjectURL(formData.logo)}
                      alt="Logo preview"
                      className="w-12 h-12 object-contain"
                    />
                  ) : (
                    <>
                      <Building2 size={20} className="text-text-muted" />
                      <span className="text-xs text-text-muted">Upload Logo</span>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Person */}
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <User size={16} className="text-sendme" /> Contact Person
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Input
                label="Full Name"
                placeholder="Enter contact person's name"
                value={formData.contactName}
                onChange={(e) => updateFormData("contactName", e.target.value)}
              />
            </div>
            <Input
              label="Phone Number"
              placeholder="+234 XXX XXX XXXX"
              value={formData.contactPhone}
              onChange={(e) => updateFormData("contactPhone", e.target.value)}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="Enter email address"
              value={formData.contactEmail}
              onChange={(e) => updateFormData("contactEmail", e.target.value)}
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <MapPin size={16} className="text-sendme" /> Address
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Street Address</label>
              <textarea
                placeholder="Enter full address"
                value={formData.address}
                onChange={(e) => updateFormData("address", e.target.value)}
                className="w-full bg-white border border-border-default rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-sendme focus:ring-1 focus:ring-sendme/20 transition-all h-20 resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-text-secondary">State</label>
              <select
                value={formData.state}
                onChange={(e) => updateFormData("state", e.target.value)}
                className="w-full bg-white border border-border-default rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-sendme focus:ring-1 focus:ring-sendme/20 transition-all appearance-none"
              >
                <option value="">Select state</option>
                {nigerianStates.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
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
          Add Organization
        </Button>
      </div>
    </Modal>
  )
}