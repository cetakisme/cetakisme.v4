import { Combobox } from "@/components/hasan/combobox";
import RenderList, { List } from "@/components/hasan/render-list";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDialog } from "@/hooks/useDialog";
import { DB } from "@/lib/supabase/supabase";
import { isoNow, toRupiah } from "@/lib/utils";
import { customer$, exitItem$, expenses$ } from "@/server/local/db";
import { dexie } from "@/server/local/dexie";
import { generateId } from "@/server/local/utils";
import {
  ExitItem,
  Material,
  NewOrder,
  Product,
  ProductVariant,
  Supplier,
} from "@prisma/client";
import { DialogProps } from "@radix-ui/react-dialog";
import { useLiveQuery } from "dexie-react-hooks";
import { LucidePlus } from "lucide-react";
import React from "react";
import { toast } from "sonner";

export const AturBarangSheet: React.FC<
  DialogProps & { order: NewOrder; onCreate: (data: ExitItem) => void }
> = ({ order, onCreate, ...props }) => {
  const dialog = useDialog();

  const exitItems = useLiveQuery(() =>
    dexie.exitItem
      .where("orderId")
      .equals(order.id)
      .filter((x) => !x.deleted)
      .sortBy("createdAt"),
  );

  return (
    <>
      <Sheet {...props}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Atur Barang</SheetTitle>
          </SheetHeader>
          <Table className="mb-4">
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>HPP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <List
                data={exitItems ?? []}
                render={(data) => (
                  <TableRow
                    onClick={() => {
                      exitItem$[data.id]!.delete();
                      expenses$[data.id]!.delete();
                    }}
                    className="cursor-pointer hover:bg-destructive hover:text-white"
                  >
                    <TableCell>{data.name}</TableCell>
                    <TableCell>{data.qty}</TableCell>
                    <TableCell>{toRupiah(data.hpp * data.qty)}</TableCell>
                  </TableRow>
                )}
              />
              <TableRow>
                <TableCell colSpan={2}>Total Pengeluaran</TableCell>
                <TableCell>
                  {toRupiah(
                    (exitItems ?? []).reduce(
                      (sum, next) => sum + next.hpp * next.qty,
                      0,
                    ),
                  )}
                </TableCell>
              </TableRow>
              <BayaranOrder
                order={order}
                pengeluaran={(exitItems ?? []).reduce(
                  (sum, next) => sum + next.hpp * next.qty,
                  0,
                )}
              />
            </TableBody>
          </Table>
          <Button onClick={dialog.trigger}>
            <LucidePlus />
            Tambah Barang Keluar
          </Button>
        </SheetContent>
      </Sheet>
      <ExitItemDialog
        {...dialog.props}
        order={order}
        onCreated={dialog.dismiss}
      />
    </>
  );
};

const BayaranOrder: React.FC<{ order: NewOrder; pengeluaran: number }> = ({
  order,
  pengeluaran,
}) => {
  const [bayaran, setBayaran] = React.useState(0);
  React.useEffect(() => {
    const f = async () => {
      const savedOrder = await dexie.savedOrders
        .where("id")
        .anyOf(order.savedOrdersId)
        .sortBy("createdAt");
      const lastSavedOrder = savedOrder.at(-1);

      if (!lastSavedOrder) return;

      const total =
        lastSavedOrder.totalProducts -
        lastSavedOrder.totalDiscounts +
        lastSavedOrder.totalCosts;

      setBayaran(total);
    };

    void f();
  }, [order]);
  return (
    <>
      <TableRow>
        <TableCell colSpan={2}>Bayaran Order</TableCell>
        <TableCell>{toRupiah(bayaran)}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={2}>Total Keuntungan</TableCell>
        <TableCell> {toRupiah(bayaran - pengeluaran)}</TableCell>
      </TableRow>
    </>
  );
};

const ExitItemDialog: React.FC<
  DialogProps & { order: NewOrder; onCreated: () => void }
