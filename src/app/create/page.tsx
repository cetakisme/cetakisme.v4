"use client";

import React from "react";
import dynamic from "next/dynamic";
import { generateId } from "@/server/local/utils";
const Product = dynamic(() => import("@/app/product"), {
  ssr: false,
});

const Page = () => {
  return (
    <div>
      {/* <Product
        product={{
          active: true,
          base_price: 0,
          deleted: false,
          id: generateId(),
          images: ["", "", "", "", ""],
          name: "",
          addons: [],
          attributes: [],
        }}
      /> */}
    </div>
  );
};

export default Page;
