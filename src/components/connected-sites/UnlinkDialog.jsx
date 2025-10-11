"use client";

import { Unlink } from "lucide-react";
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
  TextureCardDescription,
  TextureCardContent,
  TextureCardFooter,
  TextureSeparator,
} from "@/components/ui/texture-card";

export const UnlinkDialog = ({ 
  isOpen, 
  onOpenChange, 
  selectedSite, 
  unlinkConfirmText, 
  setUnlinkConfirmText, 
  isUnlinking, 
  onConfirm 
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none border-0 bg-transparent p-0 shadow-none sm:max-w-md">
        <TextureCardStyled>
          <TextureCardHeader className="flex flex-col justify-center gap-1 p-4">
            <TextureCardTitle className="text-red-400">
              Unlink {siteStyles[selectedSite.id]?.title}
            </TextureCardTitle>
            <TextureCardDescription className="text-neutral-400">
              This action cannot be undone
            </TextureCardDescription>
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
                Type <span className="font-semibold text-white">&quot;I confirm&quot;</span> to proceed
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
              onClick={() => onOpenChange(false)}
              disabled={isUnlinking}
              className="h-[42.5px] w-full"
            >
              Cancel
            </TextureButton>
            <TextureButton
              variant="accent"
              onClick={onConfirm}
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
  );
};
