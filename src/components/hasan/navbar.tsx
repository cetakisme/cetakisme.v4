"use client";

import React from "react";

import { GiHamburgerMenu } from "react-icons/gi";

const Navbar = () => {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative">
      <div className="relative z-20 flex h-12 items-center justify-between bg-white px-4">
        <h1 className="font-bold">Cetakisme</h1>
        <button onClick={() => setOpen((p) => !p)}>
          <GiHamburgerMenu />
        </button>
      </div>
      <div
        className={`absolute left-0 right-0 z-10 w-full bg-white p-4 shadow-lg duration-150 ease-in-out ${open ? "top-12" : "-top-64"}`}
      >
        <ul className="space-y-2">
          <li>Home</li>
          <li>About</li>
          <li>Contact</li>
        </ul>
      </div>
    </div>
  );
};

export default Navbar;
