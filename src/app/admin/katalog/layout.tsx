import Authenticated from "@/components/hasan/auth/authenticated";
import React, { type PropsWithChildren } from "react";

const Layout: React.FC<PropsWithChildren> = ({ children }) => {
  return <Authenticated permission="katalog">{children}</Authenticated>;
};

export default Layout;
