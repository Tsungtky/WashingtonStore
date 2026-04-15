import { prisma } from "@/app/lib/prisma";
import { getSessionUser } from "@/app/lib/session";
import { hashPassword, verifyPassword } from "@/app/lib/auth";

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "未認証" }, { status: 401 });

  const { name, email, currentPassword, newPassword } = await request.json();

  const data: { name?: string; email?: string; password?: string } = {};

  if (name && name.trim() !== user.name) {
    data.name = name.trim();
  }

  if (email && email.trim().toLowerCase() !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existing) return Response.json({ error: "このメールアドレスはすでに使用されています" }, { status: 400 });
    data.email = email.trim().toLowerCase();
  }

  if (newPassword) {
    if (!currentPassword) return Response.json({ error: "現在のパスワードを入力してください" }, { status: 400 });
    if (!verifyPassword(currentPassword, user.password)) {
      return Response.json({ error: "現在のパスワードが違います" }, { status: 400 });
    }
    if (newPassword.length < 4) return Response.json({ error: "パスワードは4文字以上にしてください" }, { status: 400 });
    data.password = hashPassword(newPassword);
  }

  if (Object.keys(data).length === 0) return Response.json({ error: "変更がありません" }, { status: 400 });

  const updated = await prisma.user.update({ where: { id: user.id }, data });
  return Response.json({ id: updated.id, name: updated.name, email: updated.email });
}
