import { Badge } from "@/components/ui/badge";
import { dexie } from "@/server/local/dexie";
import { useLiveQuery } from "dexie-react-hooks";
import React from "react";

const Customer: React.FC<{ paymentStatus: string; customerId: string }> = ({
  customerId,
  paymentStatus,
}) => {
  const customer = useLiveQuery(() => dexie.customers.get(customerId));
  return (
    <div className="flex gap-2 font-medium">
      <span>{customer?.name}</span>
      <Badge>{paymentStatus}</Badge>
    </div>
  );
};

export default Customer;
