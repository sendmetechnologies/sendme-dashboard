"use client"

import { X, Eye, EyeOff, Plus, ArrowUpRight, ArrowDownRight, ChevronRight, CheckCircle, Building2, CreditCard, Download } from "lucide-react"

interface WalletDetailProps {
  onClose: () => void
}

export function WalletDetail({ onClose }: WalletDetailProps) {
  return (
    <div className="w-[340px] bg-white border-l border-border-default flex flex-col shrink-0 h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border-light">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-text-primary">Main Wallet</h3>
            <span className="text-[9px] font-semibold bg-sendme-50 text-sendme px-1.5 py-0.5 rounded-full">Active</span>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1 text-text-muted hover:text-text-primary transition-colors"><span className="text-sm">•••</span></button>
            <button onClick={onClose} className="p-1 text-text-muted hover:text-text-primary transition-colors"><X size={16} /></button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Balance */}
        <div className="text-center">
          <p className="text-[10px] text-text-muted mb-1">Balance <Eye size={10} className="inline" /></p>
          <p className="text-2xl font-bold text-text-primary">₦4,562,300.50</p>
          <p className="text-[10px] text-text-muted mt-1">Available: <span className="font-semibold text-text-primary">₦3,892,100.20</span> • On Hold: <span className="font-semibold text-text-primary">₦420,500.00</span></p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button className="flex-1 flex items-center justify-center gap-1.5 bg-sendme text-white py-2 rounded-lg text-[11px] font-semibold hover:bg-sendme-dark transition-colors">
            <Plus size={12} /> Add Funds
          </button>
          <button className="flex-1 flex items-center justify-center gap-1.5 border border-border-default py-2 rounded-lg text-[11px] font-medium text-text-primary hover:bg-surface-hover transition-colors">
            <ArrowUpRight size={12} /> Transfer Funds
          </button>
          <button className="flex-1 flex items-center justify-center gap-1.5 border border-border-default py-2 rounded-lg text-[11px] font-medium text-text-primary hover:bg-surface-hover transition-colors">
            <ArrowDownRight size={12} /> Request Payout
          </button>
        </div>

        {/* Quick Actions */}
        <div>
          <h4 className="text-[11px] font-semibold text-text-primary mb-2">Quick Actions</h4>
          {[
            { label: "Transfer to Driver", icon: ArrowUpRight },
            { label: "Transfer to Organization", icon: ArrowUpRight },
            { label: "Request Payout", icon: ArrowDownRight },
            { label: "Transaction History", icon: Eye },
            { label: "Download Statement", icon: Download },
          ].map((action) => {
            const Icon = action.icon
            return (
              <button key={action.label} className="w-full flex items-center justify-between py-2.5 border-b border-border-light last:border-0 hover:bg-surface-secondary/50 transition-colors">
                <span className="text-[11px] font-medium text-text-primary">{action.label}</span>
                <ChevronRight size={12} className="text-text-muted" />
              </button>
            )
          })}
        </div>

        {/* Linked Accounts */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[11px] font-semibold text-text-primary">Linked Accounts</h4>
            <button className="text-[10px] font-semibold text-sendme hover:text-sendme-dark">Manage</button>
          </div>
          {[
            { name: "Opay", last4: "8765", icon: "💳", color: "bg-sendme-50" },
            { name: "First Bank", last4: "1234", icon: "🏦", color: "bg-blue-50" },
            { name: "GTBank", last4: "5678", icon: "🏦", color: "bg-sendme-50" },
          ].map((account) => (
            <div key={account.name} className="flex items-center justify-between py-2.5 border-b border-border-light last:border-0">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 ${account.color} rounded-lg flex items-center justify-center text-sm`}>{account.icon}</div>
                <div>
                  <p className="text-[11px] font-medium text-text-primary">{account.name}</p>
                  <p className="text-[9px] text-text-muted">•••• {account.last4}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={10} className="text-sendme" />
                <span className="text-[9px] font-semibold text-sendme">Verified</span>
                <ChevronRight size={12} className="text-text-muted" />
              </div>
            </div>
          ))}
          <button className="w-full flex items-center justify-center gap-1.5 py-2.5 border border-dashed border-border-default rounded-lg text-[11px] font-medium text-sendme hover:bg-sendme-50 transition-colors mt-2">
            <Plus size={12} /> Add New Account
          </button>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[11px] font-semibold text-text-primary">Recent Activity</h4>
            <button className="text-[10px] font-semibold text-sendme hover:text-sendme-dark">View all</button>
          </div>
          {[
            { desc: "Payment received from Collins Bassie", amount: "+₦6,800.00", amountColor: "text-sendme", time: "May 20, 2025 • 10:24 AM", icon: "💰", iconBg: "bg-sendme-50" },
            { desc: "Payout to Damilare Adegbite", amount: "-₦6,800.00", amountColor: "text-danger", time: "May 20, 2025 • 9:15 AM", icon: "📤", iconBg: "bg-danger-light" },
            { desc: "Payout requested to Opay", amount: "-₦15,000.00", amountColor: "text-danger", time: "May 18, 2025 • 9:05 AM", icon: "📤", iconBg: "bg-danger-light" },
          ].map((activity, i) => (
            <div key={i} className="flex items-start gap-2.5 py-2.5 border-b border-border-light last:border-0">
              <div className={`w-7 h-7 ${activity.iconBg} rounded-full flex items-center justify-center text-xs shrink-0`}>{activity.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-text-primary">{activity.desc}</p>
                <p className="text-[9px] text-text-muted mt-0.5">{activity.time}</p>
              </div>
              <span className={`text-[10px] font-semibold ${activity.amountColor}`}>{activity.amount}</span>
            </div>
          ))}
          <button className="w-full text-center py-2 text-[10px] font-semibold text-sendme hover:text-sendme-dark transition-colors">See full activity</button>
        </div>
      </div>
    </div>
  )
}
