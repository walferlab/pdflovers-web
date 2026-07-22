"use client";

import { useState, useCallback } from "react";
import CheckoutModal from "@/components/Payments/CheckoutModal";
import DownloadModal from "@/components/Download/DownloadModal";

export interface PropertyItem {
    label: string;
    value: string | number;
}

export interface ProductDetailsProps {
    title?: string;
    description?: string;
    price?: string | number;
    discount?: string | number;
    properties?: PropertyItem[] | Record<string, string | number>;
    productId?: string;
    /** Set by the server when a valid purchase cookie exists for this product. */
    existingSaleId?: string | null;
}

const ProductDetails = ({
    title,
    description,
    price,
    discount,
    properties,
    productId,
    existingSaleId,
}: ProductDetailsProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isDownloadOpen, setIsDownloadOpen] = useState(false);

    // Tracks the confirmed saleId — either pre-existing from DB session or received
    // after successful payment via onPaymentSuccess
    const [purchasedSaleId, setPurchasedSaleId] = useState<string | null>(
        existingSaleId ?? null
    );

    const numPrice = parseFloat(String(price || "").replace(/[^0-9.]/g, ""));
    const numDiscount = parseFloat(String(discount || "").replace(/[^0-9.]/g, ""));
    const hasDiscount = !isNaN(numPrice) && !isNaN(numDiscount) && numDiscount > 0;
    const isPercentage = String(discount || "").includes("%") || numDiscount <= 100;

    const calculatedDiscountedPrice = hasDiscount
        ? `₹${Math.max(0, isPercentage ? numPrice - (numPrice * numDiscount) / 100 : numPrice - numDiscount).toFixed(2)}`
        : null;

    const propertyList: PropertyItem[] = Array.isArray(properties)
        ? properties
        : properties && typeof properties === "object"
            ? Object.entries(properties).map(([label, value]) => ({ label, value }))
            : [];

    const isLongDescription = Boolean(description && description.length > 140);
    const displayedDescription = isLongDescription && !isExpanded
        ? `${description?.slice(0, 140).trim()}...`
        : description;

    // Called by CheckoutModal after server-verified payment:
    // close checkout, store saleId, open download modal
    const handlePaymentSuccess = useCallback((saleId: string) => {
        setPurchasedSaleId(saleId);
        setIsCheckoutOpen(false);
        setIsDownloadOpen(true);
    }, []);

    return (
        <div className="flex flex-col gap-4 max-w-md w-full font-general text-neutral-950">
            <div className="flex flex-col gap-1.5">
                {title && (
                    <h1 className="text-xl font-semibold font-general text-neutral-950">
                        {title}
                    </h1>
                )}
                {(price || calculatedDiscountedPrice) && (
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-semibold text-blue-500 font-cabinet">
                            {calculatedDiscountedPrice || price}
                        </span>
                        {calculatedDiscountedPrice && price && (
                            <span className="text-sm text-zinc-500 line-through font-general font-medium">
                                {price}
                            </span>
                        )}
                        {discount && (
                            <span className="text-[11px] font-medium font-cabinet tracking-wide text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md border border-blue-200/60">
                                {typeof discount === "number" ? `${discount}% OFF` : discount}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {description && (
                <>
                    <hr className="border-neutral-300" />
                    <div className="flex flex-col gap-1 text-sm tracking-wide text-neutral-600">
                        <p className="transition-all duration-200 font-general font-medium">{displayedDescription}</p>
                        {isLongDescription && (
                            <button
                                type="button"
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="self-start mt-0.5 text-xs font-medium font-cabinet text-neutral-950 hover:text-neutral-800 underline underline-offset-4 cursor-pointer transition-colors"
                            >
                                {isExpanded ? "View less" : "View more"}
                            </button>
                        )}
                    </div>
                </>
            )}

            {propertyList.length > 0 && (
                <>
                    <hr className="border-neutral-300" />
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium font-general text-neutral-500">
                            Everything you need to know
                        </span>
                        <div className="flex flex-col divide-y divide-neutral-300 border border-neutral-300 rounded-xl bg-white/60 overflow-hidden">
                            {propertyList.map((prop, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between py-2 px-3 text-sm transition-colors hover:bg-neutral-50/60"
                                >
                                    <span className="text-neutral-700 font-medium font-general">{prop.label}</span>
                                    <span className="text-neutral-950 font-medium text-right font-general">{prop.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {productId && price && (
                <>
                    <hr className="border-neutral-100" />

                    {purchasedSaleId ? (
                        // Already purchased — show Download button that opens DownloadModal
                        <>
                            <button
                                id="open-download-modal-btn"
                                type="button"
                                onClick={() => setIsDownloadOpen(true)}
                                className="
                                    w-full py-3 rounded-xl text-sm
                                    bg-blue-500 text-white font-general font-semibold
                                    hover:bg-blue-600 active:scale-[0.98] transition-all duration-150 cursor-pointer
                                    flex items-center justify-center gap-2
                                "
                            >
                                <DownloadSvg />
                                Download Your File
                            </button>

                            <DownloadModal
                                isOpen={isDownloadOpen}
                                onClose={() => setIsDownloadOpen(false)}
                                saleId={purchasedSaleId}
                                productTitle={title ?? "Product"}
                            />
                        </>
                    ) : (
                        // Not yet purchased — open CheckoutModal to buy
                        <>
                            <button
                                id="buy-now-btn"
                                type="button"
                                onClick={() => setIsCheckoutOpen(true)}
                                className="
                                    w-full py-3 rounded-xl text-sm font-semibold
                                    bg-neutral-900 text-white
                                    hover:bg-neutral-700 active:scale-[0.98]
                                    transition-all duration-150 cursor-pointer
                                    flex items-center justify-center gap-2
                                "
                            >
                                <LockSvg />
                                Buy Now
                            </button>

                            <CheckoutModal
                                isOpen={isCheckoutOpen}
                                onClose={() => setIsCheckoutOpen(false)}
                                onPaymentSuccess={handlePaymentSuccess}
                                productId={productId}
                                productTitle={title ?? "Product"}
                                price={price}
                                discount={discount}
                            />

                            {/* DownloadModal also rendered here for the post-payment case
                                (purchasedSaleId will be set by handlePaymentSuccess) */}
                            {purchasedSaleId && (
                                <DownloadModal
                                    isOpen={isDownloadOpen}
                                    onClose={() => setIsDownloadOpen(false)}
                                    saleId={purchasedSaleId}
                                    productTitle={title ?? "Product"}
                                />
                            )}
                        </>
                    )}

                </>
            )}
        </div>
    );
};

function DownloadSvg() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    );
}

function LockSvg() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    );
}

export default ProductDetails;