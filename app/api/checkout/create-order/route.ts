import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/SupabaseAdmin";

export async function POST(req: Request) {
  try {
    const { productId, couponCode } = await req.json();

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    // Always use Admin Client for pricing/coupons to prevent RLS from hiding valid rows
    const admin = createAdminClient();

    const { data: product } = await admin
      .from("products")
      .select("price, discount, title")
      .eq("id", productId)
      .maybeSingle();

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const basePrice = Number(product.price);
    if (isNaN(basePrice) || basePrice <= 0) {
      return NextResponse.json({ error: "Invalid product price" }, { status: 422 });
    }

    const productDiscountPct = Math.max(0, Number(product.discount) || 0);
    const priceAfterProductDiscount = productDiscountPct > 0
      ? basePrice * (1 - productDiscountPct / 100)
      : basePrice;

    let finalAmount = priceAfterProductDiscount;
    let couponApplied = null;

    if (couponCode?.trim()) {
      const normalizedCode = couponCode.trim().toUpperCase();

      const { data: coupon } = await admin
        .from("coupons")
        .select("id, discount_percentage, use_limit, min_apply_rate, times_used")
        .ilike("coupon_name", normalizedCode)
        .maybeSingle();

      if (!coupon) {
        return NextResponse.json({ error: "Invalid coupon code" }, { status: 400 });
      }

      // Safeguard against null DB values
      const useLimit = coupon.use_limit || 0;
      const timesUsed = coupon.times_used || 0;
      const minApplyRate = coupon.min_apply_rate || 0;
      const discountPct = coupon.discount_percentage || 0;

      if (useLimit > 0 && timesUsed >= useLimit) {
        return NextResponse.json({ error: "This coupon has reached its usage limit" }, { status: 400 });
      }

      if (minApplyRate > 0 && priceAfterProductDiscount < minApplyRate) {
        return NextResponse.json(
          { error: `Minimum order of ₹${minApplyRate} required for this coupon` },
          { status: 400 }
        );
      }

      finalAmount = priceAfterProductDiscount * (1 - discountPct / 100);
      couponApplied = {
        code: normalizedCode,
        discountPercent: discountPct,
        label: `${discountPct}% off`,
      };
    }

    // Ensure final amount is properly rounded to 2 decimal places to prevent float math bugs
    finalAmount = Math.max(0, Math.round(finalAmount * 100) / 100);
    const amountInPaise = Math.round(finalAmount * 100);

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!keyId || !keySecret) throw new Error("Razorpay credentials missing");

    const razorpayRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64"),
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: `pdflovers_${productId.slice(0, 8)}_${Date.now()}`,
        notes: { productId, couponCode: couponApplied?.code ?? "none" },
      }),
    });

    if (!razorpayRes.ok) {
      console.error("[create-order] Razorpay error:", await razorpayRes.text());
      return NextResponse.json({ error: "Failed to create payment order" }, { status: 502 });
    }

    const order = await razorpayRes.json();

    return NextResponse.json({
      orderId: order.id,
      amount: finalAmount,
      amountInPaise,
      currency: "INR",
      keyId,
      productTitle: product.title,
      basePrice,
      productDiscount: productDiscountPct > 0 ? productDiscountPct : null,
      priceAfterProductDiscount,
      coupon: couponApplied,
    });
  } catch (err) {
    console.error("[create-order] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}