"use client";

import Authenticated from "@/components/hasan/auth/authenticated";

import React from "react";
import Orderan, { AllOrderan } from "./orderan";
import { ContentLayout } from "@/components/admin-panel/content-layout";

const Order: React.FC<{ status: string }> = ({ status }) => {
  return (
    <ContentLayout title={status}>
      <Authenticated permission={status}>
        {status === "semua" ? <AllOrderan /> : <Orderan status={status} />}
      </Authenticated>
    </ContentLayout>
  );
};

export default Order;
