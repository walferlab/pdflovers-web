'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import ProductCard from '@/components/UI/ProductCard';
import ProductCardSkeleton from '@/components/UI/ProductCardSkeleton';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PAGE_SIZE = 10;

export default function MainProductFeed() {
  const searchParams = useSearchParams();
  const tag = searchParams.get('tag') || null;

  const [products, setProducts] = useState<any[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const isFetchingRef = useRef(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  const fetchProducts = useCallback(async (currentOffset: number, currentTag: string | null, isReset: boolean = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);

    const { data, error } = await supabase.rpc('get_main_feed', {
      p_limit: PAGE_SIZE,
      p_offset: currentOffset,
      p_tag: currentTag,
    });

    if (!error && data) {
      setProducts((prev) => (isReset ? data : [...prev, ...data]));
      setHasMore(data.length === PAGE_SIZE);
      setOffset(currentOffset + PAGE_SIZE);
    }

    setLoading(false);
    isFetchingRef.current = false;
  }, []);

  // Reset feed when tag changes
  useEffect(() => {
    setProducts([]);
    setOffset(0);
    setHasMore(true);
    fetchProducts(0, tag, true);
  }, [tag, fetchProducts]);

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !isFetchingRef.current) {
          fetchProducts(offset, tag);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => { if (observerTarget.current) observer.unobserve(observerTarget.current); };
  }, [offset, tag, hasMore, loading, fetchProducts]);

  return (
    <div className="w-full">
      {tag && (
        <div className="mb-6 pb-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">
            Showing category: <span className="text-blue-600">"{tag}"</span>
          </h1>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {products.map((product, index) => (
          <ProductCard
            key={`${product.id}-${index}`}
            id={product.id}
            title={product.title}
            price={product.price}
            discount={product.discount > 0 ? `${product.discount}%` : null}
            image={Array.isArray(product.image_urls) && product.image_urls.length > 0 ? product.image_urls[0] : null}
          />
        ))}

        {loading && Array.from({ length: PAGE_SIZE }).map((_, i) => (
          <ProductCardSkeleton key={`skeleton-${i}`} />
        ))}
      </div>

      {!loading && products.length === 0 && (
        <div className="text-center py-16 text-gray-500 font-medium">No products found {tag ? `in "${tag}"` : ''}.</div>
      )}

      <div ref={observerTarget} className="h-4 w-full" />
    </div>
  );
}