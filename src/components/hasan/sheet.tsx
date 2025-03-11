import React from "react";

import {
  Sheet as S,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { type DialogProps } from "@radix-ui/react-dialog";

const Sheet: React.FC<
  {
    trigger?: () => React.ReactNode;
    title: string;
    description?: string;
    content: () => React.ReactNode;
  } & DialogProps
> = ({ trigger, title, description, content, ...props }) => {
  return (
    <S {...props}>
      {trigger && <SheetTrigger asChild>{trigger()}</SheetTrigger>}
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        {content()}
      </SheetContent>
    </S>
  );
};

export default Sheet;
