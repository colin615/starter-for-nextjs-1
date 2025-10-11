"use client";

import Link from "next/link";
import { Globe } from "lucide-react";
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
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

// Navigation data
const navData = {
  navMain: [
    {
      title: "Overview",
      url: "/dashboard",
      icon: <RiPulseFill/>,
    },
    {
      title: "Leaderboards",
      url: "/dashboard/leaderboards",
      icon: <Icon className="mr-0.5" icon="heroicons:trophy-solid" width="16" height="16" />,
    },
    {
      title: "Connected Sites",
      url: "/dashboard/connected-sites",
      icon: <Globe/>,
    },
  ],
};

export function AppSidebar({ user, websites = [], ...props }) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="px-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/dashboard">
              <SidebarMenuButton
                size="lg"
                className="cursor-pointer !bg-transparent data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <img
                  src="/halloween.png"
                  alt="Logo"
                  className="h-8"
                />
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-1.5">
        <NavMain items={navData.navMain} />
      </SidebarContent>
      <SidebarFooter className="px-2">
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
