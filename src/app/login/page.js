"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { ArrowRight, Merge } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TextureButton } from "@/components/ui/texture-btn"
import {
  TextureCardContent,
  TextureCardFooter,
  TextureCardHeader,
  TextureCardStyled,
  TextureCardTitle,
  TextureSeparator,
} from "@/components/ui/texture-card"

import { SiKick } from "react-icons/si";
import { Spinner } from "@/components/ui/shadcn-io/spinner";


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

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

      // Redirect to account page on success
      router.push("/account");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center dark:bg-stone-950 p-4">
      <div className="flex items-center justify-center py-4">
        <div className="dark:bg-stone-950  h-full    rounded-md min-w-lg">
          <div className=" items-start justify-center gap-6 rounded-lg p-2 md:p-8 grid grid-cols-1 ">
            <div className="col-span-1 grid items-start gap-6 lg:col-span-1">
              <div>
                <TextureCardStyled>
                  <TextureCardHeader className="flex flex-col gap-1 items-center justify-center p-4">
                    <div className=" bg-neutral-950 rounded-full mb-3">
                      <img className="size-10 rounded-lg" src="/logo-icon.svg" />
                    </div>
                    <TextureCardTitle>Welcome Back</TextureCardTitle>
                    <p className="text-center">
                      Sign in to access your dashboard.
                    </p>
                  </TextureCardHeader>
                  <TextureSeparator />
                  <TextureCardContent>
                    <div className="flex justify-center gap-2 mb-4">
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
                      <TextureButton className="opacity-40 pointer-events-none" variant="icon">
                        {/* Kick Icon   */}
                        <SiKick className="fill-[#54FC17]" />
                        <span className="pl-2 ">KICK</span>
                      </TextureButton>
                    </div>
                    <div className="text-sm mb-3.5 relative w-[380px] mx-auto flex items-center justify-center">
                      <div className="absolute w-full h-[1px] bg-white/10" />
                      <p className="bg-[#202020] px-4 relative z-10">or</p>
                    </div>
                    <form id="loginForm" className="flex flex-col gap-6" onSubmit={handleSubmit}>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          placeholder="parzival@example.com"
                          className="w-full px-4 py-2 mt-3 rounded-md border text-white border-neutral-300 dark:border-neutral-700 bg-white/80 dark:bg-neutral-800/80 placeholder-neutral-400 dark:placeholder-neutral-500"
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
                          className="w-full px-4 py-2 mt-3 rounded-md border text-white border-neutral-300 dark:border-neutral-700 bg-white/80 dark:bg-neutral-800/80 placeholder-neutral-400 dark:placeholder-neutral-500"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                      {error && (
                        <p className="text-red-500 text-sm" role="alert">
                          {error}
                        </p>
                      )}
                    </form>
                  </TextureCardContent>
                  <TextureSeparator />
                  <TextureCardFooter className="border-b rounded-b-sm">
                    <TextureButton
                      variant="accent"
                      type="submit"
                      form="loginForm"
                      disabled={isLoading || !email || !password}
                      className={isLoading ? "w-full pointer-events-none opacity-40 transition-all h-[42.5px]" : "w-full h-[42.5px]"}
                    >
                      <div className="flex gap-1 items-center justify-center">
                       
                       {!isLoading?<>
                          Continue
                          <ArrowRight className="h-4 w-4 text-neutral-50 mt-[1px]" />
                        </>
                        :<Spinner className="size-4 opacity-70" />
                       }
                      </div>
                    </TextureButton>
                  </TextureCardFooter>
                  <div className="dark:bg-neutral-800 bg-stone-100 pt-px rounded-b-[20px] overflow-hidden ">
                    <div className="flex flex-col items-center justify-center">
                      <div className="py-2 px-2">
                        <div className="text-center text-sm">
                          Don&apos;t have an account?{" "}
                          <Link href="/signup" className="text-primary">Sign up</Link>
                        </div>
                      </div>
                    </div>
                    <TextureSeparator />
                    <div className="flex flex-col items-center justify-center ">
                      <div className="py-2 px-2">
                        <div className="text-center text-xs ">
                          Secured by Appwrite
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
