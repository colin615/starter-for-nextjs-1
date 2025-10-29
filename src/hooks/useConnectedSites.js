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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasTimezone, setHasTimezone] = useState(null);
  const [originalFormData, setOriginalFormData] = useState({});

  const siteStyles = {
    roobet: {
      title: "Roobet",
      accentColor: "#4C3715",
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

  const CENSORED_VALUE = "••••••••••••";

  const handleCardClick = (site) => {
    if (hasTimezone === false) {
      showToast({
        title: "Timezone Required",
        description: "Please set your timezone in account settings before connecting services.",
        variant: "warning",
      });
      return;
    }

    setSelectedSite(site);
    const isConnected = isServiceConnected(site.id);
    
    if (isConnected) {
      // Get existing auth data and populate with censored values
      const linkedService = linkedServices.find((s) => s.identifier === site.id);
      const authData = linkedService?.auth_data || {};
      
      // Store original values for later use when submitting
      setOriginalFormData(authData);
      
      const censoredFormData = site.auth_params.reduce((acc, param) => {
        acc[param] = authData[param] ? CENSORED_VALUE : "";
        return acc;
      }, {});
      
      setFormData(censoredFormData);
    } else {
      // New connection - empty form
      setOriginalFormData({});
      setFormData(
        site.auth_params.reduce((acc, param) => ({ ...acc, [param]: "" }), {}),
      );
    }
    
    setError("");
    setIsDrawerOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedSite) return;

    setIsDeleting(true);
    setError("");

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
      setIsDrawerOpen(false);
    } catch (err) {
      setError(err.message);
      showToast({
        title: "Error",
        description: err.message,
        variant: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const isConnected = isServiceConnected(selectedSite.id);
      
      // Build payload with all required fields
      const payload = {
        identifier: selectedSite.id,
      };
      
      selectedSite.auth_params.forEach((param) => {
        const value = formData[param];
        if (isConnected) {
          // For updates: if field is censored, use original value; otherwise use new value
          if (value === CENSORED_VALUE) {
            payload[param] = originalFormData[param] || "";
          } else {
            payload[param] = value || "";
          }
        } else {
          // For new connections, use form value
          payload[param] = value || "";
        }
      });

      const response = await fetch("/api/services/link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to link service");
      }

      // Store the linked_api ID to check if it gets deleted (indicating failure)
      const linkedApiId = data.linked_api?.id;
      
      // Only check for deletion if this was a new connection (not an update)
      if (!isConnected && linkedApiId) {
        // Poll a few times to check if the entry gets deleted (which indicates linking failed)
        // This handles async backfill operations that might delete the entry on failure
        let entryStillExists = false;
        const maxAttempts = 3;
        const delayMs = 1000;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
          
          const linkedResponse = await fetch("/api/services/linked");
          if (linkedResponse.ok) {
            const linkedData = await linkedResponse.json();
            entryStillExists = linkedData.linked?.some(
              (service) => service.id === linkedApiId
            );
            
            if (entryStillExists) {
              // Entry still exists, linking appears successful
              break;
            }
          }
        }
        
        if (!entryStillExists) {
          // The entry was deleted, indicating linking failed
          throw new Error("Service linking failed. Please check your API credentials and try again.");
        }
      }

      showToast({
        title: isConnected ? "Service Updated!" : "Service Linked!",
        description: `${siteStyles[selectedSite?.id].title} has been ${isConnected ? "updated" : "connected"} successfully.`,
        variant: "success",
      });

      await fetchLinkedServices();
      setIsDrawerOpen(false);
    } catch (err) {
      setError(err.message);
      showToast({
        title: "Linking Failed",
        description: err.message,
        variant: "error",
      });
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
    isDrawerOpen,
    setIsDrawerOpen,
    isDeleting,
    hasTimezone,
    siteStyles,
    isServiceConnected,
    handleCardClick,
    handleDelete,
    handleSubmit
  };
};
