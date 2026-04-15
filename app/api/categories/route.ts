import { prisma } from "@/app/lib/prisma";

export async function GET() {
  const [categories, origins] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.origin.findMany({ orderBy: { name: "asc" } }),
  ]);
  return Response.json({ categories, origins });
}

export async function POST(request: Request) {
  const { name, kind } = await request.json();
  if (kind === "origin") {
    const existing = await prisma.origin.findUnique({ where: { name: name.trim() } });
    if (existing) return Response.json({ error: "同じ名前の大分類がすでに存在します" }, { status: 400 });
    const origin = await prisma.origin.create({ data: { name: name.trim() } });
    return Response.json(origin);
  } else {
    const existing = await prisma.category.findUnique({ where: { name: name.trim() } });
    if (existing) return Response.json({ error: "同じ名前の小分類がすでに存在します" }, { status: 400 });
    const category = await prisma.category.create({ data: { name: name.trim() } });
    return Response.json(category);
  }
}