> = ({ order, onCreated, ...props }) => {
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(
    null,
  );
  const [selectedVariant, setSelectedVariant] =
    React.useState<ProductVariant | null>(null);
  const [selectedMaterial, setSelectedMaterial] =
    React.useState<Material | null>(null);
  const [custom, setCustom] = React.useState("");
  const [qty, setQty] = React.useState(0);
  const [vendor, setVendor] = React.useState(false);
  const [paid, setPaid] = React.useState(0);
  const [type, setType] = React.useState("produk");
  const [name, setName] = React.useState("");
  const [hpp, setHpp] = React.useState(0);
  const [supplier, setSupplier] = React.useState<Supplier | null>(null);

  React.useEffect(() => {
    if (type === "custom") {
      setVendor(true);
    }
  }, [type, vendor]);

  React.useEffect(() => {
    switch (type) {
      case "produk":
        const h = selectedVariant?.costOfGoods ?? 0;
        const g = selectedProduct?.costOfGoods ?? 0;
        setHpp(h === 0 ? g : h);
        break;
      case "bahan":
        setHpp(selectedMaterial?.costOfGoods ?? 0);
        break;
      default:
        setHpp(paid);
        break;
    }
  }, [type, paid, selectedProduct, selectedVariant, selectedMaterial]);

  React.useEffect(() => {
    switch (type) {
      case "produk":
        setName(`${selectedProduct?.name} ${selectedVariant?.name}`);
        break;
      case "bahan":
        setName(selectedMaterial?.name ?? "");
        break;
      case "custom":
        setName(custom);
        break;
      default:
        break;
    }
  }, [selectedVariant, selectedMaterial, selectedProduct, type, custom]);

  const reset = () => {
    setSupplier(null);
    setHpp(0);
    setCustom("");
    setName("");
    setPaid(0);
    setQty(0);
    setSelectedMaterial(null);
    setSelectedProduct(null);
    setSelectedVariant(null);
    setType("produk");
    setVendor(false);
  };

  return (
    <Dialog {...props}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Barang Keluar</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue={type} onValueChange={setType}>
          <TabsList>
            <TabsTrigger value="produk">Produk</TabsTrigger>
            <TabsTrigger value="bahan">Bahan</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>
          <ProdukKeluar
            selected={selectedProduct}
            selectedVariant={selectedVariant}
            onVariantSelect={setSelectedVariant}
            onSelect={setSelectedProduct}
          />
          <BahanKeluar
            selected={selectedMaterial}
            onSelect={setSelectedMaterial}
          />
          <CustomKeluar value={custom} onChange={setCustom} />
        </Tabs>
        <div className="flex flex-col gap-3">
          <div className="space-y-2">
            <Label>Qty</Label>
            <Input
              value={qty}
              onChange={(e) => setQty(+e.target.value)}
              type="number"
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              checked={vendor}
              onCheckedChange={(data) => setVendor(data as boolean)}
            />
            <Label>Dari Vendor ?</Label>
          </div>
          {vendor && (
            <>
              <SupplierKeluar selected={supplier} onSelect={setSupplier} />
              <div className="space-y-1">
                <Label>Harga</Label>
                <Input
                  value={paid}
                  onChange={(e) => setPaid(+e.target.value)}
                  type="number"
                />
              </div>
            </>
          )}
        </div>
        <Button
          onClick={async () => {
            if (
              type === "produk" &&
              selectedProduct === null &&
              selectedMaterial === null
            ) {
              toast("Pilih Produk dan Varian Dahulu");
              return;
            }

            if (type === "bahan" && selectedMaterial === null) {
              toast("Pilih Bahan Dahulu");
              return;
            }

            if (type === "custom" && custom === "") {
              toast("Masukan Nama Custom Dahulu");
              return;
            }

            if (vendor) {
              if (paid === 0) {
                toast("Masukan Harga Dahulu");
                return;
              }

              if (supplier === null) {
                toast("Masukkan Supplier Dahulu");
                return;
              }
            }

            if (qty === 0) {
              toast("Masukan QTY Dahulu");
              return;
            }

            const id = generateId();
            const newItem: DB<"ExitItem"> = {
              createdAt: isoNow(),
              deleted: false,
              id: id,
              isCustom: type === "custom",
              isVendor: vendor,
              materialId:
                type === "bahan" && selectedMaterial ? selectedMaterial.id : "",
              name: name,
              orderId: order.id,
              pay: paid,
              price: !vendor ? hpp : Math.floor(paid / qty),
              hpp: !vendor ? hpp : Math.floor(paid / qty),
              productId:
                type === "produk" && selectedProduct ? selectedProduct.id : "",
              qty: qty,
              supplierId: supplier?.id ?? "",
              type: type,
              newOrderId: order.id,
              variantId:
                type === "produk" && selectedVariant ? selectedVariant.id : "",
            };

            exitItem$[id]!.set(newItem);

            if (vendor) {
              expenses$[id]!.set({
                createdAt: newItem.createdAt,
                deleted: false,
                expense: !vendor ? hpp : Math.floor(paid / qty),
                id: id,
                notes: vendor
                  ? `Beli ${qty} ${name} untuk pesanan ${customer$[order.customer_id]?.name.get() ?? "CUSTOMER NOT FOUND"} dari ${supplier?.name}`
                  : `${customer$[order.customer_id]?.name.get() ?? "CUSTOMER NOT FOUND"} beli ${qty} ${name}`,
                targetId: "",
                type: vendor ? "vendor" : type,
                updatedAt: newItem.createdAt,
                deletable: false,
              });
            }

            reset();
            onCreated();
          }}
        >
          Submit
        </Button>
      </DialogContent>
    </Dialog>
  );
};

