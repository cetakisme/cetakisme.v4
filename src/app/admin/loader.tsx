"use client";
import { authClient } from "@/lib/better-auth/auth-client";
import { user$ } from "@/server/local/auth";
import {
  absensi$,
  costs$,
  customer$,
  discounts$,
  exitItem$,
  expenses$,
  expenseTypes$,
  incomes$,
  incomeTypes$,
  ingoingStockTypes$,
  materials$,
  newOrders$,
  orderHistories$,
  orderMaterials$,
  orderProducts$,
  orders$,
  orderVariantAddons$,
  orderVariants$,
  receiptModels$,
  receiptSettings$,
  roles$,
  savedAddons$,
  savedCosts$,
  savedDiscounts$,
  savedOrderProducts$,
  savedOrders$,
  supplierContactPersons$,
  suppliers$,
  users$,
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

    void whenReady(orderVariants$.get());
    void whenReady(orderVariantAddons$.get());
    void whenReady(discounts$.get());
    void whenReady(costs$.get());
    // void whenReady(productVariants$.get());
    // void whenReady(productAttributeValue$.get());
    // void whenReady(productToAddons$.get());
    // void whenReady(addons$.get());
    // void whenReady(addonValues$.get());
    // void whenReady(productAttribute$.get());
    void whenReady(orders$.get());
    void whenReady(customer$.get());
    // void whenReady(products$.get());
    void whenReady(users$.get());
    void whenReady(roles$.get());
    void whenReady(materials$.get());
    void whenReady(orderMaterials$.get());
    void whenReady(orderProducts$.get());
    void whenReady(supplierContactPersons$.get());
    void whenReady(suppliers$.get());
    void whenReady(expenses$.get());
    void whenReady(incomes$.get());
    void whenReady(orderHistories$.get());
    void whenReady(absensi$.get());
    void whenReady(receiptModels$.get());
    void whenReady(receiptSettings$.get());
    void whenReady(expenseTypes$.get());
    void whenReady(incomeTypes$.get());
    void whenReady(ingoingStockTypes$.get());
    void whenReady(newOrders$.get());
    void whenReady(savedAddons$.get());
    void whenReady(savedCosts$.get());
    void whenReady(savedDiscounts$.get());
    void whenReady(savedOrderProducts$.get());
    void whenReady(savedOrders$.get());
    // void whenReady(carouselSettings$.get());
    // void whenReady(categorySettings$.get());
    // void whenReady(gallerySettings$.get());
    // void whenReady(testimonySettings$.get());
    // void whenReady(productPopularSettings$.get());
    void whenReady(exitItem$.get());
  });
  return <></>;
};

export default Loader;
