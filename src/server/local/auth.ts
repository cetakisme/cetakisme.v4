import { observable } from "@legendapp/state";
import { UserWithRole } from "better-auth/plugins";

export const user$ = observable<UserWithRole | null>(null);
