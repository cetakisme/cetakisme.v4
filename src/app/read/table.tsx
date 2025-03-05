import RenderList from "@/components/hasan/render-list";
import { Button } from "@/components/ui/button";
import { type DB } from "@/lib/supabase/supabase";
import { generateId, products$ } from "@/server/local/db";
import { asList } from "@/server/local/utils";
import { observer, use$ } from "@legendapp/state/react";
import Link from "next/link";
import React from "react";

const Table = () => {
  const products = use$(products$);

  return (
    <div>
      <RenderList
        data={asList<DB<"Product">>(products)}
        render={(data) => (
          <Button asChild>
            <Link href={`/edit/${data.id}`}>{data.name}</Link>
          </Button>
        )}
      />
      <Button
        onClick={() => {
          const id = generateId();
          products$[id]!.set({
            id: id,
            name: "Produk Baru",
            active: true,
            deleted: false,
            base_price: 0,
            images: ["", "", "", "", ""],
          });
        }}
      >
        Tambah Produk Baru
      </Button>
    </div>
  );
};

export default observer(Table);
