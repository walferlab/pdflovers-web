"use client";

import { useState } from "react";

const ImageCarousel = ({ images = [] }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    // 1. SAFETY CHECK: Ensure we have a real array to prevent the .map crash
    const safeImages = Array.isArray(images) ? images : [];

    // Fallback UI if no images exist (keeping your original container style)
    if (safeImages.length === 0) {
        return (
            <div className="flex flex-col gap-4 p-2">
                <div className="w-full sm:w-sm aspect-square border border-gray-400 rounded-lg bg-gray-300 flex items-center justify-center">
                    <span className="text-gray-500 font-general font-medium">No Image</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 p-2">
            
            {/* Main Featured Image (Your exact UI classes) */}
            <div className="w-full sm:w-sm aspect-square border border-gray-400 rounded-2xl bg-gray-200 overflow-hidden relative">
                <img 
                    src={safeImages[selectedIndex]} 
                    alt="Product"
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Thumbnails Row (Your exact UI classes) */}
            <div className="flex flex-row gap-2 items-center overflow-x-auto">
                {safeImages.map((imgUrl, index) => (
                    <div 
                        key={index}
                        onClick={() => setSelectedIndex(index)}
                        className={`flex max-w-20 w-full rounded-lg aspect-square border-2 cursor-pointer overflow-hidden
                            ${selectedIndex === index ? "border-blue-400" : "border-gray-300 bg-gray-200"}`}
                    >
                        <img 
                            src={imgUrl} 
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ))}
            </div>
            
        </div>
    );
}

export default ImageCarousel;