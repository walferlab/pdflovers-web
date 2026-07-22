'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import ProductCard from '@/components/UI/ProductCard';
import ProductCardSkeleton from '@/components/UI/ProductCardSkeleton';
import { HugeiconsIcon } from '@hugeicons/react';
import { AiSearch02Icon } from '@hugeicons/core-free-icons';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PAGE_SIZE = 10;

export default function SearchProductFeed() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [products, setProducts] = useState<any[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const cachedEmbeddingRef = useRef<number[] | null>(null);
  const isFetchingRef = useRef(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  const fetchSearchResults = useCallback(async (currentOffset: number, searchQuery: string, isReset: boolean = false) => {
    if (isFetchingRef.current || !searchQuery.trim()) return;
    isFetchingRef.current = true;
    setLoading(true);

    let queryEmbedding = cachedEmbeddingRef.current;

    if (!queryEmbedding && isReset) {
      try {
        const { data: embeddingData } = await supabase.functions.invoke(
          'generate-query-embedding',
          { body: { query: searchQuery } }
        );
        if (embeddingData?.embedding) {
          queryEmbedding = embeddingData.embedding;
          cachedEmbeddingRef.current = queryEmbedding;
        }
      } catch (err) {
        console.error("AI Embedding failed, falling back to keywords:", err);
      }
    }

    // 2. Fetch from Hybrid Search RPC
    const { data, error } = await supabase.rpc('get_ai_search_results', {
      p_search_query: searchQuery,
      p_embedding: queryEmbedding,
      p_limit: PAGE_SIZE,
      p_offset: currentOffset,
    });

    if (!error && data) {
      setProducts((prev) => (isReset ? data : [...prev, ...data]));
      setHasMore(data.length === PAGE_SIZE);
      setOffset(currentOffset + PAGE_SIZE);
    }

    setLoading(false);
    isFetchingRef.current = false;
  }, []);

  // Reset when query URL parameter changes
  useEffect(() => {
    setProducts([]);
    setOffset(0);
    setHasMore(true);
    cachedEmbeddingRef.current = null; // Clear cached vector

    if (query.trim()) {
      fetchSearchResults(0, query, true);
    } else {
      setLoading(false);
    }
  }, [query, fetchSearchResults]);

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !isFetchingRef.current && query.trim()) {
          fetchSearchResults(offset, query);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => { if (observerTarget.current) observer.unobserve(observerTarget.current); };
  }, [offset, query, hasMore, loading, fetchSearchResults]);

  if (!query.trim()) {
    return <div className="text-center py-16 text-gray-500 font-medium">Type something in the search bar to begin.</div>;
  }

  return (
    <div className="w-full">

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
        <div className="text-center py-16 text-gray-600 font-general font-medium flex flex-col items-center gap-4">
            <HugeiconsIcon icon={AiSearch02Icon} size={25} />
            <p>No results found for "{query}"</p>
        </div>
      )}

      <div ref={observerTarget} className="h-4 w-full" />
    </div>
  );
}