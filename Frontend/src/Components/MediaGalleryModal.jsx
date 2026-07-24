import React, { useState } from "react";
import { X, ArrowLeft, Image as ImageIcon, FileText, Link2, Download, ExternalLink, Play, Film } from "lucide-react";
import { formatMessageTime } from "../utils/formatMessageTime.js";

const MediaGalleryModal = ({ isOpen, onClose, messages = [], contactName = "Chat", onOpenLightbox }) => {
  const [activeTab, setActiveTab] = useState("media"); // 'media' | 'docs' | 'links'

  if (!isOpen) return null;

  // 1. Extract Media (images & videos)
  const mediaItems = messages.filter((m) => !m.deletedForEveryone && (m.image || m.video));

  // 2. Extract Docs (documents)
  const docItems = messages.filter((m) => !m.deletedForEveryone && m.document);

  // 3. Extract Links from message text
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const linkItems = [];
  messages.forEach((m) => {
    if (m.deletedForEveryone || !m.text) return;
    const matches = m.text.match(urlRegex);
    if (matches && matches.length > 0) {
      matches.forEach((url) => {
        linkItems.push({
          url,
          messageId: m._id,
          createdAt: m.createdAt,
          senderId: m.senderId,
          text: m.text,
        });
      });
    }
  });

  // Group media by month
  const groupMediaByMonth = (items) => {
    const groups = {};
    items.forEach((item) => {
      const date = new Date(item.createdAt || Date.now());
      const monthYear = date.toLocaleString("en-US", { month: "long", year: "numeric" }).toUpperCase();
      const currentMonth = new Date().toLocaleString("en-US", { month: "long", year: "numeric" }).toUpperCase();
      const groupKey = monthYear === currentMonth ? "THIS MONTH" : monthYear;
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(item);
    });
    return groups;
  };

  const mediaGroups = groupMediaByMonth(mediaItems);

  const getDomain = (url) => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end animate-fade-in">
      <div className="bg-base-100 border-l border-base-300 w-full max-w-md h-full flex flex-col shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="p-4 border-b border-base-300 flex items-center justify-between bg-base-100">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-base-200 text-base-content/70 hover:text-base-content transition-colors"
              title="Back"
            >
              <ArrowLeft className="size-5" />
            </button>
            <div>
              <h3 className="font-bold text-base text-base-content leading-tight">
                Media, links and docs
              </h3>
              <p className="text-xs text-base-content/50 truncate max-w-[200px]">
                {contactName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-base-200 text-base-content/50 hover:text-base-content transition-colors"
            title="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex items-center border-b border-base-300 bg-base-100">
          {[
            { id: "media", label: "Media", count: mediaItems.length, icon: ImageIcon },
            { id: "docs", label: "Docs", count: docItems.length, icon: FileText },
            { id: "links", label: "Links", count: linkItems.length, icon: Link2 },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 text-xs font-bold transition-all relative border-b-2 ${
                  isActive
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-base-content/60 hover:text-base-content hover:bg-base-200/50"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    isActive ? "bg-primary text-primary-content" : "bg-base-300 text-base-content/70"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Scrollable Gallery Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">

          {/* ══════════════════════════════════
              MEDIA TAB (Photos & Videos)
          ══════════════════════════════════ */}
          {activeTab === "media" && (
            <div className="space-y-6">
              {Object.keys(mediaGroups).length === 0 ? (
                <div className="text-center py-16 text-base-content/50 space-y-2">
                  <ImageIcon className="size-10 mx-auto opacity-30" />
                  <p className="text-xs font-medium">No shared media items found</p>
                </div>
              ) : (
                Object.entries(mediaGroups).map(([monthTitle, items]) => (
                  <div key={monthTitle} className="space-y-3">
                    <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-base-content/60 border-b border-base-300/60 pb-1">
                      {monthTitle}
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {items.map((item) => (
                        <div
                          key={item._id}
                          onClick={() => onOpenLightbox && onOpenLightbox(item)}
                          className="relative aspect-square rounded-xl overflow-hidden border border-base-300/80 bg-base-200 cursor-pointer group hover:scale-[1.03] transition-all shadow-xs"
                        >
                          {item.image ? (
                            <img
                              src={item.image}
                              alt="media preview"
                              className="w-full h-full object-cover group-hover:brightness-95 transition-all"
                            />
                          ) : item.video ? (
                            <div className="relative w-full h-full bg-black flex items-center justify-center">
                              <video src={item.video} className="w-full h-full object-cover opacity-80" />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                <div className="size-8 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-xs">
                                  <Play className="size-4 fill-white ml-0.5" />
                                </div>
                              </div>
                              <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/75 text-white text-[9px] font-mono flex items-center gap-1">
                                <Film className="size-2.5" /> Media
                              </span>
                            </div>
                          ) : null}

                          <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ══════════════════════════════════
              DOCS TAB (PDFs & Documents)
          ══════════════════════════════════ */}
          {activeTab === "docs" && (
            <div className="space-y-3">
              {docItems.length === 0 ? (
                <div className="text-center py-16 text-base-content/50 space-y-2">
                  <FileText className="size-10 mx-auto opacity-30" />
                  <p className="text-xs font-medium">No shared document files found</p>
                </div>
              ) : (
                docItems.map((docMsg) => {
                  const doc = docMsg.document || {};
                  const ext = (doc.name || "").split(".").pop().toUpperCase();
                  const isPdf = ext === "PDF";
                  return (
                    <div
                      key={docMsg._id}
                      className="p-3 rounded-2xl bg-base-200/60 hover:bg-base-200 border border-base-300 transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`size-11 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 border ${
                          isPdf
                            ? "bg-error/15 text-error border-error/30"
                            : "bg-primary/15 text-primary border-primary/30"
                        }`}>
                          {ext || "DOC"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-base-content truncate group-hover:text-primary transition-colors">
                            {doc.name || "Document"}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-base-content/50 mt-0.5">
                            <span>{doc.size ? `${(doc.size / 1024).toFixed(0)} KB` : ext}</span>
                            <span>•</span>
                            <span>{formatMessageTime(docMsg.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {doc.url && (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="p-2 rounded-xl bg-base-100 hover:bg-primary hover:text-primary-content border border-base-300 transition-all flex-shrink-0"
                          title="Download document"
                        >
                          <Download className="size-4" />
                        </a>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ══════════════════════════════════
              LINKS TAB (Shared URLs)
          ══════════════════════════════════ */}
          {activeTab === "links" && (
            <div className="space-y-3">
              {linkItems.length === 0 ? (
                <div className="text-center py-16 text-base-content/50 space-y-2">
                  <Link2 className="size-10 mx-auto opacity-30" />
                  <p className="text-xs font-medium">No shared links found</p>
                </div>
              ) : (
                linkItems.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3.5 rounded-2xl bg-base-200/60 hover:bg-base-200 border border-base-300 transition-all block space-y-2 group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold text-xs">
                          <Link2 className="size-3.5" />
                        </div>
                        <span className="text-xs font-bold text-primary truncate">
                          {getDomain(link.url)}
                        </span>
                      </div>
                      <ExternalLink className="size-3.5 text-base-content/40 group-hover:text-primary transition-colors flex-shrink-0" />
                    </div>

                    <p className="text-xs text-base-content/80 font-mono underline truncate hover:text-primary transition-colors">
                      {link.url}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-base-content/50 pt-1 border-t border-base-300/40">
                      <span className="truncate max-w-[240px]">{link.text}</span>
                      <span className="flex-shrink-0">{formatMessageTime(link.createdAt)}</span>
                    </div>
                  </a>
                ))
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default MediaGalleryModal;
