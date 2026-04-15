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
  const category = await prisma.category.create({
    data: { name, parentId: parentId ? Number(parentId) : null },
    include: { children: true },
  });
  return Response.json(category);
}
