"use client";

import { Button } from "@/components/ui/button";

export default function WidgetsPage() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h1 className="text-3xl font-bold">Widgets</h1>
        <p className="text-muted-foreground">Coming soon...</p>
        <Button className="!bg-purple-500" variant="popout">Click me</Button>
      </div>
    </div>
  );
}

