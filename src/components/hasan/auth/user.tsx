"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/better-auth/auth-client";
import { user$ } from "@/server/local/auth";
import { UserWithRole } from "better-auth/plugins";
import Link from "next/link";
import React from "react";

const User = () => {
  const { data: session, isPending, refetch } = authClient.useSession();
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  React.useEffect(() => {
    if (!session) return;
    user$.set(session.user as UserWithRole);
  }, [session]);
  return (
    <>
      {session ? (
        <Button
          disabled={isPending || isSigningOut}
          onClick={async () => {
            setIsSigningOut(true);
            try {
              await authClient.signOut();
            } catch (error) {
              console.log(error);
            } finally {
              setIsSigningOut(false);
            }
          }}
        >
          {session?.user.username}
        </Button>
      ) : (
        <Button asChild>
          <Link href="/sign-in">Sign In</Link>
        </Button>
      )}
    </>
  );
};

export default User;
