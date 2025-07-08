import React from "react";

const Title: React.FC<React.PropsWithChildren & { className?: string }> = ({
  children,
  className,
}) => {
  return (
    <h1
      className={`mb-4 px-4 pt-4 text-2xl font-bold lg:px-0 lg:pt-0 lg:text-4xl ${className}`}
    >
      {children}
    </h1>
  );
};

export default Title;
