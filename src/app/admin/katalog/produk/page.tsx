"use client";
import { ScrollArea } from "@/components/ui/scroll-area";
import dynamic from "next/dynamic";
import React from "react";
const Table = dynamic(() => import("./read/table"), {
  ssr: false,
});

export default function HomePage() {
  return (
    <ScrollArea className="h-screen p-8">
      <Table />
    </ScrollArea>
  );
}
