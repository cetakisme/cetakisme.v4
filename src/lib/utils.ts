import { clsx, type ClassValue } from "clsx";
import { DateTime } from "luxon";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0, // No decimals
  }).format(amount);
}

export function now() {
  return DateTime.now().setZone("Asia/Singapore");
}

export function date(date: Date) {
  return DateTime.fromJSDate(date).setZone("Asia/Singapore").toJSDate();
}

export function isoDate(date: Date) {
  return DateTime.fromJSDate(date).setZone("Asia/Singapore").toISO()!;
}
