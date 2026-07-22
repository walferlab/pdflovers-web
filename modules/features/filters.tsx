const Filters = () => {
    return (
        <div className="fixed top-0 left-0  z-40 sm:sticky flex flex-col gap-2 w-full sm:w-fit h-full sm:h-fit ring-1 ring-black/80 divide-y-1 divide-black/80 rounded-md">
            <div className="text-sm text-black/80 font-cabinet font-medium p-1">Popular</div>
            <div className="text-sm text-black/80 font-cabinet font-medium p-1">Newest</div>
            <div className="text-sm text-black/80 font-cabinet font-medium p-1">Price: Low to High</div>
            <div className="text-sm text-black/80 font-cabinet font-medium p-1">Price: High to Low</div>
        </div>
    )
}
export default Filters;