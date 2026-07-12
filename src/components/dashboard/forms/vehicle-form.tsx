"use client"

import { useState } from "react"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Upload, Car, FileText } from "lucide-react"

interface VehicleFormProps {
  isOpen: boolean
  onClose: () => void
}

const vehicleTypes = ["Bicycle", "Motorbike", "Car", "Van", "Truck"]
const makes = ["Yamaha", "Honda", "Mercedes", "Toyota", "Suzuki", "Other"]
const models = {
  Yamaha: ["YZF-R15", "MT-07", "XMAX 300", "Other"],
  Honda: ["CBR 250", "PCX 160", "Africa Twin", "Other"],
  Mercedes: ["C-Class", "E-Class", "Sprinter", "Other"],
  Toyota: ["Corolla", "Camry", "Hilux", "Other"],
  Suzuki: ["GSX-R", "V-Strom", "Burgman", "Other"],
  Other: ["Other"],
}
const colors = ["White", "Black", "Silver", "Red", "Blue", "Other"]

export function VehicleForm({ isOpen, onClose }: VehicleFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    vehicleType: "",
    make: "",
    customMake: "",
    model: "",
    customModel: "",
    plate: "",
    color: "",
    capacity: "",
    papersDocument: null as File | null,
    motDocument: null as File | null,
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

  const isBicycle = formData.vehicleType === "Bicycle"
  const isTruck = formData.vehicleType === "Truck"
  const isMotorbike = formData.vehicleType === "Motorbike"
  const availableModels = formData.make ? models[formData.make as keyof typeof models] || [] : []

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Vehicle" size="lg">
      <div className="space-y-6">
        {/* Vehicle Type */}
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Car size={16} className="text-sendme" /> Vehicle Type
          </h3>
          <div className="grid grid-cols-5 gap-2">
            {vehicleTypes.map((type) => (
              <button
                key={type}
                onClick={() => updateFormData("vehicleType", type)}
                className={`py-3 px-2 rounded-lg text-xs font-medium transition-all ${
                  formData.vehicleType === type
                    ? "bg-sendme text-white"
                    : "bg-surface-secondary text-text-secondary hover:bg-surface-hover"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Vehicle Details (not for Bicycle) */}
        {!isBicycle && formData.vehicleType && (
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">Vehicle Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-text-secondary">Make</label>
                <div className="flex flex-wrap gap-2">
                  {makes.map((make) => (
                    <button
                      key={make}
                      onClick={() => updateFormData("make", make)}
                      className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                        formData.make === make
                          ? "bg-sendme text-white"
                          : "bg-surface-secondary text-text-secondary hover:bg-surface-hover"
                      }`}
                    >
                      {make}
                    </button>
                  ))}
                </div>
                {formData.make === "Other" && (
                  <Input
                    placeholder="Enter custom make"
                    value={formData.customMake}
                    onChange={(e) => updateFormData("customMake", e.target.value)}
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-text-secondary">Model</label>
                <div className="flex flex-wrap gap-2">
                  {availableModels.map((model) => (
                    <button
                      key={model}
                      onClick={() => updateFormData("model", model)}
                      className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                        formData.model === model
                          ? "bg-sendme text-white"
                          : "bg-surface-secondary text-text-secondary hover:bg-surface-hover"
                      }`}
                    >
                      {model}
                    </button>
                  ))}
                </div>
                {formData.model === "Other" && (
                  <Input
                    placeholder="Enter custom model"
                    value={formData.customModel}
                    onChange={(e) => updateFormData("customModel", e.target.value)}
                  />
                )}
              </div>

              <Input
                label="Number Plate"
                placeholder="AAA 111 BBB"
                value={formData.plate}
                onChange={(e) => updateFormData("plate", e.target.value.toUpperCase())}
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-text-secondary">Color</label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => updateFormData("color", color)}
                      className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                        formData.color === color
                          ? "bg-sendme text-white"
                          : "bg-surface-secondary text-text-secondary hover:bg-surface-hover"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              {isTruck && (
                <Input
                  label="Tonnage Capacity"
                  type="number"
                  placeholder="Enter capacity in tonnes"
                  value={formData.capacity}
                  onChange={(e) => updateFormData("capacity", e.target.value)}
                />
              )}
            </div>
          </div>
        )}

        {/* Documents */}
        {formData.vehicleType && (
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <FileText size={16} className="text-sendme" /> Documents
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-text-secondary">Vehicle Papers</label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => handleFileChange("papersDocument", e)}
                    className="hidden"
                    id="papers-doc"
                  />
                  <label
                    htmlFor="papers-doc"
                    className="flex items-center justify-center gap-2 w-full py-8 border-2 border-dashed border-border-default rounded-lg cursor-pointer hover:border-sendme transition-colors"
                  >
                    <Upload size={20} className="text-text-muted" />
                    <span className="text-xs text-text-muted">
                      {formData.papersDocument ? formData.papersDocument.name : "Upload Papers"}
                    </span>
                  </label>
                </div>
              </div>

              {isMotorbike && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-text-secondary">MOT Document</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => handleFileChange("motDocument", e)}
                      className="hidden"
                      id="mot-doc"
                    />
                    <label
                      htmlFor="mot-doc"
                      className="flex items-center justify-center gap-2 w-full py-8 border-2 border-dashed border-border-default rounded-lg cursor-pointer hover:border-sendme transition-colors"
                    >
                      <Upload size={20} className="text-text-muted" />
                      <span className="text-xs text-text-muted">
                        {formData.motDocument ? formData.motDocument.name : "Upload MOT"}
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border-light">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} loading={loading} disabled={!formData.vehicleType}>
          Add Vehicle
        </Button>
      </div>
    </Modal>
  )
}