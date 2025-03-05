import { observable } from "@legendapp/state";
import {
  configureSyncedSupabase,
  syncedSupabase,
} from "@legendapp/state/sync-plugins/supabase";
import { supabase } from "@/lib/supabase/supabase";
import { v4 as uuidv4 } from "uuid";

export const generateId = () => uuidv4();

configureSyncedSupabase({
  generateId,
});

export const products$ = observable(
  syncedSupabase({
    supabase,
    collection: "Product",
    select: (from) => from.select("*").eq("deleted", false),
    actions: ["read", "create", "update"],
    fieldDeleted: "deleted",
    realtime: true,
  }),
);

// export const productAttributes$ = observable(
//   syncedSupabase({
//     supabase,
//     collection: "ProductAttribute",
//     select: (from) => from.select("*").eq("deleted", false),
//     actions: ["read", "create", "update"],
//     fieldDeleted: "deleted",
//     realtime: true,
//   }),
// );

// export const productAttributeValues$ = observable(
//   syncedSupabase({
//     supabase,
//     collection: "ProductAttributeValue",
//     select: (from) => from.select("*").eq("deleted", false),
//     actions: ["read", "create", "update"],
//     fieldDeleted: "deleted",
//     realtime: true,
//   }),
// );

export const addons$ = observable(
  syncedSupabase({
    supabase,
    collection: "Addon",
    select: (from) => from.select("*").eq("deleted", false),
    actions: ["read", "create", "update"],
    fieldDeleted: "deleted",
    realtime: true,
  }),
);

export const productToAddons$ = observable(
  syncedSupabase({
    supabase,
    collection: "ProductToAddon",
    select: (from) => from.select("*"),
    actions: ["read", "create", "update"],
    fieldDeleted: "deleted",
    realtime: true,
  }),
);

// export const addonValues$ = observable(
//   syncedSupabase({
//     supabase,
//     collection: "AddonValue",
//     select: (from) => from.select("*").eq("deleted", false),
//     actions: ["read", "create", "update"],
//     fieldDeleted: "deleted",
//     realtime: true,
//   }),
// );

// export const attributes$ = observable(
//   syncedSupabase({
//     supabase,
//     collection: "Attribute",
//     select: (from) => from.select("*").eq("deleted", false),
//     actions: ["read", "create", "update"],
//     fieldDeleted: "deleted",
//     realtime: true,
//   }),
// );

// export const colors$ = observable(
//   syncedSupabase({
//     supabase,
//     collection: "Color",
//     select: (from) => from.select("*").eq("deleted", false),
//     actions: ["read", "create", "update"],
//     fieldDeleted: "deleted",
//     realtime: true,
//   }),
// );
