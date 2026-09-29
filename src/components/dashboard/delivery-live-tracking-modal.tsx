"use client";

import { useState } from "react";
import {
  X, MapPin, Navigation, Phone, ShieldAlert, Copy, Check,
  Crosshair, Clock, Truck, Maximize2, RefreshCw, AlertCircle
} from "lucide-react";

interface DeliveryLiveTrackingModalProps {
  isOpen: boolean;
  order: {
    id: string;
    fullId: string;
    status: string;
    statusColor?: string;
    from: string;
    to: string;
    fromAddr?: string;
    customer: string;
    customerPhone?: string;
    driver?: string | null;
    driverPhone?: string | null;
    driverVehicle?: string | null;
    type?: string;
    fare?: string;
    eta?: string;
    created_at?: string;
    driverLat?: number | null;
    driverLng?: number | null;
    pickupLat?: number | null;
    pickupLng?: number | null;
    dropoffLat?: number | null;
    dropoffLng?: number | null;
  } | null;
  onClose: () => void;
}

export function DeliveryLiveTrackingModal({
  isOpen,
  order,
  onClose,
}: DeliveryLiveTrackingModalProps) {
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(15);

  if (!isOpen || !order) return null;

  // Determine best coordinates to center the map on:
  // 1. Driver's current live location (if available)
  // 2. Pickup location (if available)
  // 3. Fallback to Abuja central coordinates
  const lat = order.driverLat ?? order.pickupLat ?? 9.0765;
  const lng = order.driverLng ?? order.pickupLng ?? 7.3986;
  const hasLiveGps = order.driverLat != null && order.driverLng != null;

  const mapQuery = hasLiveGps
    ? `${order.driverLat},${order.driverLng}`
    : order.pickupLat && order.pickupLng
    ? `${order.pickupLat},${order.pickupLng}`
    : encodeURIComponent(order.fromAddr || order.from || `${order.to}, Nigeria`);

  const handleCopyGps = () => {
    navigator.clipboard.writeText(`${lat}, ${lng}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-4xl h-[88vh] max-h-[720px] shadow-2xl flex flex-col overflow-hidden border border-border-default">
        {/* Header */}
        <div className="px-5 py-3.5 bg-white border-b border-border-light flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sendme-50 text-sendme flex items-center justify-center">
              <Navigation size={18} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-text-primary">{order.id || order.fullId}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${order.statusColor || "bg-sendme-50 text-sendme"}`}>
                  {order.status}
                </span>
                {hasLiveGps ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-sendme bg-sendme-50 px-2 py-0.5 rounded-full ring-1 ring-sendme/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-sendme animate-ping" /> Live GPS Locked
                  </span>
                ) : (
                  <span className="text-[10px] text-text-muted bg-surface-secondary px-2 py-0.5 rounded-full">
                    Route Reference
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted truncate mt-0.5 max-w-md">
                {order.from} → {order.to}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyGps}
              className="hidden sm:flex items-center gap-1 text-xs font-medium text-text-secondary bg-surface-secondary border border-border-default px-2.5 py-1.5 rounded-lg hover:bg-surface-hover transition-colors"
            >
              {copiedCoords ? <Check size={13} className="text-sendme" /> : <Copy size={13} />}
              {copiedCoords ? "Copied Coordinates" : "Copy GPS"}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface-secondary transition-colors"
              title="Close tracker"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Main Content: Map + Live Telemetry Drawer */}
        <div className="flex-1 relative flex flex-col md:flex-row overflow-hidden bg-surface-secondary">
          {/* Embedded Map (retained directly inside the dashboard) */}
          <div className="flex-1 relative w-full h-full min-h-[300px]">
            <iframe
              title={`Tracking Map - ${order.id}`}
              src={`https://maps.google.com/maps?q=${mapQuery}&z=${zoomLevel}&output=embed`}
              className="w-full h-full border-0"
              loading="lazy"
            />

            {/* Map Zoom Controls */}
            <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
              <button
                onClick={() => setZoomLevel((z) => Math.min(19, z + 1))}
                className="w-8 h-8 bg-white border border-border-default rounded-lg shadow-md flex items-center justify-center text-text-primary hover:bg-surface-hover text-sm font-bold"
                title="Zoom In"
              >
                +
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(10, z - 1))}
                className="w-8 h-8 bg-white border border-border-default rounded-lg shadow-md flex items-center justify-center text-text-primary hover:bg-surface-hover text-sm font-bold"
                title="Zoom Out"
              >
                −
              </button>
            </div>
          </div>

          {/* Right/Bottom Telemetry Panel */}
          <div className="w-full md:w-80 bg-white border-t md:border-t-0 md:border-l border-border-default p-4 flex flex-col overflow-y-auto shrink-0 space-y-4">
            {/* Driver Card */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">Assigned Driver</p>
              {order.driver ? (
                <div className="p-3 bg-surface-secondary rounded-xl border border-border-light space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-sendme-50 text-sendme font-bold flex items-center justify-center text-xs shrink-0">
                      {order.driver[0]?.toUpperCase() || "D"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-text-primary truncate">{order.driver}</p>
                      <p className="text-[11px] text-text-muted font-mono">{order.driverPhone || "No phone"}</p>
                    </div>
                  </div>
                  {order.driverVehicle && (
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-border-light">
                      <span className="text-[11px] text-text-muted">Vehicle:</span>
                      <span className="font-semibold text-text-primary text-[11px]">{order.driverVehicle}</span>
                    </div>
                  )}
                  {order.driverPhone && (
                    <a
                      href={`tel:${order.driverPhone}`}
                      className="w-full flex items-center justify-center gap-1.5 bg-sendme text-white py-1.5 rounded-lg text-xs font-bold hover:bg-sendme-dark transition-colors"
                    >
                      <Phone size={13} /> Call Rider
                    </a>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-surface-secondary rounded-xl text-center text-xs text-text-muted">
                  No driver assigned to this order yet.
                </div>
              )}
            </div>

            {/* Route Points */}
            <div className="space-y-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Delivery Route</p>
              
              <div className="flex items-start gap-2.5 p-2 bg-surface-secondary/50 rounded-lg">
                <div className="w-2.5 h-2.5 rounded-full bg-sendme mt-1 shrink-0 ring-2 ring-sendme/20" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-sendme uppercase">Pickup</p>
                  <p className="text-xs text-text-primary font-medium">{order.from}</p>
                  {order.fromAddr && (
                    <p className="text-[10px] text-text-muted mt-0.5 truncate">{order.fromAddr}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2 bg-surface-secondary/50 rounded-lg">
                <div className="w-2.5 h-2.5 rounded-full bg-danger mt-1 shrink-0 ring-2 ring-danger/20" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-danger uppercase">Dropoff</p>
                  <p className="text-xs text-text-primary font-medium">{order.to}</p>
                </div>
              </div>
            </div>

            {/* GPS Telemetry */}
            <div className="p-3 bg-surface-secondary rounded-xl border border-border-light space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-text-muted uppercase">Coordinates</span>
                <button
                  onClick={handleCopyGps}
                  className="text-[10px] font-semibold text-sendme hover:underline"
                >
                  {copiedCoords ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="text-xs font-mono font-bold text-text-primary">
                {lat.toFixed(5)}, {lng.toFixed(5)}
              </p>
              <p className="text-[10px] text-text-muted flex items-center gap-1 mt-1">
                <Clock size={11} /> Live tracking locked on this order
              </p>
            </div>

            {/* Customer Info */}
            <div className="pt-2 border-t border-border-light text-xs">
              <span className="text-text-muted text-[11px]">Customer: </span>
              <span className="font-semibold text-text-primary">{order.customer}</span>
              {order.customerPhone && (
                <p className="text-[10px] text-text-muted font-mono mt-0.5">{order.customerPhone}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
