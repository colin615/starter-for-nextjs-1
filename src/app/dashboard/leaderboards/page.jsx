"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { PlusIcon, Pencil, Eye } from "lucide-react";
import Countdown from "react-countdown";
import { motion, AnimatePresence, cubicBezier } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getDiceBearAvatarUrl } from "@/utils/avatarUtils";
import { formatDollarAmount } from "@/utils/dashboardUtils";

const casinoStyles = {
  roobet: {
    title: "Roobet",
    accentColor: "#4C3715",
    iconClass: "scale-125",
  },
  shuffle: {
    title: "Shuffle",
    accentColor: "#7A32FB",
    iconClass: " !fill-white",
  },
  rainbet: {
    title: "Rainbet",
    accentColor: "#191F3B",
    iconClass: " !fill-white",
  },
  gamdom: {
    title: "Gamdom",
    accentColor: "#0F3824",
    iconClass: " !fill-white",
  },
  rain: {
    title: "Rain",
    accentColor: "#191F3B",
    iconClass: " !fill-white",
  },
  rustclash: {
    title: "Rustclash",
    accentColor: "#111926",
    iconClass: " !fill-white",
  },
  stake: {
    title: "Stake",
    accentColor: "#111926",
    iconClass: " !fill-white",
  },
};

const AnimatedDigit = ({ value }) => {
  return (
    <div className="relative w-3 h-4 overflow-hidden">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={value}
          initial={{ y: "100%" }}
          animate={{ y: "0%" }}
          exit={{ y: "-100%" }}
          transition={{ duration: 0.3, ease: cubicBezier(0.2, 1, 0.24, 1) }}
          className="absolute inset-0 flex items-center justify-center text-[12.5px] font-bold tabular-nums bg-gradient-to-b text-transparent bg-clip-text from-[#eaeaea] to-[#dcdcdc]"
        >
          {value}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const TimeUnit = ({ value, label }) => {
  const digits = value.toString().padStart(2, "0").split("");

  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-0 ">
        <AnimatedDigit value={parseInt(digits[0])} />
        <AnimatedDigit value={parseInt(digits[1])} />
      </div>
      {label && (
        <span className="mt-0.5 text-[10px] uppercase opacity-40 font-[400]">
          {label}
        </span>
      )}
    </div>
  );
};

const CompactCountdown = ({ date }) => {
  if (!date) return null;

  const endDate = new Date(date);
  const now = new Date();

  if (endDate <= now) {
    return (
      <span className="text-[14px] text-muted-foreground opacity-60">
        Ended
      </span>
    );
  }

  const renderer = ({ days, hours, minutes, seconds, completed }) => {
    if (completed) {
      return (
        <span className="text-[14px] text-muted-foreground opacity-60">
          Ended
        </span>
      );
    }

    return (
      <div className="flex items-center gap-3.5">
        {days > 0 && <TimeUnit value={days} label="DAYS" />}
        <TimeUnit value={hours} label="HRS" />
        <TimeUnit value={minutes} label="MIN" />
        {days === 0 && <TimeUnit value={seconds} label="SEC" />}
      </div>
    );
  };

  return <Countdown date={endDate} renderer={renderer} />;
};

// Helper function to determine leaderboard status with colors
const getLeaderboardStatus = (leaderboard) => {
  const now = new Date();
  const startDate = leaderboard.startDate || leaderboard.start_date;
  const endDate = leaderboard.endDate || leaderboard.end_date;
  const isPaused = leaderboard.paused || leaderboard.is_paused || false;

  if (isPaused) {
    return { 
      status: "paused", 
      label: "Paused", 
      color: "#8B8B8B" // Gray
    };
  }

  if (endDate) {
    const end = new Date(endDate);
    if (end < now) {
      return { 
        status: "ended", 
        label: "Ended", 
        color: "#EF4444" // Red
      };
    }
  }

  if (startDate) {
    const start = new Date(startDate);
    if (start > now) {
      return { 
        status: "scheduled", 
        label: "Scheduled", 
        color: "#3B82F6" // Blue
      };
    }
  }

  return { 
    status: "active", 
    label: "Active", 
    color: "#10B981" // Green
  };
};

// Status Chip Component with colored text and low opacity background
const StatusChip = ({ status, label, color }) => {
  // Convert hex color to rgba with low opacity
  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <span
      className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-sm"
      style={{
        color: color,
        backgroundColor: hexToRgba(color, 0.15), // 15% opacity
      }}
    >
      {label}
    </span>
  );
};

// Generate placeholder players for demonstration
const generatePlaceholderPlayers = (count = 43, seed = '') => {
  // Simple hash function for deterministic randomness
  const hash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  };

  return Array.from({ length: count }, (_, i) => {
    const playerSeed = `${seed}-player-${i + 1}`;
    const playerHash = hash(playerSeed);
    // Generate wagered amount between $100 and $99999.99
    const wagered = ((playerHash % 9990000) + 10000) / 100;
    return {
      id: `player-${i + 1}`,
      name: `Player ${i + 1}`,
      avatar: getDiceBearAvatarUrl(playerSeed),
      wagered: wagered,
    };
  });
};

