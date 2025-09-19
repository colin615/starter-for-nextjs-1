"use client";

import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/toast";
import { TextureButton } from "@/components/ui/texture-btn";

function ToastPage() {
  return (
    <div className="gap-2 p-5">
      ToastPage
      <Button
        onClick={() =>
          showToast({
            title: "Hello there!",
            description: "This is a pretty plain toast",
          })
        }
      >
        Plain Toast
      </Button>
      <Button
        onClick={() =>
          showToast({
            title: "Welcome aboard Colin! How was setup?",
            description:
              "Was there anything confusing that we can make clearer for future users?",
            button: (
              <TextureButton variant="accent" className="h-8 w-[10rem]">
                Give Feedback
              </TextureButton>
            ),
          })
        }
      >
        Toast with accent button
      </Button>
      <Button
        onClick={() =>
          showToast({
            title: "Account created!",
            description:
              "Your account has been created successfully. Please log in to continue.",
            variant: "success",
          })
        }
      >
        Success Toast
      </Button>
    </div>
  );
}

export default ToastPage;
