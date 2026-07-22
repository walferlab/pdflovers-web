"use client";

import { Cancel01Icon, PartyIcon, RupeeShieldIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Span } from "next/dist/trace";
import { useState, useEffect, useCallback, useRef } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with the new saleId immediately after server-verified payment. */
  onPaymentSuccess: (saleId: string) => void;
  productId: string;
  productTitle: string;
  /** Raw price string/number from DB e.g. "₹299" or 299 */
  price: string | number;
  /** Product-level discount from DB (e.g. "10" = 10%) */
  discount?: string | number | null;
}

interface OrderDetails {
  orderId: string;
  amount: number;
  amountInPaise: number;
  currency: string;
  keyId: string;
  basePrice: number;
  productDiscount: number | null;
  priceAfterProductDiscount: number;
  coupon: { code: string; discountPercent: number; label: string } | null;
}

type ModalStep = "bill" | "processing" | "error";

// ── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (document.getElementById("razorpay-sdk")) return resolve(true);
    const script = document.createElement("script");
    script.id = "razorpay-sdk";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ── Component ──────────────────────────────────────────────────────────────

export default function CheckoutModal({
  isOpen,
  onClose,
  onPaymentSuccess,
  productId,
  productTitle,
  price,
  discount,
}: CheckoutModalProps) {
  const [step, setStep] = useState<ModalStep>("bill");
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);

  // Parse local price for initial display — server always recomputes the real amount
  const numPrice = parseFloat(String(price).replace(/[^0-9.]/g, ""));
  const numDiscount = parseFloat(String(discount || "0").replace(/[^0-9.]/g, ""));
  const hasProductDiscount = !isNaN(numDiscount) && numDiscount > 0;
  const isPercentage =
    String(discount || "").includes("%") || (numDiscount > 0 && numDiscount <= 100);
  const localDiscounted = hasProductDiscount
    ? Math.max(0, isPercentage ? numPrice - (numPrice * numDiscount) / 100 : numPrice - numDiscount)
    : numPrice;

  // Reset all state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep("bill");
      setCouponInput("");
      setCouponError("");
      setOrder(null);
      setErrorMsg("");
    }
  }, [isOpen]);

  // Close on Escape (not while processing)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && step !== "processing") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, step, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // ── Apply coupon ──────────────────────────────────────────────────────────
  // Hits create-order with coupon; server validates against DB
  const applyCoupon = useCallback(async () => {
    if (!couponInput.trim()) return;
    setCouponError("");
    setCouponLoading(true);
    try {
      const res = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, couponCode: couponInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.error ?? "Invalid coupon");
        return;
      }
      setOrder(data as OrderDetails);
    } catch {
      setCouponError("Network error. Please try again.");
    } finally {
      setCouponLoading(false);
    }
  }, [productId, couponInput]);

  const removeCoupon = useCallback(() => {
    setCouponInput("");
    setCouponError("");
    setOrder(null);
  }, []);

  // ── Pay Now ───────────────────────────────────────────────────────────────
  const handlePayNow = useCallback(async () => {
    setStep("processing");
    setErrorMsg("");

    try {
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        throw new Error("Could not load Razorpay SDK. Please disable your ad-blocker and retry.");
      }

      // Create a plain order if no coupon order exists yet
      let currentOrder = order;
      if (!currentOrder) {
        const res = await fetch("/api/checkout/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to create order");
        currentOrder = data as OrderDetails;
        setOrder(currentOrder);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Razorpay = (window as any).Razorpay;
      if (!Razorpay) throw new Error("Razorpay not available");

      const rzp = new Razorpay({
        key: currentOrder.keyId,
        amount: currentOrder.amountInPaise,
        currency: currentOrder.currency,
        name: "PDF Lovers",
        description: productTitle,
        order_id: currentOrder.orderId,
        theme: { color: "#0f0f0f" },

        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await fetch("/api/checkout/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                productId,
                couponCode: currentOrder!.coupon?.code ?? null,
              }),
            });
            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error ?? "Payment verification failed");
            }

            // Hand off to parent — parent opens DownloadModal, this modal closes
            onPaymentSuccess(verifyData.saleId);
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Verification failed";
            setErrorMsg(msg);
            setStep("error");
          }
        },

        modal: {
          // User dismissed Razorpay popup without paying
          ondismiss: () => setStep("bill"),
        },
      });

      rzp.open();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Payment failed";
      setErrorMsg(msg);
      setStep("error");
    }
  }, [order, productId, productTitle, onPaymentSuccess]);

  // ── Derived display values ─────────────────────────────────────────────────
  const displayBase = order?.basePrice ?? numPrice;
  const displayProductDiscount = order?.productDiscount ?? (hasProductDiscount ? numDiscount : null);
  const displayAfterProductDiscount = order?.priceAfterProductDiscount ?? localDiscounted;
  const displayCoupon = order?.coupon ?? null;
  const displayTotal = order?.amount ?? localDiscounted;

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      id="checkout-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Secure Checkout"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (e.target === overlayRef.current && step !== "processing") onClose();
      }}
    >
      <div
        id="checkout-modal-panel"
        className="
         absolute bottom-0 sm:bottom-1/2 left-1/2 -translate-x-1/2 sm:translate-y-1/2 bg-white rounded-t-2xl sm:rounded-2xl
          w-full sm:max-w-md
          shadow-xl overflow-hidden
          animate-[dm-slideUp_0.28s_cubic-bezier(0.16,1,0.3,1)_both]
        "
      >
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(40px); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
          @keyframes co-spin { to { transform: rotate(360deg); } }
          .co-spinner {
            width: 20px; height: 20px;
            border: 2px solid #e5e5e5; border-top-color: #0f0f0f;
            border-radius: 50%;
            animation: co-spin 0.7s linear infinite;
            display: inline-block;
          }
        `}</style>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-neutral-100">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium font-general text-neutral-500">
              Secure Checkout
            </span>
            <h2 className="text-sm font-semibold text-neutral-900 leading-snug max-w-[280px] truncate">
              {productTitle}
            </h2>
          </div>
          {step !== "processing" && (
            <div className="flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors cursor-pointer p-1">
              <HugeiconsIcon icon={Cancel01Icon} size={18} onClick={onClose} id="download-modal-close-btn" className="" />
            </div>
          )}
        </div>

        {/* ── Content ── */}
        <div className="px-5 py-4 flex flex-col gap-4">

          {/* ══ STEP: bill ══ */}
          {step === "bill" && (
            <>
              {/* Coupon Input */}
              <div className="flex flex-col gap-2">

                {displayCoupon ? (
                  <div className="flex items-center justify-between px-3 py-2.5 bg-blue-50 rounded-lg">
                    <span className="text-xs font-semibold text-blue-800 tracking-wide">
                      &nbsp;{displayCoupon.code}
                      <span className="ml-2 font-medium text-blue-700">
                        ({displayCoupon.label})
                      </span>
                    </span>
                    <button
                      id="co-remove-coupon-btn"
                      onClick={removeCoupon}
                      className="text-xs font-medium text-red-700 hover:text-red-500 underline underline-offset-2 transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                    <div className="relative">
                      <input 
                        id="co-coupon-input"
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value.toUpperCase());
                          setCouponError("");
                        }}
                        onKeyDown={(e) => { if (e.key === "Enter") applyCoupon(); }}
                        placeholder="Have a coupon code?"
                        maxLength={20}
                        type="text" 
                        className="px-3 pr-4 py-2 w-full rounded-lg font-general font-medium uppercase text-black/80 text-sm border border-neutral-300 focus:outline-none focus:border-blue-600" />

                        <button
                          id="co-apply-coupon-btn"
                          onClick={applyCoupon}
                          disabled={!couponInput.trim() || couponLoading}
                          className="
                            absolute right-2 top-1/2 -translate-y-1/2
                            text-xs font-medium
                            bg-none text-blue-600
                            disabled:opacity-60
                            transition-colors cursor-pointer disabled:cursor-not-allowed
                          "
                        >
                          {couponLoading ? <span className="italic">Applying..</span> : "Apply"}
                        </button>
                    </div>
                )}

                {couponError && (
                  <p className="text-[11px] text-red-500 mt-0.5">{couponError}</p>
                )}
              </div>

              {/* ── Bill Breakdown ── */}
              <div className="flex flex-col rounded-xl border border-neutral-100 bg-neutral-50 overflow-hidden">
                <BillRow label="Original Price" value={fmt(displayBase)} />

                {displayProductDiscount != null && displayProductDiscount > 0 && (
                  <BillRow
                    label={`Product Discount (${displayProductDiscount}%)`}
                    value={`− ${fmt(displayBase - displayAfterProductDiscount)}`}
                    accent="blue"
                  />
                )}

                {displayCoupon && (
                  <BillRow
                    label={`Coupon: ${displayCoupon.code} (${displayCoupon.discountPercent}%)`}
                    value={`− ${fmt(displayAfterProductDiscount - displayTotal)}`}
                    accent="blue"
                  />
                )}

                <div className="border-t border-neutral-200 mx-3" />

                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-semibold text-neutral-900">Total Payable</span>
                  <span className="text-xl font-cabinet font-semibold text-neutral-900 tracking-wide">{fmt(displayTotal)}</span>
                </div>
              </div>

              {/* Savings callout */}
              {(displayBase - displayTotal) > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl border border-blue-100">
                  <HugeiconsIcon icon={PartyIcon} size={18} />
                  <span className="text-[12px] text-blue-800 font-medium">
                    You&apos;re saving <strong>{fmt(displayBase - displayTotal)}</strong> on this purchase!
                  </span>
                </div>
              )}

              {/* Pay Button */}
              <button
                id="co-pay-now-btn"
                onClick={handlePayNow}
                className="
                  w-full py-3.5 rounded-xl text-sm font-semibold
                  bg-neutral-900 text-white
                  hover:bg-neutral-700 active:scale-[0.98]
                  transition-all duration-150 cursor-pointer
                  flex items-center justify-center gap-2
                "
              >
                <LockIcon />
                Pay  {fmt(displayTotal)} 
              </button>

              {/* Trust badge */}
              <div className="flex items-center font-medium justify-center gap-1.5 text-xs text-neutral-500">
                <HugeiconsIcon icon={RupeeShieldIcon} size={16} />
                Secured by Razorpay · 256-bit SSL encrypted
              </div>
            </>
          )}

          {/* ══ STEP: processing ══ */}
          {step === "processing" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <span className="co-spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
              <p className="text-sm font-general font-medium text-neutral-500 text-center">Opening secure payment…</p>
            </div>
          )}

          {/* ══ STEP: error ══ */}
          {step === "error" && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="text-center flex flex-col gap-1">
                <p className="text-sm font-semibold font- text-neutral-900">Payment Failed</p>
                <p className="text-xs text-red-500 max-w-[280px] mx-auto">
                  {errorMsg || "An error occurred. Please try again."}
                </p>
              </div>
              <button
                id="co-retry-btn"
                onClick={() => setStep("bill")}
                className="
                  px-6 py-2.5 rounded-xl text-sm font-semibold
                  border border-neutral-200 text-neutral-700
                  hover:bg-neutral-50 transition-colors cursor-pointer
                "
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function BillRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "blue";
}) {
  const valueColor =
    accent === "blue" ? "#5c85f6ff" : "#111827";
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-xs text-neutral-500 max-w-[55%] leading-snug font-medium">{label}</span>
      <span className="text-xs font-medium text-right" style={{ color: valueColor }}>
        {value}
      </span>
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
