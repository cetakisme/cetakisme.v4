"use client";

import { ContentLayout } from "@/components/admin-panel/content-layout";
import { user$ } from "@/server/local/auth";
import { Memo } from "@legendapp/state/react";
import React from "react";

const Page = () => {
  return (
    <ContentLayout title="Home">
      <h1 className="flex flex-col text-xl font-bold lg:flex-row lg:text-4xl">
        <span>Selamat Datang</span>
        <span className="w-fit rounded-lg bg-black px-4 py-2 text-white">
          <Memo>{() => user$.name.get()}</Memo>
        </span>
      </h1>
    </ContentLayout>
  );
};

export default Page;
