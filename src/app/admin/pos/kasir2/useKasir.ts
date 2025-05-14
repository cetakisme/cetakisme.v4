import { dexie } from "@/server/local/dexie";
import { Customer, NewOrder } from "@prisma/client";
import { generateId } from "better-auth";
import { create } from "zustand";

export type Addon = {
  id: string;
  addonId: string;
  addonValueId: string;
  name: string;
  price: number;
};

export type SavedProduct = {
  id: string;
  isCustom: boolean;
  name: string;
  productId: string;
  variantId: string;
  price: number;
  qty: number;
  addon: Addon[];
  discount: {
    isDiscounted: boolean;
    name: string;
    type: "percent" | "flat";
    value: number;
  };
};

export type Discount = {
  id: string;
  name: string;
  type: "percent" | "flat";
  value: number;
};

export type Cost = Discount;

type KasirStore = {
  paid: number;
  setPaid: (value: number) => void;

  method: string;
  setMethod: (value: string) => void;

  gateway: string;
  setGateway: (value: string) => void;

  notes: string;
  setNotes: (value: string) => void;

  products: SavedProduct[];
  setProducts: (data: SavedProduct[]) => void;
  addProduct: (data: SavedProduct) => void;
  deleteProduct: (data: SavedProduct) => void;

  updateQty: (data: SavedProduct, qty: number) => void;
  updatePrice: (data: SavedProduct, price: number) => void;
  updateProductDiscount: (
    data: SavedProduct,
    discount: {
      name: string;
      value: number;
      type: "percent" | "flat";
      isDiscounted: boolean;
    },
  ) => void;
  addAddon: (data: SavedProduct, addon: Addon) => void;
  deleteAddon: (data: SavedProduct, addon: Addon) => void;

  productsToDelete: SavedProduct[];
  setProductsToDelete: (data: SavedProduct[]) => void;
  addProductToDelete: (data: SavedProduct) => void;
  deleteProductToDelete: (data: SavedProduct) => void;

  discounts: Discount[];
  setDiscounts: (data: Discount[]) => void;
  addDiscount: (data: Discount) => void;
  deleteDiscount: (data: Discount) => void;

  discountsToDelete: Discount[];
  setDiscountsToDelete: (data: Discount[]) => void;
  addDiscountToDelete: (data: Discount) => void;
  deleteDiscountToDelete: (data: Discount) => void;

  costs: Cost[];
  setCosts: (data: Cost[]) => void;
  addCost: (data: Cost) => void;
  deleteCost: (data: Cost) => void;

  costsToDelete: Cost[];
  setCostsToDelete: (data: Cost[]) => void;
  addCostToDelete: (data: Cost) => void;
  deleteCostToDelete: (data: Cost) => void;

  customer: Customer | null;
  setCustomer: (data: Customer) => void;

  totalProduct: number;
  setTotalProduct: (value: number) => void;

  totalDiscount: number;
  setTotalDiscount: (value: number) => void;

  totalCost: number;
  setTotalCost: (value: number) => void;

  newOrderId: string;
  savedOrderId: string;

  reset: () => void;
  loadSavedOrder: (order: NewOrder) => void;
  editSavedOrder: (orderId: string) => void;
};

