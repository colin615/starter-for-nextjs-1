"use client";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import {
  TextureCard,
  TextureCardContent,
  TextureCardHeader,
  TextureCardTitle,
  TextureCardStyled,
  TextureSeparator,
  TextureCardFooter,
  TextureCardDescription,
} from "@/components/ui/texture-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TextureButton } from "@/components/ui/texture-btn";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { showToast } from "@/components/ui/toast";
import { ArrowRight, Unlink } from "lucide-react";

export default function Page() {
  const [sites, setSites] = useState([]);
  const [linkedServices, setLinkedServices] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSitesLoading, setIsSitesLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUnlinkDialogOpen, setIsUnlinkDialogOpen] = useState(false);
  const [unlinkConfirmText, setUnlinkConfirmText] = useState("");
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [hasTimezone, setHasTimezone] = useState(null); // null = checking, true = has timezone, false = no timezone

  const siteStyles = {
    roobet: {
      title: "Roobet",
      accentColor: "#EFAF0D",
    },
    shuffle:{
      title:"Shuffle",
      accentColor:"#896CFF"
    }
  };

  useEffect(() => {
    // Check user timezone status
    fetch("/api/user/timezone")
      .then((res) => res.json())
      .then((data) => {
        setHasTimezone(!!data.timezone);
      })
      .catch((err) => {
        console.error("Failed to check timezone:", err);
        setHasTimezone(false);
      });

    // Fetch services
    fetch("/api/services/link")
      .then((res) => res.json())
      .then((data) => {
        setSites(
          data.services.map((service) => ({
            id: service.identifier,
            name: service.name,
            accentColor: service.accent_color,
            icon: service.icon,
            iconClass: service.iconClass,
            auth_params: service.auth_params || [],
          })),
        );
      })
      .catch((err) => console.error("Failed to fetch services:", err))
      .finally(() => setIsSitesLoading(false));

    // Fetch linked services for the current user
    fetchLinkedServices();
  }, []);

  const fetchLinkedServices = async () => {
    try {
      const response = await fetch("/api/services/linked");
      if (response.ok) {
        const data = await response.json();
        setLinkedServices(data.linked || []);
      }
    } catch (error) {
      console.error("Failed to fetch linked services:", error);
    }
  };

  const isServiceConnected = (serviceId) => {
    return linkedServices.some((service) => service.identifier === serviceId);
  };

  const handleCardClick = (site) => {
    // If already connected, ignore click (they should use unlink button)
    if (isServiceConnected(site.id)) {
      return;
    }

    // Check if user has timezone set
    if (hasTimezone === false) {
      showToast({
        title: "Timezone Required",
        description: "Please set your timezone in account settings before connecting services.",
        variant: "warning",
      });
      return;
    }

    setSelectedSite(site);
    setFormData(
      site.auth_params.reduce((acc, param) => ({ ...acc, [param]: "" }), {}),
    );
    setError("");
    setIsDialogOpen(true);
  };

  const handleUnlinkClick = (site, e) => {
    e.stopPropagation(); // Prevent card click
    setSelectedSite(site);
    setUnlinkConfirmText("");
    setIsUnlinkDialogOpen(true);
  };

  const handleUnlinkConfirm = async () => {
    if (unlinkConfirmText !== "I confirm") {
      showToast({
        title: "Confirmation Required",
        description: 'Please type "I confirm" to proceed.',
        variant: "warning",
      });
      return;
    }

    setIsUnlinking(true);

    try {
      const response = await fetch("/api/services/unlink", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: selectedSite.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to unlink service");
      }

      showToast({
        title: "Service Unlinked",
        description: `${siteStyles[selectedSite.id].title} has been disconnected and all related statistics have been cleared.`,
        variant: "success",
      });

      // Refresh linked services
      await fetchLinkedServices();
      setIsUnlinkDialogOpen(false);
    } catch (err) {
      showToast({
        title: "Error",
        description: err.message,
        variant: "error",
      });
    } finally {
      setIsUnlinking(false);
    }
  };

  const formatLabel = (param) => {
    return param
      .split("_")
      .map((word) =>
        word === "id" ? "ID" : word.charAt(0).toUpperCase() + word.slice(1),
      )
      .join(" ");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/services/link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: selectedSite.id,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to link service");
      }

      console.log(selectedSite);

      showToast({
        title: "Service linked!",
        description: `${siteStyles[selectedSite?.id].title} has been connected successfully.`,
        variant: "success",
      });

      // Refresh linked services
      await fetchLinkedServices();
      setIsDialogOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-2 p-6">
        {hasTimezone === false && (
          <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-4 text-orange-800 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-200">
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
            ? // Show skeleton cards equal to the number of sites in siteStyles
              Object.keys(siteStyles).map((siteId) => (
                <TextureCard
                  key={`skeleton-${siteId}`}
                  className="flex flex-col text-white"
                >
                  <TextureCardContent className="relative overflow-hidden text-white">
                    <div className="relative z-10">
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-12 rounded-md" />
                        <Skeleton className="h-5 w-20" />
                      </div>
                      <br />
                      <Skeleton className="h-6 w-12 rounded-full" />
                    </div>
                  </TextureCardContent>
                </TextureCard>
              ))
            : sites.map((site) => {
                const isConnected = isServiceConnected(site.id);
                return (
                  <TextureCard
                    key={site.id}
                    className={`flex flex-col text-white ${
                      hasTimezone === false 
                        ? "cursor-not-allowed opacity-50" 
                        : isConnected
                        ? "cursor-default"
                        : "cursor-pointer"
                    }`}
                    style={{ "--accent": siteStyles[site.id].accentColor }}
                    onClick={() => handleCardClick(site)}
                  >
                    <TextureCardContent className="relative overflow-hidden text-white">
                      <div className="relative z-10">
                        <div className="flex items-center gap-3">
                          <div className="relative flex size-12 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-white/[0.025] p-2.5">
                            <img
                              className={`z-10 drop-shadow ${site?.iconClass}`}
                              src={`/casinos/${site.id}.svg`}
                            />
                            <img
                              className="absolute z-0 scale-[3] blur-[50px]"
                              src={site.icon}
                            />
                          </div>

                          <p>{siteStyles[site.id].title}</p>
                        </div>

                        <br />
                        <div className="flex items-center justify-between">
                          <Switch
                            checked={isConnected}
                            className="data-[state=checked]:bg-[var(--accent)] data-[state=checked]:fill-white"
                          />
                          {isConnected && (
                            <button
                              onClick={(e) => handleUnlinkClick(site, e)}
                              className="flex items-center gap-1.5 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-sm text-red-400 transition-colors hover:border-red-500/30 hover:bg-red-500/20 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-0"
                            >
                              <Unlink className="h-3.5 w-3.5" />
                              Unlink
                            </button>
                          )}
                        </div>
                      </div>
                    </TextureCardContent>
                  </TextureCard>
                );
              })}
        </div>

        <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
        }}
      >
        <DialogContent className="rounded-none border-0 bg-transparent p-0 shadow-none sm:max-w-md">
          <TextureCardStyled>
            <TextureCardHeader className="flex flex-col justify-center gap-1 p-4">
              {selectedSite && (
                <TextureCardTitle>
                  Connect {siteStyles[selectedSite.id]?.title}
                </TextureCardTitle>
              )}
            </TextureCardHeader>
            <TextureSeparator />
            <TextureCardContent className="rounded-none">
              <form
                id="connectForm"
                autoComplete="new-password"
                className="flex flex-col gap-6"
                onSubmit={handleSubmit}
              >
                {selectedSite?.auth_params.map((param) => (
                  <div key={param}>
                    <Label htmlFor={param}>{formatLabel(param)}</Label>
                    <Input
                      id={param}
                      name={param}
                      required
                      placeholder={`Enter your ${formatLabel(param)}`}
                      className="mt-3 w-full rounded-md border border-neutral-300 bg-white/80 px-4 py-2 text-white placeholder-neutral-400 focus-visible:ring-[var(--accent)]/50 dark:border-neutral-700 dark:bg-neutral-800/80 dark:placeholder-neutral-500"
                      value={formData[param] || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          [param]: e.target.value,
                        }))
                      }
                      style={{
                        WebkitTextSecurity: "disc",
                      }}
                    />
                  </div>
                ))}
                {error && (
                  <p className="text-sm text-red-500" role="alert">
                    {error}
                  </p>
                )}
              </form>
            </TextureCardContent>
            <TextureSeparator />
            <TextureCardFooter
              style={{ "--accent": siteStyles[selectedSite?.id]?.accentColor }}
              className="rounded-b-sm border-b"
            >
             <TextureButton
                variant="accent"
                type="submit"
                form="connectForm"
                disabled={
                  isLoading ||
                  !Object.values(formData).every((val) => val.trim())
                }
                innerClassName={`!bg-[var(--accent)] !from-[var(--accent)] !to-black/20 !outline-[var(--accent)] ${
                  // If accent color is light, use dark text; otherwise, use light text
                  (() => {
                    const accent = siteStyles[selectedSite?.id]?.accentColor || "#066FE6";
                    // Simple luminance check for contrast
                    function hexToRgb(hex) {
                      let c = hex.replace("#", "");
                      if (c.length === 3) c = c.split("").map((x) => x + x).join("");
                      const num = parseInt(c, 16);
                      return [num >> 16, (num >> 8) & 255, num & 255];
                    }
                    function luminance([r, g, b]) {
                      // sRGB luminance(Y) values
                      const a = [r, g, b].map((v) => {
                        v /= 255;
                        return v <= 0.03928
                          ? v / 12.92
                          : Math.pow((v + 0.055) / 1.055, 2.4);
                      });
                      return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
                    }
                    const rgb = hexToRgb(accent);
                    return luminance(rgb) > 0.5
                      ? "!text-black dark:!text-black"
                      : "!text-white dark:!text-white";
                  })()
                }`}
                style={{ "--accent": siteStyles[selectedSite?.id]?.accentColor }}
                className={
                  isLoading
                    ? "pointer-events-none h-[42.5px] w-full opacity-40 transition-all bg-[var(--accent)] !from-[var(--accent)] !to-black/20"
                    : "h-[42.5px] w-full bg-[var(--accent)] !from-[var(--accent)] !to-black/20"
                }
              >
                <div className="flex items-center justify-center gap-1">
                  {!isLoading ? (
                    <>
                      Connect
                      <ArrowRight
                        className={`mt-[1px] h-4 w-4 ${
                          (() => {
                            const accent = siteStyles[selectedSite?.id]?.accentColor || "#066FE6";
                            function hexToRgb(hex) {
                              let c = hex.replace("#", "");
                              if (c.length === 3) c = c.split("").map((x) => x + x).join("");
                              const num = parseInt(c, 16);
                              return [num >> 16, (num >> 8) & 255, num & 255];
                            }
                            function luminance([r, g, b]) {
                              const a = [r, g, b].map((v) => {
                                v /= 255;
                                return v <= 0.03928
                                  ? v / 12.92
                                  : Math.pow((v + 0.055) / 1.055, 2.4);
                              });
                              return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
                            }
                            const rgb = hexToRgb(accent);
                            return luminance(rgb) > 0.5
                              ? "text-black dark:text-black"
                              : "text-neutral-50 dark:text-white";
                          })()
                        }`}
                      />
                    </>
                  ) : (
                    <Spinner className="size-4 opacity-70" />
                  )}
                </div>
              </TextureButton>
            </TextureCardFooter>
          </TextureCardStyled>
        </DialogContent>
      </Dialog>

      {/* Unlink Confirmation Dialog */}
      <Dialog
        open={isUnlinkDialogOpen}
        onOpenChange={(open) => {
          setIsUnlinkDialogOpen(open);
          if (!open) {
            setUnlinkConfirmText("");
          }
        }}
      >
        <DialogContent className="rounded-none border-0 bg-transparent p-0 shadow-none sm:max-w-md">
          <TextureCardStyled>
            <TextureCardHeader className="flex flex-col justify-center gap-1 p-4">
              {selectedSite && (
                <>
                  <TextureCardTitle className="text-red-400">
                    Unlink {siteStyles[selectedSite.id]?.title}
                  </TextureCardTitle>
                  <TextureCardDescription className="text-neutral-400">
                    This action cannot be undone
                  </TextureCardDescription>
                </>
              )}
            </TextureCardHeader>
            <TextureSeparator />
            <TextureCardContent className="rounded-none space-y-4">
              <div className="rounded-md border border-red-500/20 bg-red-500/10 p-4">
                <p className="text-sm text-red-300">
                  <strong className="font-semibold">Warning:</strong> All statistics and data
                  related to this service will be permanently deleted. This includes:
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-red-300/90">
                  <li>All hourly statistics</li>
                  <li>All daily statistics</li>
                  <li>Connection credentials</li>
                </ul>
              </div>
              
              <div>
                <Label htmlFor="confirm" className="text-neutral-300">
                  Type <span className="font-semibold text-white">"I confirm"</span> to proceed
                </Label>
                <Input
                  id="confirm"
                  name="confirm"
                  autoComplete="off"
                  placeholder="I confirm"
                  className="mt-3 w-full rounded-md border border-neutral-300 bg-white/80 px-4 py-2 text-white placeholder-neutral-400 focus-visible:ring-red-500/50 dark:border-neutral-700 dark:bg-neutral-800/80 dark:placeholder-neutral-500"
                  value={unlinkConfirmText}
                  onChange={(e) => setUnlinkConfirmText(e.target.value)}
                />
              </div>
            </TextureCardContent>
            <TextureSeparator />
            <TextureCardFooter 
              style={{ "--accent": "#EF4444" }}
              className="flex gap-2 rounded-b-sm border-b"
            >
              <TextureButton
                variant="outline"
                onClick={() => setIsUnlinkDialogOpen(false)}
                disabled={isUnlinking}
                className="h-[42.5px] w-full"
              >
                Cancel
              </TextureButton>
              <TextureButton
                variant="accent"
                onClick={handleUnlinkConfirm}
                disabled={isUnlinking || unlinkConfirmText !== "I confirm"}
                innerClassName="!bg-[var(--accent)] !from-[var(--accent)] !to-black/20 !outline-[var(--accent)] !text-white dark:!text-white"
                style={{ "--accent": "#EF4444" }}
                className={
                  isUnlinking || unlinkConfirmText !== "I confirm"
                    ? "pointer-events-none h-[42.5px] w-full opacity-40 transition-all bg-[var(--accent)] !from-[var(--accent)] !to-black/20"
                    : "h-[42.5px] w-full transition-all bg-[var(--accent)] !from-[var(--accent)] !to-black/20"
                }
              >
                <div className="flex items-center justify-center gap-1">
                  {!isUnlinking ? (
                    <>
                      <Unlink className="h-4 w-4" />
                      Unlink Service
                    </>
                  ) : (
                    <Spinner className="size-4 opacity-70" />
                  )}
                </div>
              </TextureButton>
            </TextureCardFooter>
          </TextureCardStyled>
        </DialogContent>
      </Dialog>
    </div>
  );
}
