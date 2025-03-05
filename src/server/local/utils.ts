import { observable } from "@legendapp/state";
import {
  configureSyncedSupabase,
  syncedSupabase,
} from "@legendapp/state/sync-plugins/supabase";
import { supabase } from "@/lib/supabase/supabase";
import { v4 as uuidv4 } from "uuid";
import { Database } from "@/lib/supabase/database.types";

export const generateId = () => uuidv4();

configureSyncedSupabase({
  generateId,
});

export const asList = <TData>(data: Object | undefined) => {
  if (!data) return [] as TData[];
  return Object.values(data) as TData[];
};

export const id = (...s: string[]) => {
  return s.join("-").toLowerCase();
};
