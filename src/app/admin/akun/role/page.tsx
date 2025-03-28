"use client";

import React, { createContext, Fragment, useContext } from "react";
import { DataTableColumnHeader } from "@/hooks/Table/DataColumnHeader";
import { DataTableContent } from "@/hooks/Table/DataTableContent";
import { DataTableFilterName } from "@/hooks/Table/DataTableFilterName";
import { DataTablePagination } from "@/hooks/Table/DataTablePagination";
import { DataTableViewOptions } from "@/hooks/Table/DataTableViewOptions";
import { useTable } from "@/hooks/Table/useTable";
import { dexie } from "@/server/local/dexie";
import { useLiveQuery } from "dexie-react-hooks";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { ColumnDef } from "@tanstack/react-table";
import type { Role } from "@prisma/client";
import Dialog from "@/components/hasan/dialog";
import { Button } from "@/components/ui/button";
import { LucidePlus, MoreHorizontal } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getNavigations } from "../../layout";
import ControlledSheet from "@/components/hasan/controlled-sheet";
import { Memo, useObservable } from "@legendapp/state/react";
import InputWithLabel from "@/components/hasan/input-with-label";
import { z } from "zod";
import { toast } from "sonner";
import { roles$ } from "@/server/local/db";
import { SheetClose } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDialog } from "@/hooks/useDialog";
import type { DialogProps } from "@radix-ui/react-dialog";
import Alert from "@/components/hasan/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { asList } from "@/server/local/utils";
import { Checkbox } from "@/components/ui/checkbox";
import type { Observable } from "@legendapp/state";
import Authenticated from "@/components/hasan/auth/authenticated";
import AuthFallback from "@/components/hasan/auth/auth-fallback";

const columns: ColumnDef<Role>[] = [
  {
    id: "name",
    accessorFn: (original) => original.id,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nama" />
    ),
    cell: ({ renderValue }) => (
      <div className="font-medium">{renderValue<string>()}</div>
    ),
    size: 500,
  },
  {
    id: "permissions",
    accessorFn: (original) => original.permissions.length,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Izin" />
    ),
    cell: ({ row }) => (
      <Authenticated
        permission="role-update"
        fallback={() => (
          <Memo>
            {() => (
              <Button variant="outline">
                {roles$[row.original.id]!.permissions.get()?.length ?? 0} Izin
              </Button>
            )}
          </Memo>
        )}
      >
        <AddDialog role={row.original} />
      </Authenticated>
    ),
    size: 2000,
  },
  {
    id: "actions",
    cell: ({ row }) => <Actions role={row.original} />,
  },
];

const Actions: React.FC<{ role: Role }> = ({ role }) => {
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
          <DropdownMenuSeparator />
          <Authenticated permission="role-delete">
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
      <DeleteUser role={role} {...deleteDialog.props} />
    </>
  );
};

const DeleteUser: React.FC<{ role: Role } & DialogProps> = ({
  role,
  ...props
}) => {
  const remove = async () => {
    roles$[role.id]!.deleted.set(false);
  };

  return (
    <Alert
      {...props}
      title="Yaking Ingin Menghapus Role?"
      description="Role Yang Dihapus Tidak Bisa Dikembalikan Lagi"
      renderCancel={() => <Button>Tidak</Button>}
      renderAction={() => <Button onClick={() => remove()}>Ya</Button>}
    />
  );
};

const Page = () => {
  return (
    <Authenticated permission="role" fallback={AuthFallback}>
      <Roles />
    </Authenticated>
  );
};

export default Page;

