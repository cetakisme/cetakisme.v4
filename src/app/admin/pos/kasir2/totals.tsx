"use client";

import React from "react";
import { useKasir } from "./useKasir";
import { toRupiah } from "@/lib/utils";
import { getDiscount } from "./kasir-product-table";
import { Label } from "@/components/ui/label";

const Totals = () => {
  const products = useKasir((s) => s.products);
  const discounts = useKasir((s) => s.discounts);
  const costs = useKasir((s) => s.costs);

  const totalProducts = useKasir((s) => s.totalProduct);
  const totalDiscount = useKasir((s) => s.totalDiscount);
  const totalCost = useKasir((s) => s.totalCost);

  const setTotalProduct = useKasir((s) => s.setTotalProduct);
  const setTotalDiscount = useKasir((s) => s.setTotalDiscount);
  const setTotalCost = useKasir((s) => s.setTotalCost);

  React.useEffect(
    () =>
      setTotalProduct(
        products.reduce((sum, next) => {
          const price =
            (next.discount.isDiscounted
              ? next.price -
                getDiscount(next.discount.type, next.price, next.discount.value)
              : next.price) +
            next.addon.reduce((sum, next) => sum + next.price, 0);
          return sum + price * next.qty;
        }, 0),
      ),
    [products],
  );

  React.useEffect(
    () =>
      setTotalDiscount(
        discounts.reduce(
          (sum, next) =>
            sum + getDiscount(next.type, totalProducts, next.value),
          0,
        ),
      ),
    [totalProducts, discounts],
  );

  React.useEffect(
    () =>
      setTotalCost(
        costs.reduce(
          (sum, next) =>
            sum +
            getDiscount(next.type, totalProducts - totalDiscount, next.value),
          0,
        ),
      ),
    [totalDiscount, costs],
  );

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <Label>Total :</Label>
        <Label>{toRupiah(totalProducts)}</Label>
      </div>
      <div className="flex justify-between">
        <Label>Diskon :</Label>
        <Label>- {toRupiah(totalDiscount)}</Label>
      </div>
      <div className="flex justify-between">
        <Label>Biaya Tambahan :</Label>
        <Label>{toRupiah(totalCost)}</Label>
      </div>
      <div className="flex justify-between">
        <Label>Total Bayar :</Label>
        <Label>{toRupiah(totalProducts - totalDiscount + totalCost)}</Label>
      </div>
    </div>
  );
};

export default Totals;
