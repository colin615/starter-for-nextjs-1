"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "../ui/button";
import { FaCheck } from "react-icons/fa6";

export const ServiceCard = ({ 
  site, 
  isConnected, 
  hasTimezone, 
  onCardClick
}) => {
  // Move iconClass into siteStyles, and apply from siteStyles not site
  const siteStyles = {
    roobet: {
      title: "Roobet",
      accentColor: "#4C3715",
      iconClass: "scale-125",
      description: "Connect your Roobet affiliate account to start tracking wagers."
    },
    shuffle: {
      title: "Shuffle",
      accentColor: "#7A32FB",
      iconClass: " !fill-white", // or any other Tailwind classes
      description: "Connect your Shuffle casino account to start tracking wagers."
    },
    rainbet: {
      title: "Rainbet",
      accentColor: "#191F3B",
      iconClass: " !fill-white", // or any other Tailwind classes
      description: "Connect your Rainbet casino account to start tracking wagers."
    },
    gamdom: {
      title: "Gamdom",
      accentColor: "#0F3824",
      iconClass: " !fill-white", // or any other Tailwind classes
      description: "Connect your Gamdom casino account to start tracking wagers."
    }
  };

  // Defensive fallback for missing icons
  const iconClass = siteStyles[site.id]?.iconClass || "";
  const accentColor = siteStyles[site.id]?.accentColor || "#111926";

  const handleButtonClick = (e) => {
    e.stopPropagation(); // Prevent card click
    if (hasTimezone !== false) {
      onCardClick(site);
    }
  };

  return (
    <div
      className={`border rounded-md relative overflow-hidden bg-[#16181D] ${
        hasTimezone === false 
          ? "cursor-not-allowed opacity-50" 
          : "cursor-default"
      }`}
      style={{
        "--accent": accentColor,
      }}
    >
      {/* Background illustration - positioned behind content */}
      <img
        className="absolute -bottom-12 -right-16 z-0 size-[15.5rem] opacity-[0.0125] grayscale pointer-events-none"
        src={`/casinos/${site.id}.svg`}
        alt=""
        aria-hidden="true"
      />
      
      <div className="relative z-10 p-5">
        <div className="flex items-center gap-3">
          <div
            className="flex border border-white/5 size-9 items-center justify-center rounded-sm p-2.5"
            style={{
              background: accentColor
            }}
          >
            <img
              className={iconClass}
              src={`/casinos/${site.id}.svg`}
              alt={site.name}
            />
          </div>
          <p className="text-white font-medium">{siteStyles[site.id]?.title}</p>
        </div>
        <p className="mt-2.5 text-[13px] text-neutral-200">
          {siteStyles[site.id]?.description}
        </p>
        <Button 
          variant="outline" 
          onClick={handleButtonClick}
          disabled={hasTimezone === false}
          className={`h-8 mt-2.5 transition-all duration-200 cursor-pointer ${
            isConnected 
              ? "!bg-[#84F549]/10 !border-[#84F549]/30 !text-[#84F549] hover:brightness-90" 
              : "!bg-[#212328] !text-white hover:brightness-90"
          }`}
        >
          {isConnected ? (
            <span className="flex items-center gap-2">
              <FaCheck className="size-3.5" />
              Connected
            </span>
          ) : (
            "Connect"
          )}
        </Button>
        
      </div>
    </div>
  );
};

export const ServiceCardSkeleton = () => {
  return (
    <div className="border rounded-md relative overflow-hidden bg-[#16181D]">
      <div className="relative z-10 p-5">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-sm bg-white/10" />
          <Skeleton className="h-5 w-20 bg-white/10" />
        </div>
        {/* Description text skeleton - matches text-[13px] with proper line height, accounts for wrapping */}
        <div className="mt-2.5 space-y-1.5">
          <Skeleton className="h-[13px] w-full max-w-[280px] bg-white/10" />
          <Skeleton className="h-[13px] w-3/4 max-w-[200px] bg-white/10" />
        </div>
        {/* Button skeleton - matches h-8 button height, width accounts for "Connected" text */}
        <Skeleton className="h-8 w-28 mt-2.5 rounded-md bg-white/10" />
      </div>
    </div>
  );
};
