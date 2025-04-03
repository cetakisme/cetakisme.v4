"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Memo, useObservable, useObserveEffect } from "@legendapp/state/react";
import { LucideArrowLeftRight, LucideDot } from "lucide-react";
import moment from "moment";
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLiveQuery } from "dexie-react-hooks";
import { dexie } from "@/server/local/dexie";
import { DateTime } from "luxon";
import Title from "@/components/hasan/title";
import Authenticated from "@/components/hasan/auth/authenticated";
import { dateDiff } from "@/server/functions/absen";

const Page = () => {
  return (
    <Authenticated permission="pegawai">
      <Absensi />
    </Authenticated>
  );
};

export default Page;

const Absensi = () => {
  const range = useObservable<{
    start: Date | null;
    end: Date | null;
  }>({
    start: null,
    end: null,
  });

  const _dates = useObservable<Date[]>([]);

  const pegawai = useLiveQuery(() =>
    dexie.users.filter((x) => !x.deleted).toArray(),
  );

  useObserveEffect(() => {
    const start = range.start.get();
    const end = range.end.get();

    if (start === null || end === null) return;

    const startDate = moment(start);
    const endDate = moment(end);

    const dates: Date[] = [];
    while (startDate.isSameOrBefore(endDate)) {
      dates.push(startDate.toDate());
      startDate.add(1, "day");
    }

    _dates.set(dates);
  });

  return (
    <ScrollArea className="h-screen p-8">
      <Title>Absensi Pegawai</Title>
      <div className="flex items-center gap-2">
        <DateButton
          onSelected={(e) => range.start.set(e)}
          fallbackText="Dari Tanggal"
        />
        <LucideArrowLeftRight size={16} />
        <DateButton
          onSelected={(e) => range.end.set(e)}
          fallbackText="Sampai Tanggal"
        />
      </div>
      <div className="">
        <Table className="w-fit">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Nama</TableHead>
              <Memo>
                {() => (
                  <>
                    {_dates.get()?.map((x, i) => (
                      <TableHead key={i} className="w-[50px]">
                        {moment(x).format("DD/MM/YY")}
                      </TableHead>
                    ))}
                  </>
                )}
              </Memo>
              <TableHead className="w-[100px] text-center">Total Jam</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pegawai?.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.username}</TableCell>
                <Memo>
                  {() => (
                    <>
                      {_dates
                        .get()
                        ?.map((x, i) => (
                          <Hadir
                            date={x}
                            key={moment(x).format("DD-MM-YY")}
                            userId={user.id}
                          />
                        ))}
                    </>
                  )}
                </Memo>
                <TableCell className="bg-black text-center font-semibold text-white">
                  <Memo>
                    {() => {
                      const r = range.get();
                      if (r.end === null || r.start === null) return;

                      return (
                        <TotalJamKerja
                          userId={user.id}
                          startDate={r.start}
                          endDate={r.end}
                        />
                      );
                    }}
                  </Memo>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </ScrollArea>
  );
};

const isTheSameDay = (target: Date, date: Date) => {
  const today = DateTime.fromJSDate(target)
    .setZone("Asia/Singapore")
    .toJSDate();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};

function accumulateTimeIntervals(totals: Date[]) {
  let totalDuration = moment.duration(0);

  totals.forEach((total) => {
    const diff = dateDiff(new Date("January 1, 1970 00:00:00"), total); // Difference in milliseconds
    totalDuration.add(moment.duration(diff));
  });

  let hours = Math.floor(totalDuration.asHours());
  let minutes = totalDuration.minutes();
  let seconds = totalDuration.seconds();

  return { hours, minutes, seconds };
}

const TotalJamKerja: React.FC<{
  userId: string;
  startDate: Date;
  endDate: Date;
}> = ({ userId, startDate, endDate }) => {
  const totalJamKerja = useLiveQuery(() =>
    dexie.absensi
      .where("userId")
      .equals(userId)
      .and((x) => x.exit !== null)
      .and((x) => x.enter >= startDate && x.exit! <= endDate)
      .toArray(),
  );

  if (!totalJamKerja) return null;

  const { hours, minutes, seconds } = accumulateTimeIntervals(
    totalJamKerja.map((x) => x.totalHour),
  );

  return `${hours}:${minutes}:${seconds}`;
};

const Hadir: React.FC<{ userId: string; date: Date }> = ({ userId, date }) => {
  const hadir = useLiveQuery(() =>
    dexie.absensi
      .where("userId")
      .equals(userId)
      .and((x) => isTheSameDay(x.enter, date))
      .toArray(),
  );

  if (!hadir) return <TableCell />;
  if (!hadir[0]) return <TableCell />;

  return (
    <TableCell
      className={`${hadir && hadir.length > 0 && "bg-black"} text-center text-white`}
    >
      <TotalJamKerjaPerhari total={hadir[0]!.totalHour} />
    </TableCell>
  );
};

const TotalJamKerjaPerhari: React.FC<{
  total: Date;
}> = ({ total }) => {
  const jam = dateDiff(new Date("January 1, 1970 00:00:00"), total);
  return `${jam.hours}:${jam.minutes}:${Math.trunc(jam.seconds)}`;
};

const DateButton: React.FC<{
  onSelected: (date: Date) => void;
  fallbackText: string;
}> = ({ onSelected, fallbackText }) => {
  const date = useObservable<Date | null>(null);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <Memo>
            {() => {
              const d = date.get();
              return <>{d ? moment(d).format("DD MMMM YYYY") : fallbackText}</>;
            }}
          </Memo>
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Memo>
          {() => (
            <Calendar
              mode="single"
              selected={date.get() ?? new Date()}
              onSelect={(e) => {
                if (e) {
                  onSelected(e);
                  date.set(e);
                }
              }}
              initialFocus
            />
          )}
        </Memo>
      </PopoverContent>
    </Popover>
  );
};
