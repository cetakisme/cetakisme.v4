import React from "react";

const Conditional: React.FC<
  { condition: (() => boolean) | boolean } & React.PropsWithChildren
> = ({ condition, children }) => {
  const shouldRender =
    typeof condition === "function" ? condition() : condition;

  if (!shouldRender) {
    return null;
  }

  return <>{children}</>;
};

export default Conditional;
