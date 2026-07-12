"use client"

import { useState } from "react"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, Package, ChevronRight, ChevronLeft } from "lucide-react"

interface ScheduleFormProps {
  isOpen: boolean
  onClose: () => void
}

type Step = "details" | "schedule" | "review"

const timeSlots = [
  "Right now",
  "10:00 - 10:30",
  "10:30 - 11:00",
  "11:00 - 11:30",
  "11:30 - 12:00",
  "12:00 - 12:30",
  "12:30 - 13:00",
  "13:00 - 13:30",
  "13:30 - 14:00",
]

const vehicleTypes = [
  { id: "any", label: "Any courier" },
  { id: "motorbike", label: "Motorbike" },
  { id: "car", label: "Car" },
  { id: "bicycle", label: "Bicycle" },
]

export function ScheduleForm({ isOpen, onClose }: ScheduleFormProps) {
  const [step, setStep] = useState<Step>("details")
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    pickupAddress: "",
    deliveryAddress: "",
    itemDescription: "",
    vehicleType: "any",
    selectedDate: "",
    selectedTime: "",
    contactName: "",
    contactPhone: "",
    notes: "",
  })

  const steps: { id: Step; label: string; icon: React.ElementType }[] = [
    { id: "details", label: "Details", icon: Package },
    { id: "schedule", label: "Schedule", icon: Calendar },
    { id: "review", label: "Review", icon: ChevronRight },
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
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setLoading(false)
    onClose()
  }

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Generate dates for the next 7 days
  const generateDates = () => {
    const dates = []
    const today = new Date()
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push({
        date: date.toISOString().split("T")[0],
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        dayNum: date.getDate(),
        month: date.toLocaleDateString("en-US", { month: "short" }),
      })
    }
    return dates
  }

  const dates = generateDates()

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Schedule" size="lg">
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
                  className={`w-16 h-0.5 mx-2 mb-5 ${
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
        {step === "details" && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Delivery Details</h3>
            
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
            
            <Input
              label="Item Description"
              placeholder="What are you sending?"
              value={formData.itemDescription}
              onChange={(e) => updateFormData("itemDescription", e.target.value)}
            />

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

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Contact Name"
                placeholder="Enter contact name"
                value={formData.contactName}
                onChange={(e) => updateFormData("contactName", e.target.value)}
              />
              <Input
                label="Contact Phone"
                placeholder="+234 XXX XXX XXXX"
                value={formData.contactPhone}
                onChange={(e) => updateFormData("contactPhone", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Additional Notes</label>
              <textarea
                placeholder="Any special instructions..."
                value={formData.notes}
                onChange={(e) => updateFormData("notes", e.target.value)}
                className="w-full bg-white border border-border-default rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-sendme focus:ring-1 focus:ring-sendme/20 transition-all h-20 resize-none"
              />
            </div>
          </div>
        )}

        {step === "schedule" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-3">Select Date</h3>
              <div className="grid grid-cols-7 gap-2">
                {dates.map((d) => (
                  <button
                    key={d.date}
                    onClick={() => updateFormData("selectedDate", d.date)}
                    className={`p-3 rounded-xl text-center transition-all ${
                      formData.selectedDate === d.date
                        ? "bg-sendme text-white"
                        : "bg-surface-secondary hover:bg-surface-hover"
                    }`}
                  >
                    <p className="text-[10px] font-medium">{d.day}</p>
                    <p className="text-lg font-bold">{d.dayNum}</p>
                    <p className="text-[10px]">{d.month}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-3">Select Time Slot</h3>
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => updateFormData("selectedTime", slot)}
                    className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                      formData.selectedTime === slot
                        ? "bg-sendme text-white"
                        : "bg-surface-secondary text-text-secondary hover:bg-surface-hover"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Schedule Summary</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-surface-secondary rounded-xl">
                <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Pickup</p>
                <p className="text-sm font-medium text-text-primary">{formData.pickupAddress || "Not set"}</p>
              </div>
              <div className="p-4 bg-surface-secondary rounded-xl">
                <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Delivery</p>
                <p className="text-sm font-medium text-text-primary">{formData.deliveryAddress || "Not set"}</p>
              </div>
            </div>

            <div className="p-4 bg-surface-secondary rounded-xl">
              <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Item</p>
              <p className="text-sm font-medium text-text-primary">{formData.itemDescription || "Not specified"}</p>
            </div>

            <div className="p-4 bg-sendme-50 rounded-xl border border-sendme/20">
              <p className="text-[10px] text-sendme uppercase tracking-wide mb-1">Schedule</p>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-sendme" />
                <p className="text-sm font-semibold text-sendme">
                  {formData.selectedDate || "No date selected"}
                </p>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Clock size={16} className="text-sendme" />
                <p className="text-sm font-semibold text-sendme">
                  {formData.selectedTime || "No time selected"}
                </p>
              </div>
            </div>

            <div className="p-4 bg-surface-secondary rounded-xl">
              <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Contact</p>
              <p className="text-sm font-medium text-text-primary">{formData.contactName}</p>
              <p className="text-xs text-text-muted">{formData.contactPhone}</p>
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
          <ChevronLeft size={16} /> Back
        </Button>
        
        {step === "review" ? (
          <Button onClick={handleSubmit} loading={loading}>
            Create Schedule
          </Button>
        ) : (
          <Button onClick={handleNext}>
            Next <ChevronRight size={16} />
          </Button>
        )}
      </div>
    </Modal>
  )
}