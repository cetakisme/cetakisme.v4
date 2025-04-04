"use client";

import { Button } from "@/components/ui/button";
import { user$ } from "@/server/local/auth";
import { absensi$ } from "@/server/local/db";
import { dexie } from "@/server/local/dexie";
import { generateId } from "@/server/local/utils";
import { Memo, useObservable, useObserveEffect } from "@legendapp/state/react";
import { type Absensi } from "@prisma/client";
import moment from "moment";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import Authenticated from "@/components/hasan/auth/authenticated";
import { dateDiff, absen as doAbsen } from "@/server/functions/absen";
import { date, isoDate, now } from "@/lib/utils";

const Page = () => {
  return (
    <Authenticated permission="absen">
      <Absen />
    </Authenticated>
  );
};

export default Page;

const Absen = () => {
  const absen = useObservable<Absensi | null>(null);

  useObserveEffect(() => {
    user$.get();
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
      .reverse()
      .sortBy("enter");

    if (!absensi) return;
    if (absensi[0]) {
      absen.set(absensi[0]);
    }
  };

  return (
    <div className="p-8">
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle className="text-2xl">
            Absen Tanggal {moment(now().toJSDate()).format("DD MMMM YYYY")}
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
                      <TableCell>
                        {abs?.isActive ? "Masuk" : "Pulang"}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Label>Masuk</Label>
                      </TableCell>
                      <TableCell>
                        {abs
                          ? moment(date(abs.enter)).format("hh:mm:ss A")
                          : "-"}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Label>Pulang</Label>
                      </TableCell>
                      <TableCell>
                        {abs?.exit
                          ? moment(date(abs.exit)).format("hh:mm:ss A")
                          : "-"}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Label>Waktu Kerja</Label>
                      </TableCell>
                      <TableCell>
                        {abs ? <JamKerja total={abs.totalHour} /> : "-"}
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

                          const absensi: Absensi = {
                            id: id,
                            enter: now().toJSDate(),
                            exit: null,
                            userId: user$.id.get() ?? "",
                            isActive: true,
                            totalHour: new Date("January 1, 1970 00:00:00"),
                          };

                          absen.set(absensi);

                          absensi$[id]!.set({
                            ...absensi,
                            enter: isoDate(absensi.enter),
                            totalHour: absensi.totalHour.toISOString(),
                            exit: null,
                          });
                        }}
                      >
                        Absen Masuk
                      </Button>
                    ) : (
                      <>
                        {abs.isActive ? (
                          <Button
                            className="w-full"
                            onClick={() => {
                              const data = doAbsen(abs, now().toJSDate());

                              if (data.isChangingDay) {
                                absensi$[data.old.id]!.set({
                                  ...data.old,
                                  enter: isoDate(data.old.enter),
                                  totalHour: isoDate(data.old.totalHour),
                                  exit: data.old.exit
                                    ? isoDate(data.old.exit)
                                    : null,
                                });

                                const id = generateId();
                                absensi$[id]!.set({
                                  ...data.new,
                                  enter: isoDate(data.new.enter),
                                  totalHour: isoDate(data.new.totalHour),
                                  exit: data.new.exit
                                    ? isoDate(data.new.exit)
                                    : null,
                                });
                              } else {
                                absensi$[abs.id]!.set({
                                  ...data.new,
                                  enter: isoDate(data.new.enter),
                                  totalHour: isoDate(data.new.totalHour),
                                  exit: data.new.exit
                                    ? isoDate(data.new.exit)
                                    : null,
                                });
                              }

                              absen.set(data.new);
                            }}
                          >
                            Absen Pulang
                          </Button>
                        ) : (
                          <Button
                            className="w-full"
                            onClick={() => {
                              const absensi: Absensi = {
                                ...abs,
                                enter: now().toJSDate(),
                                exit: null,
                                isActive: true,
                              };

                              absen.set(absensi);

                              absensi$[absensi.id]!.set({
                                ...absensi,
                                enter: isoDate(absensi.enter),
                                totalHour: absensi.totalHour.toISOString(),
                                exit: null,
                              });
                            }}
                          >
                            Absen Masuk
                          </Button>
                        )}
                      </>
                    )}
                    {/* <Button
                      onClick={() => {
                        const abs = absen.get();

                        if (!abs) return;

                        const data = doAbsen(
                          {
                            ...abs,
                            id: "test",
                            enter: new Date("April 4, 2025 23:00:00"),
                            isActive: true,
                          },
                          new Date("April 6, 2025 3:00:00"),
                        );

                        if (data.isChangingDay) {
                          absensi$[data.old.id]!.set({
                            ...data.old,
                            enter: isoDate(data.old.enter),
                            totalHour: isoDate(data.old.totalHour),
                            exit: data.old.exit ? isoDate(data.old.exit) : null,
                          });

                          const id = "test2";
                          absensi$[id]!.set({
                            ...data.new,
                            id: id,
                            enter: isoDate(data.new.enter),
                            totalHour: isoDate(data.new.totalHour),
                            exit: data.new.exit ? isoDate(data.new.exit) : null,
                          });
                        } else {
                          absensi$[data.new.id]!.set({
                            ...data.new,
                            enter: isoDate(data.new.enter),
                            totalHour: isoDate(data.new.totalHour),
                            exit: data.new.exit ? isoDate(data.new.exit) : null,
                          });
                        }

                        absen.set(data.new);
                      }}
                    >
                      Test
                    </Button> */}
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

const JamKerja: React.FC<{ total: Date }> = ({ total }) => {
  const jam = dateDiff(new Date("January 1, 1970 00:00:00"), total);
  return `${jam.hours} Jam, ${jam.minutes} Menit, ${Math.trunc(jam.seconds)} Detik`;
};
