import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/SupabaseAdmin";

export async function POST(req: Request) {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, productId, couponCode } = await req.json();

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !productId) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) throw new Error("Razorpay key secret not configured");

    const expectedSig = createHmac("sha256", keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    const sigValid = timingSafeEqual(
      Buffer.from(razorpaySignature, "hex"),
      Buffer.from(expectedSig, "hex")
    );

    if (!sigValid) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: product } = await admin
      .from("products")
      .select("price, discount")
      .eq("id", productId)
      .maybeSingle();

    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const basePrice = Number(product.price);
    const productDiscountPct = Math.max(0, Number(product.discount) || 0);
    let authorizedAmount = productDiscountPct > 0
      ? basePrice * (1 - productDiscountPct / 100)
      : basePrice;

    let resolvedCouponId: number | null = null;
    let resolvedCouponTimesUsed: number | null = null;

    if (couponCode?.trim()) {
      const normalizedCode = couponCode.trim().toUpperCase();
      
      const { data: coupon } = await admin
        .from("coupons")
        .select("id, discount_percentage, use_limit, min_apply_rate, times_used")
        .ilike("coupon_name", normalizedCode)
        .maybeSingle();

      if (coupon) {
        const useLimit = coupon.use_limit || 0;
        const timesUsed = coupon.times_used || 0;
        const minApplyRate = coupon.min_apply_rate || 0;
        const discountPct = coupon.discount_percentage || 0;

        const limitReached = useLimit > 0 && timesUsed >= useLimit;
        const meetsMinimum = minApplyRate === 0 || authorizedAmount >= minApplyRate;

        if (!limitReached && meetsMinimum) {
          authorizedAmount *= (1 - discountPct / 100);
          resolvedCouponId = coupon.id;
          resolvedCouponTimesUsed = timesUsed;
        }
      }
    }

    authorizedAmount = Math.max(0, Math.round(authorizedAmount * 100) / 100);

    const { data: sale, error: insertError } = await admin
      .from("sales")
      .insert({
        product_id: productId,
        amount_paid: authorizedAmount,
        razorpay_payment_id: razorpayPaymentId,
        status: "completed",
        coupon_code: resolvedCouponId ? couponCode.trim().toUpperCase() : null,
      })
      .select("id")
      .single();

    if (insertError) {
      // 23505 = duplicate razorpay_payment_id; return idempotent success
      if (insertError.code === "23505") {
        const { data: existing } = await admin
          .from("sales")
          .select("id")
          .eq("razorpay_payment_id", razorpayPaymentId)
          .maybeSingle();

        if (existing) return await buildSuccessResponse(existing.id);
      }
      console.error("[verify-payment] Insert error:", insertError);
      return NextResponse.json({ error: "Failed to record sale" }, { status: 500 });
    }

    if (resolvedCouponId !== null && resolvedCouponTimesUsed !== null) {
      await admin
        .from("coupons")
        .update({ times_used: resolvedCouponTimesUsed + 1 })
        .eq("id", resolvedCouponId);
    }

    return await buildSuccessResponse(sale.id);
  } catch (err) {
    console.error("[verify-payment] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function buildSuccessResponse(saleId: string) {
  const cookieStore = await cookies();
  cookieStore.set(`purchase_${saleId}`, saleId, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 3600,
    path: "/",
  });
  return NextResponse.json({ success: true, saleId });
}