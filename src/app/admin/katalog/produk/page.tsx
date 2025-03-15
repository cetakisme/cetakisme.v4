import { ScrollArea } from "@/components/ui/scroll-area";
import ClientPage from "./cilent";
import React from "react";
import Authenticated from "@/components/hasan/auth/authenticated";
import AuthFallback from "@/components/hasan/auth/auth-fallback";

function Page() {
  return (
    <Authenticated permission="produk" fallback={AuthFallback}>
      <ScrollArea className="h-screen p-8">
        <ClientPage />
      </ScrollArea>
    </Authenticated>
  );
}

export default Page;
