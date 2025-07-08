"use client";

import { ImageUploader, useImageUpload } from "@/hooks/useImageUpload";
import { deleteFile, uploadFile } from "@/lib/uploadthing/utils";
import React from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { LucideDot, LucideLoaderCircle } from "lucide-react";
import Img from "./Image";

const ImageButton: React.FC<{
  rootClassName?: string;
  className?: string;
  image: string;
  onImageChange: (image: string) => void;
}> = ({ image, onImageChange, className, rootClassName }) => {
  const [uploading, setUploading] = React.useState(false);
  const { imageRef, setImage } = useImageUpload(
    (newImage) => {
      const upload = async () => {
        setUploading(true);

        if (image !== "") {
          try {
            await deleteFile(image);
            toast.success("Image Delete Sukses");
          } catch {
            toast.error("Sometings wrong when deleting");
            return;
          }
        }

        try {
          const _image = await uploadFile(newImage);
          onImageChange(_image.ufsUrl);
          toast.success("Image Upload Sukses");
        } catch {
          toast.error("Sometings wrong when uploading");
        } finally {
          setUploading(false);
        }
      };

      void upload();
    },
    (message) => toast.error(message),
  );

  async function handleDeleteImage() {
    setUploading(true);
    try {
      await deleteFile(image);
      onImageChange("");
    } catch {
      toast.error("Sometings wrong when deleting");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={`relative isolate aspect-square ${rootClassName}`}>
      <ImageUploader onImageChange={setImage} ref={imageRef} />
      <Button
        disabled={uploading}
        className={`relative h-full w-full overflow-hidden ${className}`}
        variant="outline"
        onClick={() => imageRef.current?.click()}
      >
        {uploading ? (
          <LucideLoaderCircle className="animate-spin" />
        ) : image === "" ? (
          "Gambar"
        ) : (
          <Img src={image} alt="" />
        )}
      </Button>
      {image !== "" && (
        <Button
          disabled={uploading}
          className="absolute right-2 top-2 z-50 h-5 w-5 text-white"
          variant={"destructive"}
          size={"icon"}
          onClick={handleDeleteImage}
        >
          <LucideDot />
        </Button>
      )}
    </div>
  );
};

export default ImageButton;
