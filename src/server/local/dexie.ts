import type {
  Absensi,
  Addon,
  AddonValue,
  Attribute,
  CarouselSetting,
  CategorySetting,
  Cost,
  Customer,
  CustomUser,
  Discount,
  Expense,
  ExpenseType,
  GallerySetting,
  Income,
  IncomeType,
  Material,
  Order,
  OrderHistory,
  OrderMaterial,
  OrderProduct,
  OrderVariant,
  OrderVariantAddon,
  PopularProductSetting,
  Product,
  ProductAttribteValue,
  ProductAttribute,
  ProductToAddon,
  ProductVariant,
  ReceiptModel,
  ReceiptSettings,
  Role,
  Supplier,
  SupplierContactPerson,
  TestimonySetting,
  WebsiteSetting,
} from "@prisma/client";
import Dexie, { Entity, type EntityTable } from "dexie";
import relationships from "dexie-relationships";

const dexie = new Dexie("FriendsDatabase", {
  addons: [relationships],
}) as Dexie & {
  products: EntityTable<
    Product,
    "id" // primary key "id" (for the typings only)
  >;
  addons: EntityTable<Addon, "id">;
  addonValues: EntityTable<AddonValue, "id">;
  attributes: EntityTable<Attribute, "id">;
  productAttributes: EntityTable<ProductAttribute, "id">;
  productAttributeValues: EntityTable<ProductAttribteValue, "id">;
  productToAddons: EntityTable<ProductToAddon, "id">;
  productVariants: EntityTable<ProductVariant, "id">;
  discounts: EntityTable<Discount, "id">;
  costs: EntityTable<Cost, "id">;
  orders: EntityTable<Order, "id">;
  orderVariants: EntityTable<OrderVariant, "id">;
  orderVariantAddons: EntityTable<OrderVariantAddon, "id">;
  customers: EntityTable<Customer, "id">;
  users: EntityTable<CustomUser, "id">;
  roles: EntityTable<Role, "id">;
  materials: EntityTable<Material, "id">;
  orderMaterials: EntityTable<OrderMaterial, "id">;
  orderProducts: EntityTable<OrderProduct, "id">;
  orderHistory: EntityTable<OrderHistory, "id">;
  suppliers: EntityTable<Supplier, "id">;
  supplierContactPersons: EntityTable<SupplierContactPerson, "id">;
  income: EntityTable<Income, "id">;
  expense: EntityTable<Expense, "id">;
  absensi: EntityTable<Absensi, "id">;
  receiptSettings: EntityTable<ReceiptSettings, "id">;
  receiptModel: EntityTable<ReceiptModel, "id">;
  incomeTypes: EntityTable<IncomeType, "id">;
  expenseTypes: EntityTable<ExpenseType, "id">;
  ingoingStockTypes: EntityTable<ExpenseType, "id">;
  carouselSettings: EntityTable<CarouselSetting, "id">;
  categorySettings: EntityTable<CategorySetting, "id">;
  gallerySettings: EntityTable<GallerySetting, "id">;
  testimonySettings: EntityTable<TestimonySetting, "id">;
  productPopulerSettings: EntityTable<PopularProductSetting, "id">;
  websiteSettings: EntityTable<WebsiteSetting, "id">;
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
  discounts: "id, orderHistoryId, deleted",
  costs: "id, orderHistoryId, deleted",
  orders: "id, deleted, order_status, payment_status",
  orderVariants: "id, deleted, orderHistoryId, variant_id",
  orderVariantAddons: "id, deleted, orderVariantId, addonValueId",
  customers: "id, deleted",
  users: "id, userId, roleId",
  roles: "id, userId",
  materials: "id",
  orderMaterials:
    "id, orderId, type, materialId, createdAt, [materialId+createdAt]",
  orderProducts:
    "id, orderId, type, variantId, createdAt, [variantId+createdAt]",
  orderHistory: "id, orderId",
  suppliers: "id",
  supplierContactPersons: "id, supplierId",
  income: "id",
  expense: "id",
  absensi: "id, userId, enter",
  receiptSettings: "id",
  receiptModel: "id",
  incomeTypes: "id",
  expenseTypes: "id",
  ingoingStockTypes: "id",
  carouselSettings: "id",
  categorySettings: "id",
  gallerySettings: "id",
  testimonySettings: "id",
  productPopulerSettings: "id",
  websiteSettings: "id",
});

export { dexie };
