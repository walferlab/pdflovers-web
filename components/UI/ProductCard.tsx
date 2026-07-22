'use client';

import { Sad02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const ProductCard = ({ id, title, image, price, discount, trending=false }: any) => {
    const [imgError, setImgError] = useState(false);

    return (
        <Link href={`/${id}`}>
            <div className={`flex flex-col cursor-pointer ${trending ? "p-2 bg-gray-300 rounded-2xl" : ""}`}>
                <div className="border border-gray-200 rounded-xl overflow-hidden aspect-square flex items-center justify-center bg-gray-50 max-w-64">
                    {imgError || !image ? (
                       <div className="font-general font-medium text-gray-400 flex flex-col items-center gap-1">
                        <HugeiconsIcon icon={Sad02Icon} size={20} />
                        <span>IMAGE NOT FOUND</span>
                       </div>
                    ) : (
                        <Image 
                            src={image}
                            alt={title}
                            width={400}
                            height={400}
                            className="w-full h-full object-cover object-center"
                            onError={() => setImgError(true)} 
                        />
                    )}
                </div>
                <p className="text-sm font-general tracking-tight font-medium text-black line-clamp-2 pt-2 ">
                    {title}
                </p>

                <p className="flex items-center gap-3 mt-1">
                    <span className="text-md font-cabinet font-semibold text-black/90 tracking-wide">
                        ₹{price}
                    </span>
                    
                    {discount && (
                        <span className="text-xs font-general font-medium bg-blue-200/50 px-2 py-1 rounded-sm text-blue-900">
                            {discount} OFF
                        </span>
                    )}
                </p>
            </div>
        </Link>
    );
};

export default ProductCard;