import { prisma } from "@/app/lib/prisma";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name } = await request.json();
  const category = await prisma.category.update({ where: { id: Number(id) }, data: { name } });
  return Response.json(category);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const childCount = await prisma.category.count({ where: { parentId: Number(id) } });
  if (childCount > 0) {
    return Response.json({ error: `このカテゴリには${childCount}個のサブカテゴリがあります。先に削除してください。` }, { status: 400 });
  }
  const count = await prisma.product.count({ where: { categoryId: Number(id), deletedAt: null } });
  if (count > 0) {
    return Response.json({ error: `このカテゴリには${count}個の商品があります。先に商品のカテゴリを変更してください。` }, { status: 400 });
  }
  await prisma.category.delete({ where: { id: Number(id) } });
  return Response.json({ ok: true });
}
