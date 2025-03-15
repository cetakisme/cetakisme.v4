// pnpm dlx shadcn@latest init
// pnpm dlx shadcn@latest add form input

"use client";

import React, { useState } from "react";

import { Poppins } from "next/font/google";
import Image from "next/image";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/better-auth/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const formSchema = z.object({
  username: z.string().min(2).max(50),
  //   email: z.string().email(),
  password: z.string().min(2).max(50),
});

const Page = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      //   email: "",
      password: "",
    },
  });
  const [usePassword, setUsePassword] = useState(true);
  const [isSigning, setIsSigning] = useState(false);
  const router = useRouter();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSigning(true);
    try {
      const data = await authClient.signIn.username({
        username: values.username,
        password: values.password,
      });
      router.push("/admin");
    } catch (error) {
      toast.error("Username atau password salah");
      setIsSigning(false);
    }
  }

  return (
    <main
      className={`grid h-screen grid-cols-1 bg-white md:grid-cols-2 ${poppins.className}`}
    >
      <section className="flex flex-col items-center justify-center">
        <div className="flex w-96 flex-col">
          <h1 className="text-center text-5xl font-bold">Sign In</h1>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="mt-10 flex flex-col gap-2"
            >
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Username"
                        {...field}
                        className="h-14 w-full rounded-full border border-gray-300 px-6 text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Email"
                        {...field}
                        className="h-14 w-full rounded-full border border-gray-300 px-6 text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={usePassword ? "password" : "text"}
                          placeholder="password"
                          {...field}
                          className="h-14 w-full rounded-full border-gray-300 px-6 text-sm"
                        />
                      </FormControl>
                      <div className="absolute right-2 top-0 flex h-full items-center">
                        <Button
                          type="button"
                          className="flex h-8 w-10 cursor-pointer items-center justify-center rounded-full text-gray-400"
                          variant="ghost"
                          size="icon"
                          onClick={() => setUsePassword((p) => !p)}
                        >
                          <svg
                            stroke="currentColor"
                            fill="currentColor"
                            strokeWidth="0"
                            viewBox="0 0 576 512"
                            height="20"
                            width="20"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M572.52 241.4C518.29 135.59 410.93 64 288 64S57.68 135.64 3.48 241.41a32.35 32.35 0 0 0 0 29.19C57.71 376.41 165.07 448 288 448s230.32-71.64 284.52-177.41a32.35 32.35 0 0 0 0-29.19zM288 400a144 144 0 1 1 144-144 143.93 143.93 0 0 1-144 144zm0-240a95.31 95.31 0 0 0-25.31 3.79 47.85 47.85 0 0 1-66.9 66.9A95.78 95.78 0 1 0 288 160z"></path>
                          </svg>
                        </Button>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="mt-4 flex h-14 w-full cursor-pointer items-center justify-center rounded-full bg-blue-500 text-white transition-colors duration-200 ease-in-out disabled:bg-gray-200 disabled:text-gray-400"
                disabled={isSigning}
              >
                Submit
              </Button>
            </form>
          </Form>
        </div>
      </section>
      <section className="relative hidden h-screen md:block">
        <div className="relative h-full">
          <Image
            alt=""
            fill
            src="https://utfs.io/f/LVIHtibINBqrL7dTRS3bINBqrsTte71PgvK0up4UYDjLch69"
            className="h-full w-full rounded-[50px] object-cover p-5"
          />
        </div>
      </section>
    </main>
  );
};

export default Page;
