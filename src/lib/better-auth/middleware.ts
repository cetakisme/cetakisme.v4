import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { betterFetch } from "@better-fetch/fetch";
import type { auth } from "./auth";

type Session = typeof auth.$Infer.Session;

const protectedRoutes = ["/admin"];
const signInUrl = "/sign-in";
const signUpUrl = "/sign-up";
const homeUrl = "/";

export const authMiddleware = async (req: NextRequest) => {
  const { pathname } = req.nextUrl;

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // const sessionCookie = getSessionCookie(req);
  const { data: session } = await betterFetch<Session>(
    "/api/auth/get-session",
    {
      baseURL: req.nextUrl.origin,
      headers: {
        cookie: req.headers.get("cookie") ?? "", // Forward the cookies from the request
      },
    },
  );

  if (isProtected && !session) {
    return NextResponse.redirect(new URL(signInUrl, req.url));
  }

  if (
    !isProtected &&
    (pathname.startsWith(signInUrl) || pathname.startsWith(signUpUrl)) &&
    session !== undefined &&
    session?.user !== undefined
  ) {
    return NextResponse.redirect(new URL(homeUrl, req.url));
  }

  return NextResponse.next();
};
