"use client";

import Authenticated from "@/components/hasan/auth/authenticated";
import dynamic from "next/dynamic";
// const Orderan = dynamic(() => import("./orderan"), { ssr: false });

import React from "react";
import Orderan from "./orderan";

const Order: React.FC<{ status: string }> = ({ status }) => {
  return (
    <Authenticated permission={status}>
      <Orderan status={status} />
    </Authenticated>
  );
};

export default Order;
