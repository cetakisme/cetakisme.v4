"use client";

import Authenticated from "@/components/hasan/auth/authenticated";

import React from "react";
import Orderan, { AllOrderan } from "./orderan";

const Order: React.FC<{ status: string }> = ({ status }) => {
  return (
    <Authenticated permission={status}>
      {status === "semua" ? <AllOrderan /> : <Orderan status={status} />}
    </Authenticated>
  );
};

export default Order;
