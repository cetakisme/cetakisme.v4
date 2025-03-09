import { ScrollArea } from "@/components/ui/scroll-area";
import ClientPage from "./cilent";
import React from "react";

export default function HomePage() {
  return (
    <ScrollArea className="h-screen p-8">
      <ClientPage />
    </ScrollArea>
  );
}
