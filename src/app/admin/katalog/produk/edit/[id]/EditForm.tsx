"use client";

import Product from "@/app/admin/katalog/produk/product";
import { ScrollArea } from "@/components/ui/scroll-area";
import { observer } from "@legendapp/state/react";
import React from "react";

const EditForm: React.FC<{ id: string }> = ({ id }) => {
  return (
    <ScrollArea className="h-screen p-8">
      <Product id={id} />
    </ScrollArea>
  );
};

export default observer(EditForm);
