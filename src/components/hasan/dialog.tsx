import React from "react";
import {
  Dialog as D,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "../ui/dialog";
import { type DialogProps } from "@radix-ui/react-dialog";

const Dialog: React.FC<
  {
    renderCancel?: () => React.ReactNode;
    renderAction?: () => React.ReactNode;
    renderTrigger?: () => React.ReactNode;
    title: string;
    description: () => React.ReactNode;
    className?: string;
  } & DialogProps
> = ({
  title,
  description,
  className,
  renderCancel,
  renderAction,
  renderTrigger,
  children,
  ...props
}) => {
  return (
    <D {...props}>
      {renderTrigger && (
        <DialogTrigger asChild>{renderTrigger()}</DialogTrigger>
      )}
      <DialogContent className={className}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description()}</DialogDescription>
        </DialogHeader>
        {children}
        <DialogFooter>
          {renderCancel?.()}
          {renderAction?.()}
        </DialogFooter>
      </DialogContent>
    </D>
  );
};

export default Dialog;
