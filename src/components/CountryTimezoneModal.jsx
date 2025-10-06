"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { TextureButton } from "@/components/ui/texture-btn";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { showToast } from "@/components/ui/toast";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight } from "lucide-react";

// Comprehensive list of timezones with country flags
const timezones = [
  { value: "America/New_York", label: "Eastern Time (US & Canada)", flag: "🇺🇸" },
  { value: "America/Chicago", label: "Central Time (US & Canada)", flag: "🇺🇸" },
  { value: "America/Denver", label: "Mountain Time (US & Canada)", flag: "🇺🇸" },
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)", flag: "🇺🇸" },
  { value: "America/Anchorage", label: "Alaska Time", flag: "🇺🇸" },
  { value: "Pacific/Honolulu", label: "Hawaii Time", flag: "🇺🇸" },
  { value: "Europe/London", label: "Greenwich Mean Time", flag: "🇬🇧" },
  { value: "Europe/Dublin", label: "Dublin Time", flag: "🇮🇪" },
  { value: "Europe/Paris", label: "Central European Time", flag: "🇫🇷" },
  { value: "Europe/Berlin", label: "Central European Time", flag: "🇩🇪" },
  { value: "Europe/Rome", label: "Central European Time", flag: "🇮🇹" },
  { value: "Europe/Madrid", label: "Central European Time", flag: "🇪🇸" },
  { value: "Europe/Amsterdam", label: "Central European Time", flag: "🇳🇱" },
  { value: "Europe/Brussels", label: "Central European Time", flag: "🇧🇪" },
  { value: "Europe/Vienna", label: "Central European Time", flag: "🇦🇹" },
  { value: "Europe/Zurich", label: "Central European Time", flag: "🇨🇭" },
  { value: "Europe/Stockholm", label: "Central European Time", flag: "🇸🇪" },
  { value: "Europe/Oslo", label: "Central European Time", flag: "🇳🇴" },
  { value: "Europe/Copenhagen", label: "Central European Time", flag: "🇩🇰" },
  { value: "Europe/Helsinki", label: "Eastern European Time", flag: "🇫🇮" },
  { value: "Europe/Warsaw", label: "Central European Time", flag: "🇵🇱" },
  { value: "Europe/Prague", label: "Central European Time", flag: "🇨🇿" },
  { value: "Europe/Budapest", label: "Central European Time", flag: "🇭🇺" },
  { value: "Europe/Bucharest", label: "Eastern European Time", flag: "🇷🇴" },
  { value: "Europe/Sofia", label: "Eastern European Time", flag: "🇧🇬" },
  { value: "Europe/Athens", label: "Eastern European Time", flag: "🇬🇷" },
  { value: "Europe/Istanbul", label: "Turkey Time", flag: "🇹🇷" },
  { value: "Europe/Moscow", label: "Moscow Time", flag: "🇷🇺" },
  { value: "Asia/Tokyo", label: "Japan Standard Time", flag: "🇯🇵" },
  { value: "Asia/Seoul", label: "Korea Standard Time", flag: "🇰🇷" },
  { value: "Asia/Shanghai", label: "China Standard Time", flag: "🇨🇳" },
  { value: "Asia/Hong_Kong", label: "Hong Kong Time", flag: "🇭🇰" },
  { value: "Asia/Singapore", label: "Singapore Time", flag: "🇸🇬" },
  { value: "Asia/Bangkok", label: "Indochina Time", flag: "🇹🇭" },
  { value: "Asia/Jakarta", label: "Western Indonesia Time", flag: "🇮🇩" },
  { value: "Asia/Manila", label: "Philippine Time", flag: "🇵🇭" },
  { value: "Asia/Kolkata", label: "India Standard Time", flag: "🇮🇳" },
  { value: "Asia/Karachi", label: "Pakistan Standard Time", flag: "🇵🇰" },
  { value: "Asia/Dubai", label: "Gulf Standard Time", flag: "🇦🇪" },
  { value: "Asia/Tehran", label: "Iran Standard Time", flag: "🇮🇷" },
  { value: "Asia/Riyadh", label: "Arabia Standard Time", flag: "🇸🇦" },
  { value: "Asia/Jerusalem", label: "Israel Standard Time", flag: "🇮🇱" },
  { value: "Africa/Cairo", label: "Eastern European Time", flag: "🇪🇬" },
  { value: "Africa/Johannesburg", label: "South Africa Standard Time", flag: "🇿🇦" },
  { value: "Africa/Lagos", label: "West Africa Time", flag: "🇳🇬" },
  { value: "Africa/Casablanca", label: "Western European Time", flag: "🇲🇦" },
  { value: "America/Sao_Paulo", label: "Brasilia Time", flag: "🇧🇷" },
  { value: "America/Argentina/Buenos_Aires", label: "Argentina Time", flag: "🇦🇷" },
  { value: "America/Santiago", label: "Chile Time", flag: "🇨🇱" },
  { value: "America/Lima", label: "Peru Time", flag: "🇵🇪" },
  { value: "America/Bogota", label: "Colombia Time", flag: "🇨🇴" },
  { value: "America/Caracas", label: "Venezuela Time", flag: "🇻🇪" },
  { value: "America/Mexico_City", label: "Central Time (Mexico)", flag: "🇲🇽" },
  { value: "America/Toronto", label: "Eastern Time (Canada)", flag: "🇨🇦" },
  { value: "America/Vancouver", label: "Pacific Time (Canada)", flag: "🇨🇦" },
  { value: "Australia/Sydney", label: "Australian Eastern Time", flag: "🇦🇺" },
  { value: "Australia/Melbourne", label: "Australian Eastern Time", flag: "🇦🇺" },
  { value: "Australia/Brisbane", label: "Australian Eastern Time", flag: "🇦🇺" },
  { value: "Australia/Perth", label: "Australian Western Time", flag: "🇦🇺" },
  { value: "Australia/Adelaide", label: "Australian Central Time", flag: "🇦🇺" },
  { value: "Pacific/Auckland", label: "New Zealand Time", flag: "🇳🇿" },
  { value: "Pacific/Fiji", label: "Fiji Time", flag: "🇫🇯" },
  { value: "Pacific/Tahiti", label: "Tahiti Time", flag: "🇵🇫" },
  { value: "Atlantic/Azores", label: "Azores Time", flag: "🇵🇹" },
  { value: "Atlantic/Canary", label: "Western European Time", flag: "🇪🇸" },
  { value: "Atlantic/Cape_Verde", label: "Cape Verde Time", flag: "🇨🇻" },
];

