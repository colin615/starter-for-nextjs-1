"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getUserCountMicrocopy } from "@/utils/dashboardUtils";

export const StatsCard = ({ activeUsers, isLoading }) => {
  return (
    <div className="bg-gradient-to-tr border border-[#84F549]/50 rounded-md from-[#6bc91f]/80 to-[#84F549]/80 p-5 h-[10rem] relative overflow-hidden">
      <div className="relative z-10">
        {isLoading || activeUsers === null ? (
          <>
            <Skeleton className="h-6 w-24 bg-white/20 mb-2" />
            <Skeleton className="h-12 w-20 bg-white/20" />
          </>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help">
                <h1 className="text-xl -mt-1 font-[500]">Active Users</h1>
                <p className="text-4xl font-[700] mt-1 drop-shadow-md text-white">
                  {activeUsers}
                </p>
              </div>
            </TooltipTrigger>
            <TooltipContent 
              className="bg-white/95 text-gray-800 border border-gray-200/50 shadow-lg max-w-xs [&>svg]:fill-[#84F549]"
              side="bottom"
            >
              {(() => {
                const microcopy = getUserCountMicrocopy(activeUsers);
                return (
                  <div className="text-center">
                    <p className="font-semibold flex items-center justify-center gap-1">
                      {activeUsers} Users {microcopy.emoji}
                    </p>
                    <p className="text-sm mt-1">{microcopy.text}</p>
                  </div>
                );
              })()}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
};