// Player Avatars Stack Component
const PlayerAvatarsStack = ({ players, totalCount }) => {
  const topPlayers = players.slice(0, 3);
  const remainingCount = Math.max(0, totalCount - 3);

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {topPlayers.map((player, index) => (
          <Tooltip key={player.id}>
            <TooltipTrigger asChild>
              <Avatar className="size-8 border-2 border-[#16181D] cursor-pointer hover:z-10 transition-all">
                <AvatarImage src={player.avatar} alt={player.name} />
                <AvatarFallback className="bg-muted text-xs">
                  {player.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent className="bg-[#1D1C21] border-white/20 text-gray-200">
              <div className="space-y-1">
                <p className="font-medium">{player.name}</p>
                <p className="text-xs text-gray-400">
                  Wagered: ${formatDollarAmount(player.wagered).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      {remainingCount > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-center size-8 rounded-full bg-muted border-2 border-[#16181D] text-xs font-medium text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors">
              +{remainingCount}
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-[#1D1C21] border-white/20 text-gray-200">
            <p>{remainingCount} more players</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};

export default function Page() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [leaderboards, setLeaderboards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!loading && user && !hasFetched.current) {
      hasFetched.current = true;
      fetchLeaderboards();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  const fetchLeaderboards = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/leaderboards");
      const data = await response.json();
      if (data.success) {
        setLeaderboards(data.leaderboards || []);
        console.log(data.leaderboards);
      }
    } catch (error) {
      console.error("Error fetching leaderboards:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate placeholder players for each leaderboard (memoized to prevent regeneration on every render)
  const leaderboardsWithPlayers = useMemo(() => {
    return leaderboards.map((leaderboard) => {
      // Use leaderboard ID as seed for consistent player count per leaderboard
      const seed = leaderboard.id || leaderboard.title || 'default';
      const seedValue = seed.toString().split('').reduce((a, b) => a + (b.charCodeAt(0) || 0), 0);
      const playerCount = Math.floor((seedValue % 50) + 5); // Consistent between 5-54 players
      return {
        ...leaderboard,
        players: generatePlaceholderPlayers(playerCount, seed),
        playerCount,
      };
    });
  }, [leaderboards]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Leaderboards</h1>
        <Button
          variant="popout"
          onClick={() => router.push("/dashboard/leaderboards/create")}
          className="!bg-gradient-to-b from-[#8BFF4D] to-[#5AB22B] !text-black"
        >
          <PlusIcon className="size-4" />
          Create Leaderboard
        </Button>
      </div>
      
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-muted-foreground">Loading leaderboards...</p>
          </div>
        ) : leaderboards.length === 0 ? (
          <p className="text-muted-foreground">No leaderboards found. Create your first one!</p>
        ) : (
          <div className="rounded-sm border border-white/5 bg-[#16181D] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#101114] border-b border-white/5">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Name
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Time Left
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Players
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Created At
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {leaderboardsWithPlayers.map((leaderboard) => {
                    const casinoId = leaderboard.casino_id || leaderboard.casinoId;
                    const casinoStyle = casinoStyles[casinoId] || {
                      title: casinoId,
                      accentColor: "#111926",
                      iconClass: " !fill-white",
                    };
                    const iconClass = casinoStyle.iconClass || "";
                    const statusInfo = getLeaderboardStatus(leaderboard);
                    const endDate = leaderboard.endDate || leaderboard.end_date;
                    const createdDate = leaderboard.created_at || leaderboard.createdAt;
                    const formattedDate = createdDate 
                      ? new Date(createdDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })
                      : 'N/A';

                    return (
                      <tr
                        key={leaderboard.id}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div 
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={() => router.push(`/dashboard/leaderboards/${leaderboard.id}`)}
                          >
                            <div
                              className="flex border border-white/5 size-8 items-center justify-center rounded-sm p-1.5 flex-shrink-0"
                              style={{
                                background: casinoStyle.accentColor,
                              }}
                            >
                              <img
                                className={`${iconClass} size-4`}
                                src={`/casinos/${casinoId}.svg`}
                                alt={casinoStyle.title}
                              />
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-white font-medium truncate max-w-[200px]">
                                {leaderboard.title}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Wager Race
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <StatusChip
                            status={statusInfo.status}
                            label={statusInfo.label}
                            color={statusInfo.color}
                          />
                        </td>
                        <td className="py-4 px-4">
                          <CompactCountdown date={endDate} />
                        </td>
                        <td className="py-4 px-4">
                          <PlayerAvatarsStack
                            players={leaderboard.players}
                            totalCount={leaderboard.playerCount}
                          />
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-muted-foreground">
                            {formattedDate}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="size-8 border-white/5"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dashboard/leaderboards/${leaderboard.id}`);
                              }}
                              title="View leaderboard"
                            >
                              <Eye className="size-4" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="size-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dashboard/leaderboards/edit/${leaderboard.id}`);
                              }}
                              title="Edit leaderboard"
                            >
                              <Pencil className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
