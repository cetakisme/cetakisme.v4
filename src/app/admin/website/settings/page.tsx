"use client";

import Title from "@/components/hasan/title";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { DB } from "@/lib/supabase/supabase";
import { websiteSettings$ } from "@/server/local/db";
import { Memo } from "@legendapp/state/react";
import React from "react";

const id = "settings";

const defaultData: DB<"WebsiteSetting"> = {
  id: id,
  address: "",
  description: "",
  facebook: "",
  instagram: "",
  phone: "",
  tiktok: "",
  twitter: "",
  youtube: "",
};

const page = () => {
  return (
    <ScrollArea className="h-screen p-8">
      <Title>Settings</Title>
      <Card>
        <CardHeader>
          <CardTitle>Toko Settings</CardTitle>
          <CardDescription>
            Atur setingan informasi seputar website
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="w-full">
            <Label>Alamat</Label>
            <Memo>
              {() => (
                <Input
                  className="w-full"
                  defaultValue={websiteSettings$[id]?.address.get() ?? ""}
                  onBlur={(e) => {
                    if (websiteSettings$[id]?.get() === undefined) {
                      websiteSettings$[id]!.set({
                        ...defaultData,
                        address: e.target.value,
                      });
                    } else {
                      websiteSettings$[id].address.set(e.target.value);
                    }
                  }}
                />
              )}
            </Memo>
          </div>
          <div className="w-full">
            <Label>No. Telp</Label>
            <Memo>
              {() => (
                <Input
                  className="w-full"
                  defaultValue={websiteSettings$[id]?.phone.get() ?? ""}
                  onBlur={(e) => {
                    if (websiteSettings$[id]?.get() === undefined) {
                      websiteSettings$[id]!.set({
                        ...defaultData,
                        phone: e.target.value,
                      });
                    } else {
                      websiteSettings$[id].phone.set(e.target.value);
                    }
                  }}
                />
              )}
            </Memo>
          </div>
          {/* <div className="w-full">
            <Label>Deskripsi</Label>
            <Memo>
              {() => (
                <Textarea
                  rows={3}
                  className="w-full resize-none"
                  defaultValue={websiteSettings$[id]?.description.get() ?? ""}
                  onBlur={(e) => {
                    if (websiteSettings$[id]?.get() === undefined) {
                      websiteSettings$[id]!.set({
                        ...defaultData,
                        description: e.target.value,
                      });
                    } else {
                      websiteSettings$[id]!.description.set(e.target.value);
                    }
                  }}
                />
              )}
            </Memo>
          </div> */}
        </CardContent>
      </Card>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Social Media Settings</CardTitle>
          <CardDescription>
            Atur social media yang terkait dengan website
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="w-full">
            <Label>Facebook</Label>
            <Memo>
              {() => (
                <Input
                  className="w-full"
                  defaultValue={websiteSettings$[id]?.facebook.get() ?? ""}
                  onBlur={(e) => {
                    if (websiteSettings$[id]?.get() === undefined) {
                      websiteSettings$[id]!.set({
                        ...defaultData,
                        facebook: e.target.value,
                      });
                    } else {
                      websiteSettings$[id].facebook.set(e.target.value);
                    }
                  }}
                />
              )}
            </Memo>
          </div>
          <div className="w-full">
            <Label>Youtube</Label>
            <Memo>
              {() => (
                <Input
                  className="w-full"
                  defaultValue={websiteSettings$[id]?.youtube.get() ?? ""}
                  onBlur={(e) => {
                    if (websiteSettings$[id]?.get() === undefined) {
                      websiteSettings$[id]!.set({
                        ...defaultData,
                        youtube: e.target.value,
                      });
                    } else {
                      websiteSettings$[id].youtube.set(e.target.value);
                    }
                  }}
                />
              )}
            </Memo>
          </div>
          <div className="w-full">
            <Label>Twitter</Label>
            <Memo>
              {() => (
                <Input
                  className="w-full"
                  defaultValue={websiteSettings$[id]?.twitter.get() ?? ""}
                  onBlur={(e) => {
                    if (websiteSettings$[id]?.get() === undefined) {
                      websiteSettings$[id]!.set({
                        ...defaultData,
                        twitter: e.target.value,
                      });
                    } else {
                      websiteSettings$[id].twitter.set(e.target.value);
                    }
                  }}
                />
              )}
            </Memo>
          </div>
          <div className="w-full">
            <Label>Instagram</Label>
            <Memo>
              {() => (
                <Input
                  className="w-full"
                  defaultValue={websiteSettings$[id]?.instagram.get() ?? ""}
                  onBlur={(e) => {
                    if (websiteSettings$[id]?.get() === undefined) {
                      websiteSettings$[id]!.set({
                        ...defaultData,
                        instagram: e.target.value,
                      });
                    } else {
                      websiteSettings$[id].instagram.set(e.target.value);
                    }
                  }}
                />
              )}
            </Memo>
          </div>
          <div className="w-full">
            <Label>Tiktok</Label>
            <Memo>
              {() => (
                <Input
                  className="w-full"
                  defaultValue={websiteSettings$[id]?.tiktok.get() ?? ""}
                  onBlur={(e) => {
                    if (websiteSettings$[id]?.get() === undefined) {
                      websiteSettings$[id]!.set({
                        ...defaultData,
                        tiktok: e.target.value,
                      });
                    } else {
                      websiteSettings$[id].tiktok.set(e.target.value);
                    }
                  }}
                />
              )}
            </Memo>
          </div>
        </CardContent>
      </Card>
    </ScrollArea>
  );
};

export default page;
