import Edit from "./Edit";
import { supabase } from "@/lib/supabase/supabase";
import Authenticated from "@/components/hasan/auth/authenticated";
import AuthFallback from "@/components/hasan/auth/auth-fallback";

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
  return (
    <Authenticated permission="produk-update" fallback={AuthFallback}>
      <Edit id={id} />
    </Authenticated>
  );
}

export default Page;
