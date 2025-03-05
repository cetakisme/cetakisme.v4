import { configureSyncedSupabase } from "@legendapp/state/sync-plugins/supabase";
import { v4 as uuidv4 } from "uuid";

export const generateId = () => uuidv4();

configureSyncedSupabase({
  generateId,
});

export const asList = <TData>(data: object | undefined) => {
  if (!data) return [] as TData[];
  return Object.values(data) as TData[];
};

export const id = (...s: string[]) => {
  return s.join("-").toLowerCase();
};
