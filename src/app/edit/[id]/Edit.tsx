"use client";
import dynamic from "next/dynamic";
const EditForm = dynamic(() => import("./EditForm"), { ssr: false });

import React from "react";

const Edit: React.FC<{ id: string }> = ({ id }) => {
  return <EditForm id={id} />;
};

export default Edit;
