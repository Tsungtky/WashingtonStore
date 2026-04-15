import { cookies } from "next/headers";
import { verifySession, SESSION_COOKIE } from "./auth";
import { prisma } from "./prisma";

export async function getSessionUser() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE)?.value;
  if (!session) return null;
  const userId = verifySession(session);
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function getSessionUserId(): Promise<number | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE)?.value;
  if (!session) return null;
  return verifySession(session);
}
