"use client";
import { useState } from "react";
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
import { showToast } from "@/components/ui/toast";
import { ArrowRight } from "lucide-react";

// Example data - replace with real data later
const exampleSites = [
  {
    id: "roobet",
    name: "Roobet",
    accentColor: "#ffaa00",
    icon: "/casinos/roobet.svg",
  },
  {
    id: "gamdom",
    name: "Gamdom",
    accentColor: "#03FF87",
    icon: "/casinos/gamdom.svg",
    iconClass: "scale-[.8]",
  },
  {
    id: "shuffle",
    name: "Shuffle",
    accentColor: "#896CFF",
    icon: "/casinos/shuffle.svg",
    iconClass: "scale-[.8]",
  },
  {
    id: "raingg",
    name: "Rain.GG",
    accentColor: "#F6AF16",
    icon: "/casinos/rain.svg",
    iconClass: "scale-[.9]",
  },
  {
    id: "rustclash",
    name: "Rustclash",
    accentColor: "#A252DF",
    icon: "/casinos/rustclash.svg",
    iconClass: "scale-[.9]",
  },
];

export default function Page() {
  const [selectedSite, setSelectedSite] = useState(null);
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCardClick = (site) => {
    setSelectedSite(site);
    setApiKey("");
    setError("");
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
          api_key: apiKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to link service");
      }

      showToast({
        title: "Service linked!",
        description: `${selectedSite.name} has been connected successfully.`,
        variant: "success",
      });

      setSelectedSite(null);
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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Connected Sites
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {exampleSites.length} sites connected
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {exampleSites.map((site) => (
            <TextureCard
              key={site.id}
              className="flex cursor-pointer flex-col text-white"
              style={{ "--accent": site.accentColor }}
              onClick={() => handleCardClick(site)}
            >
              <TextureCardContent className="relative overflow-hidden text-white">
                <div className="relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="relative flex size-12 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-white/[0.025] p-2.5">
                      <img
                        className={`z-10 drop-shadow ${site?.iconClass}`}
                        src={site.icon}
                      />
                      <img
                        className="absolute z-0 scale-[3] blur-[50px]"
                        src={site.icon}
                      />
                    </div>

                    <p>{site.name}</p>
                  </div>

                  <br />
                  <Switch
                    checked
                    className="data-[state=checked]:bg-[var(--accent)] data-[state=checked]:fill-white"
                  />
                </div>
                <div
                  style={{ backgroundColor: site.accentColor }}
                  className="absolute top-0 left-0 z-0 size-20 opacity-40 blur-[100px]"
                />
              </TextureCardContent>
            </TextureCard>
          ))}
        </div>
      </div>

      <Dialog open={!!selectedSite} onOpenChange={() => setSelectedSite(null)}>
        <DialogContent className="border-0 bg-transparent rounded-none p-0 shadow-none sm:max-w-md">
          <TextureCardStyled>
            <TextureCardHeader className="flex flex-col  justify-center gap-1 p-4">
              <TextureCardTitle>Connect {selectedSite?.name}</TextureCardTitle>
            </TextureCardHeader>
            <TextureSeparator />
            <TextureCardContent className="rounded-none">
              <form
                id="connectForm"
                autoComplete="new-password"
                className="flex flex-col gap-6"
                onSubmit={handleSubmit}
              >
                <div>
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    name="apikey"
                    required
                    placeholder="Enter your API key"
                    className="mt-3 w-full rounded-md border border-neutral-300 bg-white/80 px-4 py-2 text-white placeholder-neutral-400 focus-visible:ring-[var(--accent)]/50 dark:border-neutral-700 dark:bg-neutral-800/80 dark:placeholder-neutral-500"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    style={{
                      WebkitTextSecurity: "disc",
                    }}
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-500" role="alert">
                    {error}
                  </p>
                )}
              </form>
            </TextureCardContent>
            <TextureSeparator />
            <TextureCardFooter className="rounded-b-sm border-b">
              <TextureButton
                variant="accent"
                type="submit"
                form="connectForm"
                disabled={isLoading || !apiKey}
                innerClassName="!bg-[var(--accent)]  !from-[var(--accent)] !to-black/20 !outline-[var(--accent)] "
                style={{ "--accent": selectedSite?.accentColor }}
                className={
                  isLoading
                    ? "pointer-events-none h-[42.5px] w-full opacity-40 transition-all"
                    : "h-[42.5px] w-full"
                }
              >
                <div className="flex items-center justify-center gap-1">
                  {!isLoading ? (
                    <>
                      Connect
                      <ArrowRight className="mt-[1px] h-4 w-4 text-neutral-50" />
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
