import { prisma } from "@/app/lib/prisma";

export async function GET() {
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(products);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, price, stock, categoryId, imageUrl } = body;

  const barcode = String(Date.now()).slice(-8) + Math.floor(Math.random() * 100).toString().padStart(2, "0");

  const product = await prisma.product.create({
    data: {
      name,
      price: Number(price),
      stock: Number(stock),
      barcode,
      categoryId: categoryId ? Number(categoryId) : null,
      imageUrl: imageUrl || null,
    },
    include: { category: true },
  });
  return Response.json(product);
}
