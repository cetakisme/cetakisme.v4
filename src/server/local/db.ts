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

export const roles$ = createSupabaseObservable({
  collection: "Role",
  transform: async (value) => {
    await dexie.roles.put({ ...value, permissions: value.permissions ?? [] });
    return value;
  },
});

export const users$ = createSupabaseObservable({
  collection: "CustomUser",
  transform: async (value) => {
    await dexie.users.put(value);
    return value;
  },
});

export const materials$ = createSupabaseObservable({
  collection: "Material",
  transform: async (value) => {
    await dexie.materials.put(value);
    return value;
  },
});

export const orderMaterials$ = createSupabaseObservable({
  collection: "OrderMaterial",
  transform: async (value) => {
    await dexie.orderMaterials.put({
      ...value,
      createdAt: value.createdAt ? new Date(value.createdAt) : new Date(),
    });
    return value;
  },
});

export const orderProducts$ = createSupabaseObservable({
  collection: "OrderProduct",
  transform: async (value) => {
    await dexie.orderProducts.put({
      ...value,
      createdAt: value.createdAt ? new Date(value.createdAt) : new Date(),
    });
    return value;
  },
});

export const suppliers$ = createSupabaseObservable({
  collection: "Supplier",
  transform: async (value) => {
    await dexie.suppliers.put(value);
    return value;
  },
});

export const supplierContactPersons$ = createSupabaseObservable({
  collection: "SupplierContactPerson",
  transform: async (value) => {
    await dexie.supplierContactPersons.put(value);
    return value;
  },
});

export const incomes$ = createSupabaseObservable({
  collection: "Income",
  transform: async (value) => {
    await dexie.income.put({
      ...value,
      createdAt: value.createdAt ? new Date(value.createdAt) : new Date(),
      updatedAt: new Date(value.updatedAt),
    });
    return value;
  },
});

export const expenses$ = createSupabaseObservable({
  collection: "Expense",
  transform: async (value) => {
    await dexie.expense.put({
      ...value,
      createdAt: value.createdAt ? new Date(value.createdAt) : new Date(),
      updatedAt: new Date(value.updatedAt),
    });
    return value;
  },
});

export const orderHistories$ = createSupabaseObservable({
  collection: "OrderHistory",
  transform: async (value) => {
    await dexie.orderHistory.put({
      ...value,
      created_at: new Date(value.created_at),
    });
    return value;
  },
});

export const absensi$ = createSupabaseObservable({
  collection: "Absensi",
  transform: async (value) => {
    await dexie.absensi.put({
      ...value,
      enter: new Date(value.enter),
      exit: value.exit ? new Date(value.exit) : null,
    });
    return value;
  },
});

export const receiptSettings$ = createSupabaseObservable({
  collection: "ReceiptSettings",
  transform: async (value) => {
    await dexie.receiptSettings.put(value);
    return value;
  },
});

export const receiptModels$ = createSupabaseObservable({
  collection: "ReceiptModel",
  transform: async (value) => {
    await dexie.receiptModel.put(value);
    return value;
  },
});

export const orderStatuses = ["pending", "desain", "ready", "selesai", "void"];
