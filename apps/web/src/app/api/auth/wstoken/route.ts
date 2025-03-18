import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import jwt from "jsonwebtoken";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const wsToken = jwt.sign(
    { userId: session.user.id },
    process.env.HOCUSPOCUS_WEBSOCKET_SECRET!,
    { expiresIn: "1h" }
  );

  return NextResponse.json({ token: wsToken });
}