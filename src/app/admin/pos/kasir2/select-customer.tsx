"use client";

import { Combobox } from "@/components/hasan/combobox";
import { dexie } from "@/server/local/dexie";
import { Customer } from "@prisma/client";
import { useLiveQuery } from "dexie-react-hooks";
import React from "react";
import { useKasir } from "./useKasir";
import { useDialog } from "@/hooks/useDialog";
import { Label } from "@/components/ui/label";

export const SelectCustomer = () => {
  const selected = useKasir((s) => s.customer);
  const onSelected = useKasir((s) => s.setCustomer);
  return (
    <div className="flex items-center gap-2">
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
    />
  );
};
