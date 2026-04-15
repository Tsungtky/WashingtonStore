import { prisma } from "@/app/lib/prisma";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name, price, stock, categoryId, originId, subCategoryId, imageUrl } = await request.json();
  const product = await prisma.product.update({
    where: { id: Number(id) },
    data: {
      name,
      price: Number(price),
      stock: Number(stock),
      originId: originId ? Number(originId) : null,
      categoryId: categoryId ? Number(categoryId) : null,
      subCategoryId: subCategoryId ? Number(subCategoryId) : null,
      ...(imageUrl !== undefined && { imageUrl }),
    },
    include: { category: true, origin: true, subCategory: true },
  });
  return Response.json(product);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.product.update({ where: { id: Number(id) }, data: { deletedAt: new Date() } });
  return Response.json({ ok: true });
}
