import { prisma } from "@/app/lib/prisma";
import { getSessionUserId } from "@/app/lib/session";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");

  let where = {};
  if (month) {
    const [year, mon] = month.split("-").map(Number);
    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon, 1);
    where = { createdAt: { gte: start, lt: end } };
  } else {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    where = { createdAt: { gte: start, lt: end } };
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: { items: { include: { product: true } }, user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(transactions);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { items } = body as { items: { productId: number; quantity: number; unitPrice: number }[] };
  const userId = await getSessionUserId();

  for (const item of items) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (!product) return Response.json({ error: `商品ID ${item.productId} が見つかりません` }, { status: 404 });
    if (product.stock < item.quantity) {
      return Response.json({ error: `「${product.name}」の在庫が不足しています（在庫: ${product.stock}）` }, { status: 400 });
    }
  }

  const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  const transaction = await prisma.transaction.create({
    data: {
      total,
      userId: userId ?? undefined,
      items: {
        create: items.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice })),
      },
    },
    include: { items: true, user: { select: { id: true, name: true } } },
  });

  for (const item of items) {
    await prisma.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } });
  }

  return Response.json(transaction);
}
