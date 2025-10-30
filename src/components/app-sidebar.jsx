"use client";

import Link from "next/link";
import { Globe, Trophy, Users, Settings, BookOpen, LogOut, Plus } from "lucide-react";
import { RiPulseFill } from "react-icons/ri";
import { Icon } from "@iconify-icon/react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NavMain } from "./nav-main";
import LogoText from "@/components/svgs/logo-text";

// Navigation data
const navData = {
  navMain: [
    {
      title: "Overview",
      url: "/dashboard",
      icon: <RiPulseFill className="h-4 w-4" />,
      shortcut: "O",
    },
    {
      title: "Leaderboards",
      url: "/dashboard/leaderboards",
      icon: <Icon className="mr-0.5 pt-1" icon="fa-solid:crown" width="16" height="16" />,
      shortcut: "L",
    },
    {
      title: "Slot Challenges",
      url: "/dashboard/slot-challenges",
      icon: <Icon className="mr-0.5 pt-1.5" icon="streamline:target-solid" width="16" height="16" />,
      shortcut: "S",
    },
    {
      title: "Widgets",
      url: "/dashboard/widgets",
      icon: <Icon className="mr-0.5 pt-1.5" icon="ri:window-2-line" width="16" height="16" />,
      shortcut: "W",
    },
    {
      title: "Payouts",
      url: "/dashboard/payouts",
      icon: <Icon className="mr-0.5 pt-1" icon="fa7-solid:money-check-dollar" width="16" height="16" />,
      shortcut: "P",
    },
    {
      title: "Connections",
      url: "/dashboard/connected-sites",
      icon: <Icon className="mr-0.5 pt-1.5" icon="fa-solid:plug" width="16" height="16" />,
      shortcut: "C",
    },
  ],
};

export function AppSidebar({ user, websites = [], ...props }) {
  const [currentTime, setCurrentTime] = useState('');
  const [userTimezone, setUserTimezone] = useState(null);
  const [isKickConnected, setIsKickConnected] = useState(false);
  const [isCheckingKick, setIsCheckingKick] = useState(true);

  // Check if Kick is connected
  useEffect(() => {
    const checkKickConnection = async () => {
      try {
        const response = await fetch('/api/auth/kick/status');
        const data = await response.json();
        setIsKickConnected(data.connected || false);
      } catch (error) {
        console.error('Error checking Kick connection:', error);
        setIsKickConnected(false);
      } finally {
        setIsCheckingKick(false);
      }
    };

    checkKickConnection();
  }, []);

  // Get user's timezone from server
  useEffect(() => {
    const fetchTimezone = async () => {
      try {
        const response = await fetch('/api/user/timezone');
        const data = await response.json();
        if (data.success && data.timezone) {
          setUserTimezone(data.timezone);
        }
      } catch (error) {
        console.error('Error fetching timezone:', error);
      }
    };

    fetchTimezone();
  }, []);

  // Update time every second
  useEffect(() => {
    const updateTime = () => {
      const options = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      };
      
      if (userTimezone) {
        options.timeZone = userTimezone;
      }
      
      const timeString = new Date().toLocaleTimeString('en-US', options);
      setCurrentTime(timeString);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [userTimezone]);

  return (
    <Sidebar {...props}>
      <SidebarHeader className="px-3 pt-3 overflow-hidden border-b border-sidebar-border relative group/sidebar">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/dashboard" className="flex items-center px-2 py-1 justify-start">
              <LogoText  />
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
        <img className="absolute h-20 right-2 -rotate-[20deg] grayscale opacity-[0.04]  transition-all duration-300 -bottom-10" src="/dash2.svg"/>
      </SidebarHeader>
      
      <SidebarContent className="px-2 py-4">
        {/* Time Display - Horizontal Layout */}
        <div className="px-2 pb-3 flex items-center justify-between border-b border-sidebar-border">
          <div className="text-xs text-muted-foreground">Dashboard Time</div>
          <div className="text-xs font-medium bg-[#3E4048] rounded  px-2 py-0.5">
            {currentTime}
          </div>
        </div>

        {/* Main Navigation */}
        <NavMain items={navData.navMain} />

        {/* Kick Connection Notice - Only show if not connected */}
        {!isCheckingKick && !isKickConnected && (
          <div className="w-[calc(100%-2rem)] group/connect relative p-4 py-3 mt-auto mb-1 ml-4 rounded-sm border border-white/5 bg-[#3e404770]">
            <span className="text-xs text-muted-foreground">Link your KICK account for additional features!</span>
            <Button 
              variant="accent" 
              className="cursor-pointer text-xs h-6 w-full font-semibold mt-2"
              onClick={() => window.location.href = '/api/auth/kick/authorize'}
            >
              Connect <img src="/rect3.png" className="h-2.5 fill-black"  />
            </Button>
            <img className="absolute h-14 rotate-[5deg] -right-5.5 group-hover/connect:rotate-[10deg] transition-all duration-300 bottom-10" src="/dash1.svg"/>
          </div>
        )}
      </SidebarContent>
      
      <SidebarFooter className="px-2 py-4 border-t border-sidebar-border">
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground mb-2 px-3">Installation</div>
          <SidebarMenu className="space-y-1">
            <SidebarMenuItem>
              <Link href="/docs" className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
                <BookOpen className="h-4 w-4" />
                Docs
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/logout" className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4" />
                Sign out
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
