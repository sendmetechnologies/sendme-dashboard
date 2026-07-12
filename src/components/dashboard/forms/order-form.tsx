"use client"

import { useState } from "react"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MapPin, Package, User, CreditCard, Calendar, ArrowRight, ArrowLeft } from "lucide-react"

interface OrderFormProps {
  isOpen: boolean
  onClose: () => void
}

type Step = "location" | "item" | "details" | "payment" | "review"

const itemSizes = [
  { id: "small", label: "Small", description: "Documents, small packages" },
  { id: "medium", label: "Medium", description: "Boxes, electronics" },
  { id: "bulk", label: "Bulk", description: "Large items, furniture" },
]

const itemCategories = [
  { id: "documents", label: "Documents" },
  { id: "glass", label: "Glass" },
  { id: "clothing", label: "Clothing" },
  { id: "food", label: "Food" },
  { id: "electronics", label: "Electronics" },
  { id: "furniture", label: "Furniture" },
  { id: "other", label: "Other" },
]

const vehicleTypes = [
  { id: "any", label: "Any courier" },
  { id: "motorbike", label: "Motorbike" },
  { id: "car", label: "Car" },
  { id: "bicycle", label: "Bicycle" },
]

const paymentMethods = [
  { id: "cash", label: "Cash on Delivery" },
  { id: "card", label: "Credit/Debit Card" },
  { id: "transfer", label: "Bank Transfer" },
]

