"use client";

import React, { useState } from "react";
import { CardComponent } from "./card-component";
import { useTable } from "@/hooks/Table/useTable";
import { Product, ProductAttribteValue } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/hooks/Table/DataColumnHeader";
import { dexie } from "@/server/local/dexie";
import { useLiveQuery } from "dexie-react-hooks";
import { Checkbox } from "../ui/checkbox";
import RenderList, { List } from "./render-list";
import { Skeleton } from "../ui/skeleton";

const columns: ColumnDef<FilterData>[] = [
  {
    id: "name",
    accessorKey: "name",
  },
  {
    id: "price",
    accessorKey: "base_price",
  },
  {
    id: "colors",
    accessorKey: "colors",
    filterFn: (row, columnId, filterValue) => {
      const data = (filterValue as string[]) ?? [];
      if (filterValue.length === 0) return true;
      return row.original.colors.some((x) => filterValue.includes(x.value));
    },
  },
  {
    id: "sizes",
    accessorKey: "sizes",
    filterFn: (row, columnId, filterValue) => {
      const data = (filterValue as string[]) ?? [];
      if (filterValue.length === 0) return true;
      return row.original.sizes.some((x) => filterValue.includes(x.value));
    },
  },
];

export type FilterData = Product & {
  colors: ProductAttribteValue[];
  sizes: ProductAttribteValue[];
};

