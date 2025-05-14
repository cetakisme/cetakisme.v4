import React from "react";
import Image, { ImageProps } from "next/image";
import { LucideImage } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { StaticImport } from "next/dist/shared/lib/get-img-props";

const MyImage: React.FC<
  { src?: string | StaticImport; alt?: string; className?: string } & {
    rootProps?: React.ComponentProps<"div">;
  }
> = ({ rootProps, src = "", alt = "", className }) => {
  const { className: rootClassName, ...rest } = rootProps ?? { className: "" };
  return (
    <div
      className={cn("relative flex items-center justify-center", rootClassName)}
      {...rest}
    >
      {src === "" ? (
        <div className="flex flex-col items-center justify-center gap-2">
          <LucideImage size={32} />
          <Label>No Image</Label>
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          className={cn("h-full w-full object-cover", className)}
          fill
        />
      )}
    </div>
  );
};

export default MyImage;