export const useKasir = create<KasirStore>((set) => ({
  newOrderId: generateId(),
  savedOrderId: generateId(),

  paid: 0,
  setPaid: (v) => set({ paid: v }),

  method: "Cash",
  setMethod: (v) => set({ method: v }),

  gateway: "-",
  setGateway: (v) => set({ gateway: v }),

  notes: "",
  setNotes: (v) => set({ notes: v }),

  totalProduct: 0,
  setTotalProduct: (v) => set({ totalProduct: v }),

  totalDiscount: 0,
  setTotalDiscount: (v) => set({ totalDiscount: v }),

  totalCost: 0,
  setTotalCost: (v) => set({ totalCost: v }),

  products: [],
  setProducts: (data) => set({ products: data }),
  addProduct: (data) => set((p) => ({ products: [...p.products, data] })),
  deleteProduct: (data) =>
    set((p) => ({
      products: p.products.filter((x) => x.id !== data.id),
    })),

  updateQty: (data, qty) => {
    set((p) => ({
      products: p.products.map((x) => {
        if (x.id === data.id) {
          return {
            ...x,
            qty: qty,
          };
        } else {
          return x;
        }
      }),
    }));
  },
  updatePrice: (data, price) => {
    set((p) => ({
      products: p.products.map((x) => {
        if (x.id === data.id) {
          return {
            ...x,
            price: price,
          };
        } else {
          return x;
        }
      }),
    }));
  },
  updateProductDiscount: (data, discount) => {
    console.log("Test");
    set((p) => ({
      products: p.products.map((x) => {
        if (x.id === data.id) {
          return { ...x, discount: discount };
        } else {
          return x;
        }
      }),
    }));
  },
  addAddon: (data, addon) => {
    set((p) => ({
      products: p.products.map((x) => {
        if (x.id === data.id) {
          return {
            ...x,
            addon: [...x.addon, addon],
          };
        }

        return x;
      }),
    }));
  },
  deleteAddon: (data, addon) => {
    set((p) => ({
      products: p.products.map((x) => {
        if (x.id === data.id) {
          return {
            ...x,
            addon: x.addon.filter((a) => a.id !== addon.id),
          };
        }

        return x;
      }),
    }));
  },

  productsToDelete: [],
  setProductsToDelete: (data) => set({ productsToDelete: data }),
  addProductToDelete: (data) =>
    set((p) => ({ productsToDelete: [...p.productsToDelete, data] })),
  deleteProductToDelete: (data) =>
    set((p) => ({
      productsToDelete: p.productsToDelete.filter((x) => x.id !== data.id),
    })),

  discounts: [],
  setDiscounts: (data) => set({ discounts: data }),
  addDiscount: (data) => set((p) => ({ discounts: [...p.discounts, data] })),
  deleteDiscount: (data) =>
    set((p) => ({ discounts: p.discounts.filter((x) => x.id !== data.id) })),

  discountsToDelete: [],
  setDiscountsToDelete: (data) => set({ discountsToDelete: data }),
  addDiscountToDelete: (data) =>
    set((p) => ({ discountsToDelete: [...p.discountsToDelete, data] })),
  deleteDiscountToDelete: (data) =>
    set((p) => ({
      discountsToDelete: p.discountsToDelete.filter((x) => x.id !== data.id),
    })),

  costs: [],
  setCosts: (data) => set({ costs: data }),
  addCost: (data) => set((p) => ({ costs: [...p.costs, data] })),
  deleteCost: (data) =>
    set((p) => ({ costs: p.costs.filter((x) => x.id !== data.id) })),

  costsToDelete: [],
  setCostsToDelete: (data) => set({ costsToDelete: data }),
  addCostToDelete: (data) =>
    set((p) => ({ costsToDelete: [...p.costsToDelete, data] })),
  deleteCostToDelete: (data) =>
    set((p) => ({ costs: p.costsToDelete.filter((x) => x.id !== data.id) })),

  customer: null,
  setCustomer: (data) => set({ customer: data }),

  reset: () => {
    set({
      newOrderId: generateId(),
      savedOrderId: generateId(),
      products: [],
      discounts: [],
      costs: [],
      customer: null,
      costsToDelete: [],
      discountsToDelete: [],
      productsToDelete: [],
    });
  },

  loadSavedOrder: (order) => {
    const fetch = async () => {
      const savedOrderId = order.savedOrdersId.at(-1);
      if (!savedOrderId) return;

      const savedOrder = await dexie.savedOrders.get(savedOrderId);
      if (!savedOrder) return;

      const savedOrderProducts = await dexie.savedOrderProducts
        .where("id")
        .anyOf(savedOrder.savedOrderProductsId)
        .filter((x) => !x.deleted)
        .toArray();
      const savedCosts = await dexie.savedCosts
        .where("id")
        .anyOf(savedOrder.costsId)
        .filter((x) => !x.deleted)
        .toArray();
      const savedDiscounts = await dexie.savedDiscounts
        .where("id")
        .anyOf(savedOrder.discountsId)
        .filter((x) => !x.deleted)
        .toArray();
      const customer = await dexie.customers.get(order.customer_id);

      const savedProductsWithAddons = savedOrderProducts.map(async (x) => {
        const addons = await dexie.savedAddons
          .where("id")
          .anyOf(x.addon)
          .filter((x) => !x.deleted)
          .toArray();

        return {
          ...x,
          addon: addons,
        };
      });

      const productsWithAddons = await Promise.all(savedProductsWithAddons);

      set({
        newOrderId: order.id,
        savedOrderId: savedOrderId ?? [],
        products: productsWithAddons.map((x) => ({
          ...x,
          discount: {
            isDiscounted: x.isDiscounted,
            name: x.discountName,
            type: x.discountType as "flat" | "percent",
            value: x.discountValue,
          },
        })),
        discounts:
          savedDiscounts?.map((x) => ({
            ...x,
            type: x.type as "flat" | "percent",
          })) ?? [],
        costs:
          savedCosts?.map((x) => ({
            ...x,
            type: x.type as "flat" | "percent",
          })) ?? [],
        customer: customer ?? null,
        paid: savedOrder.paid,
        notes: order.notes,
        method: savedOrder.method,
        gateway: savedOrder.gateway,
      });
    };

    void fetch();
  },

  editSavedOrder: (orderId) => {
    const fetch = async () => {
      const order = await dexie.newOrders.get(orderId);
      console.log(order?.id);
      if (!order) return;

      const savedOrderId = order.savedOrdersId.at(-1);
      if (!savedOrderId) return;

      const savedOrder = await dexie.savedOrders.get(savedOrderId);
      if (!savedOrder) return;

      const savedOrderProducts = await dexie.savedOrderProducts
        .where("id")
        .anyOf(savedOrder.savedOrderProductsId)
        .filter((x) => !x.deleted)
        .toArray();
      const savedCosts = await dexie.savedCosts
        .where("id")
        .anyOf(savedOrder.costsId)
        .filter((x) => !x.deleted)
        .toArray();
      const savedDiscounts = await dexie.savedDiscounts
        .where("id")
        .anyOf(savedOrder.discountsId)
        .filter((x) => !x.deleted)
        .toArray();
      const customer = await dexie.customers.get(order.customer_id);

      const savedProductsWithAddons = savedOrderProducts.map(async (x) => {
        const addons = await dexie.savedAddons
          .where("id")
          .anyOf(x.addon)
          .filter((x) => !x.deleted)
          .toArray();

        return {
          ...x,
          addon: addons,
        };
      });

      const productsWithAddons = await Promise.all(savedProductsWithAddons);

      set({
        newOrderId: order.id,
        savedOrderId: generateId(),
        products: productsWithAddons.map((x) => ({
          ...x,
          id: generateId(),
          discount: {
            isDiscounted: x.isDiscounted,
            name: x.discountName,
            type: x.discountType as "flat" | "percent",
            value: x.discountValue,
          },
        })),
        discounts:
          savedDiscounts?.map((x) => ({
            ...x,
            id: generateId(),
            type: x.type as "flat" | "percent",
          })) ?? [],
        costs:
          savedCosts?.map((x) => ({
            ...x,
            id: generateId(),
            type: x.type as "flat" | "percent",
          })) ?? [],
        customer: customer ?? null,
        paid: savedOrder.paid,
        notes: order.notes,
        method: savedOrder.method,
        gateway: savedOrder.gateway,
      });
    };

    void fetch();
  },
}));
