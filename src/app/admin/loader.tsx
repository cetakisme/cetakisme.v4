"use client";
import { authClient } from "@/lib/better-auth/auth-client";
import { user$ } from "@/server/local/auth";
import {
  costs$,
  customer$,
  discounts$,
  orders$,
  orderVariantAddons$,
  orderVariants$,
  productAttribute$,
  productAttributeValue$,
  products$,
  productToAddons$,
  productVariants$,
  roles$,
  users$,
} from "@/server/local/db";
import { dexie } from "@/server/local/dexie";
import { whenReady } from "@legendapp/state";
import { useMount } from "@legendapp/state/react";
import { UserWithRole } from "better-auth/plugins/admin";
import React from "react";

const Loader = () => {
  const { data: session, isPending, refetch } = authClient.useSession();

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
    void whenReady(productVariants$.get());
    void whenReady(productAttributeValue$.get());
    void whenReady(productToAddons$.get());
    void whenReady(productAttribute$.get());
    void whenReady(orders$.get());
    void whenReady(customer$.get());
    void whenReady(products$.get());
    void whenReady(users$.get());
    void whenReady(roles$.get());
  });
  return <></>;
};

export default Loader;
