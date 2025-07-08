import { LayoutGrid, type LucideIcon } from "lucide-react";

type Submenu = {
  href: string;
  label: string;
  active?: boolean;
};

type Menu = {
  href: string;
  label: string;
  active?: boolean;
  icon: LucideIcon;
  submenus?: Submenu[];
};

type Group = {
  groupLabel: string;
  menus: Menu[];
};

export function getMenuList(): Group[] {
  return [
    {
      groupLabel: "",
      menus: [
        {
          href: "/admin",
          label: "Dashboard",
          active: false,
          icon: LayoutGrid,
          submenus: [],
        },
        {
          href: "",
          label: "POS",
          icon: LayoutGrid,
          submenus: [
            {
              href: "/admin/pos/kasir2",
              label: "Kasir",
            },
            {
              href: "/admin/resi",
              label: "Resi",
            },
          ],
        },
        {
          href: "",
          label: "Sales & Purchasing",
          icon: LayoutGrid,
          submenus: [
            {
              href: "/admin/sales-dan-purchasing/pengeluaran",
              label: "Pengeluaran",
            },
            {
              href: "/admin/sales-dan-purchasing/pemasukan",
              label: "Pemasukan",
            },
            {
              href: "/admin/sales-dan-purchasing/gabungan",
              label: "Gabungan",
            },
          ],
        },
        {
          href: "",
          label: "Katalog",
          icon: LayoutGrid,
          submenus: [
            {
              href: "/admin/katalog/produk",
              label: "Produk",
            },
            {
              href: "/admin/katalog/bahan-dan-aset",
              label: "Bahan Dan Aset",
            },
            {
              href: "/admin/katalog/inventory",
              label: "Inventori",
            },
          ],
        },
        {
          href: "",
          label: "Pelanggan & Suplier",
          icon: LayoutGrid,
          submenus: [
            {
              href: "/admin/pelanggan-dan-suplier/pelanggan",
              label: "Pelanggan",
            },
            {
              href: "/admin/pelanggan-dan-suplier/suplier",
              label: "Suplier",
            },
          ],
        },
        {
          href: "",
          label: "Orderan",
          icon: LayoutGrid,
          submenus: [
            {
              href: "/admin/orderan2/pending",
              label: "Pending",
            },
            {
              href: "/admin/orderan2/desain",
              label: "Design",
            },
            {
              href: "/admin/orderan2/ready",
              label: "Ready",
            },
            {
              href: "/admin/orderan2/selesai",
              label: "Selesai",
            },
            {
              href: "/admin/orderan2/semua",
              label: "Semua",
            },
          ],
        },
        {
          href: "",
          label: "Akun",
          icon: LayoutGrid,
          submenus: [
            {
              href: "/admin/akun/role",
              label: "Role",
            },
            {
              href: "/admin/akun/user",
              label: "User",
            },
          ],
        },
        {
          href: "",
          label: "Setttings",
          icon: LayoutGrid,
          submenus: [
            {
              href: "/admin/website/halaman-utama",
              label: "Landing Page",
            },
            {
              href: "/admin/website/settings",
              label: "Settings",
            },
          ],
        },
      ],
    },
    // {
    //   groupLabel: "Contents",
    //   menus: [
    //     {
    //       href: "",
    //       label: "Posts",
    //       icon: SquarePen,
    //       submenus: [
    //         {
    //           href: "/posts",
    //           label: "All Posts",
    //         },
    //         {
    //           href: "/posts/new",
    //           label: "New Post",
    //         },
    //       ],
    //     },
    //     {
    //       href: "/categories",
    //       label: "Categories",
    //       icon: Bookmark,
    //     },
    //     {
    //       href: "/tags",
    //       label: "Tags",
    //       icon: Tag,
    //     },
    //   ],
    // },
    // {
    //   groupLabel: "Settings",
    //   menus: [
    //     {
    //       href: "/users",
    //       label: "Users",
    //       icon: Users,
    //     },
    //     {
    //       href: "/account",
    //       label: "Account",
    //       icon: Settings,
    //     },
    //   ],
    // },
  ];
}
