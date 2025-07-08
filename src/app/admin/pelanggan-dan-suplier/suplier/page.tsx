"use client";

import { ContentLayout } from "@/components/admin-panel/content-layout";
import Alert from "@/components/hasan/alert";
import Authenticated from "@/components/hasan/auth/authenticated";
import ControlledSheet from "@/components/hasan/controlled-sheet";
import InputWithLabel from "@/components/hasan/input-with-label";
import Sheet from "@/components/hasan/sheet";
import Title from "@/components/hasan/title";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { DataTableColumnHeader } from "@/hooks/Table/DataColumnHeader";
import { DataTableContent } from "@/hooks/Table/DataTableContent";
import { DataTableFilterName } from "@/hooks/Table/DataTableFilterName";
import { DataTablePagination } from "@/hooks/Table/DataTablePagination";
import { DataTableViewOptions } from "@/hooks/Table/DataTableViewOptions";
import { useTable } from "@/hooks/Table/useTable";
import { useDialog } from "@/hooks/useDialog";
import { supplierContactPersons$, suppliers$ } from "@/server/local/db";
import { dexie } from "@/server/local/dexie";
import { generateId } from "@/server/local/utils";
import { type Observable } from "@legendapp/state";
import { Memo, useObservable } from "@legendapp/state/react";
import { type Supplier } from "@prisma/client";
import { type DialogProps } from "@radix-ui/react-dialog";
import { type ColumnDef } from "@tanstack/react-table";
import { useLiveQuery } from "dexie-react-hooks";
import { LucidePlus, MoreHorizontal } from "lucide-react";
import React, { createContext, useContext } from "react";

const Page = () => {
  return (
    <ContentLayout title="Suplier">
      <Authenticated permission="suplier">
        <SupplierTable />
      </Authenticated>
    </ContentLayout>
  );
};

export default Page;

interface ISupplierContext {
  id: string;
}

interface IContactPersonContext {
  id: string;
}

const SupplierContext = createContext<Observable<ISupplierContext>>(
  undefined as any,
);

const ContactPersonContext = createContext<Observable<IContactPersonContext>>(
  undefined as any,
);

const columns: ColumnDef<Supplier>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nama" />
    ),
    cell: ({ renderValue }) => (
      <div className="font-medium">{renderValue<string>()}</div>
    ),
  },
  {
    id: "alamat",
    accessorKey: "address",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Address" />
    ),
    cell: ({ row }) =>
      row.original.address === "" ? "-" : row.original.address,
  },
  {
    id: "telepon",
    accessorKey: "phone",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Telepon" />
    ),
    cell: ({ row }) => (row.original.phone === "" ? "-" : row.original.phone),
  },
  {
    id: "contactPersons",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Contact Person" />
    ),
    cell: ({ row }) => <ContactPersons supplier={row.original} />,
  },
  {
    id: "actions",
    cell: ({ row }) => <Actions supplier={row.original} />,
  },
];

const ContactPersons: React.FC<{ supplier: Supplier }> = ({ supplier }) => {
  const data = useLiveQuery(() =>
    dexie.supplierContactPersons
      .where("supplierId")
      .equals(supplier.id)
      .filter((x) => !x.deleted)
      .toArray(),
  );
  const editDialog = useDialog();
  const deletedDialog = useDialog();
  const detailDialog = useDialog();
  const contact$ = useObservable<IContactPersonContext>({ id: "" });
  return (
    <ContactPersonContext.Provider value={contact$}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">{data?.length ?? 0} Kontak</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem className="font-medium">Kontak</DropdownMenuItem>
          <DropdownMenuSeparator />
          {data
            ?.slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((x) => (
              <DropdownMenuSub key={x.id}>
                <DropdownMenuSubTrigger>{x.name}</DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem
                      onClick={() => {
                        contact$.id.set(x.id);
                        detailDialog.trigger();
                      }}
                    >
                      Detail
                    </DropdownMenuItem>
                    <Authenticated permission="suplier-update">
                      <DropdownMenuItem
                        onClick={() => {
                          contact$.id.set(x.id);
                          editDialog.trigger();
                        }}
                      >
                        Ubah
                      </DropdownMenuItem>
                    </Authenticated>
                    <Authenticated permission="suplier-delete">
                      <DropdownMenuSeparator />
                      <Button asChild variant="destructive">
                        <DropdownMenuItem
                          className="w-full justify-start"
                          onClick={() => {
                            contact$.id.set(x.id);
                            deletedDialog.trigger();
                          }}
                        >
                          Hapus
                        </DropdownMenuItem>
                      </Button>
                    </Authenticated>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            ))}
          <Authenticated permission="suplier-create">
            <DropdownMenuSeparator />
            <CreateContact
              supplier={supplier}
              onCreate={() => editDialog.trigger()}
            />
          </Authenticated>
        </DropdownMenuContent>
      </DropdownMenu>
      <Sheet
        title="Contact Person"
        content={() => <ContactForm />}
        {...editDialog.props}
      />
      <DeleteContact {...deletedDialog.props} />
      <ContactDetail {...detailDialog.props} />
    </ContactPersonContext.Provider>
  );
};

