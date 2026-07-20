import { NextResponse } from "next/server";
import { getAdminPassword, setAuthenticated } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const { password } = body as { password?: string };

  if (!password || password !== getAdminPassword()) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  await setAuthenticated();
  return NextResponse.json({ ok: true });
}
