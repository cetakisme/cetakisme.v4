"use client";

import Card from "@/components/hasan/card";
import Img from "@/components/hasan/Image";
import { PopoverButton } from "@/components/hasan/popover-button";
import RenderList from "@/components/hasan/render-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploader, useImageUpload } from "@/hooks/useImageUpload";
import { type DB, supabase } from "@/lib/supabase/supabase";
import { deleteFile, uploadFile } from "@/lib/uploadthing/utils";
import { addons$, products$, productToAddons$ } from "@/server/local/db";
import { id } from "@/server/local/utils";
import { type Observable } from "@legendapp/state";
import {
  Memo,
  useMount,
  useObservable,
  useObserveEffect,
} from "@legendapp/state/react";
import { LucideDot, LucideLoaderCircle, LucidePlus } from "lucide-react";
import React from "react";
import { createContext, useContext } from "react";
import { toast } from "sonner";

interface IProductContext extends DB<"Product"> {
  addons: DB<"Addon">[];
  send: boolean;
}

const ProductContext = createContext<Observable<IProductContext>>(
  undefined as any,
);

const Product: React.FC<{ id: string }> = ({ id }) => {
  const product$ = useObservable<
    DB<"Product"> & { addons: DB<"Addon">[]; send: boolean }
  >({
    active: true,
    base_price: 0,
    deleted: false,
    id: id,
    images: ["", "", "", "", ""],
    name: "",
    addons: [],
    send: false,
  });

  const send = () => {
    product$.send.set(true);
  };

  useObserveEffect(() => {
    if (product$.send.get()) {
      products$[product$.id.get()]?.name.set(product$.name.get());
      products$[product$.id.get()]?.base_price.set(product$.base_price.get());

      product$.send.set(false);
      toast.success("Produk Berhasil Diupdate");
    }
  });

  return (
    <ProductContext.Provider value={product$}>
      <div className="mx-auto max-w-2xl">
        <ProductInfo />
        <Addons />
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
    const { data } = await supabase
      .from("Product")
      .select("*")
      .eq("id", product$.id.get());
    if (!data) return;
    if (!data[0]) return;
    product$.name.set(data[0].name);
    product$.base_price.set(data[0].base_price);
    product$.images.set(data[0].images);
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
  image: string;
  onImageChange: (image: string) => void;
}> = ({ image, onImageChange }) => {
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
        className="relative aspect-square h-full w-full overflow-hidden"
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
    const { data } = await supabase
      .from("Addon")
      .select("*, ProductToAddon!inner(product_id)")
      .eq("ProductToAddon.product_id", product$.id.get())
      .eq("ProductToAddon.deleted", false)
      .eq("deleted", false);

    if (data) {
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
                    <Button size="icon" className="h-4 w-4">
                      <LucideDot />
                    </Button>
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
            product$.addons.set([...product$.addons.get(), e]);
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
                  product$.addons.set([...product$.addons.get(), addon]);
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
