import React from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";
import Loader from "./loader";
import Authenticated from "@/components/hasan/auth/authenticated";

interface Menu {
  title: string;
  url?: string;
  children: Menu[];
  permission: string;
}

export const menus: Menu[] = [
  {
    title: "POS",
    permission: "pos",
    children: [
      {
        title: "Kasir",
        children: [],
        url: "/admin/pos/kasir",
        permission: "kasir",
      },
      {
        title: "Resi",
        children: [],
        permission: "resi",
      },
    ],
  },
  {
    title: "Sales & Purchasing",
    permission: "sales-and-purchasing",
    children: [
      {
        title: "Pengeluaran",
        permission: "pengeluaran",
        children: [],
      },
      {
        title: "Pemasukan",
        permission: "pemasukan",
        children: [],
      },
    ],
  },
  {
    title: "Katalog",
    permission: "katalog",
    children: [
      {
        title: "Produk",
        children: [],
        url: "/admin/katalog/produk",
        permission: "produk",
      },
      {
        title: "Inventori",
        permission: "inventori",
        children: [],
      },
    ],
  },
  {
    title: "Pelanggan & Suplier",
    permission: "pelanggan-dan-suplier",
    children: [
      {
        title: "Pelanggan",
        url: "/admin/pelanggan-dan-suplier/pelanggan",
        permission: "pelanggan",
        children: [],
      },
      {
        title: "Suplier",
        permission: "suplier",
        children: [],
      },
    ],
  },
  {
    title: "Orderan",
    permission: "orderan",
    children: [
      {
        title: "Pending",
        url: "/admin/order?status=peding",
        permission: "pending",
        children: [],
      },
      {
        title: "DP",
        children: [],
        permission: "dp",
      },
      {
        title: "Desain",
        children: [],
        permission: "desain",
      },
      {
        title: "Ready",
        children: [],
        permission: "ready",
      },
      {
        title: "Selesai",
        children: [],
        permission: "selesai",
      },
    ],
  },
  {
    title: "Akun",
    permission: "akun",
    children: [
      {
        title: "Role",
        children: [],
        url: "/admin/akun/role",
        permission: "role",
      },
      {
        title: "User",
        children: [],
        url: "/admin/akun/user",
        permission: "user",
      },
    ],
  },
] as const;

type Navigation = {
  [K in (typeof menus)[0] as K["permission"]]: {
    permission: K["permission"];
    children: {
      [C in K["children"][0] as C["permission"]]: {
        permission: C["permission"];
      };
    };
  };
};

export function getNavigations() {
  const navigations: Navigation = {};

  for (const menu of menus) {
    if (!menu.permission) continue;

    // Initialize parent navigation
    if (!navigations[menu.permission]) {
      navigations[menu.permission] = {
        permission: menu.permission,
        children: {},
      };
    }

    // Add children directly
    for (const child of menu.children) {
      if (!child.permission) continue;

      navigations[menu.permission]!.children[child.permission] = {
        permission: child.permission,
      };
    }
  }

  return navigations;
}

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <main className="flex h-screen">
      <Loader />
      <div className="w-72 shrink-0 bg-black p-4 text-white">
        <h1 className="text-3xl font-extrabold">Cetakisme</h1>
        <div className="mt-6 flex flex-col gap-2">
          <Accordion
            type="single"
            collapsible
            className="rounded-md bg-white px-5 text-black"
          >
            {menus.map((x, i) => (
              <Authenticated permission={x.permission ?? ""} key={i}>
                <AccordionItem value={`item-${i}`} className="border-0">
                  <AccordionTrigger>
                    <div className="flex gap-2">
                      <svg
                        stroke="currentColor"
                        fill="currentColor"
                        strokeWidth="0"
                        viewBox="0 0 24 24"
                        height="22"
                        width="22"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M4 13h6a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1zm-1 7a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v4zm10 0a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v7zm1-10h6a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1z"></path>
                      </svg>
                      <h1 className="font-semibold">{x.title}</h1>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="flex flex-col gap-1">
                    {x.children.map((c, j) => (
                      <Authenticated permission={c.permission ?? ""} key={j}>
                        {c.url ? (
                          <Link
                            href={c.url}
                            prefetch
                            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-5 py-2 hover:bg-black hover:text-white"
                          >
                            <svg
                              stroke="currentColor"
                              fill="currentColor"
                              strokeWidth="0"
                              viewBox="0 0 1024 1024"
                              height="22"
                              width="22"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M832 64H192c-17.7 0-32 14.3-32 32v224h704V96c0-17.7-14.3-32-32-32zM288 232c-22.1 0-40-17.9-40-40s17.9-40 40-40 40 17.9 40 40-17.9 40-40 40zM160 928c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V704H160v224zm128-136c22.1 0 40 17.9 40 40s-17.9 40-40 40-40-17.9-40-40 17.9-40 40-40zM160 640h704V384H160v256zm128-168c22.1 0 40 17.9 40 40s-17.9 40-40 40-40-17.9-40-40 17.9-40 40-40z"></path>
                            </svg>
                            {c.title}
                          </Link>
                        ) : (
                          <button className="flex w-full cursor-pointer items-center gap-2 rounded-md px-5 py-2 hover:bg-black hover:text-white">
                            <svg
                              stroke="currentColor"
                              fill="currentColor"
                              strokeWidth="0"
                              viewBox="0 0 1024 1024"
                              height="22"
                              width="22"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M832 64H192c-17.7 0-32 14.3-32 32v224h704V96c0-17.7-14.3-32-32-32zM288 232c-22.1 0-40-17.9-40-40s17.9-40 40-40 40 17.9 40 40-17.9 40-40 40zM160 928c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V704H160v224zm128-136c22.1 0 40 17.9 40 40s-17.9 40-40 40-40-17.9-40-40 17.9-40 40-40zM160 640h704V384H160v256zm128-168c22.1 0 40 17.9 40 40s-17.9 40-40 40-40-17.9-40-40 17.9-40 40-40z"></path>
                            </svg>
                            {c.title}
                          </button>
                        )}
                      </Authenticated>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              </Authenticated>
            ))}
          </Accordion>
        </div>
      </div>
      <div className="h-full grow">{children}</div>
    </main>
  );
};

export default AdminLayout;
