import React from "react";

import {
  Sheet as S,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useDialog } from "@/hooks/useDialog";

const ControlledSheet: React.FC<{
  trigger?: (trigger: () => void) => React.ReactNode;
  title: string;
  description?: string;
  content: (dissmiss: () => void) => React.ReactNode;
}> = ({ trigger, title, description, content, ...props }) => {
  const dialog = useDialog();
  return (
    <S {...dialog.props}>
      {trigger?.(dialog.trigger)}
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        {content(dialog.dismiss)}
      </SheetContent>
    </S>
  );
};

export default ControlledSheet;
