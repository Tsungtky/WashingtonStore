import { prisma } from "@/app/lib/prisma";

// PUT /api/transactions/[id]
// Body: { itemId: number, newQuantity: number }
// Updates the item quantity, adjusts stock, recalculates total.
// If newQuantity === 0, removes the item.
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { itemId, newQuantity } = await request.json();
  const txId = Number(id);

  // Load the item
  const item = await prisma.transactionItem.findUnique({
    where: { id: Number(itemId) },
    include: { product: true },
  });
  if (!item || item.transactionId !== txId) {
    return Response.json({ error: "明細が見つかりません" }, { status: 404 });
  }

  const oldQty = item.quantity;
  const qty = Number(newQuantity);
  const stockAfterRestore = item.product.stock + oldQty; // what stock would be if we restored original

  if (qty < 0) {
    return Response.json({ error: "数量は0以上にしてください" }, { status: 400 });
  }
  if (qty > stockAfterRestore) {
    return Response.json({ error: `「${item.product.name}」の在庫が不足しています（最大: ${stockAfterRestore}）` }, { status: 400 });
  }

  if (qty === 0) {
    // Remove the item
    await prisma.transactionItem.delete({ where: { id: item.id } });
    // Restore stock
    await prisma.product.update({ where: { id: item.productId }, data: { stock: { increment: oldQty } } });
  } else {
    // Update item quantity
    await prisma.transactionItem.update({ where: { id: item.id }, data: { quantity: qty } });
    // Adjust stock: net = qty - oldQty (positive = deduct more, negative = restore some)
    const delta = qty - oldQty;
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: delta } },
    });
  }

  // Recalculate transaction total
  const remaining = await prisma.transactionItem.findMany({ where: { transactionId: txId } });
  const newTotal = remaining.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const tx = await prisma.transaction.update({
    where: { id: txId },
    data: { total: newTotal },
    include: { items: { include: { product: true } }, user: { select: { id: true, name: true } } },
  });

  return Response.json(tx);
}
