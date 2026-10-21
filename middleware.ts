import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE = "mkb_auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/login") return NextResponse.next();

  const token = process.env.AUTH_TOKEN;
  const session = request.cookies.get(COOKIE)?.value;
  if (token && session === token) return NextResponse.next();

  const login = request.nextUrl.clone();
  login.pathname = "/login";
  login.search = "";
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icon.svg|meta-logo.png).*)"],
};
