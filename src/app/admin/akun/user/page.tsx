"use client";

import Alert from "@/components/hasan/alert";
import Authenticated from "@/components/hasan/auth/authenticated";
import ControlledSheet from "@/components/hasan/controlled-sheet";
import InputWithLabel from "@/components/hasan/input-with-label";
import RenderList from "@/components/hasan/render-list";
import Sheet from "@/components/hasan/sheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/hooks/Table/DataColumnHeader";
import { DataTableContent } from "@/hooks/Table/DataTableContent";
import { DataTableFilterName } from "@/hooks/Table/DataTableFilterName";
import { DataTablePagination } from "@/hooks/Table/DataTablePagination";
import { DataTableViewOptions } from "@/hooks/Table/DataTableViewOptions";
import { useTable } from "@/hooks/Table/useTable";
import { useDialog } from "@/hooks/useDialog";
import { authClient } from "@/lib/better-auth/auth-client";
import { user$ } from "@/server/local/auth";
import { roles$, users$ } from "@/server/local/db";
import { dexie } from "@/server/local/dexie";
import { generateId } from "@/server/local/utils";
import { Memo, useObservable, useObserve } from "@legendapp/state/react";
import { CustomUser } from "@prisma/client";
import { DialogProps } from "@radix-ui/react-dialog";
import { DropdownMenuSeparator } from "@radix-ui/react-dropdown-menu";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { ColumnDef } from "@tanstack/react-table";
import { useLiveQuery } from "dexie-react-hooks";
import { LucidePlus, MoreHorizontal } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { z } from "zod";

const columns: ColumnDef<CustomUser>[] = [
  {
    id: "name",
    accessorFn: (original) => original.username,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nama" />
    ),
    cell: ({ renderValue }) => (
      <div className="font-medium">{renderValue<string>()}</div>
    ),
    size: 500,
  },
  {
    id: "password",
    accessorFn: (original) => original.password,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Password" />
    ),
    cell: ({ row }) => (
      <Authenticated
        permission="user-update"
        fallback={() => (
          <Button variant="ghost">
            {row.original.password
              .split("")
              .map((x) => "*")
              .join("")}
          </Button>
        )}
      >
        <Password user={row.original} />
      </Authenticated>
    ),
  },
  {
    id: "role",
    accessorFn: (original) => roles$[original.roleId]?.id.get() ?? "Dihapus",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role" />
    ),
    cell: ({ row }) => (
      <Authenticated
        permission="user-update"
        fallback={() => <RoleReadOnly user={row.original} />}
      >
        <Role user={row.original} />
      </Authenticated>
    ),
    size: 5000,
  },
  {
    id: "actions",
    cell: ({ row }) => <Actions user={row.original} />,
  },
];

const RoleReadOnly: React.FC<{ user: CustomUser }> = ({ user }) => {
  const role = useLiveQuery(() => dexie.roles.get(user.roleId));
  return <Button variant="outline">{role?.id ?? "No Role"}</Button>;
};

const Role: React.FC<{ user: CustomUser }> = ({ user }) => {
  const roles = useLiveQuery(() =>
    dexie.roles.filter((x) => !x.deleted).toArray(),
  );

  const role = useLiveQuery(() => dexie.roles.get(user.roleId));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">{role?.id ?? "No Role"}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem className="font-bold">Roles</DropdownMenuItem>
        <DropdownMenuSeparator />
        <RenderList
          data={roles}
          render={(x) => (
            <DropdownMenuItem
              className="font-medium"
              onClick={() => users$[user.id]!.roleId.set(x.id)}
            >
              {x.id}
            </DropdownMenuItem>
          )}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const Actions: React.FC<{ user: CustomUser }> = ({ user }) => {
  const deleteDialog = useDialog();
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem className="font-semibold">Opsi</DropdownMenuItem>
          <DropdownMenuShortcut />
          <Authenticated permission="user-update">
            <DropdownMenuItem>Ubah Password</DropdownMenuItem>
          </Authenticated>
          <Authenticated permission="user-delete">
            <Button asChild variant="destructive">
              <DropdownMenuItem
                onClick={deleteDialog.trigger}
                className="w-full justify-start"
              >
                Hapus
              </DropdownMenuItem>
            </Button>
          </Authenticated>
        </DropdownMenuContent>
      </DropdownMenu>
      <DeleteUser user={user} {...deleteDialog.props} />
    </>
  );
};

