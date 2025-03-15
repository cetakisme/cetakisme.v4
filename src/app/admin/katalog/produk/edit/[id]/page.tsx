import Edit from "./Edit";
import { supabase } from "@/lib/supabase/supabase";

export async function generateStaticParams() {
  const { data } = await supabase.from("Product").select("id");
  if (!data) {
    return [];
  }

  return data.map((d) => ({
    id: d.id,
  }));
}

async function Page({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  return <Edit id={id} />;
}

export default Page;
