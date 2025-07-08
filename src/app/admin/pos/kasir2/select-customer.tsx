"use client";

import { Combobox } from "@/components/hasan/combobox";
import { dexie } from "@/server/local/dexie";
import type { Customer } from "@prisma/client";
import { useLiveQuery } from "dexie-react-hooks";
import React from "react";
import { useKasir } from "./useKasir";
import { useDialog } from "@/hooks/useDialog";
import { Label } from "@/components/ui/label";
import { observable } from "@legendapp/state";
import ControlledSheet from "@/components/hasan/controlled-sheet";
import { Button } from "@/components/ui/button";
import { customer$ } from "@/server/local/db";
import { generateId } from "@/server/local/utils";
import { LucidePlus } from "lucide-react";
import InputWithLabel from "@/components/hasan/input-with-label";

export const SelectCustomer = () => {
  const selected = useKasir((s) => s.customer);
  const onSelected = useKasir((s) => s.setCustomer);
  return (
    <div className="flex items-center gap-2 px-2 lg:px-2">
      <Label>Customer : </Label>
      <SelectCustomerComponent onSelected={onSelected} selected={selected} />
    </div>
  );
};

const SelectCustomerComponent: React.FC<{
  onSelected: (data: Customer) => void;
  selected: Customer | null;
}> = ({ selected, onSelected }) => {
  const customers = useLiveQuery(() =>
    dexie.customers
      .orderBy("name")
      .filter((x) => !x.deleted)
      .toArray(),
  );
  const dialog = useDialog();
  return (
    <Combobox
      {...dialog.props}
      data={customers ?? []}
      onSelected={(data) => {
        dialog.dismiss();
        onSelected(data);
      }}
      renderItem={(data) => data.name}
      renderSelected={() => selected?.name ?? "Pilih Customer"}
      title="Customer"
      renderAddButton={() => <CustomerSheet />}
    />
  );
};

const CustomerSheet = () => {
  return (
    <ControlledSheet
      title="Tambah Customer"
      description="Isi formulir dengan data yang tepat"
      trigger={(trigger) => (
        <Button
          className="w-full"
          onClick={() => {
            const id = generateId();
            customer$[id]!.set({
              id: id,
              name: _customer$.name.get(),
              address: "",
              age: 0,
              job: "",
              notes: "",
              phone: "",
              deleted: false,
            });
            trigger();
          }}
        >
          <LucidePlus /> Tambah Customer
        </Button>
      )}
      content={() => <CustomerForm />}
    />
  );
};

const _customer$ = observable({
  name: "",
});

const CustomerForm = () => {
  return (
    <div>
      <InputWithLabel
        label="Nama"
        inputProps={{
          defaultValue: "",
          onBlur: (e) => _customer$.name.set(e.target.value),
        }}
      />
    </div>
  );
};
