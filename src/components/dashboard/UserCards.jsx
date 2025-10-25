"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { getAvatarUrl, formatDollarAmount, formatLastSeen } from "@/utils/dashboardUtils";
import { Activity, DollarSign, Clock } from "lucide-react";

// Generate placeholder users with activity scores
const generatePlaceholderUsers = (count = 10) => {
  const usernames = [
    "GamingPro123", "LuckyPlayer", "HighRoller", "CasinoKing", "BetMaster",
    "JackpotHunter", "SlotsFan", "PokerAce", "DiceRoller", "WagerWizard",
    "CardShark", "RouletteRider", "BlackjackBoss", "SpinKing", "ChipCollector"
  ];
  
  const casinos = ["stake", "roobet", "shuffle", "gamdom", "rustclash", "rain"];
  
  return Array.from({ length: count }, (_, i) => ({
    uid: `user-${i}`,
    username: usernames[i] || `Player${i + 1}`,
    wagered: Math.random() * 50000 + 1000,
    weightedWagered: Math.random() * 40000 + 800,
    lastSeen: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    activityScore: Math.floor(Math.random() * 100),
    service: casinos[i % casinos.length],
  }));
};

// Get badge color based on activity score
const getActivityBadgeVariant = (score) => {
  if (score >= 70) return "success";
  if (score >= 40) return "warning";
  return "destructive";
};

// Get badge color classes based on activity score
const getActivityBadgeClasses = (score) => {
  if (score >= 70) {
    return "bg-green-500/10 text-green-600 border-green-500/30 hover:bg-green-500/20";
  }
  if (score >= 40) {
    return "bg-yellow-500/10 text-yellow-600 border-yellow-500/30 hover:bg-yellow-500/20";
  }
  return "bg-red-500/10 text-red-600 border-red-500/30 hover:bg-red-500/20";
};

export const UserCards = ({ usersList, isLoading, selectedCasinos = [] }) => {
  // Use real data if available, otherwise use placeholder data
  const allUsers = usersList && usersList.length > 0 
    ? usersList // Use real data with actual activity scores
    : generatePlaceholderUsers(12);

  // Filter users based on selected casinos
  const users = selectedCasinos.length > 0 
    ? allUsers.filter(user => selectedCasinos.includes(user.service))
    : allUsers;

  return (
    <Card className="col-span-full">
      <CardContent className="p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Active Users</h3>
              <p className="text-sm text-muted-foreground">
                {selectedCasinos.length > 0 
                  ? `${users.length} of ${allUsers.length} users (filtered by ${selectedCasinos.length} casino${selectedCasinos.length > 1 ? 's' : ''})`
                  : "Recent user activity and performance metrics"
                }
              </p>
            </div>
            {selectedCasinos.length > 0 && (
              <div className="flex gap-2">
                {selectedCasinos.map(casino => (
                  <img
                    key={casino}
                    src={`/casinos/${casino}.svg`}
                    alt={casino}
                    className="h-6 w-6 rounded"
                    title={casino}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {users.map((user) => (
                <Card 
                  key={user.uid || user.username} 
                  className="group transition-all duration-200"
                >
                  <CardContent className="p-4 relative">
                    {/* Casino Logo - Top Right */}
                    {user.service && (
                      <img
                        src={`/casinos/${user.service}.svg`}
                        alt={user.service}
                        className="absolute top-3 right-3 h-6 w-6 grayscale opacity-30"
                      />
                    )}

                    {/* User Avatar and Info */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="relative h-12 w-12 p-[1px] rounded-full overflow-hidden">
                        {/* Blurred Background */}
                        <img 
                          className="absolute object-cover inset-0 scale-[2] blur-xl opacity-80"
                          src={getAvatarUrl(user.uid || user.username)}
                        />
                        {/* Avatar */}
                        <img
                          src={getAvatarUrl(user.uid || user.username)}
                          alt={user.username}
                          className="relative h-12 w-12 rounded-full ring-2 ring-white/10 z-10"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-medium truncate text-sm">{user.username}</h4>
                          {/* Online Status - Next to Username */}
                          <div className="h-2 w-2 bg-green-500 rounded-full flex-shrink-0" />
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Badge 
                            variant="outline" 
                            className={`text-xs font-semibold ${getActivityBadgeClasses(user.activityScore || 0)}`}
                          >
                            <Activity className="h-3 w-3 mr-1" />
                            {user.activityScore || 0}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="space-y-2 pt-2 border-t border-border/50">
                      {/* Wagered */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          Wagered
                        </span>
                        <span className="font-medium">
                          ${formatDollarAmount(user.totalWagered || user.wagered || 0).toLocaleString(undefined, { 
                            minimumFractionDigits: 0, 
                            maximumFractionDigits: 0 
                          })}
                        </span>
                      </div>

                      {/* Weighted */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          Weighted
                        </span>
                        <span className="font-medium text-primary">
                          ${formatDollarAmount(user.weightedWagered || 0).toLocaleString(undefined, { 
                            minimumFractionDigits: 0, 
                            maximumFractionDigits: 0 
                          })}
                        </span>
                      </div>

                      {/* Last Seen */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last seen
                        </span>
                        <span className="font-medium text-muted-foreground">
                          {formatLastSeen(user.lastSeen)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

