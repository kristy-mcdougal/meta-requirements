"use server";

import { timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "mkb_auth";

function passwordsMatch(input: string, expected: string) {
  const left = Buffer.from(input);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export async function signIn(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const expected = process.env.SITE_PASSWORD ?? "";
  const token = process.env.AUTH_TOKEN ?? "";

  if (!expected || !token || !passwordsMatch(password, expected)) {
    return { error: "That password is incorrect." };
  }

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/");
}
