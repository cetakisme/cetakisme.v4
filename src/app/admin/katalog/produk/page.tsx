"use client";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import ClientPage from "./cilent";
import React from "react";
import Authenticated from "@/components/hasan/auth/authenticated";
import AuthFallback from "@/components/hasan/auth/auth-fallback";
import { ContentLayout } from "@/components/admin-panel/content-layout";

function Page() {
  return (
    <ContentLayout title="Produk">
      <Authenticated permission="produk" fallback={AuthFallback}>
        <ScrollArea className="h-screen lg:w-full">
          <ScrollBar orientation="horizontal" />
          <ClientPage />
        </ScrollArea>
      </Authenticated>
    </ContentLayout>
  );
}

export default Page;
