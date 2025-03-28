"use client";

import { Button } from "@/components/ui/button";
import { user$ } from "@/server/local/auth";
import { absensi$ } from "@/server/local/db";
import { dexie } from "@/server/local/dexie";
import { generateId } from "@/server/local/utils";
import { Memo, useObservable, useObserveEffect } from "@legendapp/state/react";
import { Absensi } from "@prisma/client";
import moment from "moment";
import React from "react";
import { DateTime } from "luxon";
import { LucideLoader } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

const isToday = (date: Date) => {
  const today = DateTime.now().setZone("Asia/Singapore").toJSDate();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};

const Page = () => {
  const absen = useObservable<Absensi | null>(null);

  useObserveEffect(() => {
    const _ = user$.get();
    reloadAbsensi();
  });

  const reloadAbsensi = () => {
    const id = user$.id.get();
    if (!id) return;
    void fetchAbsensi(id);
  };

  const fetchAbsensi = async (id: string) => {
    const absensi = await dexie.absensi
      .where("userId")
      .equals(id)
      .and((x) => isToday(x.enter))
      .toArray();

    if (!absensi) return;
    if (absensi[0]) absen.set(absensi[0]);
  };

  return (
    <div className="p-8">
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle className="text-2xl">
            Absen Tanggal{" "}
            {moment(DateTime.now().setZone("Asia/Singapore").toJSDate()).format(
              "DD MMMM YYYY",
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Memo>
            {() => {
              const abs = absen.get();
              return (
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <Label>Nama</Label>
                      </TableCell>
                      <TableCell>{user$.name.get() ?? "-"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Label>Status</Label>
                      </TableCell>
                      <TableCell>{abs ? "Masuk" : "Belum Absen"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Label>Masuk</Label>
                      </TableCell>
                      <TableCell>
                        {abs ? moment(abs.enter).format("hh:mm:ss A") : "-"}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Label>Pulang</Label>
                      </TableCell>
                      <TableCell>
                        {abs && abs.exit
                          ? moment(abs.exit).format("hh:mm:ss A")
                          : "-"}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Label>Waktu Kerja</Label>
                      </TableCell>
                      <TableCell>
                        {abs ? (
                          <TotalJamKerja
                            start={moment(abs.enter)}
                            end={moment(
                              abs.exit ??
                                DateTime.now()
                                  .setZone("Asia/Singapore")
                                  .toJSDate(),
                            )}
                          />
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              );
            }}
          </Memo>
          <div className="mt-8 w-full">
            <Memo>
              {() => {
                const abs = absen.get();

                return (
                  <>
                    {abs === null ? (
                      <Button
                        className="w-full"
                        onClick={() => {
                          const id = generateId();
                          const absensi = {
                            id: id,
                            enter: DateTime.now()
                              .setZone("Asia/Singapore")
                              .toISO()!,
                            exit: null,
                            userId: user$.id.get() ?? "",
                          };

                          absensi$[id]!.set(absensi);
                          absen.set({
                            id: id,
                            enter: DateTime.now()
                              .setZone("Asia/Singapore")
                              .toJSDate(),
                            exit: null,
                            userId: user$.id.get() ?? "",
                          });
                        }}
                      >
                        Absen Masuk
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        disabled={abs.exit !== null}
                        onClick={() => {
                          absensi$[abs.id]!.exit.set(
                            DateTime.now().setZone("Asia/Singapore").toISO()!,
                          );
                          absen.exit.set(
                            DateTime.now().setZone("Asia/Singapore").toJSDate(),
                          );
                        }}
                      >
                        Absen Pulang
                      </Button>
                    )}
                  </>
                );
              }}
            </Memo>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;

const TotalJamKerja: React.FC<{ end: moment.Moment; start: moment.Moment }> = ({
  end,
  start,
}) => {
  const diffHours = end.diff(start, "hours");
  const diffMinutes = end.diff(start, "minutes") % 60;
  const diffSeconds = end.diff(start, "seconds") % 60;

  return `${diffHours} Jam, ${diffMinutes} Menit, ${diffSeconds} Detik`;
};
