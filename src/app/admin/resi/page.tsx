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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { DataTableColumnHeader } from "@/hooks/Table/DataColumnHeader";
import { DataTableContent } from "@/hooks/Table/DataTableContent";
import { DataTableFilterName } from "@/hooks/Table/DataTableFilterName";
import { DataTablePagination } from "@/hooks/Table/DataTablePagination";
import { DataTableViewOptions } from "@/hooks/Table/DataTableViewOptions";
import { useTable } from "@/hooks/Table/useTable";
import { useDialog } from "@/hooks/useDialog";
import {
  generateId,
  receiptModels$,
  receiptSettings$,
} from "@/server/local/db";
import { dexie } from "@/server/local/dexie";
import { type Observable } from "@legendapp/state";
import { Memo, useObservable, useObserveEffect } from "@legendapp/state/react";
import { type ReceiptModel } from "@prisma/client";
import { type ColumnDef } from "@tanstack/react-table";
import { useLiveQuery } from "dexie-react-hooks";
import { LucidePlus, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import React, { useContext } from "react";

const Page = () => {
  return (
    <Authenticated permission="resi">
      <Receipt />
    </Authenticated>
  );
};

type IResiContext = {
  id: string;
  settingsId: string;
};

const ResiContext = React.createContext<Observable<IResiContext>>(
  undefined as any,
);

export default Page;

const columns: ColumnDef<ReceiptModel>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nama" />
    ),
    cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    size: 1000,
  },
  {
    id: "default",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Default" />
    ),
    cell: ({ row }) => <DefaultButton receipt={row.original} />,
  },
  {
    id: "actions",
    cell: ({ row }) => <Actions receipt={row.original} />,
  },
];

const DefaultButton: React.FC<{ receipt: ReceiptModel }> = ({ receipt }) => {
  const ctx$ = useContext(ResiContext);
  return (
    <Memo>
      {() => (
        <>
          {receiptSettings$[ctx$.settingsId.get()]!.model.get() ===
          receipt.id ? (
            <Button>Default</Button>
          ) : (
            <Button
              variant={"outline"}
              onClick={() => {
                const id =
                  ctx$.settingsId.get() === ""
                    ? generateId()
                    : ctx$.settingsId.get();

                ctx$.settingsId.set(id);
                receiptSettings$[id]!.set({
                  id: id,
                  model: receipt.id,
                });
              }}
            >
              Set Default
            </Button>
          )}
        </>
      )}
    </Memo>
  );
};

const Actions: React.FC<{ receipt: ReceiptModel }> = ({ receipt }) => {
  const deleteDialog = useDialog();
  const editDialog = useDialog();
  const ctx$ = useContext(ResiContext);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size={"icon"} variant={"outline"}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="space-y-1">
          <DropdownMenuItem className="font-medium">Opsi</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              ctx$.id.set(receipt.id);
              editDialog.trigger();
            }}
          >
            Ubah Nama
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/admin/resi/content/edit/${receipt.id}`}>
              Edit Konten
            </Link>
          </DropdownMenuItem>
          <Button asChild variant="destructive">
            <DropdownMenuItem
              className="w-full justify-start"
              onClick={deleteDialog.trigger}
            >
              Hapus
            </DropdownMenuItem>
          </Button>
        </DropdownMenuContent>
      </DropdownMenu>
      <Sheet
        {...editDialog.props}
        title="Model Resi"
        content={() => <ReceiptForm />}
      />
      <Alert
        {...deleteDialog.props}
        title="Yakin Ingin Menghapus Model Resi ?"
        description="Model Resi yang dihapus tidak dapat dikembalikan"
        renderCancel={() => <Button>Tidak</Button>}
        renderAction={() => (
          <Button
            onClick={() => {
              receiptModels$[receipt.id]!.delete();
            }}
          >
            Ya
          </Button>
        )}
      />
    </>
  );
};

const Receipt = () => {
  const receipt = useLiveQuery(() =>
    dexie.receiptModel.filter((x) => !x.deleted).toArray(),
  );

  const table = useTable({
    data: receipt ?? [],
    columns,
  });

  const ctx$ = useObservable<IResiContext>({
    id: "",
    settingsId: "",
  });

  useObserveEffect(async () => {
    const settings = await dexie.receiptSettings.toArray();
    if (settings.length === 0) return;
    ctx$.settingsId.set(settings[0]!.id);
  });

  return (
    <ContentLayout title="Resi">
      <ResiContext.Provider value={ctx$}>
        <ScrollArea className="space-y-2">
          <Title>Resi</Title>
          <div className="space-y-2">
            <div className="flex h-9 justify-between">
              <DataTableFilterName table={table} />
              <div className="flex gap-2">
                <AddReceiptModel />
                <DataTableViewOptions table={table} />
              </div>
            </div>
            <DataTableContent table={table} />
            <DataTablePagination table={table} />
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </ResiContext.Provider>
    </ContentLayout>
  );
};

const AddReceiptModel = () => {
  const ctx$ = useContext(ResiContext);
  return (
    <ControlledSheet
      title="Model Resi"
      content={() => <ReceiptForm />}
      trigger={(trigger) => (
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            const id = generateId();
            receiptModels$[id]!.set({
              id: id,
              name: "",
              content: "",
              deleted: false,
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

const ReceiptForm = () => {
  const model = useContext(ResiContext);

  return (
    <div className="space-y-2">
      <Memo>
        {() => (
          <InputWithLabel
            label="Nama"
            inputProps={{
              defaultValue: receiptModels$[model.id.get()]!.name.get(),
              onBlur: (e) =>
                receiptModels$[model.id.get()]!.name.set(e.target.value),
            }}
          />
        )}
      </Memo>
    </div>
  );
};
