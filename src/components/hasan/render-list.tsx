"use client";

import { Button } from "@/components/ui/button";
import React from "react";

export default function RenderList<TData>({
  data,
  render,
  ...props
}: React.ComponentProps<"div"> & {
  data: TData[] | undefined;
  render: (data: TData, index: number) => React.ReactNode;
}) {
  if (!data) {
    return (
      <Button className="w-full" disabled={true}>
        Loading...
      </Button>
    );
  }
  return (
    <div {...props}>
      {data.map((x, i) => (
        <React.Fragment key={i}>{render(x, i)}</React.Fragment>
      ))}
    </div>
  );
}

export function List<TData>({
  data,
  render,
  ...props
}: {
  data: TData[] | undefined;
  render: (data: TData, index: number) => React.ReactNode;
}) {
  if (!data) {
    return (
      <Button className="w-full" disabled={true}>
        Loading...
      </Button>
    );
  }
  return (
    <>
      {data.map((x, i) => (
        <React.Fragment key={i}>{render(x, i)}</React.Fragment>
      ))}
    </>
  );
}
