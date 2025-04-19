import React from "react";
import Image from "next/image";

const Img: React.FC<{ src: string; alt: string; className?: string }> = ({
  src,
  alt,
  className,
}) => {
  return (
    <Image
      alt={alt}
      src={src}
      fill
      className={`h-full w-full object-cover ${className}`}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  );
};

export default Img;
