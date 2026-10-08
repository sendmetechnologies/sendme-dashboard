"use client";

import { useState, useEffect, useRef } from "react";
import {
  Image as ImageIcon, Video, Plus, Trash2, Edit2, Play,
  Loader2, Check, AlertTriangle, X, Upload, ExternalLink, RefreshCw,
  Copy, Sparkles, Info
} from "lucide-react";

export interface AppBanner {
  id: string;
  title: string;
  description: string | null;
  type: "banner" | "video";
  media_url: string;
  link_url: string | null;
  cta_text?: string | null;
  bg_color?: string | null;
  target_audience: "all" | "driver" | "customer" | "org";
  trigger_action: "go_online" | "send_package" | "dashboard" | null;
  display_frequency: number;
  sort_order?: number;
  is_active: boolean;
  is_popup?: boolean;
  created_at: string;
}

const audienceOptions = [
  { value: "all", label: "All Users" },
  { value: "driver", label: "Riders / Drivers Only" },
  { value: "customer", label: "Senders / Customers Only" },
  { value: "org", label: "Organizations Only" },
];

const triggerOptions = [
  { value: "dashboard", label: "Home Dashboard (Announcement Banner)" },
  { value: "go_online", label: "When Driver Clicks 'Go Online' (Tutorial Video)" },
  { value: "send_package", label: "When Sender Clicks 'Send a Package' (Tutorial Video)" },
];

