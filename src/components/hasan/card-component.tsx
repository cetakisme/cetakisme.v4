import Link from "next/link";
import Image from "next/image";
import { Product, ProductAttribteValue } from "@prisma/client";
import { LucideImage, LucideImageMinus } from "lucide-react";
import { toRupiah } from "@/lib/utils";
import { useLiveQuery } from "dexie-react-hooks";
import { dexie } from "@/server/local/dexie";
import { toast } from "sonner";
import React from "react";
import { FilterData } from "./filter-section";

export const CardComponent: React.FC<{ product: FilterData }> = ({
  product,
}) => {
  const [image, setImage] = React.useState(product.images[0] ?? "");

  const resetImage = React.useCallback(() => {
    setImage(product.images[0] ?? "");
  }, [product.images]);

  return (
    <Link href="#" className="group block">
      <div className="relative aspect-square">
        <div className="relative flex h-full w-full items-center justify-center">
          {image === "" ? (
            <LucideImage size={52} className="text-gray-400" />
          ) : (
            <Image
              src={image}
              alt=""
              fill
              className="h-full w-full rounded-sm object-cover"
            />
          )}
        </div>
        <div className="absolute bottom-2 left-2 flex w-full flex-col gap-1">
          <Sizes sizes={product.sizes} />
          <Colors
            colors={product.colors}
            onColorHover={setImage}
            onColorLeave={resetImage}
          />
        </div>
      </div>

      <div className="mt-3">
        <h3 className="line-clamp-1 text-ellipsis font-medium text-gray-900 group-hover:underline group-hover:underline-offset-4">
          {product.name}
        </h3>
        <p className="text-sm text-gray-700">{toRupiah(product.base_price)}</p>
      </div>
    </Link>
  );
};

const Sizes: React.FC<{
  sizes: ProductAttribteValue[];
}> = ({ sizes }) => {
  return (
    <div className="flex gap-0.5">
      {sizes.map((x, i) => {
        if (i === 3) {
          return (
            <div
              className="flex aspect-square w-5 items-center justify-center rounded-full bg-black text-[10px] font-medium text-white"
              key={x.id}
            >
              ...
            </div>
          );
        } else {
          return (
            <div
              key={x.id}
              className="flex aspect-square w-5 items-center justify-center rounded-md bg-black text-[10px] font-medium text-white"
            >
              {x.value}
            </div>
          );
        }
      })}
    </div>
  );
};

const Colors: React.FC<{
  colors: ProductAttribteValue[];
  onColorHover: (image: string) => void;
  onColorLeave: () => void;
}> = ({ colors, onColorHover, onColorLeave }) => {
  return (
    <div className="flex gap-0.5">
      {colors?.map((x, i) => {
        if (i === 3) {
          return (
            <div
              className="flex aspect-square w-5 items-center justify-center rounded-full bg-black text-[10px] font-medium text-white"
              key={x.id}
            >
              ...
            </div>
          );
        } else {
          return (
            <div
              key={x.id}
              onMouseEnter={() => onColorHover(x.image)}
              onMouseLeave={() => onColorLeave()}
              className="flex aspect-square w-5 items-center justify-center rounded-full border-2 border-white bg-black text-[10px] font-medium text-white"
              style={{
                backgroundColor: x.color,
              }}
            />
          );
        }
      })}
    </div>
  );
};

// const Color:React.FC<{colorAttributeId: string}> = ({colorAttributeId: color}) => {
//     const color = useLiveQuery(() => dexie.productAttributeValues.where("attribute_id").equals())
//     return (<div className="flex aspect-square w-5 items-center justify-center rounded-full bg-black text-[10px] font-medium text-white" style={{
//                 backgroundColor: color
//               }} />)
// }
