"use client";

import Navbar from "@/components/hasan/navbar";
import React from "react";
import FilterSection from "@/components/hasan/filter-section";
import { useLiveQuery } from "dexie-react-hooks";
import { dexie } from "@/server/local/dexie";

const Page = () => {
  const products = useLiveQuery(() =>
    dexie.products
      .orderBy("name")
      .filter((x) => x.active)
      .toArray(),
  );

  return (
    <section className="mx-auto max-w-5xl">
      <div className="sticky top-0 z-20 mx-auto max-w-5xl">
        <Navbar />
      </div>
      <FilterSection products={products ?? []} />
    </section>
  );
};

export default Page;
