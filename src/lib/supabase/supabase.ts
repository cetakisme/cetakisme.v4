import { createClient } from "@supabase/supabase-js";
import { type Database } from "./database.types";
import { env } from "@/env";

export const supabase = createClient<Database>(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export type TableName = keyof Database["public"]["Tables"];

export type DB<TKey extends TableName> =
  Database["public"]["Tables"][TKey]["Row"];
