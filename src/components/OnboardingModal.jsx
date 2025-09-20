"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { TextureButton } from "@/components/ui/texture-btn";
import { showToast } from "@/components/ui/toast";
import { X } from "lucide-react";
import { Textarea } from "./ui/textarea";

const premadeColors = [
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#10B981" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Red", value: "#EF4444" },
  { name: "Orange", value: "#F97316" },
  { name: "Pink", value: "#EC4899" },
];

export function OnboardingModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    accentColor: premadeColors[0].value,
    icon: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
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
      onSuccess();
      onClose();
    } catch (error) {
      showToast({
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-lg bg-stone-900 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Add New Website</h2>
          <Button variant="ghost" onClick={onClose}>
            <X />
          </Button>
        </div>

        <div className="mb-4">
          <div className="flex space-x-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded ${
                  s <= step ? "bg-blue-500" : "bg-gray-600"
                }`}
              />
            ))}
          </div>
        </div>

        {step === 1 && (
          <div>
            <Label htmlFor="name">Website Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="My Awesome Website"
              className="mt-2"
            />
            <Label htmlFor="description" className="mt-4 block">
              Description (optional)
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Brief description"
              className="mt-2"
              maxLength={200}
            />
          </div>
        )}

        {step === 2 && (
          <div>
            <Label>Accent Color</Label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {premadeColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() =>
                    setFormData({ ...formData, accentColor: color.value })
                  }
                  className={`rounded border-2 p-2 ${
                    formData.accentColor === color.value
                      ? "border-white"
                      : "border-gray-600"
                  }`}
                  style={{ backgroundColor: color.value }}
                >
                  {color.name}
                </button>
              ))}
            </div>
            <Label className="mt-4 block">Custom Color</Label>
            <Input
              type="color"
              value={formData.accentColor}
              onChange={(e) =>
                setFormData({ ...formData, accentColor: e.target.value })
              }
              className="mt-2"
            />
          </div>
        )}

        {step === 3 && (
          <div>
            <Label>Project Icon (optional)</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setFormData({ ...formData, icon: e.target.files[0] })
              }
              className="mt-2"
            />
            {formData.icon && (
              <img
                src={URL.createObjectURL(formData.icon)}
                alt="Preview"
                className="mt-2 h-16 w-16 rounded-full"
              />
            )}
          </div>
        )}

        <div className="mt-6 flex justify-between">
          {step > 1 && <TextureButton onClick={handleBack}>Back</TextureButton>}
          {step < 3 ? (
            <TextureButton onClick={handleNext} disabled={!formData.name}>
              Next
            </TextureButton>
          ) : (
            <TextureButton onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Website"}
            </TextureButton>
          )}
        </div>
      </div>
    </div>
  );
}
