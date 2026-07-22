"use client"
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  Search01Icon,
  Cancel01Icon,
  DiscoverCircleIcon,
  BadgeInfoIcon,
  AiSearch02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import LogoMain from "@/public/LOGO_MAIN.png";

const Navbar = () => {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  
    setIsMobileSearchOpen(false); 
  };
  
  if (isMobileSearchOpen) {
    return (
      <div className="fixed top-0 left-0 w-full h-fit flex flex-row justify-between items-center py-4 px-2 border-b border-black/80 bg-white z-60">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center bg-gray-200 rounded-full px-2">
            <div className="text-gray-500 shrink-0">
                <HugeiconsIcon icon={AiSearch02Icon} size={20} />
            </div>
            
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search here" 
              autoFocus
              className="w-full px-3 py-2 bg-transparent outline-none text-black font-general font-medium" 
            />
        </form>
        
        <button 
            onClick={() => setIsMobileSearchOpen(false)} 
            className="p-2 text-black shrink-0"
            aria-label="Close search"
        >
            <HugeiconsIcon icon={Cancel01Icon} size={24} />
        </button>
        </div>
    );
  }

  // Default View
  return (
    <div className="fixed top-0 left-0 w-full h-fit flex flex-row justify-between sm:justify-around items-center p-4 border-b border-black/80 bg-white z-60">
      
      <Link href="/" className="flex items-center shrink-0">
        <Image 
          src={LogoMain} 
          alt="PDF Lovers Logo" 
          className="h-6 w-auto object-contain" 
          priority
        />
      </Link>

      {/* Wrapped in a form */}
      <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-2xl mx-8 relative items-center">
        <div className="absolute left-3 text-gray-500">
          <HugeiconsIcon icon={AiSearch02Icon} size={18} />
        </div>
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for templates, courses, or guides..." 
          className="w-full pl-10 pr-4 py-2 bg-gray-200 rounded-full outline-none text-black font-general font-medium"
        />
      </form>

      <div className="flex flex-row gap-2 sm:gap-4 items-center text-black">
        
        <button 
          className="md:hidden p-1" 
          onClick={() => setIsMobileSearchOpen(true)}
        >
          <HugeiconsIcon icon={Search01Icon} size={24} />
        </button>

        <Link href="/" className="p-1">
          <HugeiconsIcon icon={DiscoverCircleIcon} size={24} />
        </Link>

        <Link href="/help" className="p-1">
          <HugeiconsIcon icon={BadgeInfoIcon}  size={24} />
        </Link>
      </div>
    </div>
  );
};

export default Navbar;