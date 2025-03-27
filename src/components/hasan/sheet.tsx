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
    style?: React.CSSProperties;
  } & DialogProps
> = ({ trigger, title, description, content, style, ...props }) => {
  return (
    <S {...props}>
      {trigger && <SheetTrigger asChild>{trigger()}</SheetTrigger>}
      <SheetContent style={style}>
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