const DeleteUser: React.FC<{ user: CustomUser } & DialogProps> = ({
  user,
  ...props
}) => {
  const remove = async () => {
    const { data, error } = await authClient.admin.removeUser({
      userId: user.id,
    });

    if (error) {
      toast.error("Sometings Wrong");
      console.log(error.message);
      return;
    }

    users$[user.id]?.deleted.set(true);
    toast.success("User Berhasil Dihapus");
  };

  return (
    <Alert
      {...props}
      title="Yaking Ingin Menghapus User?"
      description="User Yang Dihapus Tidak Bisa Dikembalikan Lagi"
      renderCancel={() => <Button>Tidak</Button>}
      renderAction={() => <Button onClick={() => remove()}>Ya</Button>}
    />
  );
};

const Password: React.FC<{ user: CustomUser }> = ({ user }) => {
  const visible = useObservable(false);

  useObserve(() => {
    console.log(visible.get());
  });

  return (
    <Memo>
      {() => (
        <Button variant="ghost" onClick={() => visible.set((p) => !p)}>
          {visible.get()
            ? user.password
            : user.password
                .split("")
                .map((x) => "*")
                .join("")}
        </Button>
      )}
    </Memo>
  );
};

const Page = () => {
  const users = useLiveQuery(() =>
    dexie.users.filter((x) => !x.deleted).toArray(),
  );
  const table = useTable({
    data: users ?? [],
    columns: columns,
  });

  return (
    <ScrollArea className="h-screen p-8">
      <div className="space-y-2">
        <div className="flex h-9 justify-between">
          <DataTableFilterName table={table} />
          <div className="flex gap-2">
            <Authenticated permission="user-create">
              <AddSheet />
            </Authenticated>
            <DataTableViewOptions table={table} />
          </div>
        </div>
        <DataTableContent table={table} />
        <DataTablePagination table={table} />
      </div>
    </ScrollArea>
  );
};

export default Page;

const AddSheet = () => {
  return (
    <ControlledSheet
      trigger={(trigger) => (
        <Button variant="outline" size="icon" onClick={() => trigger()}>
          <LucidePlus />
        </Button>
      )}
      title="Tambah User Baru"
      content={(dismiss) => <AddForm onSuccess={() => dismiss()} />}
    />
  );
};

const schema = z.object({
  username: z.string().min(1, "Username Tidak Boleh Kosong"),
  password: z.string().min(8, "Password Minimal 8 Huruf!"),
  email: z.string().email("Format Email Salah"),
});

const AddForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const user = useObservable({
    username: "",
    password: "",
    email: "",
  });
  const saving = useObservable(false);

  const save = async () => {
    const result = schema.safeParse(user.get());

    if (!result.success) {
      toast.error(result.error.errors[0]?.message);
      return;
    }

    saving.set(true);

    try {
      const { data, error } = await authClient.admin.createUser({
        name: user.username.get(),
        email: user.email.get(),
        password: user.password.get(),
        role: "user",
        data: {
          username: user.username.get().toLowerCase(),
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (!data) {
        toast.error("Something Wrong");
        return;
      }

      users$[data.user.id]!.set({
        id: data.user.id,
        password: user.password.get(),
        username: user.username.get(),
        roleId: "",
        deleted: false,
      });

      onSuccess();
    } catch (e) {
      saving.set(false);
    }
  };

  return (
    <div className="space-y-2">
      <Memo>
        {() => (
          <InputWithLabel
            label="Username"
            inputProps={{
              value: user.username.get(),
              onChange: (e) => user.username.set(e.target.value),
            }}
          />
        )}
      </Memo>
      <Memo>
        {() => (
          <InputWithLabel
            label="Email"
            inputProps={{
              value: user.email.get(),
              onChange: (e) => user.email.set(e.target.value),
            }}
          />
        )}
      </Memo>
      <Memo>
        {() => (
          <InputWithLabel
            label="Password"
            inputProps={{
              value: user.password.get(),
              onChange: (e) => user.password.set(e.target.value),
            }}
          />
        )}
      </Memo>
      <Memo>
        {() => (
          <Button
            className="w-full"
            onClick={() => save()}
            disabled={saving.get()}
          >
            Submit
          </Button>
        )}
      </Memo>
    </div>
  );
};
