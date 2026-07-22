"use client"; // Required for useSearchParams in Next.js App Router

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const Categories = [
    { label: "Planner", slug: "planner" },
    { label: "Journal", slug: "journal" }, 
    { label: "Sticker", slug: "sticker" },
    { label: "Journal Template", slug: "journal-template" },
    { label: "Budget", slug: "budget" },
    { label: "Budget Planner", slug: "budget-planner" },
    { label: "Budget Journal", slug: "budget-journal" },
    { label: "Finance", slug: "finance" },
    { label: "Financial Planner", slug: "financial-planner" },
    { label: "Financial Journal", slug: "financial-journal" },
    { label: "Financial Template", slug: "financial-template" },
    { label: "Finance Tracker", slug: "finance-tracker" },
];

const CategoriesTags = () => {
    // Grab the current category from the URL to determine active state
    const searchParams = useSearchParams();
    const currentCategory = searchParams.get("category");

    return (
        <div className="w-full flex flex-row gap-2 overflow-x-scroll scrollbar-none py-1">
            <Link 
            href="/" 
            className={`
                whitespace-nowrap shrink-0 px-4 py-2 rounded-full text-xs font-general font-medium tracking-wide transition-all duration-300 border
                ${searchParams.toString() === "" 
                    ? "bg-white-600 text-blue-600 border-blue-600 shadow-sm" 
                    : "bg-white text-black border-black/20 hover:border-black hover:bg-black hover:text-white"
                }
            `}>
                All
            </Link>

            {Categories.map((item) => {
                const isActive = currentCategory === item.slug;
                

                return (
                    <Link
                        href={`/?category=${item.slug}`}
                        key={item.slug}
                        className={`
                            whitespace-nowrap shrink-0 px-4 py-2 rounded-full text-xs font-general font-medium tracking-wide transition-all duration-300 border
                            ${isActive 
                                ? "bg-white-600 text-blue-600 border-blue-600 shadow-sm" // Active: Solid Blue
                                : "bg-white text-black border-black/20 hover:border-black hover:bg-black hover:text-white" // Inactive: White with Black hover
                            }
                        `}
                    >
                        {item.label}
                    </Link>
                );
            })}
        </div>
    );
};

export default CategoriesTags;