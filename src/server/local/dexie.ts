import type {
  Addon,
  AddonValue,
  Attribute,
  Product,
  ProductAttribteValue,
  ProductAttribute,
  ProductToAddon,
  ProductVariant,
} from "@prisma/client";
import Dexie, { type EntityTable } from "dexie";
import relationships from "dexie-relationships";

const dexie = new Dexie("FriendsDatabase", {
  addons: [relationships],
}) as Dexie & {
  products: EntityTable<
    Omit<Product, "created_at">,
    "id" // primary key "id" (for the typings only)
  >;
  addons: EntityTable<Addon, "id">;
  addonValues: EntityTable<AddonValue, "id">;
  attributes: EntityTable<Attribute, "id">;
  productAttributes: EntityTable<ProductAttribute, "id">;
  productAttributeValues: EntityTable<ProductAttribteValue, "id">;
  productToAddons: EntityTable<ProductToAddon, "id">;
  productVariants: EntityTable<ProductVariant, "id">;
};

// Schema declaration:
dexie.version(1).stores({
  products: "id, name, deleted",
  addons: "id, name, addon_id, deleted",
  addonValues: "id, name, addon_id, deleted",
  attributes: "id, name, deleted",
  productAttributes: "id, name, attribute_id, product_id, deleted",
  productAttributeValues: "id, name, attribute_id, deleted",
  productToAddons: "id, product_id, attribute_id, deleted",
  productVariants: "id, product_id, deleted",
});

export { dexie };
