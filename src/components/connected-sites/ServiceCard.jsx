"use client";

import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Unlink } from "lucide-react";
import {
  TextureCard,
  TextureCardContent,
} from "@/components/ui/texture-card";

export const ServiceCard = ({ 
  site, 
  isConnected, 
  hasTimezone, 
  onCardClick, 
  onUnlinkClick 
}) => {
  const siteStyles = {
    roobet: {
      title: "Roobet",
      accentColor: "#EFAF0D",
    },
    shuffle: {
      title: "Shuffle",
      accentColor: "#896CFF"
    }
  };

  return (
    <TextureCard
      className={`flex flex-col text-white ${
        hasTimezone === false 
          ? "cursor-not-allowed opacity-50" 
          : isConnected
          ? "cursor-default"
          : "cursor-pointer"
      }`}
      style={{ "--accent": siteStyles[site.id]?.accentColor }}
      onClick={() => onCardClick(site)}
    >
      <TextureCardContent className="relative overflow-hidden text-white">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="relative flex size-12 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-white/[0.025] p-2.5">
              <img
                className={`z-10 drop-shadow ${site?.iconClass}`}
                src={`/casinos/${site.id}.svg`}
                alt={site.name}
              />
              <img
                className="absolute z-0 scale-[3] blur-[50px]"
                src={site.icon}
                alt=""
              />
            </div>
            <p>{siteStyles[site.id]?.title}</p>
          </div>
          <br />
          <div className="flex items-center justify-between">
            <Switch
              checked={isConnected}
              className="data-[state=checked]:bg-[var(--accent)] data-[state=checked]:fill-white"
            />
            {isConnected && (
              <button
                onClick={(e) => onUnlinkClick(site, e)}
                className="flex items-center gap-1.5 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-sm text-red-400 transition-colors hover:border-red-500/30 hover:bg-red-500/20 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-0"
              >
                <Unlink className="h-3.5 w-3.5" />
                Unlink
              </button>
            )}
          </div>
        </div>
      </TextureCardContent>
    </TextureCard>
  );
};

export const ServiceCardSkeleton = () => {
  return (
    <TextureCard className="flex flex-col text-white">
      <TextureCardContent className="relative overflow-hidden text-white">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <Skeleton className="size-12 rounded-md" />
            <Skeleton className="h-5 w-20" />
          </div>
          <br />
          <Skeleton className="h-6 w-12 rounded-full" />
        </div>
      </TextureCardContent>
    </TextureCard>
  );
};
