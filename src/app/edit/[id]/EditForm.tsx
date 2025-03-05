"use client";

import Product from "@/app/product";
import { observer } from "@legendapp/state/react";
import React from "react";

const EditForm: React.FC<{ id: string }> = ({ id }) => {
  return (
    <div>
      <Product id={id} />
    </div>
  );
};

export default observer(EditForm);
