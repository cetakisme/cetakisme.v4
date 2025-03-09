"use client";

import Card from "@/components/hasan/card";
import Dialog from "@/components/hasan/dialog";
import Img from "@/components/hasan/Image";
import { PopoverButton } from "@/components/hasan/popover-button";
import RenderList, { List } from "@/components/hasan/render-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploader, useImageUpload } from "@/hooks/useImageUpload";
import { type DB, supabase } from "@/lib/supabase/supabase";
import { deleteFile, uploadFile, deleteFiles } from "@/lib/uploadthing/utils";
import { HexColorPicker } from "react-colorful";
import {
  addons$,
  addonValues$,
  attributes$,
  generateId,
  productAttribute$,
  productAttributeValue$,
  products$,
  productToAddons$,
  productVariants$,
} from "@/server/local/db";
import { asList, id } from "@/server/local/utils";
import { type Observable } from "@legendapp/state";
import {
  Memo,
  useMount,
  useObservable,
  useObserveEffect,
} from "@legendapp/state/react";
import type {
  Addon,
  AddonValue,
  ProductAttribute,
  ProductVariant,
} from "@prisma/client";
import { LucideDot, LucideLoaderCircle, LucidePlus } from "lucide-react";
import React from "react";
import { createContext, useContext } from "react";
import { toast } from "sonner";
import { dexie } from "@/server/local/dexie";
import { type ColumnDef, type Row } from "@tanstack/react-table";
import { DataTableSelectorHeader } from "@/hooks/Table/DataTableSelectorHeader";
import { useTable } from "@/hooks/Table/useTable";
import { DataTableContent } from "@/hooks/Table/DataTableContent";
import { DataTablePagination } from "@/hooks/Table/DataTablePagination";
import { DataTableColumnHeader } from "@/hooks/Table/DataColumnHeader";
import { DataTableFilterName } from "@/hooks/Table/DataTableFilterName";
import { Popover, PopoverClose } from "@radix-ui/react-popover";
import DataTableDeleteSelection from "@/hooks/Table/DataTableDeleteSelection";
import { PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface IProductContext extends Omit<DB<"Product">, "created_at"> {
  addons: (DB<"Addon"> & { values: DB<"AddonValue">[] })[];
  send: boolean;
  attributes: (DB<"ProductAttribute"> & {
    values: DB<"ProductAttribteValue">[];
  })[];
  variants: (DB<"ProductVariant"> & { isUnique: boolean })[];
}

const ProductContext = createContext<Observable<IProductContext>>(
  undefined as any,
);

const Product: React.FC<{ id: string }> = ({ id }) => {
  const product$ = useObservable<
    Omit<DB<"Product">, "created_at"> & {
      addons: (DB<"Addon"> & { values: DB<"AddonValue">[] })[];
      send: boolean;
      attributes: (DB<"ProductAttribute"> & {
        values: DB<"ProductAttribteValue">[];
      })[];
      variants: (DB<"ProductVariant"> & { isUnique: boolean })[];
    }
  >({
    active: true,
    base_price: 0,
    deleted: false,
    id: id,
    images: ["", "", "", "", ""],
    name: "",
    addons: [],
    send: false,
    attributes: [],
    variants: [],
  });

  const send = () => {
    product$.send.set(true);
  };

  useObserveEffect(async () => {
    if (product$.send.get()) {
      const variants: ProductVariant[] = product$.variants.get().map((x) => ({
        deleted: x.deleted,
        id: x.id,
        name: x.name,
        price: x.isUnique ? x.price : product$.base_price.get(),
        product_id: x.product_id,
        qty: x.qty,
      }));

      const prevVariants = await dexie.productVariants
        .where("product_id")
        .equals(product$.id.get())
        .toArray();

      // batch(() => {
      //   prevVariants.map((x) => {
      //     productVariants$[x.id]?.deleted.set(true);
      //   });

      //   variants.map((x) => {
      //     productVariants$[x.id]?.deleted.set(true);
      //   });
      // });

      const { error } = await supabase.rpc("update_product_variants", {
        prev_variant_ids: prevVariants.map((v) => v.id),
        current_variants: variants,
      });

      if (error) console.error("Error updating variants:", error);

      product$.send.set(false);
      toast.success("Produk Berhasil Diupdate");
    }
  });

  return (
    <ProductContext.Provider value={product$}>
      <div className="mx-auto max-w-2xl">
        <ProductInfo />
        <Addons />
        <Attributes />
        <VariantUpdater />
        <PriceVariants />
        <QtyVariants />
        <Button className="float-right" onClick={() => send()}>
          Simpan
        </Button>
      </div>
    </ProductContext.Provider>
  );
};

export default Product;

const ProductInfo = () => {
  const product$ = useContext(ProductContext);

  useMount(async () => {
    const product = await dexie.products.get(product$.id.get());
    if (!product) return;
    product$.name.set(product.name);
    product$.base_price.set(product.base_price);
    product$.images.set(product.images);
  });

  return (
    <Card title="Produk" description="Informasi Seputar Produk">
      <div className="space-y-2">
        <div className="">
          <Memo>
            {() => (
              <>
                <Label>Nama</Label>
                <Input
                  key={product$.id.get()}
                  value={product$.name.get()}
                  onChange={(e) => product$.name.set(e.target.value)}
                  onBlur={(e) =>
                    products$[product$.id.get()]?.name.set(e.target.value)
                  }
                />
              </>
            )}
          </Memo>
        </div>
        <div className="">
          <Memo>
            {() => (
              <>
                <Label>Harga</Label>
                <Input
                  key={product$.id.get()}
                  value={product$.base_price.get()}
                  onChange={(e) => product$.base_price.set(+e.target.value)}
                  onBlur={(e) =>
                    products$[product$.id.get()]?.base_price.set(
                      +e.target.value,
                    )
                  }
                  type="number"
                />
              </>
            )}
          </Memo>
        </div>
        <div className="">
          <Memo>
            {() => (
              <>
                <Label>Gambar</Label>
                <div className="grid grid-cols-5 gap-2">
                  {product$.images.map((x, i) => (
                    <ImageButton
                      key={i}
                      image={x.get()}
                      onImageChange={(e) => {
                        products$[product$.id.get()]?.images[i]?.set(e);
                        product$.images[i]?.set(e);
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </Memo>
        </div>
      </div>
    </Card>
  );
};

const ImageButton: React.FC<{
  className?: string;
  image: string;
  onImageChange: (image: string) => void;
}> = ({ image, onImageChange, className }) => {
  const [uploading, setUploading] = React.useState(false);
  const { imageRef, setImage } = useImageUpload(
    (newImage) => {
      const upload = async () => {
        setUploading(true);

        if (image !== "") {
          try {
            await deleteFile(image);
            toast.success("Image Delete Sukses");
          } catch {
            toast.error("Sometings wrong when deleting");
            return;
          }
        }

        try {
          const _image = await uploadFile(newImage);
          onImageChange(_image.ufsUrl);
          toast.success("Image Upload Sukses");
        } catch {
          toast.error("Sometings wrong when uploading");
        } finally {
          setUploading(false);
        }
      };

      void upload();
    },
    (message) => toast.error(message),
  );
  return (
    <>
      <ImageUploader onImageChange={setImage} ref={imageRef} />
      <Button
        disabled={uploading}
        className={`relative aspect-square h-full w-full overflow-hidden ${className}`}
        variant="outline"
        onClick={() => imageRef.current?.click()}
      >
        {uploading ? (
          <LucideLoaderCircle className="animate-spin" />
        ) : image === "" ? (
          "Gambar"
        ) : (
          <Img src={image} alt="" />
        )}
      </Button>
    </>
  );
};

const Addons = () => {
  const product$ = useContext(ProductContext);

  useMount(async () => {
    const productToAddons = await dexie.productToAddons
      .where("product_id")
      .equals(product$.id.get())
      .toArray();

    const addonIds = productToAddons.map((x) => x.addon_id);

    if (addonIds.length === 0) {
      return; // No addons, return early
    }

    const addons = await dexie.addons.where("id").anyOf(addonIds).toArray();
    const values = await dexie.addonValues
      .where("addon_id")
      .anyOf(addons.map((x) => x.id))
      .and((v) => v.deleted === false)
      .toArray();

    // 🔥 Use a Map for fast lookups
    const valueMap = new Map<string, AddonValue[]>();

    for (const value of values) {
      if (!valueMap.has(value.addon_id)) {
        valueMap.set(value.addon_id, []);
      }
      valueMap.get(value.addon_id)!.push(value);
    }

    // 🔥 Build the final data structure using pre-built map
    const data: (Addon & { values: AddonValue[] })[] = addons.map((addon) => ({
      ...addon,
      values: valueMap.get(addon.id) ?? [],
    }));

    if (addons) {
      product$.addons.set(data);
    }
  });

  return (
    <Card title="Addon" description="">
      <Memo>
        {() => (
          <>
            <RenderList
              data={product$.addons.get()}
              render={(data) => (
                <Button asChild variant="outline">
                  <div className="w-full justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-4 w-4"
                        onClick={() => {
                          product$.addons.set(
                            product$.addons
                              .get()
                              .filter((x) => x.id !== data.id),
                          );
                          productToAddons$[
                            id(product$.id.get(), data.name)
                          ]?.deleted.set(true);
                        }}
                      >
                        <LucideDot />
                      </Button>
                      <span>{data.name}</span>
                    </div>
                    <EditAddonButton addon={data} />
                  </div>
                </Button>
              )}
            />
          </>
        )}
      </Memo>
      <AddAddonButton />
    </Card>
  );
};

const AddAddonButton = () => {
  const input$ = useObservable("");
  const availableAddons$ = useObservable<DB<"Addon">[]>([]);
  const product$ = useContext(ProductContext);
  useMount(async () => {
    const { data: addons } = await supabase
      .from("Addon")
      .select("*")
      .eq("deleted", false);

    if (addons) {
      availableAddons$.set(addons);
    }
  });
  return (
    <Memo>
      {() => (
        <PopoverButton
          data={availableAddons$
            .get()
            .filter((x) => !product$.addons.get().some((a) => a.id === x.id))}
          controlled
          onInputChange={(e) => input$.set(e)}
          onSelected={(e) => {
            product$.addons.set([
              ...product$.addons.get(),
              { ...e, values: [] },
            ]);
            const _id = id(product$.id.get(), e.name);
            productToAddons$[_id]!.set({
              addon_id: e.id,
              product_id: product$.id.get(),
              id: _id,
              deleted: false,
            });
          }}
          renderItem={(e) => e.name}
          renderAddButton={() => (
            <div className="p-1">
              <Button
                className="w-full"
                onClick={() => {
                  console.log(input$.get());
                  if (input$.get() === "") {
                    toast.error("Masukkan Input terlebih dahulu");
                    return;
                  }

                  const _id = id(product$.id.get(), input$.get());

                  const addon = {
                    id: _id,
                    name: input$.get(),
                    deleted: false,
                  };

                  addons$[_id]!.set(addon);
                  availableAddons$.set([...availableAddons$.get(), addon]);
                  product$.addons.set([
                    ...product$.addons.get(),
                    { ...addon, values: [] },
                  ]);
                  productToAddons$[_id]!.set({
                    addon_id: _id,
                    product_id: product$.id.get(),
                    id: _id,
                    deleted: false,
                  });

                  input$.set("");
                }}
              >
                <LucidePlus />
                Buat Addon Baru
              </Button>
            </div>
          )}
          renderTrigger={() => (
            <Button>
              <LucidePlus /> Tambah Addon
            </Button>
          )}
          title="Addon"
        />
      )}
    </Memo>
  );
};

const EditAddonButton: React.FC<{
  addon: Addon & { values: AddonValue[] };
}> = ({ addon }) => {
  const product$ = useContext(ProductContext);
  const input = useObservable("");

  const handleAddAddon = () => {
    if (input.get() === "") {
      toast.error("Masukkan Harus Diisi");
      return;
    }

    if (
      addon.values.some(
        (x) => x.name.toLowerCase() === input.get().toLowerCase(),
      )
    ) {
      toast.error("Nama Suda Ada");
      return;
    }

    const _id = id(addon.id, input.get());

    const newAddon = {
      addon_id: addon.id,
      deleted: false,
      id: _id,
      name: input.get(),
      price: 0,
    };

    addonValues$[_id]!.set(newAddon);

    input.set("");

    product$.addons.set(
      product$.addons.get().map((x) => {
        if (x.id === addon.id) {
          return { ...x, values: [...x.values, newAddon] };
        }

        return x;
      }),
    );
  };

  return (
    <Dialog
      title={`Edit ${addon.name}`}
      description={() => ""}
      renderTrigger={() => (
        <Button size="icon" className="h-4 w-4">
          <LucideDot />
        </Button>
      )}
    >
      <div className="flex items-center justify-between">
        <Label>Item</Label>
        <Label>Harga</Label>
      </div>
      <RenderList
        data={addon.values}
        className="space-y-2"
        render={(data) => (
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                className="h-4 w-4"
                size="icon"
                variant="destructive"
                onClick={() => {
                  addonValues$[data.id]!.deleted.set(true);
                  product$.addons.set(
                    product$.addons.get().map((x) => {
                      if (x.id === addon.id) {
                        return {
                          ...x,
                          values: x.values.filter((v) => v.id !== data.id),
                        };
                      }

                      return x;
                    }),
                  );
                }}
              >
                <LucideDot />
              </Button>
              <Label>{data.name}</Label>
            </div>
            <Input
              className="w-24"
              defaultValue={data.price}
              onBlur={(e) => addonValues$[data.id]!.price.set(+e.target.value)}
              type="number"
            />
          </div>
        )}
      />
      <div className="">
        <Label>Item Baru</Label>
        <div className="flex gap-2">
          <Memo>
            {() => (
              <Input
                value={input.get()}
                onChange={(e) => input.set(e.target.value)}
              />
            )}
          </Memo>

          <Button onClick={() => handleAddAddon()}>
            <LucidePlus />
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

const Attributes = () => {
  const product$ = useContext(ProductContext);

  const deleteAttribute = (
    attribute: ProductAttribute & {
      values: DB<"ProductAttribteValue">[];
    },
  ) => {
    const f = async () => {
      const imagesToDelete = attribute.values
        .filter((x) => x.image !== "")
        .map((x) => x.image);

      console.log(imagesToDelete);

      for (const element of attribute.values) {
        productAttributeValue$[element.id]!.set({
          ...element,
          deleted: true,
          color: "",
          image: "",
        });
      }

      if (imagesToDelete.length === 0) return;

      await deleteFiles(imagesToDelete);

      toast.success("Gambar Berhasil Dihapus");
    };
    void f();
    productAttribute$[attribute.id]!.deleted.set(true);
    product$.attributes.set(
      product$.attributes.get().filter((x) => x.id !== attribute.id),
    );
  };

  useMount(async () => {
    const data = await dexie.productAttributes
      .where("product_id")
      .equals(product$.id.get())
      .and((a) => a.deleted === false)
      .toArray();

    const attributeIds = data.map((x) => x.id);

    if (attributeIds.length === 0) {
      return; // No attributes, return early
    }

    const attributesValue = await dexie.productAttributeValues
      .where("attribute_id")
      .anyOf(attributeIds)
      .and((a) => a.deleted === false)
      .toArray();

    // 🔥 Use a Map for fast lookup
    const valueMap = new Map<string, DB<"ProductAttribteValue">[]>();

    for (const value of attributesValue) {
      if (!valueMap.has(value.attribute_id)) {
        valueMap.set(value.attribute_id, []);
      }
      valueMap.get(value.attribute_id)!.push(value);
    }

    // 🔥 Build final object using the pre-built map
    const result: Record<
      string,
      DB<"ProductAttribute"> & {
        values: DB<"ProductAttribteValue">[];
      }
    > = {};

    for (const element of data) {
      result[element.id] = {
        ...element,
        values: valueMap.get(element.id) ?? [],
      };
    }

    product$.attributes.set(Object.values(result));
  });

  return (
    <Card title="Varian" description="">
      <Memo>
        {() => (
          <RenderList
            data={asList<
              DB<"ProductAttribute"> & { values: DB<"ProductAttribteValue">[] }
            >(product$.attributes.get())}
            render={(data, i) => (
              <Button asChild variant="outline">
                <div className="w-full justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-4 w-4"
                      onClick={() => {
                        deleteAttribute(data);
                      }}
                    >
                      <LucideDot />
                    </Button>
                    <span>{attributes$[data.attribute_id]?.name.get()}</span>
                  </div>
                  <EditAttributeButton attribute={data} index={i} />
                </div>
              </Button>
            )}
          />
        )}
      </Memo>
      <AddAttributeButton />
    </Card>
  );
};

const AddAttributeButton = () => {
  const input$ = useObservable("");
  const product$ = useContext(ProductContext);

  const createNewAttribte = () => {
    if (input$.get() === "") {
      toast.error("Masukkan Nama Terlebih Dahulu");
      return;
    }
    const attributeId = generateId();
    const newAttribte: DB<"Attribute"> = {
      deleted: false,
      id: attributeId,
      name: input$.get(),
    };

    attributes$[attributeId]!.set(newAttribte);
    addAttribute(newAttribte);
  };

  const addAttribute = (attribute: DB<"Attribute">) => {
    const productAttributeId = id(product$.id.get(), attribute.name);
    const newProductAttribute: DB<"ProductAttribute"> = {
      id: productAttributeId,
      attribute_id: attribute.id,
      product_id: product$.id.get(),
      deleted: false,
    };

    console.log(newProductAttribute);

    productAttribute$[newProductAttribute.id]?.set(newProductAttribute);

    product$.attributes.set([
      ...product$.attributes.get(),
      {
        ...newProductAttribute,
        values: [],
      },
    ]);
  };

  return (
    <Memo>
      {() => (
        <PopoverButton
          data={asList<DB<"Attribute">>(attributes$.get()).filter(
            (x) =>
              !product$.attributes.get().some((v) => {
                return v.attribute_id === x.id;
              }),
          )}
          controlled
          onInputChange={(e) => input$.set(e)}
          onSelected={addAttribute}
          renderItem={(e) => e.name}
          title="Varian"
          renderAddButton={() => (
            <div className="p-1">
              <Button className="w-full" onClick={createNewAttribte}>
                <LucidePlus /> Buat Varian Baru
              </Button>
            </div>
          )}
          renderTrigger={() => (
            <Button>
              <LucidePlus /> Tambah Varian
            </Button>
          )}
        />
      )}
    </Memo>
  );
};

const EditAttributeButton: React.FC<{
  attribute: DB<"ProductAttribute"> & { values: DB<"ProductAttribteValue">[] };
  index: number;
}> = ({ index, attribute }) => {
  const attributeName = useObservable(
    attributes$[attribute.attribute_id]?.name,
  );

  return (
    <Dialog
      title="Edit Varian"
      description={() => ""}
      renderTrigger={() => (
        <Button size="icon" className="h-4 w-4">
          <LucideDot />
        </Button>
      )}
    >
      {attributeName.get() === "Warna" ? (
        <EditColorAttribute attribute={attribute} index={index} />
      ) : (
        <EditStringAttribute attribute={attribute} index={index} />
      )}
    </Dialog>
  );
};

const EditColorAttribute: React.FC<{
  attribute: DB<"ProductAttribute"> & { values: DB<"ProductAttribteValue">[] };
  index: number;
}> = ({ attribute, index }) => {
  const product$ = useContext(ProductContext);
  const addValue = () => {
    const newValue: DB<"ProductAttribteValue"> = {
      attribute_id: attribute.id,
      deleted: false,
      id: id(attribute.id, "Hitam"),
      value: "Hitam",
      color: "#000000",
      image: "",
    };

    productAttributeValue$[newValue.id]!.set(newValue);

    const newAttributes = product$.attributes
      .get()
      .map((x) =>
        x.id === attribute.id ? { ...x, values: [...x.values, newValue] } : x,
      );

    product$.attributes.set(newAttributes);
  };
  return (
    <div className="flex gap-1">
      <Memo>
        {() => (
          <List
            data={product$.attributes[index]!.values.get()}
            render={(data, d_index) => (
              <ColorDialog
                value={data}
                onImageChange={(image) => {
                  product$.attributes[index]!.values[d_index]!.image.set(image);
                }}
                onDelete={() => {
                  product$.attributes[index]!.values.set(
                    product$.attributes[index]!.values.get().filter(
                      (x, i) => d_index !== i,
                    ),
                  );
                }}
                onUpdated={(value) => {
                  const values = product$.attributes[index]!.values.get().map(
                    (x, i) => {
                      return i === d_index ? value : x;
                    },
                  );

                  const data = product$.attributes
                    .get()
                    .map((x, i) =>
                      i === index ? { ...x, values: values } : x,
                    );

                  product$.attributes.set(data);
                }}
              />
            )}
          />
        )}
      </Memo>
      <Button
        className="aspect-square h-10 w-10 rounded-full"
        variant="outline"
        onClick={addValue}
      >
        <LucidePlus />
      </Button>
    </div>
  );
};

const ColorDialog: React.FC<{
  value: DB<"ProductAttribteValue">;
  onImageChange: (image: string) => void;
  onUpdated: (value: DB<"ProductAttribteValue">) => void;
  onDelete: () => void;
}> = ({ value, onImageChange, onDelete, onUpdated }) => {
  const attribute$ = useObservable(value);
  const handleSave = () => {
    const _id = id(attribute$.attribute_id.get(), attribute$.value.get());
    productAttributeValue$[attribute$.id.get()]!.set({
      color: "",
      deleted: true,
      attribute_id: attribute$.attribute_id.get(),
      value: attribute$.value.get(),
      image: "",
      id: attribute$.id.get(),
    });

    productAttributeValue$[_id]!.set({
      ...attribute$.get(),
      id: _id,
      deleted: false,
    });

    const t = { ...attribute$.get(), id: _id };

    onUpdated(t);
  };

  return (
    <Popover>
      <Memo>
        {() => (
          <PopoverTrigger asChild>
            <Button
              className="bordder-4 aspect-square rounded-full border-black"
              style={{ backgroundColor: attribute$.color.get() }}
            />
          </PopoverTrigger>
        )}
      </Memo>
      <PopoverContent
        side="left"
        className="w-60 space-y-2"
        onPointerDownOutside={() => handleSave()}
      >
        <Memo>
          {() => (
            <>
              <Input
                className="w-full"
                value={attribute$.value.get()}
                onChange={(e) => attribute$.value.set(e.target.value)}
              />
              <HexColorPicker
                color={attribute$.color.get()}
                onChange={(color) => attribute$.color.set(color)}
              />
              <ImageButton
                className="aspect-square w-full"
                image={attribute$.image.get()}
                onImageChange={(image) => {
                  const _id = id(
                    attribute$.attribute_id.get(),
                    attribute$.value.get(),
                  );
                  productAttributeValue$[_id]!.image.set(image);
                  attribute$.image.set(image);
                  onImageChange(image);
                }}
              />
            </>
          )}
        </Memo>
        <Button variant="destructive" asChild>
          <PopoverClose
            onClick={() => {
              const f = async () => {
                if (attribute$.image.get() === "") return;
                await deleteFile(attribute$.image.get());
                toast.success("Gambar Berhasil Dihapus");
              };

              void f();
              productAttributeValue$[attribute$.id.get()]!.deleted.set(true);
              onDelete();
            }}
          >
            Hapus
          </PopoverClose>
        </Button>
      </PopoverContent>
    </Popover>
  );
};

const EditStringAttribute: React.FC<{
  attribute: DB<"ProductAttribute"> & { values: DB<"ProductAttribteValue">[] };
  index: number;
}> = ({ attribute, index }) => {
  const input$ = useObservable("");
  const product$ = useContext(ProductContext);

  const deleteValue = (value: DB<"ProductAttribteValue">) => {
    const newAttributes = product$.attributes
      .get()
      .map((x) =>
        x.id === attribute.id
          ? { ...x, values: x.values.filter((f) => f.id !== value.id) }
          : x,
      );

    product$.attributes.set(newAttributes);
    productAttributeValue$[value.id]!.deleted.set(true);
  };

  const addValue = (name: string) => {
    if (input$.get() === "") {
      toast.error("Masukkan Nama Terlebih Dahulu");
      return;
    }

    if (
      attribute.values.some(
        (v) => v.value.toLowerCase() === input$.get().toLowerCase(),
      )
    ) {
      toast.error("Item Sudah Ada");
      return;
    }
    const newValue: DB<"ProductAttribteValue"> = {
      attribute_id: attribute.id,
      deleted: false,
      id: id(attribute.id, name),
      value: name,
      color: "",
      image: "",
    };

    productAttributeValue$[newValue.id]!.set(newValue);

    const newAttributes = product$.attributes
      .get()
      .map((x) =>
        x.id === attribute.id ? { ...x, values: [...x.values, newValue] } : x,
      );

    product$.attributes.set(newAttributes);

    input$.set("");
  };
  return (
    <>
      <Memo>
        {() => (
          <RenderList
            data={product$.attributes[index]!.values.get()}
            render={(data) => (
              <Badge
                onClick={() => deleteValue(data)}
                className="cursor-pointer"
              >
                {data.value}
              </Badge>
            )}
          />
        )}
      </Memo>
      <Memo>
        {() => (
          <>
            <Input
              value={input$.get()}
              onChange={(e) => input$.set(e.target.value)}
            />
            <Button onClick={() => addValue(input$.get())}>
              Tambah Item Baru
            </Button>
          </>
        )}
      </Memo>
    </>
  );
};

function generateCombinations(arrays: string[][]): string[] {
  return arrays
    .reduce(
      (acc, curr) => {
        return curr.length > 0
          ? acc.flatMap((a) => curr.map((b) => a + " " + b))
          : acc;
      },
      [""],
    )
    .map((str) => str.trim()); // Trim leading spaces from results
}

type Item = { id: string };

function mergeArrays<TData extends Item>(
  arr1: TData[],
  arr2: TData[],
): TData[] {
  const mergedMap: Record<string, TData> = {};

  // Add items from the first array
  for (const item of arr2) {
    mergedMap[item.id] = { ...item };
  }

  // Add items from the second array, but keep existing values if id already exists
  for (const item of arr1) {
    if (mergedMap[item.id]) {
      mergedMap[item.id] = { ...item };
    }
  }

  return Object.values(mergedMap);
}

const VariantUpdater = () => {
  const product$ = useContext(ProductContext);

  useMount(async () => {
    const data = await dexie.productVariants
      .where("product_id")
      .equals(product$.id.get())
      .toArray();

    const product = await dexie.products.get(product$.id.get());
    const variants = data.map((x) => ({
      ...x,
      isUnique: x.price !== product?.base_price,
    }));

    product$.variants.set(variants);
  });

  useObserveEffect(async () => {
    const attributes = product$.attributes.get();
    if (attributes.length === 0) return;

    const flattedAttributes = attributes.map((x) =>
      x.values.map((v) => v.value),
    );

    const combinations = generateCombinations(flattedAttributes);
    const newVariants: (DB<"ProductVariant"> & { isUnique: boolean })[] =
      combinations.map((x) => ({
        id: id(product$.id.get(), x),
        name: x,
        deleted: false,
        price: 0,
        product_id: product$.id.get(),
        qty: 0,
        isUnique: false,
      }));

    const mergedVariants = mergeArrays(product$.variants.get(), newVariants);

    product$.variants.set(mergedVariants);
  });
  return <></>;
};

const QtyInput: React.FC<{ row: Row<ProductVariant> }> = ({ row }) => {
  const product$ = useContext(ProductContext);
  const value$ = useObservable(row.original.qty);

  const updatePrice = React.useCallback(
    (qty: number) => {
      product$.variants.set(
        product$.variants
          .get()
          .map((x) => (x.id === row.original.id ? { ...x, qty: qty } : x)),
      );

      // productVariants$[row.original.id]?.price.set(qty);
      console.log(productVariants$[row.original.id]?.get());
    },
    [row, product$.variants],
  );

  return (
    <Memo>
      {() => (
        <Input
          value={value$.get()}
          onChange={(e) => value$.set(+e.target.value)}
          onBlur={(e) => updatePrice(+e.target.value)}
          type="number"
        />
      )}
    </Memo>
  );
};

const QtyTable: React.FC<{ data: ProductVariant[] }> = ({ data }) => {
  const table = useTable({
    columns: qtyColumns,
    data: data.sort(),
  });

  return (
    <div>
      <div className="h-9">
        <DataTableFilterName table={table} />
      </div>
      <DataTableContent table={table} />
      <DataTablePagination table={table} />
    </div>
  );
};

const qtyColumns: ColumnDef<ProductVariant>[] = [
  // DataTableSelectorHeader(),
  {
    id: "name",
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nama" />
    ),
    cell: ({ renderValue }) => (
      <div className="font-medium">{renderValue<string>()}</div>
    ),
    size: 1000,
  },
  {
    id: "kuantitas",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Qty" />
    ),
    cell: ({ row }) => <QtyInput row={row} />,
    size: 200,
  },
];

const QtyVariants = () => {
  const product$ = useContext(ProductContext);

  return (
    <Card title="Kuantitas" description="Kuantitas Barang Yang Tersedia">
      <Memo>{() => <QtyTable data={product$.variants.get()} />}</Memo>
    </Card>
  );
};

const PriceInput: React.FC<{ row: Row<ProductVariant> }> = ({ row }) => {
  const product$ = useContext(ProductContext);

  const updatePrice = React.useCallback(
    (price: number) => {
      product$.variants.set(
        product$.variants
          .get()
          .map((x) => (x.id === row.original.id ? { ...x, price: price } : x)),
      );
    },
    [row, product$.variants],
  );

  return (
    <Input
      defaultValue={row.original.price}
      onBlur={(e) => updatePrice(+e.target.value)}
      type="number"
    />
  );
};

const priceColumns: ColumnDef<ProductVariant>[] = [
  DataTableSelectorHeader(),
  {
    id: "name",
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nama" />
    ),
    cell: ({ renderValue }) => (
      <div className="font-medium">{renderValue<string>()}</div>
    ),
    size: 1000,
  },
  {
    id: "harga",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Harga" />
    ),
    cell: ({ row }) => <PriceInput row={row} />,
    size: 200,
  },
];

const PriceTable: React.FC<{ data: ProductVariant[] }> = ({ data }) => {
  const product$ = useContext(ProductContext);
  const table = useTable({
    columns: priceColumns,
    data: data,
  });

  return (
    <div>
      <div className="flex h-9 justify-between">
        <DataTableFilterName table={table} />
        <DataTableDeleteSelection
          table={table}
          onDelete={(rows) => {
            const map = new Map<
              string,
              ProductVariant & { isUnique: boolean }
            >();

            for (const element of product$.variants.get()) {
              map.set(element.id, element);
            }

            for (const element of rows) {
              map.set(element.original.id, {
                ...element.original,
                isUnique: false,
              });
            }

            product$.variants.set(Array.from(map.values()));
          }}
        />
      </div>
      <DataTableContent table={table} />
      <DataTablePagination table={table} />
    </div>
  );
};

const PriceVariants = () => {
  const product$ = useContext(ProductContext);

  return (
    <Card title="Harga" description="Atur Harga Barang">
      <Memo>
        {() => (
          <PopoverButton
            data={product$.variants.get().filter((x) => !x.isUnique)}
            onSelected={(e) =>
              product$.variants.set(
                product$.variants
                  .get()
                  .map((x) => (x.id === e.id ? { ...x, isUnique: true } : x)),
              )
            }
            renderItem={(e) => e.name}
            title="Kombinasi"
            renderTrigger={() => (
              <Button>
                <LucidePlus /> Tambah Harga Unik
              </Button>
            )}
          />
        )}
      </Memo>
      <Memo>
        {() => (
          <PriceTable
            data={product$.variants.get().filter((x) => x.isUnique)}
          />
        )}
      </Memo>
    </Card>
  );
};
