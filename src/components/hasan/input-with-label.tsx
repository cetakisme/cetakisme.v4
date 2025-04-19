import React from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";

const InputWithLabel: React.FC<{
  label: string;
  inputProps?: React.ComponentProps<"input">;
  rootProps?: React.ComponentProps<"div">;
}> = ({ label, inputProps, rootProps }) => {
  return (
    <div {...rootProps}>
      <Label>{label}</Label>
      <Input {...inputProps} />
    </div>
  );
};

export default InputWithLabel;