export function BannersManagementTab() {
  const [items, setItems] = useState<AppBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "banner" | "video">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AppBanner | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"banner" | "video">("banner");
  const [mediaUrl, setMediaUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [bgColor, setBgColor] = useState("#158A5E");
  const [targetAudience, setTargetAudience] = useState<"all" | "driver" | "customer" | "org">("all");
  const [triggerAction, setTriggerAction] = useState<string>("dashboard");
  const [displayFrequency, setDisplayFrequency] = useState(5);
  const [sortOrder, setSortOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [isPopup, setIsPopup] = useState(false);

  // Upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const sampleAiPrompt =
    "A 3D stylized modern delivery parcel box with discount badge, isometric 3D render, smooth clean lighting, transparent background (or dark green #158A5E), high quality glossy finish, PNG asset.";

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(sampleAiPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/banners");
      if (res.ok) {
        const data = await res.json();
        setItems(data.banners || []);
      }
    } catch (e) {
      console.error("Failed to load banners:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setTitle("");
    setDescription("");
    setType("banner");
    setMediaUrl("");
    setLinkUrl("");
    setCtaText("");
    setBgColor("#158A5E");
    setTargetAudience("all");
    setTriggerAction("dashboard");
    setDisplayFrequency(5);
    setSortOrder((items.length || 0) + 1);
    setIsActive(true);
    setIsPopup(false);
    setErrorMsg("");
    setModalOpen(true);
  };

  const openEditModal = (item: AppBanner) => {
    setEditingItem(item);
    setTitle(item.title);
    setDescription(item.description || "");
    setType(item.type);
    setMediaUrl(item.media_url);
    setLinkUrl(item.link_url || "");
    setCtaText(item.cta_text || "");
    setBgColor(item.bg_color || "#158A5E");
    setTargetAudience(item.target_audience);
    setTriggerAction(item.trigger_action || (item.type === "video" ? "go_online" : "dashboard"));
    setDisplayFrequency(item.display_frequency || 5);
    setSortOrder(item.sort_order || 1);
    setIsActive(item.is_active);
    setIsPopup(Boolean(item.is_popup));
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setErrorMsg("");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/banners/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setMediaUrl(data.url);
    } catch (err: any) {
      setErrorMsg("Image upload failed: " + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !mediaUrl.trim()) {
      setErrorMsg("Title and Media URL/Image are required.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        type,
        media_url: mediaUrl.trim(),
        link_url: linkUrl.trim() || null,
        cta_text: ctaText.trim() || null,
        bg_color: bgColor || "#158A5E",
        target_audience: targetAudience,
        trigger_action: triggerAction,
        display_frequency: Number(displayFrequency) || 5,
        sort_order: Number(sortOrder) || 1,
        is_active: isActive,
        is_popup: isPopup,
      };

      if (editingItem) {
        const res = await fetch("/api/admin/banners", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingItem.id, ...payload }),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to update");
        }
      } else {
        const res = await fetch("/api/admin/banners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to create");
        }
      }

      setModalOpen(false);
      fetchItems();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save item");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePopup = async (item: AppBanner) => {
    try {
      const updatedPopup = !item.is_popup;
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_popup: updatedPopup } : i))
      );

      const res = await fetch("/api/admin/banners", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, is_popup: updatedPopup }),
      });

      if (!res.ok) {
        fetchItems();
      }
    } catch {
      fetchItems();
    }
  };

  const handleToggleActive = async (item: AppBanner) => {
    try {
      const updatedActive = !item.is_active;
      // Optimistic update
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_active: updatedActive } : i))
      );

      const res = await fetch("/api/admin/banners", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, is_active: updatedActive }),
      });

      if (!res.ok) {
        fetchItems(); // revert on error
      }
    } catch {
      fetchItems();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this placement?")) return;

    try {
      setItems((prev) => prev.filter((i) => i.id !== id));
      await fetch(`/api/admin/banners?id=${id}`, { method: "DELETE" });
    } catch {
      fetchItems();
    }
  };

  const filteredItems = items.filter((item) => {
    if (filterType === "all") return true;
    return item.type === filterType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            In-App Banners & Video Walkthroughs
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Manage promotional dashboard banners and strategic tutorial videos that trigger on key actions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Pills */}
          <div className="flex bg-surface-secondary border border-border-default rounded-lg p-0.5 text-xs font-medium">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1 rounded-md transition-colors ${
                filterType === "all" ? "bg-white text-text-primary shadow-sm" : "text-text-muted"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType("banner")}
              className={`px-3 py-1 rounded-md transition-colors ${
                filterType === "banner" ? "bg-white text-text-primary shadow-sm" : "text-text-muted"
              }`}
            >
              Banners
            </button>
            <button
              onClick={() => setFilterType("video")}
              className={`px-3 py-1 rounded-md transition-colors ${
                filterType === "video" ? "bg-white text-text-primary shadow-sm" : "text-text-muted"
              }`}
            >
              Videos
            </button>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-sendme text-white rounded-lg text-xs font-semibold hover:bg-sendme-dark transition-colors shadow-sm"
          >
            <Plus size={14} /> Add Placement
          </button>
        </div>
      </div>

      {/* Grid / List */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center text-text-muted">
          <Loader2 size={24} className="animate-spin text-sendme mb-2" />
          <p className="text-xs">Loading banners and video tutorials...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border-default rounded-xl bg-surface-secondary/40">
          <ImageIcon className="mx-auto text-text-muted mb-2" size={32} />
          <p className="text-xs font-medium text-text-primary">No placements found</p>
          <p className="text-[11px] text-text-muted mt-0.5">Click "Add Placement" to create a new banner or video.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`border rounded-xl bg-white overflow-hidden flex flex-col justify-between transition-all ${
                item.is_active ? "border-border-default shadow-sm" : "border-border-default opacity-60 bg-gray-50/50"
              }`}
            >
              <div>
                {/* Media Preview Header */}
                {item.type === "banner" ? (
                  <div
                    style={{ backgroundColor: item.bg_color || "#158A5E" }}
                    className="w-full h-36 relative overflow-hidden flex items-center justify-between p-3.5 select-none"
                  >
                    {/* Subtle decorative circles */}
                    <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
                    <div className="absolute right-10 -bottom-6 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />

                    {/* Left Column: Title, Description, Button */}
                    <div className="flex-1 pr-2 z-10 space-y-1">
                      <h5 className="text-xs font-bold text-white line-clamp-1 leading-snug">
                        {item.title}
                      </h5>
                      {item.description && (
                        <p className="text-[10px] text-white/80 line-clamp-2 leading-tight">
                          {item.description}
                        </p>
                      )}
                      <div className="pt-1">
                        <span
                          style={{ color: item.bg_color || "#158A5E" }}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white rounded-full text-[10px] font-bold shadow-xs"
                        >
                          {item.cta_text || (item.target_audience === "driver" ? "Go Online & Earn" : "Send a Package")}
                          <span>→</span>
                        </span>
                      </div>
                    </div>

                    {/* Right Column: Illustration Image (fitted properly) */}
                    <div className="w-20 h-20 shrink-0 flex items-center justify-center z-10">
                      <img
                        src={item.media_url}
                        alt={item.title}
                        className="w-full h-full object-contain drop-shadow-sm"
                      />
                    </div>

                    {/* Slide Badge & Active Toggle (Clean Admin Badges Only) */}
                    <div className="absolute top-2 left-2 flex gap-1 z-20">
                      <span className="text-[9px] font-bold bg-amber-500/90 text-white px-2 py-0.5 rounded-full backdrop-blur-md shadow-xs">
                        Slide #{item.sort_order || 1}
                      </span>
                    </div>

                    <div className="absolute top-2 right-2 flex items-center gap-1.5 z-20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePopup(item);
                        }}
                        title={item.is_popup ? "Disable App Popup" : "Enable App Popup Modal"}
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide transition-colors ${
                          item.is_popup
                            ? "bg-purple-600 text-white shadow-xs"
                            : "bg-gray-800/60 text-gray-300 hover:text-white"
                        }`}
                      >
                        {item.is_popup ? "POPUP ON" : "POPUP OFF"}
                      </button>
                      <button
                        onClick={() => handleToggleActive(item)}
                        title={item.is_active ? "Deactivate" : "Activate"}
                        className={`px-2 py-0.5 rounded-full text-[9px] font-semibold tracking-wide transition-colors ${
                          item.is_active
                            ? "bg-emerald-500 text-white shadow-xs"
                            : "bg-gray-800/80 text-gray-200"
                        }`}
                      >
                        {item.is_active ? "ACTIVE" : "OFF"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-36 bg-gray-900 relative overflow-hidden flex items-center justify-center">
                    <div className="flex flex-col items-center justify-center text-white/80">
                      <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shadow-lg mb-1">
                        <Play size={18} fill="white" className="text-white ml-0.5" />
                      </div>
                      <span className="text-[10px] font-mono tracking-wide text-white/70">YouTube Video</span>
                    </div>

                    <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-600/90 text-white backdrop-blur-md shadow-sm">
                        video
                      </span>
                      <span className="text-[10px] font-medium bg-black/60 text-white px-2 py-0.5 rounded-full backdrop-blur-md">
                        {audienceOptions.find((a) => a.value === item.target_audience)?.label || item.target_audience}
                      </span>
                    </div>

                    <div className="absolute top-2 right-2">
                      <button
                        onClick={() => handleToggleActive(item)}
                        title={item.is_active ? "Deactivate" : "Activate"}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide transition-colors ${
                          item.is_active
                            ? "bg-green-500 text-white shadow-sm"
                            : "bg-gray-700 text-gray-200"
                        }`}
                      >
                        {item.is_active ? "ACTIVE" : "OFF"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="p-4 space-y-2">
                  <h4 className="text-xs font-semibold text-text-primary line-clamp-1">{item.title}</h4>
                  {item.description && (
                    <p className="text-[11px] text-text-muted line-clamp-2 leading-relaxed">{item.description}</p>
                  )}

                  <div className="pt-2 border-t border-border-light space-y-1 text-[11px] text-text-secondary">
                    {item.type === "banner" && (
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted">Carousel Slide:</span>
                        <span className="font-semibold text-sendme">
                          Slide #{item.sort_order || 1}
                        </span>
                      </div>
                    )}
                    {item.trigger_action && (
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted">Trigger:</span>
                        <span className="font-medium text-text-primary">
                          {item.trigger_action === "go_online"
                            ? "Go Online"
                            : item.trigger_action === "send_package"
                            ? "Send Package"
                            : "Dashboard"}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted">Display Frequency:</span>
                      <span className="font-medium text-text-primary">
                        Every {item.display_frequency}th open
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="px-4 py-2.5 bg-surface-secondary/60 border-t border-border-light flex items-center justify-between">
                <a
                  href={item.media_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-sendme hover:underline flex items-center gap-1 font-medium"
                >
                  <ExternalLink size={12} /> View Media
                </a>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white rounded transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-text-muted hover:text-red-600 hover:bg-white rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create / Edit Placement */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-border-default">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-border-light flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-text-primary">
                  {editingItem ? "Edit Placement" : "Add New Banner / Video Placement"}
                </h3>
                <p className="text-[11px] text-text-muted">
                  Configure audience targeting and direct media storage.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-text-muted hover:text-text-primary rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setType("banner");
                    setTriggerAction("dashboard");
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    type === "banner"
                      ? "border-sendme bg-emerald-50 text-sendme"
                      : "border-border-default text-text-muted hover:bg-surface-secondary"
                  }`}
                >
                  <ImageIcon size={15} /> Announcement Banner
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType("video");
                    setTriggerAction("go_online");
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    type === "video"
                      ? "border-purple-600 bg-purple-50 text-purple-700"
                      : "border-border-default text-text-muted hover:bg-surface-secondary"
                  }`}
                >
                  <Video size={15} /> Action Tutorial Video
                </button>
              </div>

              {/* 📱 Real-Time Live Outcome Preview for Banners */}
              {type === "banner" && (
                <div className="space-y-1.5 p-3 bg-surface-secondary/50 border border-border-default rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <span>📱</span> Live Mobile Outcome Preview
                    </span>
                    <span className="text-[10px] text-text-muted">Updates as you edit</span>
                  </div>

                  {/* The Simulated Mobile Card */}
                  <div
                    style={{ backgroundColor: bgColor || "#158A5E" }}
                    className="w-full rounded-2xl p-4 min-h-[118px] flex items-center justify-between relative overflow-hidden shadow-sm text-white select-none transition-colors"
                  >
                    {/* Subtle decorative circles */}
                    <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
                    <div className="absolute right-12 -bottom-8 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />

                    {/* Left Column: Title, Description, Button */}
                    <div className="flex-1 pr-3 z-10 space-y-1">
                      <h4 className="text-xs font-bold tracking-tight text-white leading-snug line-clamp-1">
                        {title || "Special 15% Delivery Promo"}
                      </h4>
                      <p className="text-[10px] text-white/85 line-clamp-2 leading-tight">
                        {description || "Enjoy 15% off your next delivery across Abuja & Lagos today."}
                      </p>
                      <div className="pt-1.5">
                        <span
                          style={{ color: bgColor || "#158A5E" }}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white rounded-full text-[10px] font-bold shadow-xs"
                        >
                          {ctaText ||
                            (targetAudience === "driver"
                              ? "Go Online & Earn"
                              : targetAudience === "customer"
                              ? "Send a Package"
                              : "Explore Now")}
                          <span>→</span>
                        </span>
                      </div>
                    </div>

                    {/* Right Column: Illustration Image (fitted without overflowing) */}
                    <div className="w-20 h-20 shrink-0 flex items-center justify-center z-10">
                      {mediaUrl ? (
                        <img
                          src={mediaUrl}
                          alt="Preview"
                          className="w-full h-full object-contain drop-shadow-sm"
                        />
                      ) : (
                        <div className="w-full h-full rounded-xl bg-white/10 border border-white/20 border-dashed flex flex-col items-center justify-center text-white/60 text-[9px] text-center p-1">
                          <ImageIcon size={16} className="mb-0.5 text-white/50" />
                          <span>No Image</span>
                        </div>
                      )}
                    </div>

                    {/* Close preview button */}
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-black/20 flex items-center justify-center text-white text-[9px]">
                      ✕
                    </div>
                    {/* Dots preview */}
                    <div className="absolute bottom-1.5 left-4 flex items-center gap-1">
                      <div className="w-3 h-1 bg-white rounded-full" />
                      <div className="w-1 h-1 bg-white/40 rounded-full" />
                      <div className="w-1 h-1 bg-white/40 rounded-full" />
                    </div>
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Special 15% Delivery Promo"
                  className="w-full text-xs text-text-primary bg-white border border-border-default rounded-lg px-3 py-2.5 focus:outline-none focus:border-sendme"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Enjoy 15% off your next delivery across Abuja & Lagos today."
                  className="w-full text-xs text-text-primary bg-white border border-border-default rounded-lg px-3 py-2 focus:outline-none focus:border-sendme"
                />
              </div>

              {/* Button Text & Color (Banner Only) */}
              {type === "banner" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-text-secondary mb-1 block">
                      Button Text (Optional)
                    </label>
                    <input
                      type="text"
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      placeholder={
                        targetAudience === "driver"
                          ? "Go Online & Earn"
                          : targetAudience === "customer"
                          ? "Send a Package"
                          : "Explore Now"
                      }
                      className="w-full text-xs text-text-primary bg-white border border-border-default rounded-lg px-3 py-2 focus:outline-none focus:border-sendme"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-text-secondary mb-1 block">
                      Card Theme Color
                    </label>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      {["#158A5E", "#0E6844", "#12744F", "#0B4F35", "#1E293B"].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setBgColor(c)}
                          style={{ backgroundColor: c }}
                          className={`w-6 h-6 rounded-full border-2 transition-all ${
                            bgColor === c ? "border-white ring-2 ring-sendme scale-110" : "border-transparent opacity-80 hover:opacity-100"
                          }`}
                        />
                      ))}
                      <input
                        type="text"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="text-[11px] font-mono px-2 py-1 border border-border-default rounded w-20 ml-1 text-center"
                        placeholder="#158A5E"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Media Upload or YouTube Link */}
              {type === "banner" ? (
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">
                    Illustration Graphic (Right-side image, e.g. Parcel with 15% off)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder="Storage bucket URL"
                      className="flex-1 text-xs text-text-primary bg-surface-secondary border border-border-default rounded-lg px-3 py-2"
                      readOnly
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={uploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 bg-surface-secondary border border-border-default rounded-lg text-xs font-medium text-text-primary hover:bg-surface-hover flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      {uploadingImage ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                      Upload File
                    </button>
                  </div>

                  {/* 💡 AI Prompt Template & Cloud Setup Guide */}
                  <div className="mt-2.5 p-3 bg-emerald-50/70 border border-emerald-200/90 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-950 flex items-center gap-1.5">
                        <Sparkles size={13} className="text-sendme" />
                        Prompt Template for AI Image Generation
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyPrompt}
                        className="flex items-center gap-1 px-2 py-0.5 bg-white border border-emerald-300 rounded text-[10px] font-semibold text-emerald-800 hover:bg-emerald-100/70 transition-colors shadow-2xs"
                      >
                        {copiedPrompt ? (
                          <>
                            <Check size={11} className="text-emerald-700" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={11} />
                            <span>Copy Prompt</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-2 bg-white rounded-lg border border-emerald-200/70 font-mono text-[10px] text-emerald-900 leading-relaxed select-all">
                      {sampleAiPrompt}
                    </div>

                    <div className="text-[10px] text-emerald-800 space-y-1 pt-0.5 leading-relaxed">
                      <p className="flex items-start gap-1.5">
                        <span className="font-semibold text-emerald-950">• Asset Format:</span>
                        <span>Square 1:1 image (e.g. 400×400 PNG) with transparent background or dark green (#158A5E).</span>
                      </p>
                      <p className="flex items-start gap-1.5">
                        <span className="font-semibold text-emerald-950">• Cloud Storage:</span>
                        <span>Clicking "Upload File" stores the image directly into Supabase Storage bucket (<code className="bg-emerald-100/80 px-1 rounded">banners</code>) with a permanent CDN URL — never viewed from temporary local files.</span>
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">
                    YouTube Tutorial Video URL
                  </label>
                  <input
                    type="url"
                    required
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full text-xs text-text-primary bg-white border border-border-default rounded-lg px-3 py-2.5 focus:outline-none focus:border-sendme"
                  />
                  <p className="text-[10px] text-text-muted mt-1">
                    Accepts standard or short YouTube URLs (e.g. youtu.be/... or watch?v=...).
                  </p>
                </div>
              )}

              {/* Destination Link URL for Banners */}
              {type === "banner" && (
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">
                    Destination In-App Route or Web Link (Optional)
                  </label>
                  <input
                    type="text"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="e.g. /(order)/step-1-location or https://sendme.ng/promo"
                    className="w-full text-xs text-text-primary bg-white border border-border-default rounded-lg px-3 py-2 focus:outline-none focus:border-sendme"
                  />
                </div>
              )}

              {/* Target Audience & Trigger */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">Target Audience</label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value as any)}
                    className="w-full text-xs text-text-primary bg-white border border-border-default rounded-lg px-3 py-2.5 focus:outline-none focus:border-sendme"
                  >
                    {audienceOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">Trigger / Placement</label>
                  <select
                    value={triggerAction || ""}
                    onChange={(e) => setTriggerAction(e.target.value)}
                    className="w-full text-xs text-text-primary bg-white border border-border-default rounded-lg px-3 py-2.5 focus:outline-none focus:border-sendme"
                  >
                    {triggerOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Frequency Capping & Carousel Order */}
              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">
                    Carousel Slide # (1, 2, 3...)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={sortOrder}
                    onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 1)}
                    className="w-full text-xs text-text-primary bg-white border border-border-default rounded-lg px-3 py-2 focus:outline-none focus:border-sendme"
                  />
                  <p className="text-[10px] text-text-muted mt-1">
                    Display order in the carousel (Slide 1, 2, etc.)
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActiveCheck"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 text-sendme rounded border-border-default focus:ring-sendme"
                    />
                    <label htmlFor="isActiveCheck" className="text-xs font-medium text-text-primary cursor-pointer">
                      Placement Active
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isPopupCheck"
                      checked={isPopup}
                      onChange={(e) => setIsPopup(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded border-border-default focus:ring-purple-500"
                    />
                    <label htmlFor="isPopupCheck" className="text-xs font-medium text-text-primary cursor-pointer">
                      Show as Pop-up Modal (Dismissible)
                    </label>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-border-light flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-border-default rounded-lg text-xs font-medium text-text-primary hover:bg-surface-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="flex-1 px-4 py-2.5 bg-sendme text-white rounded-lg text-xs font-semibold hover:bg-sendme-dark transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm"
                >
                  {submitting && <Loader2 size={13} className="animate-spin" />}
                  {editingItem ? "Update Placement" : "Save & Publish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
