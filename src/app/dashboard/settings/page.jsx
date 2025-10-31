"use client";

import { useState, useEffect } from "react";
import { CountryTimezoneModal } from "@/components/CountryTimezoneModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, ArrowRight } from "lucide-react";
import { TextureButton } from "@/components/ui/texture-btn";

export default function SettingsPage() {
  const [isTimezoneModalOpen, setIsTimezoneModalOpen] = useState(false);
  const [currentTimezone, setCurrentTimezone] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTimezone = async () => {
      try {
        const response = await fetch("/api/user/timezone");
        const data = await response.json();
        
        if (response.ok && data.timezone) {
          setCurrentTimezone(data.timezone);
        }
      } catch (error) {
        console.error("Failed to fetch timezone:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimezone();
  }, []);

  const handleTimezoneSave = (timezone) => {
    if (timezone) {
      setCurrentTimezone(timezone.value);
    }
    // Refetch to ensure we have the latest
    fetch("/api/user/timezone")
      .then((res) => res.json())
      .then((data) => {
        if (data.timezone) {
          setCurrentTimezone(data.timezone);
        }
      })
      .catch((err) => console.error("Failed to refresh timezone:", err));
  };

  const getTimezoneLabel = (tzValue) => {
    if (!tzValue) return "Not set";
    
    // Format timezone nicely by replacing underscores with spaces and capitalizing
    const formatted = tzValue
      .replace(/_/g, " ")
      .split("/")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" / ");
    
    return formatted;
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* Timezone Settings Card */}
        <Card className="bg-[#16181D] border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary/10">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-white">Timezone</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Set your timezone to display times correctly across the dashboard
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-md border border-border bg-[#212328] p-4">
              <div>
                <p className="text-sm font-medium text-white">Current Timezone</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isLoading ? "Loading..." : getTimezoneLabel(currentTimezone)}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsTimezoneModalOpen(true)}
                className="border-border bg-[#16181D] hover:bg-[#212328] text-white"
              >
                Change
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <CountryTimezoneModal
        isOpen={isTimezoneModalOpen}
        onClose={() => setIsTimezoneModalOpen(false)}
        onSave={handleTimezoneSave}
      />
    </div>
  );
}

