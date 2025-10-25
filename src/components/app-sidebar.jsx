"use client";

import Link from "next/link";
import { Globe, Trophy, Users, Settings, BookOpen, MessageCircle, LogOut, Plus } from "lucide-react";
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
import { openCrispChat } from "@/components/CrispChat";
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
      title: "Connected Sites",
      url: "/dashboard/connected-sites",
      icon: <Icon className="mr-0.5 pt-1.5" icon="fa-solid:plug" width="16" height="16" />,
      shortcut: "C",
    },
  ],
};

export function AppSidebar({ user, websites = [], ...props }) {
  const [currentTime, setCurrentTime] = useState('');
  const [userTimezone, setUserTimezone] = useState(null);

  // Get user's timezone from Appwrite preferences
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
      <SidebarHeader className="px-3 pt-3 border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/dashboard" className="flex items-center px-2 py-1 justify-start">
              <LogoText  />
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
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
              <button 
                onClick={openCrispChat}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <MessageCircle className="h-4 w-4" />
                Live chat
              </button>
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
