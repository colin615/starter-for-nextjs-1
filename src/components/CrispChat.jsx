"use client";

import { useEffect } from "react";
import Script from "next/script";
import { useAuth } from "@/contexts/AuthContext";

export const CrispChat = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    // Initialize Crisp
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = "1072fda0-85bf-4650-93dd-28dfca16f54d";
  }, []);

  useEffect(() => {
    // Wait for Crisp to be fully loaded
    if (typeof window === "undefined" || !window.$crisp) return;

    const syncUserToCrisp = () => {
      if (!loading && user) {
        // Set user email
        if (user.email) {
          window.$crisp.push(["set", "user:email", [user.email]]);
        }

        // Set user nickname (name)
        if (user.name) {
          window.$crisp.push(["set", "user:nickname", [user.name]]);
        }

        // Set user data with additional info
        const userData = {
          user_id: user.$id,
          registration: user.registration || new Date(user.$createdAt).toISOString(),
          status: user.status ? "active" : "inactive",
          email_verification: user.emailVerification || false,
          phone_verification: user.phoneVerification || false,
        };

        // Add phone if available
        if (user.phone) {
          userData.phone = user.phone;
          window.$crisp.push(["set", "user:phone", [user.phone]]);
        }

        // Set user data
        window.$crisp.push(["set", "user:data", [userData]]);

        // Set session data
        window.$crisp.push([
          "set",
          "session:data",
          [
            [
              ["user_id", user.$id],
              ["email", user.email],
              ["name", user.name || ""],
            ],
          ],
        ]);
      } else if (!loading && !user) {
        // Reset Crisp session when user logs out
        window.$crisp.push(["do", "session:reset"]);
      }
    };

    // Check if Crisp is ready
    if (window.$crisp.is) {
      syncUserToCrisp();
    } else {
      // Wait for Crisp to be ready
      window.CRISP_READY_TRIGGER = () => {
        syncUserToCrisp();
      };
    }
  }, [user, loading]);

  return (
    <Script
      id="crisp-chat"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          window.$crisp=[];
          window.CRISP_WEBSITE_ID="1072fda0-85bf-4650-93dd-28dfca16f54d";
          (function(){
            d=document;
            s=d.createElement("script");
            s.src="https://client.crisp.chat/l.js";
            s.async=1;
            d.getElementsByTagName("head")[0].appendChild(s);
          })();
        `,
      }}
    />
  );
};

// Helper function to open Crisp chat
export const openCrispChat = () => {
  if (window.$crisp) {
    window.$crisp.push(["do", "chat:open"]);
  }
};

// Helper function to close Crisp chat
export const closeCrispChat = () => {
  if (window.$crisp) {
    window.$crisp.push(["do", "chat:close"]);
  }
};

// Helper function to show Crisp chat
export const showCrispChat = () => {
  if (window.$crisp) {
    window.$crisp.push(["do", "chat:show"]);
  }
};

// Helper function to hide Crisp chat
export const hideCrispChat = () => {
  if (window.$crisp) {
    window.$crisp.push(["do", "chat:hide"]);
  }
};

// Helper function to manually set user data
export const setCrispUserData = (userData) => {
  if (window.$crisp) {
    if (userData.email) {
      window.$crisp.push(["set", "user:email", [userData.email]]);
    }
    if (userData.name) {
      window.$crisp.push(["set", "user:nickname", [userData.name]]);
    }
    if (userData.phone) {
      window.$crisp.push(["set", "user:phone", [userData.phone]]);
    }
  }
};

// Helper function to reset Crisp session
export const resetCrispSession = () => {
  if (window.$crisp) {
    window.$crisp.push(["do", "session:reset"]);
  }
};

