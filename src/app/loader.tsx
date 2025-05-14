"use client";
import { authClient } from "@/lib/better-auth/auth-client";
import { user$ } from "@/server/local/auth";
import {
  absensi$,
  addons$,
  addonValues$,
  carouselSettings$,
  categorySettings$,
  costs$,
  customer$,
  discounts$,
  expenses$,
  expenseTypes$,
  gallerySettings$,
  incomes$,
  incomeTypes$,
  ingoingStockTypes$,
  materials$,
  orderHistories$,
  orderMaterials$,
  orderProducts$,
  orders$,
  orderVariantAddons$,
  orderVariants$,
  productAttribute$,
  productAttributeValue$,
  productPopularSettings$,
  products$,
  productToAddons$,
  productVariants$,
  receiptModels$,
  receiptSettings$,
  roles$,
  supplierContactPersons$,
  suppliers$,
  testimonySettings$,
  users$,
  websiteSettings$,
} from "@/server/local/db";
import { dexie } from "@/server/local/dexie";
import { whenReady } from "@legendapp/state";
import { useMount } from "@legendapp/state/react";
import type { UserWithRole } from "better-auth/plugins/admin";
import React from "react";

const Loader = () => {
  const { data: session } = authClient.useSession();

  React.useEffect(() => {
    if (!session) return;
    user$.set(session.user as UserWithRole);
  }, [session]);

  useMount(async () => {
    await dexie.transaction("rw", dexie.tables, async () => {
      for (const table of dexie.tables) {
        await table.clear();
      }
    });

    void whenReady(productVariants$.get());
    void whenReady(productAttributeValue$.get());
    void whenReady(productToAddons$.get());
    void whenReady(addons$.get());
    void whenReady(addonValues$.get());
    void whenReady(productAttribute$.get());
    void whenReady(products$.get());
    void whenReady(carouselSettings$.get());
    void whenReady(categorySettings$.get());
    void whenReady(gallerySettings$.get());
    void whenReady(testimonySettings$.get());
    void whenReady(productPopularSettings$.get());
    void whenReady(websiteSettings$.get());
  });
  return <></>;
};

export default Loader;
