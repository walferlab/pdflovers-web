"use client";

import { Cancel01Icon, CloudSavingDone01Icon, Download01Icon, FileFavouriteIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState, useEffect, useCallback, useRef } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleId: string;
  productTitle: string;
}

interface FileInfo {
  fileName: string;
  fileSize: string;
  fileType: string;
  contentType: string;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function DownloadModal({
  isOpen,
  onClose,
  saleId,
  productTitle,
}: DownloadModalProps) {
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoError, setInfoError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);

  // Fetch file info from S3 when modal opens
  useEffect(() => {
    if (!isOpen || !saleId) return;

    setFileInfo(null);
    setInfoError("");
    setDownloadError("");

    const controller = new AbortController();
    setInfoLoading(true);

    fetch(`/api/checkout/download?saleId=${saleId}&info=1`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setInfoError(data.error);
        } else {
          setFileInfo(data as FileInfo);
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") setInfoError("Could not load file info.");
      })
      .finally(() => setInfoLoading(false));

    return () => controller.abort();
  }, [isOpen, saleId]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // ── Download ──────────────────────────────────────────────────────────────
  const handleDownload = useCallback(async () => {
    setDownloading(true);
    setDownloadError("");

    try {
      const res = await fetch(`/api/checkout/download?saleId=${saleId}`);
      const data = await res.json();

      if (!res.ok) {
        setDownloadError(data.error ?? "Download failed. Please try again.");
        return;
      }

      // Trigger browser download via a temporary anchor
      const a = document.createElement("a");
      a.href = data.downloadUrl;
      a.download = data.fileName ?? fileInfo?.fileName ?? "download.pdf";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      setDownloadError("Network error. Please try again.");
    } finally {
      setDownloading(false);
    }
  }, [saleId, fileInfo]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      id="download-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Download your file"
      className="fixed inset-0 z-50 "
      style={{ background: "rgba(126, 126, 126, 0.733)", backdropFilter: "blur(2px)" }}
      onClick={(e) => {
        if (e.target === overlayRef.current && !downloading) onClose();
      }}
    >
      <div
        id="download-modal-panel"
        className="
          absolute bottom-0 sm:bottom-1/2 left-1/2 -translate-x-1/2 sm:translate-y-1/2 bg-white rounded-t-2xl sm:rounded-2xl
          w-full sm:max-w-md
          shadow-xl overflow-hidden
          animate-[dm-slideUp_0.28s_cubic-bezier(0.16,1,0.3,1)_both]
        "
      >
        <style>{`
          @keyframes dm-slideUp {
            from { transform: translateY(40px); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
          @keyframes dm-spin { to { transform: rotate(360deg); } }
          .dm-spinner {
            border-radius: 50%;
            animation: dm-spin 0.7s linear infinite;
            display: inline-block;
          }
        `}</style>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-neutral-100">
          <div className="flex flex-col gap-0.5">
            <span className="text-[12px] font-medium font-general tracking-normal text-neutral-400">
              Download your file
            </span>
            <h2 className="text-sm font-semibold text-neutral-900 leading-snug max-w-[280px] truncate">
              {productTitle}
            </h2>
          </div>
          {!downloading && (
            <div className="flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors cursor-pointer p-1">
              <HugeiconsIcon icon={Cancel01Icon} size={18} onClick={onClose} id="download-modal-close-btn" className="" />
            </div>
          )}
        </div>

        {/* ── Content ── */}
        <div className="px-5 py-5 flex flex-col gap-4">

          {/* Success badge */}
          <div className="flex flex-col items-center gap-2 py-2">
            <HugeiconsIcon icon={CloudSavingDone01Icon} size={32} color="#165aa3ff" />
            <p className="text-sm font-semibold text-neutral-900 font-general">Your file is ready!</p>
            <p className="text-xs text-neutral-500 font-medium text-center font-general">
              Download your file below. The link is valid for <strong>1 hour</strong>.
            </p>
          </div>

          {/* ── File info card ── */}
          {infoLoading && (
            <div className="flex items-center justify-center py-3 gap-2 text-xs text-neutral-400 font-general">
              <span
                className="dm-spinner"
                style={{ width: 16, height: 16, border: "2px solid #e5e5e5", borderTopColor: "#737373" }}
              />
              <p>Loading info</p>
            </div>
          )}

          {infoError && !infoLoading && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
              <span className="text-base">⚠️</span>
              <p className="text-xs text-amber-800">
                {infoError === "Unauthorized"
                  ? "Your session has expired. Please refresh the page and try again."
                  : infoError}
              </p>
            </div>
          )}

          {fileInfo && !infoLoading && (
            <div className="flex items-center gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
              <HugeiconsIcon icon={FileFavouriteIcon} size={28} color="#3279c4ff" />
              <div className="flex flex-col gap-0.5 min-w-0">
                <p className="text-sm font-cabinet font-semibold text-neutral-900 truncate">{fileInfo.fileName}</p>
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <span className="px-1.5 py-0.5 bg-neutral-200 rounded text-[10px] font-semibold text-neutral-600 uppercase tracking-wide">
                    {fileInfo.fileType}
                  </span>
                  <span className="font-general font-medium">{fileInfo.fileSize}</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Download button ── */}
          {!infoError && (
            <button
              id="dm-download-btn"
              onClick={handleDownload}
              disabled={downloading || infoLoading}
              className="
                w-full py-3.5 rounded-xl text-sm font-semibold font-general
                bg-blue-500 text-white
                hover:bg-blue-600 active:scale-[0.98]
                disabled:opacity-60 disabled:cursor-not-allowed
                transition-all duration-150 cursor-pointer
                flex items-center justify-center gap-2
              "
            >
              {downloading ? (
                <>
                  <span
                    className="dm-spinner"
                    style={{ width: 18, height: 18, border: "2px solid #ffffff55", borderTopColor: "#fff" }}
                  />
                  Preparing Download…
                </>
              ) : (
                <>
                  <HugeiconsIcon icon={Download01Icon} size={18} color="#fff" />
                  Download File
                </>
              )}
            </button>
          )}

          {downloadError && (
            <p className="text-[11px] text-red-500 text-center font-general font-medium">{downloadError}</p>
          )}

          {/* Trust note */}
          <p className="text-[11px] text-neutral-400 text-center font-general font-medium">
            Secure link · expires in 1 hour · single-use download
          </p>
        </div>
      </div>
    </div>
  );
}