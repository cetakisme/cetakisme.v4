"use client";

import { Button } from "@/components/ui/button";
import React from "react";

export default function RenderList<TData>({
  data,
  render,
  renderEmpty,
  getKey,
  ...props
}: React.ComponentProps<"div"> & {
  data: TData[] | undefined;
  renderEmpty?: () => React.ReactNode;
  render: (data: TData, index: number) => React.ReactNode;
  getKey?: (data: TData, index: number) => string | number;
}) {
  if (!data) {
    return (
      <Button className="w-full justify-start" variant="ghost" disabled={true}>
        Loading...
      </Button>
    );
  }
  return (
    <div {...props}>
      {data.length > 0 ? (
        data.map((x, i) => (
          <React.Fragment key={getKey?.(x, i) ?? i}>
            {render(x, i)}
          </React.Fragment>
        ))
      ) : (
        <>{renderEmpty?.()}</>
      )}
    </div>
  );
}

export function List<TData extends { id: string }>({
  data,
  render,
  renderEmpty,
}: {
  data: TData[] | undefined;
  render: (data: TData, index: number) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
}) {
  if (!data) {
    return renderEmpty?.();
  }
  return (
    <>
      {data.map((x, i) => (
        <React.Fragment key={x.id}>{render(x, i)}</React.Fragment>
      ))}
    </>
  );
}
