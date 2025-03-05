// import { products$ } from "@/server/local/db";
import Edit from "./Edit";
import { asList } from "@/server/local/utils";
import { DB } from "@/lib/supabase/supabase";
import { whenReady } from "@legendapp/state";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  return <Edit id={id} />;
}
