"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { showToast } from "@/components/ui/toast";
import { setClientSession } from "@/lib/appwrite";

import { ArrowRight, Merge } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TextureButton } from "@/components/ui/texture-btn";
import {
  TextureCardContent,
  TextureCardFooter,
  TextureCardHeader,
  TextureCardStyled,
  TextureCardTitle,
  TextureSeparator,
} from "@/components/ui/texture-card";

import { SiKick, SiAppwrite } from "react-icons/si";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Spotlight } from "@/components/ui/spotlight-new";

function LoginPageContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const message = searchParams.get("message");
    if (message === "Account created successfully") {
      showToast({
        title: "Account created!",
        description:
          "Your account has been created successfully. Please log in to continue.",
        variant: "success",
      });
    }
  }, [searchParams]);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Set client session for real-time functionality
      if (data.session?.secret) {
        setClientSession(data.session.secret);
        console.log("Client session set for real-time notifications");
      }

      // Redirect to account page on success
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4 dark:bg-stone-950">
      <Spotlight />
      <div className="z-10 flex items-center justify-center py-4">
        <div className="h-full min-w-lg rounded-md">
          <div className="grid grid-cols-1 items-start justify-center gap-6 rounded-lg p-2 md:p-8">
            <div className="col-span-1 grid items-start gap-6 lg:col-span-1">
              <div>
                <TextureCardStyled>
                  <TextureCardHeader className="flex flex-col items-center justify-center gap-1 p-4">
                    <div className="mb-3 rounded-full bg-neutral-950">
                      <img
                        className="size-10 rounded-lg"
                        src="/logo-icon.svg"
                      />
                    </div>
                    <TextureCardTitle>Welcome Back</TextureCardTitle>
                    <p className="text-center">
                      Sign in to access your dashboard.
                    </p>
                  </TextureCardHeader>
                  <TextureSeparator />
                  <TextureCardContent>
                    <div className="mb-4 flex justify-center gap-2">
                      <TextureButton variant="icon">
                        {/* Google Icon */}
                        <svg
                          width="256"
                          height="262"
                          viewBox="0 0 256 262"
                          xmlns="http://www.w3.org/2000/svg"
                          preserveAspectRatio="xMidYMid"
                          className="size-4"
                        >
                          <path
                            d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                            fill="#4285F4"
                          />
                          <path
                            d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                            fill="#34A853"
                          />
                          <path
                            d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"
                            fill="#FBBC05"
                          />
                          <path
                            d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                            fill="#EB4335"
                          />
                        </svg>
                        <span className="pl-2">Google</span>
                      </TextureButton>
                      <TextureButton
                        className="pointer-events-none opacity-40"
                        variant="icon"
                      >
                        {/* Kick Icon   */}
                        <SiKick className="fill-[#54FC17]" />
                        <span className="pl-2">KICK</span>
                      </TextureButton>
                    </div>
                    <div className="relative mx-auto mb-3.5 flex w-[380px] items-center justify-center text-sm">
                      <div className="absolute h-[1px] w-full bg-white/10" />
                      <p className="relative z-10 bg-[#202020] px-4">or</p>
                    </div>
                    <form
                      id="loginForm"
                      className="flex flex-col gap-6"
                      onSubmit={handleSubmit}
                    >
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          placeholder="parzival@example.com"
                          className="mt-3 w-full rounded-md border border-neutral-300 bg-white/80 px-4 py-2 text-white placeholder-neutral-400 dark:border-neutral-700 dark:bg-neutral-800/80 dark:placeholder-neutral-500"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          required
                          placeholder="Enter your password"
                          className="mt-3 w-full rounded-md border border-neutral-300 bg-white/80 px-4 py-2 text-white placeholder-neutral-400 dark:border-neutral-700 dark:bg-neutral-800/80 dark:placeholder-neutral-500"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
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
                      form="loginForm"
                      disabled={isLoading || !email || !password}
                      className={
                        isLoading
                          ? "pointer-events-none h-[42.5px] w-full opacity-40 transition-all"
                          : "h-[42.5px] w-full"
                      }
                    >
                      <div className="flex items-center justify-center gap-1">
                        {!isLoading ? (
                          <>
                            Continue
                            <ArrowRight className="mt-[1px] h-4 w-4 text-neutral-50" />
                          </>
                        ) : (
                          <Spinner className="size-4 opacity-70" />
                        )}
                      </div>
                    </TextureButton>
                  </TextureCardFooter>
                  <div className="overflow-hidden rounded-b-[20px] bg-stone-100 pt-px dark:bg-neutral-800">
                    <div className="flex flex-col items-center justify-center">
                      <div className="px-2 py-2">
                        <div className="text-center text-sm">
                          Don&apos;t have an account?{" "}
                          <Link href="/signup" className="text-primary">
                            Sign up
                          </Link>
                        </div>
                      </div>
                    </div>
                    <TextureSeparator />
                    <div className="flex flex-col items-center justify-center">
                      <div className="px-2 py-2">
                        <div className="flex items-center gap-1.5 text-center text-xs">
                          Secured by Appwrite
                          <SiAppwrite className="inline" />
                        </div>
                      </div>
                    </div>
                  </div>
                </TextureCardStyled>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
