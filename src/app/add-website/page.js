"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
import { showToast } from "@/components/ui/toast";
import { Spotlight } from "@/components/ui/spotlight-new";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { getAppwriteFileUrl } from "@/lib/utils";

const premadeColors = [
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#10B981" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Red", value: "#EF4444" },
  { name: "Orange", value: "#F97316" },
  { name: "Pink", value: "#EC4899" },
];

const stepVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    zIndex: 0,
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

export default function AddWebsitePage() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    accentColor: premadeColors[0].value,
    icon: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadedIconUrl, setUploadedIconUrl] = useState("");
  const fileInputRef = React.useRef(null);
  const router = useRouter();

  const handleNext = () => {
    if (step < 5) {
      setDirection(1);
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/websites/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to create website");

      showToast({
        title: "Website created!",
        description: "Your new website has been added successfully.",
        variant: "success",
      });

      // Move to completion step
      setDirection(1);
      setStep(5);
    } catch (error) {
      showToast({
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueToDashboard = () => {
    router.push("/dashboard");
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    // Clear any previous errors
    setUploadError("");

    // Validate file size (2MB limit)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      setUploadError(
        "File size must be less than 2MB. Please choose a smaller image.",
      );
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select a valid image file (JPG, PNG, GIF, WebP).");
      return;
    }

    setUploadLoading(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const response = await fetch("/api/upload-icon", {
        method: "POST",
        body: formDataUpload,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log(response.json());
        throw new Error(errorData.error || "Upload failed");
      }

      const result = await response.json();

      // Update form data with the uploaded file ID
      setFormData({ ...formData, icon: result.fileId });
      setUploadedIconUrl(result.fileUrl);

      showToast({
        title: "Icon uploaded!",
        description: "Your website icon has been uploaded successfully.",
        variant: "success",
      });
    } catch (error) {
      setUploadError(
        error.message || "Failed to upload icon. Please try again.",
      );
      console.error("Upload error:", error);
    } finally {
      setUploadLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-8 flex justify-center space-x-2">
      {[1, 2, 3, 4, 5].map((s) => (
        <motion.div
          key={s}
          className={`h-2 flex-1 rounded-full ${
            s <= step ? "bg-indigo-500" : "bg-gray-600"
          }`}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.3, delay: s * 0.1 }}
        />
      ))}
    </div>
  );

  const renderStepContent = () => (
    <AnimatePresence custom={direction} mode="wait">
      <motion.div
        key={step}
        custom={direction}
        variants={stepVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{
          x: { type: "spring", stiffness: 300, damping: 30 },
          opacity: { duration: 0.2 },
          layout: { duration: 0.3 },
        }}
        layout
        className="w-full"
      >
        {step === 1 && (
          <div className="w-full space-y-6">
            <div className="text-center">
              <motion.h2
                className="text-2xl font-bold text-neutral-900 dark:text-neutral-100"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Welcome to your website setup
              </motion.h2>
              <motion.p
                className="mt-2 text-neutral-600 dark:text-neutral-400"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Let's get your new website configured in just a few steps.
              </motion.p>
            </div>
            <motion.div
              className="flex flex-col items-center space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="w-full max-w-md">
                <Label htmlFor="name" className="text-sm font-medium">
                  Website Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="My Awesome Website"
                  className="mt-2"
                />
              </div>
            </motion.div>
          </div>
        )}

        {step === 2 && (
          <div className="w-full space-y-6">
            <div className="text-center">
              <motion.h2
                className="text-2xl font-bold text-neutral-900 dark:text-neutral-100"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Add a description
              </motion.h2>
              <motion.p
                className="mt-2 text-neutral-600 dark:text-neutral-400"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Help others understand what your website is about.
              </motion.p>
            </div>
            <motion.div
              className="flex flex-col items-center space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="w-full max-w-md">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description (optional)
                </Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description of your website"
                  className="mt-2 min-h-[100px] w-full resize-none rounded-md border border-neutral-300 bg-white/80 px-4 py-2 text-neutral-900 placeholder-neutral-400 dark:border-neutral-700 dark:bg-neutral-800/80 dark:text-neutral-100 dark:placeholder-neutral-500"
                  maxLength={200}
                />
                <p className="mt-1 text-xs text-neutral-500">
                  {formData.description.length}/200 characters
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {step === 3 && (
          <div className="w-full space-y-6">
            <div className="text-center">
              <motion.h2
                className="text-2xl font-bold text-neutral-900 dark:text-neutral-100"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Choose your accent color
              </motion.h2>
              <motion.p
                className="mt-2 text-neutral-600 dark:text-neutral-400"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Pick a color that represents your brand.
              </motion.p>
            </div>
            <motion.div
              className="flex flex-col items-center space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="grid max-w-md grid-cols-3 gap-3">
                {premadeColors.map((color, index) => (
                  <motion.button
                    key={color.value}
                    onClick={() =>
                      setFormData({ ...formData, accentColor: color.value })
                    }
                    className={`rounded-lg border-2 p-4 transition-all ${
                      formData.accentColor === color.value
                        ? "scale-105 border-white"
                        : "border-gray-600 hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.value }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <span className="font-medium text-white">{color.name}</span>
                  </motion.button>
                ))}
              </div>
              <div className="w-full max-w-md">
                <Label className="text-sm font-medium">Custom Color</Label>
                <Input
                  type="color"
                  value={formData.accentColor}
                  onChange={(e) =>
                    setFormData({ ...formData, accentColor: e.target.value })
                  }
                  className="mt-2 h-12"
                />
              </div>
            </motion.div>
          </div>
        )}

        {step === 4 && (
          <div className="w-full space-y-6">
            <div className="text-center">
              <motion.h2
                className="text-2xl font-bold text-neutral-900 dark:text-neutral-100"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Add a project icon
              </motion.h2>
              <motion.p
                className="mt-2 text-neutral-600 dark:text-neutral-400"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Upload an icon to make your website stand out.
              </motion.p>
            </div>
            <motion.div
              className="flex flex-col items-center space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="w-full max-w-md space-y-3">
                <div className="relative">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        handleFileUpload(file);
                      }
                    }}
                    disabled={uploadLoading}
                    className="max-w-xs"
                  />
                  {uploadLoading && (
                    <div className="absolute top-1/2 right-2 -translate-y-1/2">
                      <Spinner className="h-4 w-4" />
                    </div>
                  )}
                </div>

                {uploadError && (
                  <motion.p
                    className="text-center text-sm text-red-500"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {uploadError}
                  </motion.p>
                )}

                {(uploadedIconUrl || formData.icon) && (
                  <motion.div
                    className="flex flex-col items-center space-y-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <div className="relative">
                      <img
                        src={
                          uploadedIconUrl ||
                          (formData.icon
                            ? getAppwriteFileUrl(formData.icon)
                            : URL.createObjectURL(formData.icon))
                        }
                        alt="Website Icon Preview"
                        className="h-20 w-20 rounded-full border-2 border-white object-cover"
                      />
                      <button
                        onClick={() => {
                          setFormData({ ...formData, icon: null });
                          setUploadedIconUrl("");
                          setUploadError("");
                          if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                          }
                        }}
                        className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white transition-colors hover:bg-red-600"
                        title="Remove icon"
                      >
                        ×
                      </button>
                    </div>
                    <p className="text-xs text-neutral-500">
                      Icon uploaded successfully
                    </p>
                  </motion.div>
                )}

                <p className="text-center text-xs text-neutral-500">
                  Maximum file size: 2MB. Supported formats: JPG, PNG, GIF, WebP
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {step === 5 && (
          <div className="w-full space-y-6">
            <div className="text-center">
              <motion.div
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.2,
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
              >
                <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
              </motion.div>
              <motion.h2
                className="text-2xl font-bold text-neutral-900 dark:text-neutral-100"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Website Created Successfully!
              </motion.h2>
              <motion.p
                className="mt-2 text-neutral-600 dark:text-neutral-400"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Your new website "{formData.name}" has been set up and is ready
                to go.
              </motion.p>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );

  const renderNavigation = () => (
    <div className="flex items-center justify-between">
      {step > 1 && step < 5 && (
        <TextureButton onClick={handleBack} variant="secondary" size="default">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </TextureButton>
      )}
      {step < 4 ? (
        <TextureButton
          onClick={handleNext}
          disabled={!formData.name}
          className="ml-auto"
          size="default"
        >
          Next
          <ArrowRight className="ml-2 h-4 w-4" />
        </TextureButton>
      ) : step === 4 ? (
        <TextureButton
          onClick={handleSubmit}
          disabled={isLoading}
          variant="accent"
          className="ml-auto"
          size="default"
        >
          {isLoading ? (
            <Spinner className="mr-2 h-4 w-4" />
          ) : (
            <Check className="mr-2 h-4 w-4" />
          )}
          {isLoading ? "Creating..." : "Create Website"}
        </TextureButton>
      ) : (
        <TextureButton
          onClick={handleContinueToDashboard}
          variant="accent"
          className="ml-auto"
          size="default"
        >
          Continue to Dashboard
        </TextureButton>
      )}
    </div>
  );

  return (
    <main className="flex min-h-screen w-full items-center justify-center p-4 dark:bg-stone-950">
      <Spotlight />
      <div className="z-10 flex items-center justify-center py-4">
        <div className="w-full max-w-lg rounded-md">
          <div className="grid grid-cols-1 items-start justify-center gap-6 rounded-lg p-2 md:p-8">
            <div className="col-span-1 grid w-full max-w-lg items-start gap-6 lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                layout
              >
                <TextureCardStyled className="w-full max-w-lg">
                  <TextureCardHeader className="flex flex-col items-center justify-center gap-1 p-4">
                    <div className="mb-3 rounded-full bg-neutral-950">
                      <img
                        className="size-10 rounded-lg"
                        src="/logo-icon.svg"
                      />
                    </div>
                    <TextureCardTitle>Add New Website</TextureCardTitle>
                  </TextureCardHeader>
                  <TextureSeparator />
                  <TextureCardContent className="px-8 py-6">
                    {renderStepIndicator()}
                    {renderStepContent()}
                  </TextureCardContent>
                  <TextureSeparator />
                  <TextureCardFooter className="px-8 py-6">
                    {renderNavigation()}
                  </TextureCardFooter>
                </TextureCardStyled>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
