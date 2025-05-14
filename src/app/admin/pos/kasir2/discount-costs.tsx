"use client";

import RenderList from "@/components/hasan/render-list";
import React from "react";
import { useKasir } from "./useKasir";
import { Label } from "@/components/ui/label";
import { toRupiah } from "@/lib/utils";
import { getDiscount } from "./kasir-product-table";

const DiscountCosts = () => {
  const discounts = useKasir((s) => s.discounts);
  const costs = useKasir((s) => s.costs);

  const deleteDiscount = useKasir((s) => s.deleteDiscount);
  const deleteCost = useKasir((s) => s.deleteCost);

  const totalProduct = useKasir((s) => s.totalProduct);
  const totalDiscount = useKasir((s) => s.totalDiscount);

  return (
    <div className="space-y-4">
      <div>
        <Label>Diskon</Label>
        <RenderList
          data={discounts}
          renderEmpty={() => <>-</>}
          getKey={(data) => data.id}
          render={(data) => (
            <div
              className="flex justify-between p-2 hover:bg-destructive hover:text-white"
              onClick={() => deleteDiscount(data)}
            >
              <Label>{data.name}</Label>
              <Label>
                {toRupiah(getDiscount(data.type, totalProduct, data.value))}
              </Label>
            </div>
          )}
        />
      </div>
      <div className="">
        <Label>Biaya Tambahan</Label>
        <RenderList
          data={costs}
          renderEmpty={() => <>-</>}
          getKey={(data) => data.id}
          render={(data) => (
            <div
              className="flex justify-between p-2 hover:bg-destructive hover:text-white"
              onClick={() => deleteCost(data)}
            >
              <Label>{data.name}</Label>
              <Label>
                {toRupiah(
                  getDiscount(
                    data.type,
                    totalProduct - totalDiscount,
                    data.value,
                  ),
                )}
              </Label>
            </div>
          )}
        />
      </div>
    </div>
  );
};

export default DiscountCosts;
