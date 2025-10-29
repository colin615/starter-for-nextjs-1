"use client";

import { ServiceCard, ServiceCardSkeleton } from "@/components/connected-sites/ServiceCard";
import { ConnectDrawer } from "@/components/connected-sites/ConnectDrawer";
import { KickDrawer } from "@/components/connected-sites/KickDrawer";
import { useConnectedSites } from "@/hooks/useConnectedSites";
import { Button } from "@/components/ui/button";
import { FaTelegramPlane } from "react-icons/fa";
import { FaCheck } from "react-icons/fa6";
import { SiKick, SiDiscord } from "react-icons/si";
import { useState, useEffect, useCallback } from "react";
import { showToast } from "@/components/ui/toast";

export default function Page() {
  const {
    sites,
    selectedSite,
    formData,
    setFormData,
    isLoading,
    isSitesLoading,
    error,
    isDrawerOpen,
    setIsDrawerOpen,
    isDeleting,
    hasTimezone,
    siteStyles,
    isServiceConnected,
    handleCardClick,
    handleDelete,
    handleSubmit
  } = useConnectedSites();

  const [isKickConnected, setIsKickConnected] = useState(false);
  const [isCheckingKick, setIsCheckingKick] = useState(true);
  const [kickUserProfile, setKickUserProfile] = useState(null);
  const [isKickDrawerOpen, setIsKickDrawerOpen] = useState(false);
  const [isKickLoading, setIsKickLoading] = useState(false);
  const [isKickDeleting, setIsKickDeleting] = useState(false);
  const [kickError, setKickError] = useState("");

  useEffect(() => {
    // Check Kick connection status
    const checkKickStatus = () => {
      fetch("/api/auth/kick/status")
        .then((res) => res.json())
        .then((data) => {
          setIsKickConnected(data.connected || false);
          setKickUserProfile(data.user || null);
        })
        .catch((err) => {
          console.error("Failed to check Kick connection:", err);
          setIsKickConnected(false);
          setKickUserProfile(null);
        })
        .finally(() => setIsCheckingKick(false));
    };

    checkKickStatus();

    // Refresh status if returning from OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'kick_connected') {
      // Clear the URL parameter
      window.history.replaceState({}, '', window.location.pathname);
      // Refresh the status
      setTimeout(checkKickStatus, 500);
    }
  }, []);

  const handleKickCardClick = (e) => {
    e.stopPropagation();
    if (hasTimezone !== false) {
      setIsKickDrawerOpen(true);
      setKickError("");
    }
  };

  const handleKickConnect = () => {
    setIsKickLoading(true);
    setKickError("");
    window.location.href = '/api/auth/kick/authorize';
  };

  const handleKickReconnect = () => {
    setIsKickLoading(true);
    setKickError("");
    window.location.href = '/api/auth/kick/authorize';
  };

  const handleKickDelete = async () => {
    setIsKickDeleting(true);
    setKickError("");

    try {
      const response = await fetch("/api/auth/kick/unlink", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to unlink Kick connection");
      }

      showToast({
        title: "Kick Disconnected",
        description: "Your Kick account has been disconnected successfully.",
        variant: "success",
      });

      setIsKickConnected(false);
      setKickUserProfile(null);
      setIsKickDrawerOpen(false);
    } catch (err) {
      setKickError(err.message);
      showToast({
        title: "Error",
        description: err.message,
        variant: "error",
      });
    } finally {
      setIsKickDeleting(false);
    }
  };

  const handleKickRefreshProfile = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/kick/status");
      if (response.ok) {
        const data = await response.json();
        setKickUserProfile(data.user || null);
      }
    } catch (err) {
      console.error("Failed to refresh Kick profile:", err);
    }
  }, []);

  const handleTelegramConnect = (e) => {
    e.stopPropagation();
    // TODO: Implement Telegram OAuth when ready
    alert('Telegram integration coming soon!');
  };

  const handleDiscordConnect = (e) => {
    e.stopPropagation();
    // TODO: Implement Discord OAuth when ready
    alert('Discord integration coming soon!');
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {hasTimezone === false && (
        <div className="mb-4 rounded-lg border border-[#84F549]/30 bg-[#84F549]/10 p-4 text-[#5a9e34] dark:border-[#84F549]/50 dark:bg-[#84F549]/10 dark:text-[#a8ff6f]">
          <p className="text-sm">
            <strong>Timezone Required:</strong> Please set your timezone in your{" "}
            <a href="/dashboard/account" className="underline hover:no-underline">
              account settings
            </a>{" "}
            before connecting services.
          </p>
        </div>
      )}
      
      {/* Connected Sites Section */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">Connected Sites</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isSitesLoading
            ? Object.keys(siteStyles).map((siteId) => (
                <ServiceCardSkeleton key={`skeleton-${siteId}`} />
              ))
            : sites.map((site) => (
                <ServiceCard
                  key={site.id}
                  site={site}
                  isConnected={isServiceConnected(site.id)}
                  hasTimezone={hasTimezone}
                  onCardClick={handleCardClick}
                />
              ))
          }
        </div>
      </div>

      {/* Integrations Section */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">Integrations</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isSitesLoading ? (
            <>
              <ServiceCardSkeleton key="integration-skeleton-1" />
              <ServiceCardSkeleton key="integration-skeleton-2" />
              <ServiceCardSkeleton key="integration-skeleton-3" />
            </>
          ) : (
            <>
              {/* KICK Integration */}
              <div
                className={`border rounded-md relative overflow-hidden bg-[#16181D] ${
                  hasTimezone === false 
                    ? "cursor-not-allowed opacity-50" 
                    : "cursor-pointer"
                }`}
                onClick={handleKickCardClick}
                style={{
                  "--accent": "#53FC18",
                }}
              >
                {/* Background illustration - positioned behind content */}
                <SiKick className="absolute -bottom-8 right-1 z-0 size-[11rem] opacity-[0.0125] grayscale pointer-events-none" />
                
                <div className="relative z-10 p-5">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex size-9 items-center justify-center rounded-sm p-2"
                      style={{
                        background: "#53FC18"
                      }}
                    >
                     <SiKick className="size-5 fill-black" />
                    </div>
                    <p className="text-white font-medium">Kick</p>
                  </div>
                  <p className="mt-2.5 text-[13px] text-neutral-200">
                    Connect your Kick account to sync leaderboard data.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={handleKickCardClick}
                    disabled={hasTimezone === false}
                    className={`h-8 mt-2.5 transition-all duration-200 cursor-pointer ${
                      isKickConnected 
                        ? "!bg-[#84F549]/10 !border-[#84F549]/30 !text-[#84F549] hover:brightness-90" 
                        : "!bg-[#212328] !text-white hover:brightness-90"
                    }`}
                  >
                    {isKickConnected ? (
                      <span className="flex items-center gap-2">
                        <FaCheck className="size-3.5" />
                        Connected
                      </span>
                    ) : (
                      "Connect"
                    )}
                  </Button>
                </div>
              </div>

              {/* Telegram Integration */}
              <div
                className="border rounded-md relative overflow-hidden bg-[#16181D] cursor-default"
              >
                {/* Background illustration - positioned behind content */}
                <FaTelegramPlane className="absolute -bottom-12 -right-14 z-0 size-[17.5rem] opacity-[0.0125] grayscale pointer-events-none" />

                <div className="relative z-10 p-5">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex size-9 items-center justify-center rounded-sm p-2"
                      style={{
                        background: "#0088cc"
                      }}
                    >
                    <FaTelegramPlane className="size-5.5 fill-white" />
                    </div>
                    <p className="text-white font-medium">Telegram</p>
                  </div>
                  <p className="mt-2.5 text-[13px] text-neutral-200">
                    Connect your Telegram account for notifications and updates.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={handleTelegramConnect}
                    disabled={hasTimezone === false}
                    className="h-8 mt-2.5 !bg-[#212328] !text-white transition-all duration-200 cursor-pointer hover:brightness-90"
                  >
                    Connect
                  </Button>
                </div>
              </div>

              {/* Discord Integration */}
              <div
                className="border rounded-md relative overflow-hidden bg-[#16181D] cursor-default"
              >
                {/* Background illustration - positioned behind content */}
                <SiDiscord className="absolute -bottom-11 -right-20 z-0 size-[14.5rem] opacity-[0.0125] grayscale pointer-events-none" />

                <div className="relative z-10 p-5">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex size-9 items-center justify-center rounded-sm p-2"
                      style={{
                        background: "#5865F2"
                      }}
                    >
                    <SiDiscord className="size-5.5 fill-white" />
                    </div>
                    <p className="text-white font-medium">Discord</p>
                  </div>
                  <p className="mt-2.5 text-[13px] text-neutral-200">
                    Connect your Discord account for notifications and updates.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={handleDiscordConnect}
                    disabled={hasTimezone === false}
                    className="h-8 mt-2.5 !bg-[#212328] !text-white transition-all duration-200 cursor-pointer hover:brightness-90"
                  >
                    Connect
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <ConnectDrawer
        isOpen={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        selectedSite={selectedSite}
        formData={formData}
        setFormData={setFormData}
        isLoading={isLoading}
        isDeleting={isDeleting}
        error={error}
        isConnected={selectedSite ? isServiceConnected(selectedSite.id) : false}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />

      <KickDrawer
        isOpen={isKickDrawerOpen}
        onOpenChange={setIsKickDrawerOpen}
        isConnected={isKickConnected}
        userProfile={kickUserProfile}
        isLoading={isKickLoading}
        isDeleting={isKickDeleting}
        error={kickError}
        onConnect={handleKickConnect}
        onReconnect={handleKickReconnect}
        onDelete={handleKickDelete}
        onRefreshProfile={handleKickRefreshProfile}
      />
    </div>
  );
}
