import React from "react";
import Resi from "./resi";

async function Page({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  return <Resi id={id} />;
}

export default Page;
