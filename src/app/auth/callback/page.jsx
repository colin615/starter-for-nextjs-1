"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState(null);

  useEffect(() => {
    async function handleCallback() {
      try {
        // Check for code in query params (server-side callback)
        const code = searchParams.get("code");
        const errorParam = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");
        const next = searchParams.get("next") || "/dashboard";

        // Handle OAuth errors
        if (errorParam) {
          console.error("Auth callback error:", errorParam, errorDescription);
          router.push(
            `/login?error=${encodeURIComponent(errorDescription || errorParam)}`
          );
          return;
        }

        // If code is in query params, exchange it for session
        if (code) {
          const { data, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error("Failed to exchange code for session:", exchangeError);
            router.push(
              `/login?error=${encodeURIComponent(
                exchangeError.message || "Failed to verify magic link"
              )}`
            );
            return;
          }

          if (!data.session) {
            router.push("/login?error=Failed to create session");
            return;
          }

          // Success - redirect to intended destination
          window.location.href = next;
          return;
        }

        // Check for hash fragments (client-side magic link)
        // Extract hash from URL
        const hash = window.location.hash.substring(1);
        if (hash) {
          const params = new URLSearchParams(hash);
          const accessToken = params.get("access_token");
          const refreshToken = params.get("refresh_token");
          const errorHash = params.get("error");
          const nextFromHash = params.get("next") || next;

          if (errorHash) {
            const errorDescriptionHash = params.get("error_description");
            console.error("Auth callback error:", errorHash, errorDescriptionHash);
            router.push(
              `/login?error=${encodeURIComponent(
                errorDescriptionHash || errorHash
              )}`
            );
            return;
          }

          if (accessToken && refreshToken) {
            // Set the session using the tokens from hash
            const { data, error: sessionError } =
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

            if (sessionError) {
              console.error("Failed to set session:", sessionError);
              router.push(
                `/login?error=${encodeURIComponent(
                  sessionError.message || "Failed to create session"
                )}`
              );
              return;
            }

            if (!data.session) {
              router.push("/login?error=Failed to create session");
              return;
            }

            // Success - redirect to intended destination
            window.location.href = nextFromHash;
            return;
          }
        }

        // No valid callback data found
        router.push("/login?error=Invalid callback");
      } catch (err) {
        console.error("Unexpected error in auth callback:", err);
        setError(err.message);
        router.push(
          `/login?error=${encodeURIComponent(
            err.message || "An unexpected error occurred"
          )}`
        );
      }
    }

    handleCallback();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Error: {error}</p>
          <button
            onClick={() => router.push("/login")}
            className="mt-4 text-primary hover:underline"
          >
            Return to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Spinner className="mx-auto size-8 opacity-70" />
        <p className="mt-4 text-sm text-neutral-400">
          Verifying your magic link...
        </p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner className="mx-auto size-8 opacity-70" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}

