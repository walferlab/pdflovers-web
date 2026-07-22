import CategoriesTags from "@/modules/features/CategoriesTags";
import FeedProducts from "@/modules/products/FeedProducts";
import TrendingProducts from "@/modules/products/trendingProducts";
import { Metadata } from "next";

export const metadata: Metadata = {
  title : "Discover templates, courses and guides"
}

export default function Home() {
  return (
    <div className="p-4">
      <main className="flex flex-col gap-10">
      <TrendingProducts />
      <CategoriesTags />
      <FeedProducts />
      </main>
    </div>
  );
}
