import { prisma } from "@/app/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const barcode = searchParams.get("barcode");
  if (!barcode) return Response.json({ error: "barcode required" }, { status: 400 });

  const product = await prisma.product.findFirst({ where: { barcode, deletedAt: null }, include: { category: true } });
  if (!product) return Response.json({ error: "Product not found" }, { status: 404 });

  return Response.json(product);
}
