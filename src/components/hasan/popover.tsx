import React from "react";
import { Popover as P, PopoverContent, PopoverTrigger } from "../ui/popover";

const Popover: React.FC<{
  renderTrigger?: () => React.ReactNode;
  content: () => React.ReactNode;
}> = ({ renderTrigger, content }) => {
  return (
    <P>
      {renderTrigger && (
        <PopoverTrigger asChild>{renderTrigger()}</PopoverTrigger>
      )}
      <PopoverContent>{content()}</PopoverContent>
    </P>
  );
};

export default Popover;
