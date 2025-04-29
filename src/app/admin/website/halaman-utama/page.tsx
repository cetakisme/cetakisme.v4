"use client";

import { Combobox } from "@/components/hasan/combobox";
import ImageButton from "@/components/hasan/image-buton";
import InputWithLabel from "@/components/hasan/input-with-label";
import Title from "@/components/hasan/title";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useDialog } from "@/hooks/useDialog";
import { DB } from "@/lib/supabase/supabase";
import {
  carouselSettings$,
  categorySettings$,
  gallerySettings$,
  productPopularSettings$,
  testimonySettings$,
} from "@/server/local/db";
import { dexie } from "@/server/local/dexie";
import { Memo, useObserveEffect } from "@legendapp/state/react";
import { Product } from "@prisma/client";
import { useLiveQuery } from "dexie-react-hooks";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

const Page = () => {
  return (
    <ScrollArea className="h-screen p-8">
      <Title>Landing Page</Title>
      <Card>
        <CardHeader>
          <CardTitle>Produk Populer Settings</CardTitle>
          <CardDescription>
            Atur produk yang akan tampil di bagian populer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PopularSection />
          {/* <CarouselSettingSection /> */}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Carousel Settings</CardTitle>
          <CardDescription>
            Atur carousel yang muncul di halaman awal website
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CarouselSettingSection />
        </CardContent>
      </Card>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Kategori Settings</CardTitle>
          <CardDescription>
            Atur foto kategori yang muncul di halaman awal website
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryCarouselSection />
        </CardContent>
      </Card>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Gallery Settings</CardTitle>
          <CardDescription>
            Atur kumpulan gambar yang muncul di bagian Gallry di halaman Utama
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GallerySettingsSection />
        </CardContent>
      </Card>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Testimony Settings</CardTitle>
          <CardDescription>Atur Testimony di halaman Utama</CardDescription>
        </CardHeader>
        <CardContent className="w-full">
          <TestimonySettings />
        </CardContent>
      </Card>
    </ScrollArea>
  );
};

export default Page;

const PopularSection = () => {
  const products = useLiveQuery(() => dexie.products.orderBy("name").toArray());

  return (
    <div className="grid grid-cols-1 gap-2">
      <PopularProductDropdown products={products ?? []} id="popular-1" />
      <PopularProductDropdown products={products ?? []} id="popular-2" />
      <PopularProductDropdown products={products ?? []} id="popular-3" />
      <PopularProductDropdown products={products ?? []} id="popular-4" />
    </div>
  );
};

const TestimonySettings = () => {
  return (
    <div className="grid w-full grid-cols-2 gap-4">
      <TestimonyCard id="testimoy-1" />
      <TestimonyCard id="testimoy-2" />
      <TestimonyCard id="testimoy-3" />
      <TestimonyCard id="testimoy-3" />
    </div>
  );
};

const CategoryCarouselSection = () => {
  return (
    <div className="grid grid-cols-2 gap-2">
      <CategoryCard id={"category-1"} />
      <CategoryCard id={"category-2"} />
      <CategoryCard id={"category-3"} />
      <CategoryCard id={"category-4"} />
    </div>
  );
};

const CarouselSettingSection = () => {
  return (
    <div className="grid grid-cols-8 gap-2">
      <CategoryImageButtonDecorator id="carousel-1" />
      <CategoryImageButtonDecorator id="carousel-2" />
      <CategoryImageButtonDecorator id="carousel-3" />
      <CategoryImageButtonDecorator id="carousel-4" />
    </div>
  );
};

const GallerySettingsSection = () => {
  return (
    <div className="grid grid-cols-8 gap-2">
      <GalleryImageButtonDecorator id="gallery-1" />
      <GalleryImageButtonDecorator id="gallery-2" />
      <GalleryImageButtonDecorator id="gallery-3" />
      <GalleryImageButtonDecorator id="gallery-4" />
      <GalleryImageButtonDecorator id="gallery-5" />
      <GalleryImageButtonDecorator id="gallery-6" />
      <GalleryImageButtonDecorator id="gallery-7" />
      <GalleryImageButtonDecorator id="gallery-8" />
    </div>
  );
};

const PopularProductDropdown: React.FC<{ products: Product[]; id: string }> = ({
  id,
  products,
}) => {
  const [selected, setSelected] = useState<Product | null>(null);
  const open = useDialog();

  const popularProduct = useLiveQuery(() =>
    dexie.productPopulerSettings.get(id),
  );

  useEffect(() => {
    const f = async () => {
      if (!popularProduct) return;
      const product = await dexie.products.get(popularProduct.productId);
      if (!product) return;
      setSelected(product);
    };
    f();
  }, [popularProduct]);

  useEffect(() => {
    if (selected === null) return;
    if (productPopularSettings$[id]?.get() === undefined) {
      productPopularSettings$[id]!.set({
        id: id,
        productId: selected.id,
      });
    } else {
      productPopularSettings$[id]!.productId.set(selected.id);
    }
  }, [selected]);

  // useEffect(() => {
  //   const f = async () => {
  //     const popularProduct = await dexie.productPopulerSettings.get(id);
  //     if (!popularProduct) return;
  //     const product = await dexie.products.get(popularProduct.productId);
  //     if (!product) return;
  //     setSelected(product);
  //   };

  //   void f();
  // }, []);

  return (
    <Combobox
      {...open.props}
      data={products ?? []}
      onSelected={(data) => {
        if (data) setSelected(data);
        open.dismiss();
      }}
      renderSelected={() => selected?.name ?? "Pilih Produk Populer"}
      title="Produk Populer"
      renderItem={(data) => data.name}
    />
  );
};

