"use client";

import * as React from "react";
import Link from "next/link";
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
import { TeamSwitcher } from "@/components/team-switcher";
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

  // Transform websites data to match the expected format
  const teams =
    websites.length > 0
      ? websites.map((website, index) => ({
          id: website.$id,
          name: website.name,
          logo: null, // We'll handle this in the component
          plan: website.description || "Website",
          accentColor: website.accentColor,
          iconFileId: website.iconFileId,
          logoFileURL: website.logoFileURL,
        }))
      : data.teams; // Fallback to sample data if no websites

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
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
