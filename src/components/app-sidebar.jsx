"use client";

import * as React from "react";
import Link from "next/link";
import { getAppwriteFileUrl } from "@/lib/utils";
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Folder,
  Forward,
  Frame,
  GalleryVerticalEnd,
  Globe,
  Home,
  Map,
  MoreHorizontal,
  PieChart,
  Settings2,
  SquareTerminal,
  Trash2,
  Trophy,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Overview",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "Leaderboards",
      url: "/dashboard/leaderboards",
      icon: Trophy,
    },
    {
      title: "Connected Sites",
      url: "/dashboard/connected-sites",
      icon: Globe,
    },
  ],
};

export function AppSidebar({ user, websites = [], ...props }) {
  const { isMobile } = useSidebar();

  // Get the first website or use default
  const activeWebsite = websites.length > 0 ? websites[0] : null;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-lg bg-white/10">
                
                  <img
                    src={"/icon.svg"}
                    alt={activeWebsite.name}
                    className="h-full w-full object-cover"
                  />
                
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  trackwage.rs
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user?.name,
            email: user?.email,
            avatar: "/avatars/shadcn.jpg",
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