const CustomKeluar: React.FC<{
  value: string;
  onChange: (data: string) => void;
}> = ({ value, onChange }) => {
  return (
    <TabsContent value="custom">
      <div className="flex flex-col gap-1">
        <Label>Custom</Label>
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </TabsContent>
  );
};

const SupplierKeluar: React.FC<{
  selected: Supplier | null;
  onSelect: (data: Supplier) => void;
}> = ({ selected, onSelect }) => {
  const materials = useLiveQuery(() =>
    dexie.suppliers.filter((x) => !x.deleted).sortBy("name"),
  );

  return (
    // <TabsContent value="bahan" className="space-y-3">
    <div className="flex flex-col gap-2">
      <Label>Supplier</Label>
      <Combobox
        data={materials ?? []}
        onSelected={onSelect}
        renderItem={(data) => data.name}
        renderSelected={() => selected?.name ?? "Pilih Supplier"}
        title="Supplier"
      />
    </div>
    // </TabsContent>
  );
};

const BahanKeluar: React.FC<{
  selected: Material | null;
  onSelect: (data: Material) => void;
}> = ({ selected, onSelect }) => {
  const materials = useLiveQuery(() =>
    dexie.materials.filter((x) => !x.deleted).sortBy("name"),
  );

  return (
    <TabsContent value="bahan" className="space-y-3">
      <div className="flex flex-col gap-1">
        <Label>Bahan</Label>
        <Combobox
          data={materials ?? []}
          onSelected={onSelect}
          renderItem={(data) => data.name}
          renderSelected={() => selected?.name ?? "Pilih Bahan"}
          title="Material"
        />
      </div>
    </TabsContent>
  );
};

const ProdukKeluar: React.FC<{
  selected: Product | null;
  selectedVariant: ProductVariant | null;
  onSelect: (data: Product) => void;
  onVariantSelect: (data: ProductVariant) => void;
}> = ({ selected, onSelect, onVariantSelect, selectedVariant }) => {
  const products = useLiveQuery(() =>
    dexie.products.filter((x) => !x.deleted).sortBy("name"),
  );
  const [variants, setVariants] = React.useState<ProductVariant[]>([]);
  React.useEffect(() => {
    if (!selected) return;
    const f = async () => {
      const v = await dexie.productVariants
        .where("product_id")
        .equals(selected?.id ?? "")
        .filter((x) => !x.deleted)
        .sortBy("name");

      setVariants(v);
    };

    void f();
  }, [selected]);

  return (
    <TabsContent value="produk" className="space-y-3">
      <div className="flex flex-col gap-1">
        <Label>Produk</Label>
        <Combobox
          data={products ?? []}
          onSelected={onSelect}
          renderItem={(data) => data.name}
          renderSelected={() => selected?.name ?? "Pilih Produk"}
          title="Produk"
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label>Varian</Label>
        <Combobox
          data={variants ?? []}
          onSelected={onVariantSelect}
          renderItem={(data) => data.name}
          renderSelected={() => selectedVariant?.name ?? "Pilih Varian"}
          title="Varian"
        />
      </div>
    </TabsContent>
  );
};
