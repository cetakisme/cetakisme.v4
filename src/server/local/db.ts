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
      onError: (error) => console.log(error.message),
      transform: {
        load: opts.transform,
        save: opts.transform,
      },
      actions: ["read", "create", "update"],
      fieldDeleted: "deleted",
      realtime: true,
      // as: "Map",
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
    await dexie.costs.put(value);
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
      totalHour: new Date(value.totalHour),
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

export const incomeTypes$ = createSupabaseObservable({
  collection: "IncomeType",
  transform: async (value) => {
    await dexie.incomeTypes.put(value);
    return value;
  },
});

export const expenseTypes$ = createSupabaseObservable({
  collection: "ExpenseType",
  transform: async (value) => {
    await dexie.expenseTypes.put(value);
    return value;
  },
});

export const ingoingStockTypes$ = createSupabaseObservable({
  collection: "IngoingStockType",
  transform: async (value) => {
    await dexie.ingoingStockTypes.put(value);
    return value;
  },
});

export const categorySettings$ = createSupabaseObservable({
  collection: "CategorySetting",
  transform: async (value) => {
    await dexie.categorySettings.put(value);
    return value;
  },
});

export const carouselSettings$ = createSupabaseObservable({
  collection: "CarouselSetting",
  transform: async (value) => {
    await dexie.carouselSettings.put(value);
    return value;
  },
});

export const gallerySettings$ = createSupabaseObservable({
  collection: "GallerySetting",
  transform: async (value) => {
    await dexie.gallerySettings.put(value);
    return value;
  },
});

export const testimonySettings$ = createSupabaseObservable({
  collection: "TestimonySetting",
  transform: async (value) => {
    await dexie.testimonySettings.put(value);
    return value;
  },
});

export const productPopularSettings$ = createSupabaseObservable({
  collection: "PopularProductSetting",
  transform: async (value) => {
    await dexie.productPopulerSettings.put(value);
    return value;
  },
});

export const websiteSettings$ = createSupabaseObservable({
  collection: "WebsiteSetting",
  transform: async (value) => {
    await dexie.websiteSettings.put(value);
    return value;
  },
});

export const savedOrders$ = createSupabaseObservable({
  collection: "SavedOrder",
  transform: async (value) => {
    await dexie.savedOrders.put({
      ...value,
      costsId: value.costsId ?? [],
      savedOrderProductsId: value.savedOrderProductsId ?? [],
      discountsId: value.discountsId ?? [],
      creteadAt: new Date(value.creteadAt),
    });
    return value;
  },
});

export const savedOrderProducts$ = createSupabaseObservable({
  collection: "SavedOrderProduct",
  transform: async (value) => {
    await dexie.savedOrderProducts.put({ ...value, addon: value.addon ?? [] });
    return value;
  },
});

export const savedDiscounts$ = createSupabaseObservable({
  collection: "SavedDiscount",
  transform: async (value) => {
    await dexie.savedDiscounts.put(value);
    return value;
  },
});

export const savedCosts$ = createSupabaseObservable({
  collection: "SavedCost",
  transform: async (value) => {
    await dexie.savedCosts.put(value);
    return value;
  },
});

export const newOrders$ = createSupabaseObservable({
  collection: "NewOrder",
  transform: async (value) => {
    await dexie.newOrders.put({
      ...value,
      savedOrdersId: value.savedOrdersId ?? [],
      deadline: value.deadline ? new Date(value.deadline) : new Date(),
      createdAt: new Date(value.createdAt),
    });
    return value;
  },
});

export const savedAddons$ = createSupabaseObservable({
  collection: "SavedAddon",
  transform: async (value) => {
    await dexie.savedAddons.put(value);
    return value;
  },
});

export const exitItem$ = createSupabaseObservable({
  collection: "ExitItem",
  transform: async (value) => {
    await dexie.exitItem.put({
      ...value,
      createdAt: new Date(value.createdAt),
    });
    return value;
  },
});

export const orderStatuses = [
  "pending",
  "desain",
  "ready",
  "selesai",
  "void",
] as const;

export const paymentStatuses = ["DP", "CICIL", "LUNAS"] as const;

export const expensetype = ["produk", "bahan", "beli vendor"] as const;
