import React from "react";
import {
  Card as C,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

const Card: React.FC<
  { title: string; description: string } & React.PropsWithChildren &
    React.ComponentProps<"div">
> = ({ children, title, description, ...props }) => {
  return (
    <C {...props}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </C>
  );
};

export default Card;
