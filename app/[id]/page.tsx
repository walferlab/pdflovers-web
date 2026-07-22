import ImageCarousel from "@/components/Products/ImageCarousel";
import ProductDetails from "@/components/Products/ProductsDetails";
import { createClient } from "@/utils/SupabaseServer";
import { createAdminClient } from "@/utils/SupabaseAdmin";
import { cookies } from "next/headers";
import { Metadata } from "next";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const { id } = await params;
    const supabase = await createClient();
    const { data: product } = await supabase
        .from("products")
        .select("title")
        .eq("id", id)
        .single();

    if (!product) {
        return {
            title: "Product Not Found",
            description: "The requested product could not be found.",
        };
    }

    const defaultImage = "/public/logo.png";

    return {
        title: `${product.title} | PDFLOVERS`,
        description: `Get the ${product.title} PDF now at a discount on PDFLOVERS`,
        openGraph: {
            title: `${product.title} | PDFLOVERS`,
            description: `Get the ${product.title} PDF now at a discount on PDFLOVERS`,
            images: [
                {
                    url: defaultImage,
                    width: 1200,
                    height: 630,
                    alt: product.title,
                },
            ],
            locale: "en_US",
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: `${product.title} | PDFLOVERS`,
            description: `Get the ${product.title} PDF now at a discount on PDFLOVERS`,
            images: [defaultImage],
        },
    };
}

const ProductPage = async ({ params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;

    if (!id || !UUID_RE.test(id)) {
        return (
            <main className="flex justify-center items-center min-h-[50vh] font-general text-neutral-500 text-sm">
                Invalid product ID
            </main>
        );
    }

    const supabase = await createClient();
    const { data: product, error } = await supabase
        .from("products")
        .select("title, image_urls, description, price, discount, properties, id")
        .eq("id", id)
        .single();

    if (error || !product) {
        return (
            <main className="flex justify-center items-center min-h-[50vh] font-general text-neutral-500 text-sm">
                Product not found or unavailable
            </main>
        );
    }

    let existingSaleId: string | null = null;
    try {
        const cookieStore = await cookies();
        const purchaseSaleIds = cookieStore
            .getAll()
            .filter((c) => c.name.startsWith("purchase_") && UUID_RE.test(c.value))
            .map((c) => c.value);

        if (purchaseSaleIds.length > 0) {
            const admin = createAdminClient();
            const { data: sale } = await admin
                .from("sales")
                .select("id")
                .in("id", purchaseSaleIds)
                .eq("product_id", id)
                .eq("status", "completed")
                .limit(1)
                .maybeSingle();
            existingSaleId = sale?.id ?? null;
        }
    } catch {
    }

    return (
        <main className="flex flex-col items-center p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 max-w-4xl w-full justify-center">
                <ImageCarousel images={product.image_urls || []} />
                <ProductDetails
                    title={product.title}
                    description={product.description}
                    price={product.price ? `₹${product.price}` : undefined}
                    discount={product.discount && Number(product.discount) > 0 ? product.discount : undefined}
                    properties={product.properties || []}
                    productId={product.id}
                    existingSaleId={existingSaleId}
                />
            </div>
        </main>
    );
};

export default ProductPage;