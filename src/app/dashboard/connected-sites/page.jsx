"use client";
import { useState, useEffect } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import {
  TextureCard,
  TextureCardContent,
  TextureCardHeader,
  TextureCardTitle,
  TextureCardStyled,
  TextureSeparator,
  TextureCardFooter,
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
import { ArrowRight } from "lucide-react";

export default function Page() {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSitesLoading, setIsSitesLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
  }, []);

  const handleCardClick = (site) => {
    setSelectedSite(site);
    setFormData(
      site.auth_params.reduce((acc, param) => ({ ...acc, [param]: "" }), {}),
    );
    setError("");
    setIsDialogOpen(true);
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

      setIsDialogOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Connected Sites</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-2 p-6 pt-0">
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
            : sites.map((site) => (
                <TextureCard
                  key={site.id}
                  className="flex cursor-pointer flex-col text-white"
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
                      <Switch
                        checked
                        className="data-[state=checked]:bg-[var(--accent)] data-[state=checked]:fill-white"
                      />
                    </div>
                  </TextureCardContent>
                </TextureCard>
              ))}
        </div>
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
    </SidebarInset>
  );
}
