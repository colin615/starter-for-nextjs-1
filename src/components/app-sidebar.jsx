"use client";

import Link from "next/link";
import { Globe, Trophy, Users, Settings, BookOpen, MessageCircle, LogOut, Plus } from "lucide-react";
import { RiPulseFill } from "react-icons/ri";
import { Icon } from "@iconify-icon/react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NavMain } from "./nav-main";

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
      icon: <Icon className="mr-0.5" icon="heroicons:trophy-solid" width="16" height="16" />,
      shortcut: "L",
    },
    {
      title: "Connected Sites",
      url: "/dashboard/connected-sites",
      icon: <Globe className="h-4 w-4" />,
      shortcut: "C",
    },
  ],
};

export function AppSidebar({ user, websites = [], ...props }) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="px-3 py-4 border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">W</span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">WagerDash</span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Globe className="h-3 w-3" />
                  <span>wagerdash.com</span>
                </div>
              </div>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent className="px-2 py-4 space-y-6">
        {/* Time Display */}
        <div className="px-3">
          <div className="text-xs text-muted-foreground mb-1">TIME</div>
          <div className="text-sm font-medium">
            {new Date().toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
            })}
          </div>
        </div>

        {/* Main Navigation */}
        <NavMain items={navData.navMain} />

        {/* Call to Action */}
        <div className="px-3">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <div className="text-sm font-medium mb-2">First, connect your site.</div>
            <Button size="sm" className="w-full bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Connect Site
            </Button>
          </div>
        </div>
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
              <Link href="/chat" className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
                <MessageCircle className="h-4 w-4" />
                Live chat
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
      <SidebarRail />
    </Sidebar>
  );
}
