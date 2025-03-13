import { observable } from "@legendapp/state";
import {
  configureSyncedSupabase,
  syncedSupabase,
} from "@legendapp/state/sync-plugins/supabase";
import { type DB, supabase, type TableName } from "@/lib/supabase/supabase";
import { v4 as uuidv4 } from "uuid";
import { dexie } from "./dexie";

export const generateId = () => uuidv4();

configureSyncedSupabase({
  generateId,
});

function createSupabaseObservable<TCollection extends TableName>(opts: {
  collection: TCollection;
  transform:
    | ((data: DB<TCollection>) => DB<TCollection>)
    | ((data: DB<TCollection>) => Promise<DB<TCollection>>);
}) {
  return observable(
    syncedSupabase({
      supabase,
      collection: opts.collection,
      select: (from) => from.select("*"),
      transform: {
        load: opts.transform,
        save: opts.transform,
      },
      actions: ["read", "create", "update"],
      fieldDeleted: "deleted",
      realtime: true,
    }),
  );
}

export const products$ = createSupabaseObservable({
  collection: "Product",
  transform: async (value) => {
    await dexie.products.put({
      ...value,
      images: value.images ?? [],
      created_at: new Date(value.created_at),
    });
    return value;
  },
});

export const addons$ = createSupabaseObservable({
  collection: "Addon",
  transform: async (value) => {
    await dexie.addons.put(value);
    return value;
  },
});

export const productToAddons$ = createSupabaseObservable({
  collection: "ProductToAddon",
  transform: async (value) => {
    await dexie.productToAddons.put(value);
    return value;
  },
});

export const attributes$ = createSupabaseObservable({
  collection: "Attribute",
  transform: async (value) => {
    await dexie.attributes.put(value);
    return value;
  },
});

export const productAttribute$ = createSupabaseObservable({
  collection: "ProductAttribute",
  transform: async (value) => {
    await dexie.productAttributes.put(value);
    return value;
  },
});

export const productAttributeValue$ = createSupabaseObservable({
  collection: "ProductAttribteValue",
  transform: async (value) => {
    await dexie.productAttributeValues.put(value);
    return value;
  },
});

export const productVariants$ = createSupabaseObservable({
  collection: "ProductVariant",
  transform: async (value) => {
    await dexie.productVariants.put(value);
    return value;
  },
});

export const addonValues$ = createSupabaseObservable({
  collection: "AddonValue",
  transform: async (value) => {
    await dexie.addonValues.put(value);
    return value;
  },
});

export const customer$ = createSupabaseObservable({
  collection: "Customer",
  transform: async (value) => {
    await dexie.customers.put(value);
    return value;
  },
});

export const discounts$ = createSupabaseObservable({
  collection: "Discount",
  transform: async (value) => {
    await dexie.discounts.put(value);
    return value;
  },
});

export const costs$ = createSupabaseObservable({
  collection: "Cost",
  transform: async (value) => {
    await dexie.costs.put(value);
    return value;
  },
});

export const orders$ = createSupabaseObservable({
  collection: "Order",
  transform: async (value) => {
    await dexie.orders.put({
      ...value,
      created_at: new Date(value.created_at),
      deadline: value.deadline ? new Date(value.deadline) : null,
    });
    return value;
  },
});

export const orderVariants$ = createSupabaseObservable({
  collection: "OrderVariant",
  transform: async (value) => {
    await dexie.orderVariants.put(value);
    return value;
  },
});

export const orderVariantAddons$ = createSupabaseObservable({
  collection: "OrderVariantAddon",
  transform: async (value) => {
    await dexie.orderVariantAddons.put(value);
    return value;
  },
});
