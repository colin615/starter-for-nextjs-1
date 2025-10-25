"use client";

import { ServiceCard, ServiceCardSkeleton } from "@/components/connected-sites/ServiceCard";
import { ConnectDialog } from "@/components/connected-sites/ConnectDialog";
import { UnlinkDialog } from "@/components/connected-sites/UnlinkDialog";
import { useConnectedSites } from "@/hooks/useConnectedSites";

export default function Page() {
  const {
    sites,
    selectedSite,
    formData,
    setFormData,
    isLoading,
    isSitesLoading,
    error,
    isDialogOpen,
    setIsDialogOpen,
    isUnlinkDialogOpen,
    setIsUnlinkDialogOpen,
    unlinkConfirmText,
    setUnlinkConfirmText,
    isUnlinking,
    hasTimezone,
    siteStyles,
    isServiceConnected,
    handleCardClick,
    handleUnlinkClick,
    handleUnlinkConfirm,
    handleSubmit
  } = useConnectedSites();


  return (
    <div className="flex flex-1 flex-col gap-2 p-6">
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
      
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                onUnlinkClick={handleUnlinkClick}
              />
            ))
        }
      </div>

      <ConnectDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        selectedSite={selectedSite}
        formData={formData}
        setFormData={setFormData}
        isLoading={isLoading}
        error={error}
        onSubmit={handleSubmit}
      />

      <UnlinkDialog
        isOpen={isUnlinkDialogOpen}
        onOpenChange={setIsUnlinkDialogOpen}
        selectedSite={selectedSite}
        unlinkConfirmText={unlinkConfirmText}
        setUnlinkConfirmText={setUnlinkConfirmText}
        isUnlinking={isUnlinking}
        onConfirm={handleUnlinkConfirm}
      />
    </div>
  );
}