const FilterSection: React.FC<{ products: Product[]; slice?: number }> = ({
  products,
  slice,
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = React.useState<FilterData[]>([]);
  const memoized = React.useMemo(() => data, [data]);

  const table = useTable({
    data: memoized,
    columns,
  });

  React.useEffect(() => {
    const f = async () => {
      const asyncTasks: Promise<FilterData>[] = products.map(
        async (product) => {
          const attributes = await dexie.productAttributes
            .where("product_id")
            .equals(product.id)
            .filter((attr) => !attr.deleted)
            .toArray();

          const colorAttr = attributes.find((attr) =>
            attr.id.includes("warna"),
          );
          const sizeAttr = attributes.find((attr) =>
            attr.id.includes("ukuran"),
          );

          const [colorValues, sizeValues] = await Promise.all([
            colorAttr
              ? dexie.productAttributeValues
                  .where("attribute_id")
                  .equals(colorAttr.id)
                  .filter((v) => !v.deleted)
                  .toArray()
              : Promise.resolve([]),
            sizeAttr
              ? dexie.productAttributeValues
                  .where("attribute_id")
                  .equals(sizeAttr.id)
                  .filter((v) => !v.deleted)
                  .toArray()
              : Promise.resolve([]),
          ]);

          return {
            ...product,
            colors: colorValues,
            sizes: sizeValues,
          };
        },
      );

      const _data = await Promise.all(asyncTasks);
      setData(_data);
      setLoading(false);
    };

    void f();
  }, [products]);

  return (
    <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
      {/* <header>
        <h2 className="text-xl font-bold text-gray-900 sm:text-3xl">
          Product Collection
        </h2>

        <p className="mt-4 max-w-md text-gray-500">
          Lorem ipsum, dolor sit amet consectetur adipisicing elit. Itaque
          praesentium cumque iure dicta incidunt est ipsam, officia dolor fugit
          natus?
        </p>
      </header> */}

      <div className="block lg:hidden">
        <button className="flex cursor-pointer items-center gap-2 border-b border-gray-400 pb-1 text-gray-900 transition hover:border-gray-600">
          <span className="text-sm font-medium"> Filters & Sorting </span>

          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="size-4 rtl:rotate-180"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 4.5l7.5 7.5-7.5 7.5"
            />
          </svg>
        </button>
      </div>

      <div className="mt-4 lg:mt-8 lg:grid lg:grid-cols-4 lg:items-start lg:gap-8">
        <div className="sticky top-14 hidden space-y-4 lg:block">
          {/* <div>
            <label
              htmlFor="SortBy"
              className="block text-xs font-medium text-gray-700"
            >
              {" "}
              Sort By{" "}
            </label>

            <select
              id="SortBy"
              className="mt-1 rounded-sm border-gray-300 text-sm"
            >
              <option>Sort By</option>
              <option value="Title, DESC">Title, DESC</option>
              <option value="Title, ASC">Title, ASC</option>
              <option value="Price, DESC">Price, DESC</option>
              <option value="Price, ASC">Price, ASC</option>
            </select>
          </div> */}

          <div>
            <p className="block text-xs font-medium text-gray-700">Filters</p>

            <div className="mt-1 space-y-2">
              {/* <details className="overflow-hidden rounded-sm border border-gray-300 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-2 p-4 text-gray-900 transition">
                  <span className="text-sm font-medium"> Availability </span>

                  <span className="transition group-open:-rotate-180">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="size-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  </span>
                </summary>

                <div className="border-t border-gray-200 bg-white">
                  <header className="flex items-center justify-between p-4">
                    <span className="text-sm text-gray-700"> 0 Selected </span>

                    <button
                      type="button"
                      className="text-sm text-gray-900 underline underline-offset-4"
                    >
                      Reset
                    </button>
                  </header>

                  <ul className="space-y-1 border-t border-gray-200 p-4">
                    <li>
                      <label
                        htmlFor="FilterInStock"
                        className="inline-flex items-center gap-2"
                      >
                        <input
                          type="checkbox"
                          id="FilterInStock"
                          className="size-5 rounded-sm border-gray-300 shadow-sm"
                        />

                        <span className="text-sm font-medium text-gray-700">
                          {" "}
                          In Stock (5+){" "}
                        </span>
                      </label>
                    </li>

                    <li>
                      <label
                        htmlFor="FilterPreOrder"
                        className="inline-flex items-center gap-2"
                      >
                        <input
                          type="checkbox"
                          id="FilterPreOrder"
                          className="size-5 rounded-sm border-gray-300 shadow-sm"
                        />

                        <span className="text-sm font-medium text-gray-700">
                          {" "}
                          Pre Order (3+){" "}
                        </span>
                      </label>
                    </li>

                    <li>
                      <label
                        htmlFor="FilterOutOfStock"
                        className="inline-flex items-center gap-2"
                      >
                        <input
                          type="checkbox"
                          id="FilterOutOfStock"
                          className="size-5 rounded-sm border-gray-300 shadow-sm"
                        />

                        <span className="text-sm font-medium text-gray-700">
                          {" "}
                          Out of Stock (10+){" "}
                        </span>
                      </label>
                    </li>
                  </ul>
                </div>
              </details>

              <details className="overflow-hidden rounded-sm border border-gray-300 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-2 p-4 text-gray-900 transition">
                  <span className="text-sm font-medium"> Price </span>

                  <span className="transition group-open:-rotate-180">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="size-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  </span>
                </summary>

                <div className="border-t border-gray-200 bg-white">
                  <header className="flex items-center justify-between p-4">
                    <span className="text-sm text-gray-700">
                      {" "}
                      The highest price is $600{" "}
                    </span>

                    <button
                      type="button"
                      className="text-sm text-gray-900 underline underline-offset-4"
                    >
                      Reset
                    </button>
                  </header>

                  <div className="border-t border-gray-200 p-4">
                    <div className="flex justify-between gap-4">
                      <label
                        htmlFor="FilterPriceFrom"
                        className="flex items-center gap-2"
                      >
                        <span className="text-sm text-gray-600">$</span>

                        <input
                          type="number"
                          id="FilterPriceFrom"
                          placeholder="From"
                          className="shadow-xs w-full rounded-md border-gray-200 sm:text-sm"
                        />
                      </label>

                      <label
                        htmlFor="FilterPriceTo"
                        className="flex items-center gap-2"
                      >
                        <span className="text-sm text-gray-600">$</span>

                        <input
                          type="number"
                          id="FilterPriceTo"
                          placeholder="To"
                          className="shadow-xs w-full rounded-md border-gray-200 sm:text-sm"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </details> */}

              <details className="overflow-hidden rounded-sm border border-gray-300 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-2 p-4 text-gray-900 transition">
                  <span className="text-sm font-medium"> Warna </span>

                  <span className="transition group-open:-rotate-180">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="size-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  </span>
                </summary>

                <div className="border-t border-gray-200 bg-white">
                  <header className="flex items-center justify-between p-4">
                    <span className="text-sm text-gray-700">
                      {" "}
                      {
                        (
                          (table
                            .getColumn("colors")
                            ?.getFilterValue() as string[]) ?? []
                        ).length
                      }{" "}
                      Terpilih
                    </span>

                    <button
                      type="button"
                      className="text-sm text-gray-900 underline underline-offset-4"
                      onClick={() => {
                        table.getColumn("colors")?.setFilterValue([]);
                      }}
                    >
                      Reset
                    </button>
                  </header>

                  <ul className="space-y-1 border-t border-gray-200 p-4">
                    <AvailableColor
                      selectedColors={
                        (table
                          .getColumn("colors")
                          ?.getFilterValue() as string[]) ?? []
                      }
                      onColorDeselect={(color) =>
                        // setSelectedColors((p) => p.filter((x) => x !== color))
                        table
                          .getColumn("colors")
                          ?.setFilterValue(
                            (
                              (table
                                .getColumn("colors")
                                ?.getFilterValue() as string[]) ?? []
                            ).filter((x) => x !== color),
                          )
                      }
                      onColorSelect={(color) => {
                        table
                          .getColumn("colors")
                          ?.setFilterValue([
                            ...((table
                              .getColumn("colors")
                              ?.getFilterValue() as string[]) ?? []),
                            color,
                          ]);
                      }}
                    />
                  </ul>
                </div>
              </details>
              <details className="overflow-hidden rounded-sm border border-gray-300 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-2 p-4 text-gray-900 transition">
                  <span className="text-sm font-medium"> Ukuran </span>

                  <span className="transition group-open:-rotate-180">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="size-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  </span>
                </summary>

                <div className="border-t border-gray-200 bg-white">
                  <header className="flex items-center justify-between p-4">
                    <span className="text-sm text-gray-700">
                      {
                        (
                          (table
                            .getColumn("sizes")
                            ?.getFilterValue() as string[]) ?? []
                        ).length
                      }{" "}
                      Terpilih
                    </span>

                    <button
                      type="button"
                      className="text-sm text-gray-900 underline underline-offset-4"
                      onClick={() => {
                        table.getColumn("sizes")?.setFilterValue([]);
                      }}
                    >
                      Reset
                    </button>
                  </header>

                  <ul className="space-y-1 border-t border-gray-200 p-4">
                    <AvailableSizes
                      selectedSizes={
                        (table
                          .getColumn("sizes")
                          ?.getFilterValue() as string[]) ?? []
                      }
                      onDeselect={(color) =>
                        // setSelectedColors((p) => p.filter((x) => x !== color))
                        table
                          .getColumn("sizes")
                          ?.setFilterValue(
                            (
                              (table
                                .getColumn("sizes")
                                ?.getFilterValue() as string[]) ?? []
                            ).filter((x) => x !== color),
                          )
                      }
                      onSelect={(color) => {
                        table
                          .getColumn("sizes")
                          ?.setFilterValue([
                            ...((table
                              .getColumn("sizes")
                              ?.getFilterValue() as string[]) ?? []),
                            color,
                          ]);
                      }}
                    />
                  </ul>
                </div>
              </details>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {loading ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <List
                data={[{ id: "1" }, { id: "2" }]}
                render={(data) => (
                  <div>
                    <Skeleton className="aspect-square" />
                    <div className="mt-3 flex flex-col gap-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                )}
              />
            </ul>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {slice ? (
                <List
                  data={table.getRowModel().rows.slice(0, slice)}
                  render={(item) => <CardComponent product={item.original} />}
                  renderEmpty={() => <div>Loading...</div>}
                />
              ) : (
                <List
                  data={table.getRowModel().rows}
                  render={(item) => <CardComponent product={item.original} />}
                  renderEmpty={() => <div>Loading...</div>}
                />
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterSection;

const AvailableColor: React.FC<{
  selectedColors: string[];
  onColorSelect: (color: string) => void;
  onColorDeselect: (color: string) => void;
}> = ({ selectedColors, onColorDeselect, onColorSelect }) => {
  const colors = useLiveQuery(() =>
    dexie.productAttributeValues
      .filter((x) => x.attribute_id.includes("warna"))
      .sortBy("name"),
  );

  return (
    <>
      {[...new Set(colors?.map((x) => x.value))].map((x) => (
        <Color
          key={x}
          color={x}
          selected={selectedColors.includes(x)}
          onSelect={onColorSelect}
          onDeselect={onColorDeselect}
        />
      ))}
    </>
  );
};

const AvailableSizes: React.FC<{
  selectedSizes: string[];
  onSelect: (color: string) => void;
  onDeselect: (color: string) => void;
}> = ({ selectedSizes, onDeselect, onSelect }) => {
  const sizes = useLiveQuery(() =>
    dexie.productAttributeValues
      .filter((x) => x.attribute_id.includes("ukuran"))
      .sortBy("name"),
  );

  return (
    <>
      {[...new Set(sizes?.map((x) => x.value))].map((x) => (
        <Color
          key={x}
          color={x}
          selected={selectedSizes.includes(x)}
          onSelect={onSelect}
          onDeselect={onDeselect}
        />
      ))}
    </>
  );
};

const Color: React.FC<{
  color: string;
  selected: boolean;
  onSelect: (color: string) => void;
  onDeselect: (color: string) => void;
}> = ({ color, selected, onSelect, onDeselect }) => {
  return (
    <li>
      <label htmlFor="FilterTeal" className="inline-flex items-center gap-2">
        <Checkbox
          checked={selected}
          onCheckedChange={(e) => {
            if (e) {
              onSelect(color);
            } else {
              onDeselect(color);
            }
          }}
        />

        <span className="text-sm font-medium text-gray-700">{color}</span>
      </label>
    </li>
  );
};
