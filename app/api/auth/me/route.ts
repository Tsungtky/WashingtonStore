import { getSessionUser } from "@/app/lib/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "未認証" }, { status: 401 });
  return Response.json({ id: user.id, name: user.name, email: user.email });
}
