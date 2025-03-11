"use client";

import React from "react";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import RenderList from "@/components/hasan/render-list";
import { asList } from "@/server/local/utils";
import { Product, ProductVariant } from "@prisma/client";
import { products$, productVariants$ } from "@/server/local/db";
import Img from "@/components/hasan/Image";
import { Memo, useObservable, useObserveEffect } from "@legendapp/state/react";
import { Label } from "@/components/ui/label";
import { PopoverButton } from "@/components/hasan/popover-button";
import { dexie } from "@/server/local/dexie";

const Page = () => {
  console.log(productVariants$.get());
  return (
    <ResizablePanelGroup direction="horizontal" className="p-8">
      <ResizablePanel defaultSize={50}>One</ResizablePanel>
      <ResizablePanel defaultSize={50}>
        <ScrollArea className="h-full">
          <Memo>
            {() => (
              <RenderList
                className="grid grid-cols-4 gap-2"
                data={asList<Product>(products$.get())}
                render={(data) => <ProductCard product={data} />}
              />
            )}
          </Memo>
        </ScrollArea>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default Page;

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const variants$ = useObservable<ProductVariant[]>([]);

  useObserveEffect(async () => {
    const data = await dexie.productVariants
      .where("product_id")
      .equals(product.id)
      .and((variant) => variant.deleted === false)
      .toArray();

    if (data) {
      variants$.set(data);
    }
  });
  return (
    <Memo>
      {() => (
        <PopoverButton
          data={variants$.get()}
          onSelected={(e) => {}}
          renderItem={(e) => e.name}
          title="Varian"
          renderTrigger={() => (
            <div className="flex aspect-square h-full w-full flex-col overflow-hidden rounded-md shadow-lg">
              <div className="relative flex-1">
                {product.images[0] && product.images[0] !== "" ? (
                  <Img src={product.images[0]} alt="" />
                ) : (
                  <>No Image</>
                )}
              </div>
              <Label className="line-clamp-1 px-2 py-1">{product.name}</Label>
            </div>
          )}
        />
      )}
    </Memo>
  );
};
