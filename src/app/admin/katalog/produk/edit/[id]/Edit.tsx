"use client";
import AuthFallback from "@/components/hasan/auth/auth-fallback";
import Authenticated from "@/components/hasan/auth/authenticated";
import dynamic from "next/dynamic";
const EditForm = dynamic(() => import("./EditForm"), { ssr: false });

import React from "react";

const Edit: React.FC<{ id: string }> = ({ id }) => {
  return (
    <Authenticated permission="produk-update" fallback={AuthFallback}>
      <EditForm id={id} />
    </Authenticated>
  );
};

export default Edit;
