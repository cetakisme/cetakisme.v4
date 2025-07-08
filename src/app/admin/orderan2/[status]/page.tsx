import React from "react";
import Order from "./order";

async function Page({ params }: { params: Promise<{ status: string }> }) {
  const status = (await params).status;
  return <Order status={status} />;
}

export default Page;
