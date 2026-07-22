const ProductCardSkeleton = ()=> {
    return(
        <div className="flex flex-col gap-2 animate-pulse">
            <div className="aspect-square max-w-64 bg-gray-300 rounded-2xl"/>
            <div className="h-6 bg-gray-200 rounded-lg max-w-40"/>
            <div className="h-6 bg-gray-200 rounded-lg max-w-24"/>
        </div>
    )
}
export default ProductCardSkeleton;