const Roles = () => {
  const users = useLiveQuery(() =>
    dexie.roles.filter((x) => !x.deleted).toArray(),
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
            {/* <AddDialog /> */}
            <Authenticated permission="role-created">
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

const AddSheet = () => {
  return (
    <ControlledSheet
      trigger={(trigger) => (
        <Button variant="outline" size="icon" onClick={() => trigger()}>
          <LucidePlus />
        </Button>
      )}
      title="Tambah User Baru"
      content={() => <AddForm />}
    />
  );
};

const schema = z.object({
  role: z.string().min(1, "Nama Harus Diisi"),
});

const AddForm = () => {
  const role = useObservable({
    role: "",
  });

  const save = async () => {
    const result = schema.safeParse(role.get());
    if (!result.success) {
      toast.error(result.error.errors[0]?.message);
      return;
    }

    roles$[result.data.role]!.set({
      id: result.data.role,
      deleted: false,
      permissions: [],
    });
  };

  return (
    <div className="space-y-2">
      <Memo>
        {() => (
          <InputWithLabel
            label="Nama Role"
            inputProps={{
              value: role.role.get(),
              onChange: (e) => role.role.set(e.target.value),
            }}
          />
        )}
      </Memo>
      <Button className="w-full" asChild>
        <SheetClose onClick={() => save()}> Submit</SheetClose>
      </Button>
    </div>
  );
};

const actions = ["create", "update", "delete"];

interface IRoleContext {
  role: Role;
}

const RoleContext = createContext<Observable<IRoleContext>>(undefined as any);

const AddDialog: React.FC<{ role: Role }> = ({ role }) => {
  const navigations = getNavigations();
  const parents = Object.values(navigations);

  const role$ = useObservable<IRoleContext>({
    role: role,
  });

  return (
    <RoleContext.Provider value={role$}>
      <Dialog
        title={`Perizinan Role ${role.id}`}
        className="max-h-[32rem] overflow-hidden overflow-y-auto"
        description={() => "Mengatur Perizinan Role Pada Aplikasi"}
        renderTrigger={() => (
          <Button variant="outline">
            <Memo>
              {() => (
                <>{roles$[role.id]!.permissions.get()?.length ?? 0} Izin</>
              )}
            </Memo>
          </Button>
        )}
      >
        <Tabs
          defaultValue={navigations.pos!.permission}
          className="overflow-hidden"
        >
          <ScrollArea className="-12 w-full">
            <TabsList>
              {parents.map((x) => (
                <TabsTrigger value={x.permission} key={x.permission}>
                  {x.permission.replaceAll("-", " ")}
                </TabsTrigger>
              ))}
            </TabsList>

            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          <RolePermissionTabsContent permission={navigations.pos!} />
          <RolePermissionTabsContent
            permission={navigations["sales-and-purchasing"]!}
          />
          <RolePermissionTabsContent permission={navigations.katalog!} />
          <RolePermissionTabsContent
            permission={navigations["pelanggan-dan-suplier"]!}
          />
          <RolePermissionTabsContent permission={navigations.orderan!} />
          <RolePermissionTabsContent permission={navigations.akun!} />
          <RolePermissionTabsContent permission={navigations.absensi!} />
        </Tabs>
      </Dialog>
    </RoleContext.Provider>
  );
};

const RolePermissionTabsContent: React.FC<{
  permission: {
    permission: string;
    children: Record<string, { permission: string }>;
  };
}> = ({ permission }) => {
  const role$ = useContext(RoleContext);

  return (
    <TabsContent value={permission.permission}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Izin</TableHead>
            <TableHead className="text-right">Izin</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="h-10">
            <TableCell className="font-medium">
              {permission.permission}
            </TableCell>
            <TableCell className="text-right">
              <Memo>
                {() => {
                  const permissionsSet = new Set(
                    roles$[role$.role.id.get()]!.permissions.get(),
                  );
                  return (
                    <Checkbox
                      checked={permissionsSet.has(permission.permission)}
                      onCheckedChange={(e) => {
                        if (e === true) {
                          roles$[role$.role.id.get()]!.permissions.set((p) => {
                            if (p === null) return [permission.permission];
                            return [...p, permission.permission];
                          });
                          return;
                        }

                        if (e === false) {
                          roles$[role$.role.id.get()]!.permissions.set((p) => {
                            if (p === null) return [];
                            return p.filter((r) => r !== permission.permission);
                          });
                        }
                      }}
                    />
                  );
                }}
              </Memo>
            </TableCell>
          </TableRow>
          {asList<{ permission: string }>(permission.children).map((x) => {
            return (
              <Fragment key={x.permission}>
                <TableRow className="h-10">
                  <TableCell className="font-medium">{x.permission}</TableCell>
                  <TableCell className="text-right">
                    <Memo>
                      {() => {
                        const permissionsSet = new Set(
                          roles$[role$.role.id.get()]!.permissions.get(),
                        );
                        return (
                          <Checkbox
                            checked={permissionsSet.has(x.permission)}
                            onCheckedChange={(e) => {
                              if (e === true) {
                                roles$[role$.role.id.get()]!.permissions.set(
                                  (p) => {
                                    if (p === null) return [x.permission];
                                    return [...p, x.permission];
                                  },
                                );
                                return;
                              }

                              if (e === false) {
                                roles$[role$.role.id.get()]!.permissions.set(
                                  (p) => {
                                    if (p === null) return [];
                                    return p.filter((r) => r !== x.permission);
                                  },
                                );
                              }
                            }}
                          />
                        );
                      }}
                    </Memo>
                  </TableCell>
                </TableRow>
                {actions.map((a) => {
                  const joinedString = [x.permission, a].join("-");

                  return (
                    <TableRow key={a} className="h-10">
                      <TableCell className="pl-8">{a}</TableCell>
                      <TableCell className="text-right">
                        <Memo>
                          {() => {
                            const permissionsSet = new Set(
                              roles$[role$.role.id.get()]!.permissions.get(),
                            );
                            return (
                              <Checkbox
                                checked={permissionsSet.has(joinedString)}
                                onCheckedChange={(e) => {
                                  if (e === true) {
                                    roles$[
                                      role$.role.id.get()
                                    ]!.permissions.set((p) => {
                                      if (p === null) return [joinedString];
                                      return [...p, joinedString];
                                    });
                                    return;
                                  }

                                  if (e === false) {
                                    roles$[
                                      role$.role.id.get()
                                    ]!.permissions.set((p) => {
                                      if (p === null) return [];
                                      return p.filter(
                                        (r) => r !== joinedString,
                                      );
                                    });
                                  }
                                }}
                              />
                            );
                          }}
                        </Memo>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TabsContent>
  );
};