export function OrderForm({ isOpen, onClose }: OrderFormProps) {
  const [step, setStep] = useState<Step>("location")
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    pickupAddress: "",
    deliveryAddress: "",
    itemSize: "",
    itemCategory: "",
    itemValue: "",
    senderName: "",
    senderPhone: "",
    receiverName: "",
    receiverPhone: "",
    vehicleType: "any",
    paymentMethod: "cash",
    scheduleDate: "",
    scheduleTime: "",
    notes: "",
  })

  const steps: { id: Step; label: string; icon: React.ElementType }[] = [
    { id: "location", label: "Location", icon: MapPin },
    { id: "item", label: "Item", icon: Package },
    { id: "details", label: "Details", icon: User },
    { id: "payment", label: "Payment", icon: CreditCard },
    { id: "review", label: "Review", icon: ArrowRight },
  ]

  const currentStepIndex = steps.findIndex((s) => s.id === step)

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setStep(steps[currentStepIndex + 1].id)
    }
  }

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setStep(steps[currentStepIndex - 1].id)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setLoading(false)
    onClose()
  }

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Order" size="lg">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((s, i) => {
          const Icon = s.icon
          const isActive = s.id === step
          const isCompleted = i < currentStepIndex
          return (
            <div key={s.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    isActive
                      ? "bg-sendme text-white"
                      : isCompleted
                      ? "bg-sendme-50 text-sendme"
                      : "bg-surface-secondary text-text-muted"
                  }`}
                >
                  <Icon size={18} />
                </div>
                <span className="text-[10px] mt-1.5 font-medium text-text-muted">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`w-12 h-0.5 mx-2 mb-5 ${
                    isCompleted ? "bg-sendme" : "bg-surface-secondary"
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Step Content */}
      <div className="min-h-[300px]">
        {step === "location" && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Pickup & Delivery Locations</h3>
            <Input
              label="Pickup Address"
              placeholder="Enter pickup address"
              value={formData.pickupAddress}
              onChange={(e) => updateFormData("pickupAddress", e.target.value)}
            />
            <Input
              label="Delivery Address"
              placeholder="Enter delivery address"
              value={formData.deliveryAddress}
              onChange={(e) => updateFormData("deliveryAddress", e.target.value)}
            />
          </div>
        )}

        {step === "item" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-3">Item Size</h3>
              <div className="grid grid-cols-3 gap-3">
                {itemSizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => updateFormData("itemSize", size.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.itemSize === size.id
                        ? "border-sendme bg-sendme-50"
                        : "border-border-light hover:border-border-default"
                    }`}
                  >
                    <p className="text-sm font-semibold text-text-primary">{size.label}</p>
                    <p className="text-[10px] text-text-muted mt-1">{size.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-3">Item Category</h3>
              <div className="grid grid-cols-4 gap-2">
                {itemCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => updateFormData("itemCategory", cat.id)}
                    className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                      formData.itemCategory === cat.id
                        ? "bg-sendme text-white"
                        : "bg-surface-secondary text-text-secondary hover:bg-surface-hover"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Item Value (₦)"
              type="number"
              placeholder="Enter item value"
              value={formData.itemValue}
              onChange={(e) => updateFormData("itemValue", e.target.value)}
            />
          </div>
        )}

        {step === "details" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-3">Sender Details</h3>
              <div className="space-y-3">
                <Input
                  label="Full Name"
                  placeholder="Enter sender name"
                  value={formData.senderName}
                  onChange={(e) => updateFormData("senderName", e.target.value)}
                />
                <Input
                  label="Phone Number"
                  placeholder="+234 XXX XXX XXXX"
                  value={formData.senderPhone}
                  onChange={(e) => updateFormData("senderPhone", e.target.value)}
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-3">Receiver Details</h3>
              <div className="space-y-3">
                <Input
                  label="Full Name"
                  placeholder="Enter receiver name"
                  value={formData.receiverName}
                  onChange={(e) => updateFormData("receiverName", e.target.value)}
                />
                <Input
                  label="Phone Number"
                  placeholder="+234 XXX XXX XXXX"
                  value={formData.receiverPhone}
                  onChange={(e) => updateFormData("receiverPhone", e.target.value)}
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-3">Vehicle Type</h3>
              <div className="grid grid-cols-4 gap-2">
                {vehicleTypes.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => updateFormData("vehicleType", v.id)}
                    className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                      formData.vehicleType === v.id
                        ? "bg-sendme text-white"
                        : "bg-surface-secondary text-text-secondary hover:bg-surface-hover"
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === "payment" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-3">Payment Method</h3>
              <div className="space-y-2">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => updateFormData("paymentMethod", method.id)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      formData.paymentMethod === method.id
                        ? "border-sendme bg-sendme-50"
                        : "border-border-light hover:border-border-default"
                    }`}
                  >
                    <p className="text-sm font-semibold text-text-primary">{method.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-3">Schedule (Optional)</h3>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Date"
                  type="date"
                  value={formData.scheduleDate}
                  onChange={(e) => updateFormData("scheduleDate", e.target.value)}
                />
                <Input
                  label="Time"
                  type="time"
                  value={formData.scheduleTime}
                  onChange={(e) => updateFormData("scheduleTime", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Additional Notes</label>
              <textarea
                placeholder="Any special instructions..."
                value={formData.notes}
                onChange={(e) => updateFormData("notes", e.target.value)}
                className="w-full bg-white border border-border-default rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-sendme focus:ring-1 focus:ring-sendme/20 transition-all h-24 resize-none"
              />
            </div>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Order Summary</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-surface-secondary rounded-xl">
                <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Pickup</p>
                <p className="text-sm font-medium text-text-primary">{formData.pickupAddress || "Not set"}</p>
                <p className="text-xs text-text-muted mt-1">{formData.senderName}</p>
              </div>
              <div className="p-4 bg-surface-secondary rounded-xl">
                <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Delivery</p>
                <p className="text-sm font-medium text-text-primary">{formData.deliveryAddress || "Not set"}</p>
                <p className="text-xs text-text-muted mt-1">{formData.receiverName}</p>
              </div>
            </div>

            <div className="p-4 bg-surface-secondary rounded-xl">
              <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Item</p>
              <p className="text-sm font-medium text-text-primary">
                {itemSizes.find((s) => s.id === formData.itemSize)?.label || "Not selected"} -{" "}
                {itemCategories.find((c) => c.id === formData.itemCategory)?.label || "Not selected"}
              </p>
              {formData.itemValue && (
                <p className="text-xs text-text-muted mt-1">Value: ₦{Number(formData.itemValue).toLocaleString()}</p>
              )}
            </div>

            <div className="p-4 bg-sendme-50 rounded-xl border border-sendme/20">
              <p className="text-[10px] text-sendme uppercase tracking-wide mb-1">Payment</p>
              <p className="text-sm font-semibold text-sendme">
                {paymentMethods.find((m) => m.id === formData.paymentMethod)?.label}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border-light">
        <Button
          variant="ghost"
          onClick={handleBack}
          disabled={currentStepIndex === 0}
        >
          <ArrowLeft size={16} /> Back
        </Button>
        
        {step === "review" ? (
          <Button onClick={handleSubmit} loading={loading}>
            Create Order
          </Button>
        ) : (
          <Button onClick={handleNext}>
            Next <ArrowRight size={16} />
          </Button>
        )}
      </div>
    </Modal>
  )
}