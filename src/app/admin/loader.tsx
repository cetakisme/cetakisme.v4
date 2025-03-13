"use client";
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
} from "@/server/local/db";
import { whenReady } from "@legendapp/state";
import { useMount } from "@legendapp/state/react";
import React from "react";

const Loader = () => {
  useMount(() => {
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
  });
  return <></>;
};

export default Loader;
