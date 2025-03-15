import Authenticated from "@/components/hasan/auth/authenticated";
import React, { type PropsWithChildren } from "react";

const Layout: React.FC<PropsWithChildren> = ({ children }) => {
  return <Authenticated permission="orderan">{children}</Authenticated>;
};

export default Layout;
