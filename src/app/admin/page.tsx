"use client";

import { user$ } from "@/server/local/auth";
import { Memo } from "@legendapp/state/react";
import React from "react";

const Page = () => {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">
        Selamat Datang{" "}
        <span className="rounded-lg bg-black px-4 py-2 text-white">
          <Memo>{user$.name}</Memo>
        </span>
      </h1>
    </div>
  );
};

export default Page;
