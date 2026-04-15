import { prisma } from "@/app/lib/prisma";
import { hashPassword, verifyPassword, signSession, SESSION_COOKIE } from "@/app/lib/auth";

export async function POST(request: Request) {
  const { email, password } = await request.json();
  if (!email || !password) return Response.json({ error: "メールアドレスとパスワードを入力してください" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user || !verifyPassword(password, user.password)) {
    return Response.json({ error: "メールアドレスまたはパスワードが違います" }, { status: 401 });
  }

  const session = signSession(user.id);
  return Response.json({ id: user.id, name: user.name, email: user.email }, {
    headers: { "Set-Cookie": `${SESSION_COOKIE}=${session}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax` },
  });
}