export function CountryTimezoneModal({ isOpen, onClose, onSave }) {
  const [selectedTimezone, setSelectedTimezone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Load saved timezone or auto-detect user's timezone on component mount
  useEffect(() => {
    if (isOpen) {
      const loadTimezone = async () => {
        try {
          const response = await fetch("/api/user/timezone");
          const data = await response.json();
          
          if (response.ok && data.timezone) {
            // Use saved timezone if available
            setSelectedTimezone(data.timezone);
          } else {
            // Fallback to auto-detected timezone
            const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            setSelectedTimezone(userTimezone);
          }
        } catch (error) {
          console.error("Failed to load saved timezone:", error);
          // Fallback to auto-detected timezone
          const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          setSelectedTimezone(userTimezone);
        }
      };
      
      loadTimezone();
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTimezone) return;

    setIsLoading(true);
    
    try {
      const response = await fetch("/api/user/timezone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timezone: selectedTimezone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save timezone");
      }
      
      const selectedTz = timezones.find(tz => tz.value === selectedTimezone);
      onSave(selectedTz);
      
      showToast({
        title: "Timezone updated!",
        description: `Your timezone has been set to ${selectedTz?.label}.`,
        variant: "success",
      });
      
      onClose();
    } catch (error) {
      console.error("Timezone save error:", error);
      showToast({
        title: "Error",
        description: error.message || "Failed to update timezone. Please try again.",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-none border-0 bg-transparent p-0 shadow-none sm:max-w-md">
        <TextureCardStyled>
          <TextureCardHeader className="flex flex-col justify-center gap-1 p-4">
            <TextureCardTitle>Select Timezone</TextureCardTitle>
          </TextureCardHeader>
          <TextureSeparator />
          <TextureCardContent className="rounded-none !text-white">
            <form
              id="timezoneForm"
              className="flex flex-col gap-4"
              onSubmit={handleSubmit}
            >
              <Label>Choose your timezone:</Label>
              <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
                <SelectTrigger className="w-full">
                  <SelectValue className="!text-white" placeholder="Select a timezone" />
                </SelectTrigger>
                <SelectContent className="max-h-64 !text-white">
                  {timezones.map((timezone) => (
                    <SelectItem key={timezone.value} value={timezone.value}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{timezone.flag}</span>
                        <span>{timezone.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </form>
          </TextureCardContent>
          <TextureSeparator />
          <TextureCardFooter className="rounded-b-sm border-b">
            <TextureButton
              variant="accent"
              type="submit"
              form="timezoneForm"
              disabled={!selectedTimezone || isLoading}
              innerClassName="!bg-blue-600 !from-blue-600 !to-black/20 !outline-blue-600 !text-white dark:!text-white"
              className={
                isLoading
                  ? "pointer-events-none h-[42.5px] w-full opacity-40 transition-all bg-blue-600 !from-blue-600 !to-black/20"
                  : "h-[42.5px] w-full bg-blue-600 !from-blue-600 !to-black/20"
              }
            >
              <div className="flex items-center justify-center gap-1">
                {!isLoading ? (
                  <>
                    Save Timezone
                    <ArrowRight className="mt-[1px] h-4 w-4 text-white" />
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
}
