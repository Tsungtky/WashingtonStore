import { prisma } from "@/app/lib/prisma";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name, kind } = await request.json();
  if (kind === "origin") {
    const origin = await prisma.origin.update({ where: { id: Number(id) }, data: { name } });
    return Response.json(origin);
  } else {
    const category = await prisma.category.update({ where: { id: Number(id) }, data: { name } });
    return Response.json(category);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind");
  if (kind === "origin") {
    const count = await prisma.product.count({ where: { originId: Number(id), deletedAt: null } });
    if (count > 0) return Response.json({ error: `この大分類には${count}個の商品があります。先に変更してください。` }, { status: 400 });
    await prisma.origin.delete({ where: { id: Number(id) } });
  } else {
    const count = await prisma.product.count({ where: { categoryId: Number(id), deletedAt: null } });
    if (count > 0) return Response.json({ error: `この小分類には${count}個の商品があります。先に変更してください。` }, { status: 400 });
    await prisma.category.delete({ where: { id: Number(id) } });
  }
  return Response.json({ ok: true });
}
