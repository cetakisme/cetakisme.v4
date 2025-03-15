"use client";

import { user$ } from "@/server/local/auth";
import { roles$, users$ } from "@/server/local/db";
import { Memo, use$, useObserve } from "@legendapp/state/react";
import React from "react";

const Authenticated: React.FC<
  React.PropsWithChildren & {
    permission: string;
    fallback?: () => React.ReactNode;
  }
> = ({ children, permission, fallback }) => {
  return (
    <>
      <Memo>
        {() => {
          const user = user$.get();

          if (!user) return fallback?.();
          const role = user.role;

          if (!role) return fallback?.();
          if (role === "admin") return <>{children}</>;

          const roleId = users$[user.id]!.roleId.get();

          const existingRole = roles$[roleId]?.get();
          if (!existingRole) return fallback?.();

          const permissions = new Set([...(existingRole.permissions ?? [])]);
          if (permissions.has(permission)) return <>{children}</>;

          return fallback?.();
        }}
      </Memo>
    </>
  );
};

export default Authenticated;
