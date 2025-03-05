"use client";
import dynamic from "next/dynamic";
const Table = dynamic(() => import("./read/table"), { ssr: false });

export default function HomePage() {
  return (
    <div>
      <Table />
    </div>
  );
}
