import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { pbkdf2Sync, randomBytes } from "crypto";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "admin@test.com";
  const displayName = "Admin";
  const password = "123456";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("ユーザーはすでに存在します:", email);
    return;
  }

  const user = await prisma.user.create({
    data: { email, name: displayName, password: hashPassword(password) },
  });
  console.log("✅ ユーザーを作成しました:", user.email, "ID:", user.id);
}

main().catch(console.error).finally(() => prisma.$disconnect());
