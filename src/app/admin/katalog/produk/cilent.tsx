"use client";
import React from "react";
import dynamic from "next/dynamic";
const Table = dynamic(() => import("./read/table"), {
  ssr: false,
});

const CilentPage = () => {
  return <Table />;
};

export default CilentPage;