const or = (s: string | undefined, o: string): string => {
  return s === undefined || s === "" ? o : s;
};

const ContactDetail: React.FC<DialogProps> = ({ ...props }) => {
  const ctx$ = useContext(ContactPersonContext);
  return (
    <Sheet
      {...props}
      title="Kontak Detail"
      content={() => (
        <Memo>
          {() => (
            <>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Nama</TableCell>
                    <TableCell>:</TableCell>
                    <TableCell className="text-right">
                      {or(
                        supplierContactPersons$[ctx$.id.get()]?.name.get(),
                        "-",
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Alamat</TableCell>
                    <TableCell>:</TableCell>
                    <TableCell className="text-right">
                      {or(
                        supplierContactPersons$[ctx$.id.get()]?.address.get(),
                        "-",
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Umur</TableCell>
                    <TableCell>:</TableCell>
                    <TableCell className="text-right">
                      {supplierContactPersons$[ctx$.id.get()]?.age.get()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Telepon</TableCell>
                    <TableCell>:</TableCell>
                    <TableCell className="text-right">
                      {or(
                        supplierContactPersons$[ctx$.id.get()]?.phone.get(),
                        "-",
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Pekerjaan</TableCell>
                    <TableCell>:</TableCell>
                    <TableCell className="text-right">
                      {or(
                        supplierContactPersons$[ctx$.id.get()]?.job.get(),
                        "-",
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <div className="pt-4">
                <Label>Catatan</Label>
                <p className="text-sm text-gray-400">
                  {or(supplierContactPersons$[ctx$.id.get()]?.notes.get(), "-")}
                </p>
              </div>
            </>
          )}
        </Memo>
      )}
    />
  );
};

const CreateContact: React.FC<{ supplier: Supplier; onCreate: () => void }> = ({
  supplier,
  onCreate,
}) => {
  const ctx$ = useContext(ContactPersonContext);
  return (
    <Button asChild>
      <DropdownMenuItem
        className="w-full"
        onClick={() => {
          const id = generateId();
          supplierContactPersons$[id]!.set({
            id: id,
            address: "",
            name: "Kontak Baru",
            age: 0,
            deleted: false,
            job: "",
            notes: "",
            phone: "",
            supplierId: supplier.id,
          });
          ctx$.id.set(id);
          onCreate();
        }}
      >
        <LucidePlus /> Buat Baru
      </DropdownMenuItem>
    </Button>
  );
};

const DeleteContact: React.FC<DialogProps> = ({ ...props }) => {
  const ctx$ = useContext(ContactPersonContext);
  return (
    <Alert
      {...props}
      title={`Yakin Ingin Menghapus ${supplierContactPersons$[ctx$.id.get()]!.name.get()}}`}
      description="Kontak yang dihapus tidak dapat dikembailkan lagi"
      renderCancel={() => <Button>Tidak</Button>}
      renderAction={() => (
        <Button
          onClick={() => supplierContactPersons$[ctx$.id.get()]!.delete()}
        >
          Ya
        </Button>
      )}
    />
  );
};

const Actions: React.FC<{ supplier: Supplier }> = ({ supplier }) => {
  const ctx$ = useContext(SupplierContext);
  const editDialog = useDialog();
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
          <Authenticated permission="suplier-update">
            <DropdownMenuItem
              onClick={() => {
                ctx$.id.set(supplier.id);
                editDialog.trigger();
              }}
            >
              Ubah
            </DropdownMenuItem>
          </Authenticated>
          <Authenticated permission="suplier-delete">
            <Button asChild variant="destructive">
              <DropdownMenuItem
                className="w-full justify-start"
                onClick={() => {
                  deleteDialog.trigger();
                }}
              >
                Hapus
              </DropdownMenuItem>
            </Button>
          </Authenticated>
        </DropdownMenuContent>
      </DropdownMenu>
      <Sheet title="Supplier" content={() => <Form />} {...editDialog.props} />
      <Alert
        {...deleteDialog.props}
        title={`Yakin Ingin Menghapus ${supplier.name}`}
        description="Supplier yang dihapus tidak dapat dikembailkan lagi"
        renderCancel={() => <Button>Tidak</Button>}
        renderAction={() => (
          <Button
            onClick={() => {
              const f = async () => {
                const contacts = await dexie.supplierContactPersons
                  .where("supplierId")
                  .equals(supplier.id)
                  .filter((x) => !x.deleted)
                  .toArray();

                for (const element of contacts) {
                  supplierContactPersons$[element.id]!.delete();
                }
              };

              suppliers$[supplier.id]!.delete();
              void f();
            }}
          >
            Ya
          </Button>
        )}
      />
    </>
  );
};

const ContactForm = () => {
  const ctx$ = useContext(ContactPersonContext);
  return (
    <div>
      <InputWithLabel
        label="Nama"
        inputProps={{
          defaultValue: supplierContactPersons$[ctx$.id.get()]!.name.get(),
          onBlur: (e) =>
            supplierContactPersons$[ctx$.id.get()]!.name.set(e.target.value),
        }}
      />
      <InputWithLabel
        label="Alamat"
        inputProps={{
          defaultValue: supplierContactPersons$[ctx$.id.get()]!.address.get(),
          onBlur: (e) =>
            supplierContactPersons$[ctx$.id.get()]!.address.set(e.target.value),
        }}
      />
      <InputWithLabel
        label="Telepon"
        inputProps={{
          defaultValue: supplierContactPersons$[ctx$.id.get()]!.phone.get(),
          onBlur: (e) =>
            supplierContactPersons$[ctx$.id.get()]!.phone.set(e.target.value),
        }}
      />
      <InputWithLabel
        label="Umur"
        inputProps={{
          type: "number",
          defaultValue: supplierContactPersons$[ctx$.id.get()]!.age.get(),
          onBlur: (e) =>
            supplierContactPersons$[ctx$.id.get()]!.age.set(+e.target.value),
        }}
      />
      <InputWithLabel
        label="Pekerjaan"
        inputProps={{
          defaultValue: supplierContactPersons$[ctx$.id.get()]!.job.get(),
          onBlur: (e) =>
            supplierContactPersons$[ctx$.id.get()]!.job.set(e.target.value),
        }}
      />
      <InputWithLabel
        label="Keterangan"
        inputProps={{
          defaultValue: supplierContactPersons$[ctx$.id.get()]!.notes.get(),
          onBlur: (e) =>
            supplierContactPersons$[ctx$.id.get()]!.notes.set(e.target.value),
        }}
      />
    </div>
  );
};

const SupplierTable = () => {
  const ctx$ = useObservable<ISupplierContext>({ id: "" });
  const data = useLiveQuery(() =>
    dexie.suppliers.filter((x) => !x.deleted).toArray(),
  );

  const table = useTable({
    data: data ?? [],
    columns: columns,
  });

  return (
    <SupplierContext.Provider value={ctx$}>
      <ScrollArea className="h-screen">
        <Title>Suplier</Title>
        <div className="space-y-2">
          <div className="flex h-9 justify-between">
            <DataTableFilterName table={table} />
            <div className="flex gap-2">
              <AddSheet />
              <DataTableViewOptions table={table} />
            </div>
          </div>
          <DataTableContent table={table} />
          <DataTablePagination table={table} />
        </div>
      </ScrollArea>
    </SupplierContext.Provider>
  );
};

const AddSheet = () => {
  const ctx$ = useContext(SupplierContext);
  return (
    <ControlledSheet
      title="Suplier"
      content={() => <Form />}
      trigger={(trigger) => (
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            const id = generateId();
            suppliers$[id]!.set({
              id: id,
              name: "Suplier Baru",
              address: "",
              deleted: false,
              phone: "",
              notes: "",
            });
            ctx$.id.set(id);
            trigger();
          }}
        >
          <LucidePlus />
        </Button>
      )}
    />
  );
};

const Form = () => {
  const ctx$ = useContext(SupplierContext);
  return (
    <div className="space-y-2">
      <Memo>
        {() => (
          <InputWithLabel
            label="Nama"
            inputProps={{
              defaultValue: suppliers$[ctx$.id.get()]!.name.get(),
              onBlur: (e) =>
                suppliers$[ctx$.id.get()]!.name.set(e.target.value),
            }}
          />
        )}
      </Memo>
      <Memo>
        {() => (
          <InputWithLabel
            label="Alamat"
            inputProps={{
              defaultValue: suppliers$[ctx$.id.get()]!.address.get(),
              onBlur: (e) =>
                suppliers$[ctx$.id.get()]!.address.set(e.target.value),
            }}
          />
        )}
      </Memo>
      <Memo>
        {() => (
          <InputWithLabel
            label="Telepon"
            inputProps={{
              defaultValue: suppliers$[ctx$.id.get()]!.phone.get(),
              onBlur: (e) =>
                suppliers$[ctx$.id.get()]!.phone.set(e.target.value),
            }}
          />
        )}
      </Memo>
      <Memo>
        {() => (
          <div className="">
            <Label>Catatan</Label>
            <Textarea
              rows={5}
              className="resize-none"
              defaultValue={suppliers$[ctx$.id.get()]!.notes.get()}
              onBlur={(e) =>
                suppliers$[ctx$.id.get()]!.notes.set(e.target.value)
              }
            />
          </div>
        )}
      </Memo>
    </div>
  );
};