const TestimonyCard: React.FC<{ id: string }> = ({ id }) => {
  const handleUpdateName = (name: string) => {
    if (testimonySettings$[id]?.get() === undefined) {
      testimonySettings$[id]!.set({
        id: id,
        name: name,
        job: "",
        testimony: "",
      });
    } else {
      testimonySettings$[id]!.name.set(name);
    }
  };

  const handleUpdateJob = (job: string) => {
    if (testimonySettings$[id]?.get() === undefined) {
      testimonySettings$[id]!.set({
        id: id,
        name: "",
        job: job,
        testimony: "",
      });
    } else {
      testimonySettings$[id]!.job.set(job);
    }
  };

  const handleUpdateTesimony = (testimony: string) => {
    if (testimonySettings$[id]?.get() === undefined) {
      testimonySettings$[id]!.set({
        id: id,
        name: "",
        job: "",
        testimony: testimony,
      });
    } else {
      testimonySettings$[id]!.testimony.set(testimony);
    }
  };
  return (
    <div className="flex flex-col gap-2 rounded-md border p-4">
      <div className="w-full">
        <Memo>
          {() => (
            <InputWithLabel
              label="Nama"
              inputProps={{
                className: "w-full",
                defaultValue: testimonySettings$[id]?.name.get() ?? "",
                onBlur: (e) => handleUpdateName(e.target.value),
              }}
            />
          )}
        </Memo>
      </div>
      <div className="w-full">
        <Memo>
          {() => (
            <InputWithLabel
              label="Pekerjaan"
              inputProps={{
                className: "w-full",
                defaultValue: testimonySettings$[id]?.job.get() ?? "",
                onBlur: (e) => handleUpdateJob(e.target.value),
              }}
            />
          )}
        </Memo>
      </div>
      <div className="w-full">
        <Label>Testimony</Label>
        <Memo>
          {() => (
            <Textarea
              rows={3}
              className="w-full resize-none"
              defaultValue={testimonySettings$[id]?.testimony.get() ?? ""}
              onBlur={(e) => handleUpdateTesimony(e.target.value)}
            />
          )}
        </Memo>
      </div>
    </div>
  );
};

const CategoryCard: React.FC<{ id: string }> = ({ id }) => {
  const handleUpdateName = (name: string) => {
    if (categorySettings$[id]?.get() === undefined) {
      categorySettings$[id]!.set({
        id: id,
        name: name,
        imageUrl: "",
        url: "",
      });
    } else {
      categorySettings$[id]!.name.set(name);
    }
  };

  const handleUpdateURL = (url: string) => {
    if (categorySettings$[id]?.get() === undefined) {
      categorySettings$[id]!.set({
        id: id,
        name: "",
        imageUrl: "",
        url: url,
      });
    } else {
      categorySettings$[id]!.url.set(url);
    }
  };

  const handleUpdateImage = (image: string) => {
    if (categorySettings$[id]?.get() === undefined) {
      categorySettings$[id]!.set({
        id: id,
        name: "",
        imageUrl: image,
        url: "",
      });
    } else {
      categorySettings$[id]!.imageUrl.set(image);
    }
  };

  return (
    <div className="flex gap-2 rounded-lg border p-4">
      <Memo>
        {() => (
          <ImageButton
            image={categorySettings$[id]?.imageUrl.get() ?? ""}
            onImageChange={handleUpdateImage}
            rootClassName="h-full"
          />
        )}
      </Memo>
      <div className="flex flex-1 flex-col gap-2">
        <Memo>
          {() => (
            <InputWithLabel
              label="Nama"
              inputProps={{
                defaultValue: categorySettings$[id]?.name.get() ?? "",
                onBlur: (e) => handleUpdateName(e.target.value),
              }}
            />
          )}
        </Memo>
        <Memo>
          {() => (
            <InputWithLabel
              label="URL"
              inputProps={{
                defaultValue: categorySettings$[id]?.url.get() ?? "",
                onBlur: (e) => handleUpdateURL(e.target.value),
              }}
            />
          )}
        </Memo>
      </div>
    </div>
  );
};

const GalleryImageButtonDecorator: React.FC<{ id: string }> = ({ id }) => {
  return (
    <Memo>
      {() => (
        <ImageButton
          image={gallerySettings$[id]?.imageUrl.get() ?? ""}
          onImageChange={(image) => {
            if (gallerySettings$[id]?.get() === undefined) {
              gallerySettings$[id]!.set({
                id: id,
                imageUrl: image,
              });
            } else {
              gallerySettings$[id]!.imageUrl.set(image);
            }
          }}
        />
      )}
    </Memo>
  );
};

const CategoryImageButtonDecorator: React.FC<{ id: string }> = ({ id }) => {
  return (
    <Memo>
      {() => (
        <ImageButton
          image={carouselSettings$[id]?.imageUrl.get() ?? ""}
          onImageChange={(image) => {
            if (carouselSettings$[id]?.get() === undefined) {
              carouselSettings$[id]!.set({
                id: id,
                imageUrl: image,
              });
            } else {
              carouselSettings$[id]!.imageUrl.set(image);
            }
          }}
        />
      )}
    </Memo>
  );
};
