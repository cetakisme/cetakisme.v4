import { observable } from "@legendapp/state";
import type { UserWithRole } from "better-auth/plugins";

export const user$ = observable<UserWithRole | null>(null);
