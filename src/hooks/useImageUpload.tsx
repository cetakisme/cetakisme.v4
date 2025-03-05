import React, { forwardRef } from "react";

export const useImageUpload = (
  onImageChange: (image: File) => void,
  onError: (message: string) => void,
) => {
  function previewAdditionalImages(files: FileList | null) {
    if (!files) return;
    if (files.length === 0) return;
    if (!validateImage(files, onError)) return;

    const fileArray = Array.from(files);
    if (!fileArray[0]) return;

    onImageChange(fileArray[0]);
  }

  const inputRef = React.useRef<React.ElementRef<"input">>(null);

  return {
    imageRef: inputRef,
    setImage: previewAdditionalImages,
  };
};

const maxImage = 4;
const maxSize = 0.5;

export const sizeByte = (num: number) => {
  return num < 1 ? `${num * 1000} KB` : `${num} MB`;
};

export const validateImage = (
  files: FileList,
  onError: (message: string) => void,
) => {
  if (files.length > maxImage) {
    onError(`Only ${maxImage} images allowed`);
    return false;
  }

  for (const file of files) {
    const requiredMaxSize = 1024 * 1024 * maxSize;
    if (file.size > requiredMaxSize) {
      onError(`File Size Must Be Less Than ${sizeByte(maxSize)}`);
      return false;
    }
  }

  return true;
};

type Props = {
  onImageChange: (e: FileList | null) => void;
};

export const ImageUploader = forwardRef<HTMLInputElement, Props>(
  ({ onImageChange }, ref) => {
    return (
      <input
        ref={ref} // Attach the ref to the input element
        className="hidden"
        type="file"
        accept=".jpg, .webp, .png, .jpeg"
        onChange={(e) => onImageChange(e.target.files)}
      />
    );
  },
);
