"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import {
  TextureCardHeader,
  TextureCardTitle,
  TextureCardContent,
  TextureSeparator,
} from "@/components/ui/texture-card";
import { 
  formatDollarAmount, 
  formatLastSeen, 
  getServiceIcon, 
  getAvatarUrl 
} from "@/utils/dashboardUtils";

const DarkTextureCard = ({ children, className = "" }) => (
  <div className={`rounded-[24px] border border-white/60 dark:border-stone-950/60 bg-gradient-to-b from-[#07080B] to-[#0f1015] ${className}`}>
    <div className="rounded-[23px] border dark:border-neutral-900/80 border-black/10 bg-gradient-to-b from-[#07080B] to-[#0f1015]">
      <div className="rounded-[22px] border dark:border-neutral-950 border-white/50 bg-gradient-to-b from-[#07080B] to-[#0f1015]">
        <div className="rounded-[21px] border dark:border-neutral-900/70 border-neutral-950/20 bg-gradient-to-b from-[#07080B] to-[#0f1015]">
          <div className="w-full border border-white/50 dark:border-neutral-700/50 rounded-[20px] text-neutral-500 bg-[#07080B]">
            {children}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Get activity dot gradient based on score
const getActivityDotStyle = (activity) => {
  if (activity < 20) {
    // Gray (white with low opacity)
    return 'bg-gradient-to-r from-gray-400/50 to-gray-500/50';
  } else if (activity < 70) {
    // Yellow-ish
    return 'bg-gradient-to-r from-yellow-400/60 to-amber-500/60';
  } else {
    // Green
    return 'bg-gradient-to-r from-green-400 to-emerald-500';
  }
};

export const UserStatsTable = ({ 
  usersList, 
  isLoading, 
  sortField, 
  sortDirection, 
  handleSort, 
  getSortedUsersList 
}) => {
  return (
    <DarkTextureCard>
      <TextureCardHeader className="flex flex-col justify-center gap-1 p-4">
        <TextureCardTitle>User Statistics</TextureCardTitle>
      </TextureCardHeader>
      <TextureSeparator />
      <TextureCardContent className="rounded-none bg-[#07080B]">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[60px_1.5fr_1fr_2fr_2fr_1fr] gap-4 p-3 rounded-lg bg-[#0f1015]/50 items-center pl-2 pr-6 border border-white/5">
                <Skeleton className="h-6 w-10 bg-gray-600/30 mx-auto" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full bg-gray-600/30" />
                  <Skeleton className="h-4 w-32 bg-gray-600/30" />
                </div>
                <Skeleton className="h-4 w-16 bg-gray-600/30" />
                <Skeleton className="h-4 w-32 bg-gray-600/30 pl-4" />
                <Skeleton className="h-4 w-32 bg-gray-600/30 pl-4" />
                <Skeleton className="h-3 w-20 bg-gray-600/30 ml-auto" />
              </div>
            ))}
          </div>
        ) : usersList.length === 0 ? (
          <p className="text-gray-400 text-sm">No user data available for the selected time period.</p>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="min-w-full">
              {/* Table Header */}
              <div className="grid grid-cols-[60px_1.5fr_1fr_2fr_2fr_1fr] gap-4 pb-3 mb-3 border-b border-white/10 sticky top-0 bg-[#07080B] z-10 pl-2 pr-6">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">#</div>
                <button 
                  onClick={() => handleSort('username')}
                  className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-left hover:text-gray-300 transition-colors flex items-center gap-1 group"
                >
                  Username
                  {sortField === 'username' ? (
                    sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                  ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                  )}
                </button>
                <button 
                  onClick={() => handleSort('activityScore')}
                  className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-left hover:text-gray-300 transition-colors flex items-center gap-1 group"
                >
                  Activity
                  {sortField === 'activityScore' ? (
                    sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                  ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                  )}
                </button>
                <button 
                  onClick={() => handleSort('weightedWagered')}
                  className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-left hover:text-gray-300 transition-colors flex items-center gap-1 pl-4 group"
                >
                  Weighted
                  {sortField === 'weightedWagered' ? (
                    sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                  ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                  )}
                </button>
                <button 
                  onClick={() => handleSort('wagered')}
                  className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-left hover:text-gray-300 transition-colors flex items-center gap-1 pl-4 group"
                >
                  Wagered
                  {sortField === 'wagered' ? (
                    sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                  ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                  )}
                </button>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Last Seen</div>
              </div>

              {/* Table Body */}
              <div className="space-y-2">
                {getSortedUsersList(usersList).map((user, index) => (
                  <div
                    key={user.uid}
                    className="grid grid-cols-[60px_1.5fr_1fr_2fr_2fr_1fr] gap-4 p-3 rounded-lg bg-[#0f1015]/50 hover:bg-[#14151a]/70 transition-colors items-center pl-2 pr-6 border border-white/5"
                  >
                    {/* Rank */}
                    <div className="flex justify-center">
                      <span className="text-gray-400 font-medium text-sm">#{index + 1}</span>
                    </div>

                    {/* Avatar + Username */}
                    <div className="min-w-0 flex items-center gap-3">
                      <img
                        src={getAvatarUrl(user.uid)}
                        alt={user.username}
                        className="h-10 w-10 rounded-full ring-2 p-0.5 ring-white/10 flex-shrink-0"
                      />
                      <h3 className="text-white font-medium truncate flex items-center gap-2">
                        {getServiceIcon(user.service) && (
                          <img
                            src={getServiceIcon(user.service)}
                            alt={user.service}
                            className="h-4 w-4 inline-block flex-shrink-0"
                          />
                        )}
                        <span className="truncate">{user.username}</span>
                      </h3>
                    </div>

                    {/* Activity Score */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 rounded-full bg-white border border-white/20 px-2.5 py-1">
                        <div className={`w-2 h-2 rounded-full ${getActivityDotStyle(user.activityScore || 0)}`}></div>
                        <span className="text-white font-medium text-sm">
                          {user.activityScore || 0}
                        </span>
                      </div>
                      {user.totalDaysActive && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-xs text-gray-400 cursor-help">
                              ({user.totalDaysActive}d)
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-[#1D1C21] border-white/20 text-gray-200 shadow-xl">
                            <p className="text-xs font-medium">Days Active (30d)</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>

                    {/* Weighted Wagered */}
                    <div className="flex items-center gap-2 pl-4">
                      <span className="text-white font-medium whitespace-nowrap">
                        ${formatDollarAmount(user.weightedWagered).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      {user.todayWeightedWagered > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-xs font-semibold text-green-600 bg-green-500/20 px-2 py-0.5 rounded-full border border-green-500/30 whitespace-nowrap flex-shrink-0 cursor-help">
                              +${formatDollarAmount(user.todayWeightedWagered).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-[#1D1C21] border-white/20 text-gray-200 shadow-xl">
                            <p className="text-xs font-medium">Weighted Today</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>

                    {/* Wagered */}
                    <div className="flex items-center gap-2 pl-4">
                      <span className="text-white font-medium whitespace-nowrap">
                        ${formatDollarAmount(user.wagered).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      {user.todayWagered > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-xs font-semibold text-green-600 bg-green-500/20 px-2 py-0.5 rounded-full border border-green-500/30 whitespace-nowrap flex-shrink-0 cursor-help">
                              +${formatDollarAmount(user.todayWagered).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-[#1D1C21] border-white/20 text-gray-200 shadow-xl">
                            <p className="text-xs font-medium">Wagered Today</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>

                    {/* Last Seen */}
                    <div className="text-right">
                      <span className="text-gray-400 text-sm">{formatLastSeen(user.lastSeen)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        )}
      </TextureCardContent>
    </DarkTextureCard>
  );
};
