"use client";

import { useState } from "react";
import { ArrowRight, Trash2, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
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
  return param
    .split("_")
    .map((word) =>
      word === "id" ? "ID" : word.charAt(0).toUpperCase() + word.slice(1),
    )
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

  if (!selectedSite) return null;

  const isEditing = isConnected;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

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
            <DrawerTitle className="text-xl font-semibold">
              {isEditing ? `Update ${siteStyles[selectedSite.id]?.title}` : `Connect ${siteStyles[selectedSite.id]?.title}`}
            </DrawerTitle>
            {isEditing && (
              <DrawerDescription>
                Update your connection credentials or delete the connection.
              </DrawerDescription>
            )}
          </DrawerHeader>
          
          <div className="flex-1 overflow-y-auto p-6">
            <form
              id="connectForm"
              autoComplete="new-password"
              className="flex flex-col gap-6"
              onSubmit={onSubmit}
            >
              {selectedSite?.auth_params.map((param) => {
                const value = formData[param] || "";
                const isCensored = isEditing && value === CENSORED_VALUE;
                
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
                      type={isCensored ? "password" : "text"}
                      style={{
                        WebkitTextSecurity: isCensored ? "disc" : "none",
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
              <div className="space-y-2 ">
                <Button
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
                  className="w-full"
                >
                  {!isLoading ? (
                    <>
                      {isEditing ? "Update Connection" : "Connect"}
                      <ArrowRight className="h-4 w-4" />
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

