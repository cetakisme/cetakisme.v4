import React from "react";

const Title: React.FC<React.PropsWithChildren> = ({ children }) => {
  return <h1 className="mb-4 text-4xl font-bold">{children}</h1>;
};

export default Title;
