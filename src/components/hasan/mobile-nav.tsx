"use client";

import React, { useEffect, useState } from "react";
import { ScrollArea } from "../ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import Authenticated from "./auth/authenticated";
import { menus } from "@/app/admin/layout";
import Link from "next/link";
import LogoutButton from "@/app/admin/logout-button";
import { Button } from "../ui/button";
// import { FaBurger } from "react-icons/fa6";
import { GiHamburgerMenu } from "react-icons/gi";
// import { useHistoryState } from "@uidotdev/usehooks";
import { usePathname } from "next/navigation";

type Context = {
  open: boolean;
  toggleOpen: () => void;
  setOpen: (v: boolean) => void;
};
const MobileContext = React.createContext<Context | undefined>(undefined);

export const useMobileContext = () => {
  const ctx = React.useContext(MobileContext);
  if (!ctx) throw new Error("Mobile Context Error");
  return ctx;
};

export const MobilContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <MobileContext.Provider
      value={{ open, toggleOpen: () => setOpen((p) => !p), setOpen }}
    >
      {children}
    </MobileContext.Provider>
  );
};

export const MobileNavTrigger = () => {
  const { toggleOpen } = useMobileContext();
  return (
    <>
      <Button
        size={"icon"}
        className="fixed right-4 top-4 z-[20]"
        onClick={() => {
          toggleOpen();
        }}
      >
        <GiHamburgerMenu />
      </Button>
    </>
  );
};

const MobileNav = () => {
  const { open, setOpen } = useMobileContext();
  const pathname = usePathname();

  useEffect(() => {
    console.log(`Route changed to: ${pathname}`);
    setOpen(false);
  }, [pathname, setOpen]);

  return (
    <div
      className={`fixed z-[10] flex h-screen w-screen shrink-0 flex-col bg-black p-4 text-white duration-150 ease-in-out lg:hidden ${!open ? "-translate-x-full" : "translate-x-0"}`}
    >
      <h1 className="text-3xl font-extrabold">Cetakisme</h1>
      <ScrollArea className="mt-6 flex flex-1 flex-col gap-2">
        <Accordion
          type="single"
          collapsible
          className="rounded-md bg-white px-5 text-black"
        >
          {menus.map((x, i) => (
            <Authenticated
              permission={x.permission ?? ""}
              key={i}
              exclude={x.exclude}
            >
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
                    <Authenticated
                      permission={c.permission ?? ""}
                      key={j}
                      exclude={x.exclude}
                    >
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
        <LogoutButton />
      </ScrollArea>
    </div>
  );
};

export default MobileNav;
