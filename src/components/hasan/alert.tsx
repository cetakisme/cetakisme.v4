import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import type { DialogProps } from "@radix-ui/react-dialog";

const Alert: React.FC<
  {
    title: string;
    description: string;
    renderAction?: () => React.ReactNode;
    renderCancel?: () => React.ReactNode;
  } & DialogProps
> = ({ title, description, renderAction, renderCancel, ...props }) => {
  return (
    <AlertDialog {...props}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild className="text-black">
            {renderCancel?.() ?? "Tidak"}
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            {renderAction?.() ?? "Ya"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default Alert;
