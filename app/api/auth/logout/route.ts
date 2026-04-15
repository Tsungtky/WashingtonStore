import { SESSION_COOKIE } from "@/app/lib/auth";

export async function POST() {
  return Response.json({ ok: true }, {
    headers: { "Set-Cookie": `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax` },
  });
}
