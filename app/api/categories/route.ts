import { prisma } from "@/app/lib/prisma";

export async function GET() {
  const [origins, categories, subCategories] = await Promise.all([
    prisma.origin.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.subCategory.findMany({ orderBy: { name: "asc" } }),
  ]);
  return Response.json({ origins, categories, subCategories });
}

export async function POST(request: Request) {
  const { name, kind } = await request.json();
  if (kind === "origin") {
    const existing = await prisma.origin.findUnique({ where: { name: name.trim() } });
    if (existing) return Response.json({ error: "同じ名前の大分類がすでに存在します" }, { status: 400 });
    return Response.json(await prisma.origin.create({ data: { name: name.trim() } }));
  } else if (kind === "subCategory") {
    const existing = await prisma.subCategory.findUnique({ where: { name: name.trim() } });
    if (existing) return Response.json({ error: "同じ名前の小分類がすでに存在します" }, { status: 400 });
    return Response.json(await prisma.subCategory.create({ data: { name: name.trim() } }));
  } else {
    const existing = await prisma.category.findUnique({ where: { name: name.trim() } });
    if (existing) return Response.json({ error: "同じ名前の中分類がすでに存在します" }, { status: 400 });
    return Response.json(await prisma.category.create({ data: { name: name.trim() } }));
  }
}
