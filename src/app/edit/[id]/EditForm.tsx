"use client";

import Product from "@/app/product";
import RenderList from "@/components/hasan/render-list";
import { DB, supabase } from "@/lib/supabase/supabase";
// import {
//   addons$,
//   productAttributes$,
//   productAttributeValues$,
// } from "@/server/local/db";
// import { products$ } from "@/server/local/db";
import { asList } from "@/server/local/utils";
import { whenReady } from "@legendapp/state";
import {
  observer,
  use$,
  useObservable,
  useWhenReady,
} from "@legendapp/state/react";
import React from "react";

const defaultProduct: DB<"Product"> = {
  active: true,
  base_price: 0,
  deleted: false,
  id: "",
  images: [],
  name: "",
};

const EditForm: React.FC<{ id: string }> = ({ id }) => {
  return (
    <div>
      <Product id={id} />
    </div>
  );
};

export default observer(EditForm);
