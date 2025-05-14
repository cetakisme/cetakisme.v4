import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { now } from "@/lib/utils";
import { newOrders$ } from "@/server/local/db";
import { DateTime } from "luxon";
import React from "react";

const Deadline: React.FC<{ orderId: string; deadline: Date | null }> = ({
  orderId,
  deadline,
}) => {
  // const hour = Math.floor(
  //   DateTime.fromJSDate(deadline ?? new Date())
  //     .setZone("Asia/Singapore")
  //     .diffNow("hours").hours,
  // );
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant={"outline"}>
          {/* {deadline
            ? `${Math.abs(hour)} ${hour > 0 ? "Jam Lagi" : "Jam Yang Lalu"}`
            : "-"} */}
          {DateTime.fromJSDate(deadline ?? new Date()).toLocaleString(
            DateTime.DATE_MED_WITH_WEEKDAY,
            { locale: "id" },
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-fit p-0">
        <Calendar
          mode="single"
          selected={deadline ?? now().toJSDate()}
          onSelect={(date) => {
            if (date)
              newOrders$[orderId]!.set((p) => ({
                ...p,
                deadline: DateTime.fromJSDate(date).toISO()!,
              }));
          }}
        />
      </PopoverContent>
    </Popover>
    // <DatePicker
    //   startYear={getYear(new Date()) - 1}
    //   endYear={getYear(new Date()) + 1}
    //   // selectedDate={deadline ?? new Date()}
    //   onDateChange={(date) =>
    //     newOrders$[orderId]!.set((p) => ({
    //       ...p,
    //       deadline: DateTime.fromJSDate(date)
    //         .setZone("Asia/Singapore", { keepLocalTime: true })
    //         .toISO(),
    //     }))
    //   }
    //   trigger={() => {
    //     const hour = Math.floor(
    //       DateTime.fromJSDate(deadline ?? new Date())
    //         .setZone("Asia/Singapore")
    //         .diffNow("hours").hours,
    //     );
    //     return (
    //       <Button variant="outline">
    // {deadline
    //   ? `${Math.abs(hour)} ${hour > 0 ? "Jam Lagi" : "Jam Yang Lalu"}`
    //   : "-"}
    //       </Button>
    //     );
    //   }}
    // />
  );
};

export default Deadline;
