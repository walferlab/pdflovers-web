import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  S3Client,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createAdminClient } from "@/utils/SupabaseAdmin";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function buildS3Client() {
  const region = process.env.AWS_S3_REGION;
  const accessKeyId = process.env.AWS_S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_S3_SECRET_ACCESS_KEY;

  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error("Missing AWS S3 environment variables");
  }

  return new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
}

// Extracts the S3 object key from whatever format is stored in asset_url:
//   Plain key:   "products/file.pdf"
//   Full URL:    "https://bucket.s3.region.amazonaws.com/products/file.pdf"
//   s3:// URI:   "s3://bucket/products/file.pdf"
// Also rejects path traversal attempts (keys containing "..")
function extractS3Key(assetUrl: string, bucket: string): string {
  let key: string;

  if (assetUrl.startsWith("s3://")) {
    key = assetUrl.replace(/^s3:\/\/[^/]+\//, "");
  } else if (assetUrl.startsWith("http")) {
    const pathname = new URL(assetUrl).pathname.replace(/^\//, "");
    const bucketPrefix = `${bucket}/`;
    key = pathname.startsWith(bucketPrefix)
      ? pathname.slice(bucketPrefix.length)
      : pathname;
  } else {
    key = assetUrl;
  }

  // Block path traversal
  if (key.includes("..") || key.startsWith("/")) {
    throw new Error("Invalid asset key");
  }

  return key;
}

/** Shared auth: verify purchase cookie + load sale + product from DB.
 *  Returns { s3Key, productTitle, bucket } or throws a NextResponse on failure. */
async function authorizeAndLoad(saleId: string): Promise<{
  s3Key: string;
  productTitle: string;
  bucket: string;
  assetUrl: string;
}> {
  const cookieStore = await cookies();
  const purchaseCookie = cookieStore.get(`purchase_${saleId}`);

  if (!purchaseCookie || purchaseCookie.value !== saleId) {
    // Throw a special sentinel so callers can return 403
    throw Object.assign(new Error("Unauthorized"), { status: 403 });
  }

  const admin = createAdminClient();

  const { data: sale, error: saleError } = await admin
    .from("sales")
    .select("product_id, status")
    .eq("id", saleId)
    .single();

  if (saleError || !sale) {
    throw Object.assign(new Error("Sale not found"), { status: 404 });
  }

  if (sale.status !== "completed") {
    throw Object.assign(new Error("Payment not completed"), { status: 402 });
  }

  const { data: product, error: productError } = await admin
    .from("products")
    .select("asset_url, title")
    .eq("id", sale.product_id)
    .single();

  if (productError || !product || !product.asset_url) {
    throw Object.assign(new Error("Product file not available"), { status: 404 });
  }

  const bucket = process.env.AWS_S3_BUCKET_NAME;
  if (!bucket) throw new Error("AWS_S3_BUCKET_NAME not configured");

  const s3Key = extractS3Key(product.asset_url, bucket);

  return { s3Key, productTitle: product.title ?? "download", bucket, assetUrl: product.asset_url };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const saleId = searchParams.get("saleId");
    const info = searchParams.get("info") === "1";

    // Validate saleId format before touching cookies or DB
    if (!saleId || !UUID_RE.test(saleId)) {
      return NextResponse.json({ error: "Invalid saleId" }, { status: 400 });
    }

    let authorized;
    try {
      authorized = await authorizeAndLoad(saleId);
    } catch (err: unknown) {
      const e = err as Error & { status?: number };
      const status = e.status ?? 403;
      return NextResponse.json({ error: e.message }, { status });
    }

    const { s3Key, productTitle, bucket } = authorized;
    const s3 = buildS3Client();

    // ── INFO MODE: HeadObject — returns file metadata, no download URL ──────
    if (info) {
      const head = await s3.send(
        new HeadObjectCommand({ Bucket: bucket, Key: s3Key })
      );

      const contentType = head.ContentType ?? "application/octet-stream";
      const fileSize = head.ContentLength ?? 0;
      // Derive a friendly extension from content-type
      const extMap: Record<string, string> = {
        "application/pdf": "PDF",
        "application/epub+zip": "EPUB",
        "application/zip": "ZIP",
        "application/x-zip-compressed": "ZIP",
        "image/jpeg": "JPEG",
        "image/png": "PNG",
      };
      const fileType = extMap[contentType] ?? contentType.split("/")[1]?.toUpperCase() ?? "FILE";

      return NextResponse.json({
        fileName: `${productTitle}.${fileType.toLowerCase()}`,
        fileSize: formatFileSize(fileSize),
        fileSizeBytes: fileSize,
        fileType,
        contentType,
      });
    }

    // ── DOWNLOAD MODE: generate 1-hour presigned URL ─────────────────────────
    const safeFileName = encodeURIComponent(`${productTitle}.pdf`);

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: s3Key,
      ResponseContentDisposition: `attachment; filename="${safeFileName}"`,
      ResponseContentType: "application/pdf",
    });

    // Signed URL valid for 1 hour — matches the purchase cookie TTL
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    return NextResponse.json({
      downloadUrl: signedUrl,
      fileName: `${productTitle}.pdf`,
    });
  } catch (err) {
    console.error("[download] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
