"use client";

import { ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TextureButton } from "@/components/ui/texture-btn";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  TextureCardStyled,
  TextureCardHeader,
  TextureCardTitle,
  TextureCardContent,
  TextureCardFooter,
  TextureSeparator,
} from "@/components/ui/texture-card";

const formatLabel = (param) => {
  return param
    .split("_")
    .map((word) =>
      word === "id" ? "ID" : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
};

const getContrastTextClass = (accentColor) => {
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
  
  const rgb = hexToRgb(accentColor);
  return luminance(rgb) > 0.5
    ? "!text-black dark:!text-black"
    : "!text-white dark:!text-white";
};

export const ConnectDialog = ({ 
  isOpen, 
  onOpenChange, 
  selectedSite, 
  formData, 
  setFormData, 
  isLoading, 
  error, 
  onSubmit 
}) => {
  const siteStyles = {
    roobet: {
      title: "Roobet",
      accentColor: "#EFAF0D",
    },
    shuffle: {
      title: "Shuffle",
      accentColor: "#896CFF"
    }
  };

  if (!selectedSite) return null;

  const accentColor = siteStyles[selectedSite.id]?.accentColor || "#066FE6";
  const textClass = getContrastTextClass(accentColor);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none border-0 bg-transparent p-0 shadow-none sm:max-w-md">
        <TextureCardStyled>
          <TextureCardHeader className="flex flex-col justify-center gap-1 p-4">
            <TextureCardTitle>
              Connect {siteStyles[selectedSite.id]?.title}
            </TextureCardTitle>
          </TextureCardHeader>
          <TextureSeparator />
          <TextureCardContent className="rounded-none">
            <form
              id="connectForm"
              autoComplete="new-password"
              className="flex flex-col gap-6"
              onSubmit={onSubmit}
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
            style={{ "--accent": accentColor }}
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
              innerClassName={`!bg-[var(--accent)] !from-[var(--accent)] !to-black/20 !outline-[var(--accent)] ${textClass}`}
              style={{ "--accent": accentColor }}
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
                      className={`mt-[1px] h-4 w-4 ${textClass.replace('!', '').replace('dark:', '')}`}
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
  );
};
