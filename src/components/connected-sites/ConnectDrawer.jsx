"use client";

import { useState } from "react";
import { ArrowRight, Trash2, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { FaPlus, FaPlugCircleBolt } from "react-icons/fa6";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const formatLabel = (param) => {
  // Handle both snake_case and camelCase
  // First replace underscores with spaces, then split camelCase
  let words = param
    .replace(/_/g, " ") // Replace underscores with spaces
    .replace(/([a-z])([A-Z])/g, "$1 $2") // Add space before capital letters (camelCase)
    .split(/\s+/) // Split on any whitespace
    .filter((word) => word.length > 0); // Remove empty strings

  return words
    .map((word) => {
      const lowerWord = word.toLowerCase();
      if (lowerWord === "id") return "ID";
      if (lowerWord === "api") return "API";
      // Capitalize first letter, lowercase the rest
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
};


const CENSORED_VALUE = "••••••••••••";

export const ConnectDrawer = ({
  isOpen,
  onOpenChange,
  selectedSite,
  formData,
  setFormData,
  isLoading,
  isDeleting,
  error,
  isConnected,
  onSubmit,
  onDelete
}) => {
  // Hooks must be called unconditionally before any early returns
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const siteStyles = {
    roobet: {
      title: "Roobet",
      accentColor: "#4C3715",
      btnColor: "#EFAF0D",
      iconClass: "scale-125",
      isBright: true,
    },
    shuffle: {
      title: "Shuffle",
      accentColor: "#896CFF",
      iconClass: " !fill-white",
      isBright: false,
    },
    rainbet: {
      title: "Rainbet",
      accentColor: "#191F3B",
      iconClass: " !fill-white",
      isBright: false,
    },  
    gamdom: {
      title: "Gamdom",
      accentColor: "#0F3824",
      btnColor: "#03FF87",
      iconClass: " !fill-white",
      isBright: true,
    }
  };

  if (!selectedSite) return null;

  const isEditing = isConnected;
  const accentColor = siteStyles[selectedSite.id]?.accentColor || "#066FE6";
  const iconClass = siteStyles[selectedSite.id]?.iconClass || "";
  const isBright = siteStyles[selectedSite.id]?.isBright ?? false;
  
  // Determine text color based on isBright property
  const textColor = isBright ? "!text-black" : "text-white";

  const handleInputChange = (param, value) => {
    setFormData((prev) => ({
      ...prev,
      [param]: value,
    }));
  };

  const handleInputFocus = (param) => {
    // When user focuses on a censored field, clear it so they can type
    if (isEditing && formData[param] === CENSORED_VALUE) {
      setFormData((prev) => ({
        ...prev,
        [param]: "",
      }));
    }
  };

  const handleInputBlur = (param) => {
    // If field is empty after blur and we're editing, restore censored value
    if (isEditing && !formData[param]) {
      setFormData((prev) => ({
        ...prev,
        [param]: CENSORED_VALUE,
      }));
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmText === "I confirm") {
      onDelete();
      setShowDeleteConfirm(false);
      setDeleteConfirmText("");
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setDeleteConfirmText("");
  };

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="h-full max-w-md border-l">
        <div className="flex h-full flex-col">
          <DrawerHeader className="border-b">
            <div className="flex items-center gap-3">
              <div
                className="flex size-7.5 items-center justify-center rounded-sm p-[8.5px] bg-[#191B20]"
                style={{
                  backgroundColor: accentColor,
                }}
              >
                <img
                  src={`/casinos/${selectedSite.id}.svg`}
                  alt={siteStyles[selectedSite.id]?.title}
                  className={iconClass}
                />
              </div>
              <DrawerTitle className="text-xl font-semibold">
                {isEditing ? `Update ${siteStyles[selectedSite.id]?.title}` : `${siteStyles[selectedSite.id]?.title} API Connection`}
              </DrawerTitle>
            </div>
            {isEditing && (
              <DrawerDescription>
                Update your connection credentials or delete the connection.
              </DrawerDescription>
            )}
          </DrawerHeader>

          {!isEditing && (
            <div className="px-6 pt-4 pb-4 border-b  space-y-2">
              <div className="flex items-center gap-2">
                <FaPlugCircleBolt className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">New API Connection</h3>
              </div>
              <p className="text-sm text-muted-foreground pl-6">
                Enter the API credentials provided to you by your affiliate manager.
              </p>
            </div>
          )}

          <div className={`flex-1 overflow-y-auto ${!isEditing ? 'pl-6 pr-6 pt-4  ' : 'px-6 pt-6 pb-4'}`}>
            <form
              id="connectForm"
              autoComplete="off"
              className="flex flex-col gap-3"
              onSubmit={onSubmit}
            >
              {selectedSite?.auth_params.map((param) => {
                const value = formData[param] || "";
                const isCensored = isEditing && value === CENSORED_VALUE;
                const isPasswordField = param.toLowerCase().includes("password");
                // Mask all non-password fields with dots while typing
                // Password fields keep their normal behavior
                const shouldMaskInput = !isPasswordField;

                return (
                  <div key={param} className="space-y-2">
                    <Label htmlFor={param} className="text-sm font-medium">
                      {formatLabel(param)}
                    </Label>
                    <Input
                      id={param}
                      name={param}
                      required={!isCensored}
                      placeholder={isCensored ? CENSORED_VALUE : `Enter your ${formatLabel(param)}`}
                      value={value}
                      onChange={(e) => handleInputChange(param, e.target.value)}
                      onFocus={() => handleInputFocus(param)}
                      onBlur={() => handleInputBlur(param)}
                      type={shouldMaskInput || isCensored || isPasswordField ? "password" : "text"}
                      autoComplete="off"
                      data-form-type="other"
                      data-lpignore="true"
                      className="rounded-sm"
                      style={{
                        WebkitTextSecurity: shouldMaskInput || isCensored ? "disc" : "none",
                      }}
                    />
                  </div>
                );
              })}
              {error && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="-mt-1.5 ">
                <Button
                  variant="popout"
                  type="submit"
                  form="connectForm"
                  disabled={
                    isLoading ||
                    isDeleting ||
                    (isEditing
                      ? !Object.keys(formData).some(key =>
                        formData[key] && formData[key] !== CENSORED_VALUE
                      )
                      : !Object.values(formData).every((val) => val && val.trim())
                    )
                  }
                  className={`!w-full !h-7.5 !mt-2.5 ${textColor} hover:opacity-90`}
                  style={{
                    backgroundColor: siteStyles[selectedSite.id]?.btnColor || accentColor,
                    borderColor: accentColor,
                  }}
                >
                  {!isLoading ? (
                    <>
                      {!isEditing && <FaPlus className="h-4 w-4" />}
                      {isEditing ? "Update Connection" : "Add Connection"}
                      {isEditing && <ArrowRight className="h-4 w-4" />}
                    </>
                  ) : (
                    <>
                      <Spinner className="size-4 opacity-70" />
                      {isEditing ? "Updating..." : "Connecting..."}
                    </>
                  )}
                </Button>

                {/* Subtle Delete Button - Only show when editing */}
                {isEditing && (
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={handleDeleteClick}
                    disabled={isDeleting || isLoading}
                    className="w-full text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Connection
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      </DrawerContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={(open) => {
        if (!open) {
          handleDeleteCancel();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="pt-2">
              This action is permanent and cannot be undone. All statistics and data related to this connection will be permanently deleted.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
              <p className="text-sm font-semibold text-destructive mb-2">
                Warning: This will delete:
              </p>
              <ul className="list-disc list-inside text-sm text-destructive/90 space-y-1">
                <li>All hourly statistics</li>
                <li>All daily statistics</li>
                <li>Connection credentials</li>
                <li>All historical data</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delete-confirm" className="text-sm font-medium">
                Type <span className="font-semibold text-destructive">&quot;I confirm&quot;</span> to proceed:
              </Label>
              <Input
                id="delete-confirm"
                name="delete-confirm"
                autoComplete="off"
                placeholder="I confirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="rounded-sm"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting || deleteConfirmText !== "I confirm"}
            >
              {!isDeleting ? (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete Connection
                </>
              ) : (
                <>
                  <Spinner className="size-4 opacity-70" />
                  Deleting...
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Drawer>
  );
};

