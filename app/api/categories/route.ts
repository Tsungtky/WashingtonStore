import { prisma } from "@/app/lib/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    include: { children: { orderBy: { name: "asc" } } },
    orderBy: { name: "asc" },
  });
  return Response.json(categories);
}

export async function POST(request: Request) {
  const { name, parentId } = await request.json();
  const pid = parentId ? Number(parentId) : null;
  const existing = await prisma.category.findFirst({ where: { name: name.trim(), parentId: pid } });
  if (existing) return Response.json({ error: "同じ名前のカテゴリがすでに存在します" }, { status: 400 });
  const category = await prisma.category.create({
    data: { name: name.trim(), parentId: pid },
    include: { children: true },
  });
  return Response.json(category);
}
