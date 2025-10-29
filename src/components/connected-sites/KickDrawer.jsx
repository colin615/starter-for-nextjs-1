"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowRight, Trash2, AlertTriangle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { SiKick } from "react-icons/si";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

export const KickDrawer = ({
  isOpen,
  onOpenChange,
  isConnected,
  userProfile,
  isLoading,
  isDeleting,
  error,
  onConnect,
  onReconnect,
  onDelete,
  onRefreshProfile
}) => {
  const accentColor = "#53FC18";
  const textColor = "text-black";
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const hasRefreshedRef = useRef(false);

  // Refresh profile when drawer opens and is connected
  useEffect(() => {
    if (isOpen && isConnected && onRefreshProfile && !hasRefreshedRef.current) {
      hasRefreshedRef.current = true;
      onRefreshProfile();
    }
    
    // Reset ref when drawer closes
    if (!isOpen) {
      hasRefreshedRef.current = false;
    }
  }, [isOpen, isConnected, onRefreshProfile]);

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

  const handleConnect = () => {
    if (isConnected) {
      onReconnect();
    } else {
      onConnect();
    }
  };

  return (
    <>
      <Drawer open={isOpen} onOpenChange={onOpenChange} direction="right">
        <DrawerContent className="h-full max-w-md border-l">
          <div className="flex h-full flex-col">
            <DrawerHeader className="border-b">
              <div className="flex items-center gap-3">
                <div
                  className="flex size-7.5 items-center justify-center rounded-sm p-[8.5px]"
                  style={{
                    backgroundColor: accentColor,
                  }}
                >
                  <SiKick className="size-5 fill-black" />
                </div>
                <DrawerTitle className="text-xl font-semibold">
                  {isConnected ? "Kick Connection" : "Kick API Connection"}
                </DrawerTitle>
              </div>
              {isConnected && (
                <DrawerDescription>
                  View your connected Kick account or reconnect.
                </DrawerDescription>
              )}
            </DrawerHeader>

            {!isConnected && (
              <div className="px-6 pt-4 pb-4 border-b space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">OAuth Connection</h3>
                </div>
                <p className="text-sm text-muted-foreground pl-6">
                  Connect your Kick account to sync leaderboard data and track your activity.
                </p>
              </div>
            )}

            <div className={`flex-1 overflow-y-auto ${!isConnected ? 'pl-6 pr-6 pt-4' : 'px-6 pt-6 pb-4'}`}>
              {isConnected && userProfile ? (
                <div className="space-y-6">
                  {/* User Profile Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="size-16">
                        <AvatarImage src={userProfile.avatar} alt={userProfile.name} />
                        <AvatarFallback className="bg-muted text-muted-foreground">
                          {userProfile.name?.charAt(0).toUpperCase() || "K"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{userProfile.name}</h3>
                        {userProfile.id && (
                          <p className="text-sm text-muted-foreground">ID: {userProfile.id}</p>
                        )}
                      </div>
                    </div>

                    {userProfile.email && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Email</p>
                        <p className="text-sm">{userProfile.email}</p>
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
                      <p className="text-sm text-destructive" role="alert">
                        {error}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Button
                      variant="popout"
                      type="button"
                      onClick={handleConnect}
                      disabled={isLoading || isDeleting}
                      className={`!w-full !h-7.5 ${textColor} hover:opacity-90`}
                      style={{
                        backgroundColor: accentColor,
                        borderColor: accentColor,
                      }}
                    >
                      {!isLoading ? (
                        <>
                          Reconnect
                          <ArrowRight className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          <Spinner className="size-4 opacity-70" />
                          Connecting...
                        </>
                      )}
                    </Button>

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
                  </div>
                </div>
              ) : isConnected ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center py-8">
                    <Spinner className="size-6" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Loading user profile...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {error && (
                    <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
                      <p className="text-sm text-destructive" role="alert">
                        {error}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-4">
                    <Button
                      variant="popout"
                      type="button"
                      onClick={handleConnect}
                      disabled={isLoading}
                      className={`!w-full !h-7.5 !mt-2.5 ${textColor} hover:opacity-90`}
                      style={{
                        backgroundColor: accentColor,
                        borderColor: accentColor,
                      }}
                    >
                      {!isLoading ? (
                        <>
                          Connect Kick Account
                          <ArrowRight className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          <Spinner className="size-4 opacity-70" />
                          Connecting...
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

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
                <li>All leaderboard statistics</li>
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
    </>
  );
};

