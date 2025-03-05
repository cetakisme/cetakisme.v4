import { createClient } from "@supabase/supabase-js";
import { type Database } from "./database.types";

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

type Key = keyof Database["public"]["Tables"];

export type DB<TKey extends Key> = Database["public"]["Tables"][TKey]["Row"];
