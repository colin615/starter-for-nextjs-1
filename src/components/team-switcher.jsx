"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronsUpDown, Plus } from "lucide-react";
import { getAppwriteFileUrl } from "@/lib/utils";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

// Helper function to get initials from name
function getInitials(name) {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);
}

export function TeamSwitcher({ teams }) {
  const { isMobile } = useSidebar();
  const [activeTeam, setActiveTeam] = React.useState(teams[0]);
  const [imageErrors, setImageErrors] = React.useState(new Set());

  // Update activeTeam when teams prop changes
  React.useEffect(() => {
    if (
      teams.length > 0 &&
      (!activeTeam || !teams.find((t) => t.id === activeTeam.id))
    ) {
      setActiveTeam(teams[0]);
    }
  }, [teams, activeTeam]);

  // Clear image errors when teams change
  React.useEffect(() => {
    setImageErrors(new Set());
  }, [teams]);

  if (!activeTeam) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div
                className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-lg text-sm font-semibold text-white"
                style={{
                  backgroundColor:
                    activeTeam.iconFileId &&
                    !imageErrors.has(activeTeam.iconFileId)
                      ? "transparent"
                      : activeTeam.accentColor || "#3B82F6",
                }}
              >
                {activeTeam.iconFileId &&
                !imageErrors.has(activeTeam.iconFileId) ? (
                  <img
                    key={activeTeam.iconFileId}
                    src={getAppwriteFileUrl(activeTeam.iconFileId)}
                    alt={activeTeam.name}
                    className="h-full w-full object-cover"
                    onLoad={(e) => {
                      // Ensure image is visible when it loads successfully
                      e.target.style.display = "block";
                      e.target.parentElement.style.backgroundColor =
                        "transparent";
                      // Remove from error set if it was there
                      setImageErrors((prev) => {
                        const newSet = new Set(prev);
                        newSet.delete(activeTeam.iconFileId);
                        return newSet;
                      });
                    }}
                    onError={(e) => {
                      console.warn(
                        `Failed to load image for ${activeTeam.name}:`,
                        getAppwriteFileUrl(activeTeam.iconFileId),
                      );
                      setImageErrors((prev) =>
                        new Set(prev).add(activeTeam.iconFileId),
                      );
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "block";
                      e.target.parentElement.style.backgroundColor =
                        activeTeam.accentColor || "#3B82F6";
                    }}
                  />
                ) : null}
                <span
                  style={{
                    display:
                      activeTeam.iconFileId &&
                      !imageErrors.has(activeTeam.iconFileId)
                        ? "none"
                        : "block",
                  }}
                >
                  {getInitials(activeTeam.name)}
                </span>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeTeam.name}</span>
                <span className="truncate text-xs">{activeTeam.plan}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Projects
            </DropdownMenuLabel>
            {teams.map((team, index) => (
              <DropdownMenuItem
                key={team.id || team.name}
                onClick={() => setActiveTeam(team)}
                className="gap-2 p-2"
              >
                <div
                  className="flex aspect-square size-6 items-center justify-center overflow-hidden rounded-md text-xs font-semibold text-white"
                  style={{
                    backgroundColor:
                      team.iconFileId && !imageErrors.has(team.iconFileId)
                        ? "transparent"
                        : team.accentColor || "#3B82F6",
                  }}
                >
                  {team.iconFileId && !imageErrors.has(team.iconFileId) ? (
                    <img
                      key={team.iconFileId}
                      src={getAppwriteFileUrl(team.iconFileId)}
                      alt={team.name}
                      className="h-full w-full object-cover"
                      onLoad={(e) => {
                        // Ensure image is visible when it loads successfully
                        e.target.style.display = "block";
                        e.target.parentElement.style.backgroundColor =
                          "transparent";
                        // Remove from error set if it was there
                        setImageErrors((prev) => {
                          const newSet = new Set(prev);
                          newSet.delete(team.iconFileId);
                          return newSet;
                        });
                      }}
                      onError={(e) => {
                        console.warn(
                          `Failed to load image for ${team.name}:`,
                          getAppwriteFileUrl(team.iconFileId),
                        );
                        setImageErrors((prev) =>
                          new Set(prev).add(team.iconFileId),
                        );
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "block";
                        e.target.parentElement.style.backgroundColor =
                          team.accentColor || "#3B82F6";
                      }}
                    />
                  ) : null}
                  <span
                    style={{
                      display:
                        team.iconFileId && !imageErrors.has(team.iconFileId)
                          ? "none"
                          : "block",
                    }}
                  >
                    {getInitials(team.name)}
                  </span>
                </div>
                {team.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2" asChild>
              <Link href="/add-website">
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <Plus className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium">
                  Add Project
                </div>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
