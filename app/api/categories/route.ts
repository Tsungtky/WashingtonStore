import { prisma } from "@/app/lib/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return Response.json(categories);
}

export async function POST(request: Request) {
  const { name } = await request.json();
  const category = await prisma.category.create({ data: { name } });
  return Response.json(category);
}
