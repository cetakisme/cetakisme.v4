// import { products$ } from "@/server/local/db";
import Edit from "./Edit";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  return <Edit id={id} />;
}
