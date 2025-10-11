"use client";

import { useState, useEffect } from "react";
import { showToast } from "@/components/ui/toast";

export const useConnectedSites = () => {
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
  const [hasTimezone, setHasTimezone] = useState(null);

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
    if (isServiceConnected(site.id)) {
      return;
    }

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
    e.stopPropagation();
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

      showToast({
        title: "Service linked!",
        description: `${siteStyles[selectedSite?.id].title} has been connected successfully.`,
        variant: "success",
      });

      await fetchLinkedServices();
      setIsDialogOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sites,
    linkedServices,
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
  };
};
