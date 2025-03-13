import { createClient } from "@supabase/supabase-js";
import { type Database } from "./database.types";

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export type TableName = keyof Database["public"]["Tables"];

export type DB<TKey extends TableName> =
  Database["public"]["Tables"][TKey]["Row"];
