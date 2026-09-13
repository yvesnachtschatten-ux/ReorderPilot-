export function roundOrderQty(qty, moq, packSize) {
  if (qty <= 0) return 0;
  const min = Math.max(0, moq || 0);
  const pack = Math.max(1, packSize || 1);
  const afterMoq = Math.max(qty, min);
  return Math.ceil(afterMoq / pack) * pack;
}
export function calculateReorder(input, reviewPeriodDays = 30) {
  const avgDailySales = input.unitsSold30 / 30;
  const reorderPoint = Math.ceil(avgDailySales * input.leadTimeDays + input.safetyStockUnits);
  const targetStock = Math.ceil(avgDailySales * (input.leadTimeDays + reviewPeriodDays) + input.safetyStockUnits);
  const rawRecommendedQty = Math.max(0, targetStock - input.currentStock - input.inboundQty);
  const recommendedQty = roundOrderQty(rawRecommendedQty, input.moq, input.packSize);
  const daysOfStock = avgDailySales > 0 ? input.currentStock / avgDailySales : null;
  let urgency = 'HEALTHY';
  if (avgDailySales === 0) urgency = 'NO SALES';
  else if (input.currentStock + input.inboundQty <= reorderPoint) urgency = 'REORDER NOW';
  else if (daysOfStock !== null && daysOfStock <= input.leadTimeDays + 7) urgency = 'AT RISK';
  return { ...input, avgDailySales, reorderPoint, targetStock, rawRecommendedQty, recommendedQty, daysOfStock, urgency };
}
export function buildPoDrafts(items) {
  const selected = items.filter(i => i.recommendedQty > 0);
  const grouped = new Map();
  for (const item of selected) {
    const arr = grouped.get(item.supplier) ?? [];
    arr.push(item);
    grouped.set(item.supplier, arr);
  }
  return Array.from(grouped.entries()).map(([supplier, lines]) => ({
    supplier,
    lines,
    estimatedCost: lines.reduce((sum, l) => sum + l.recommendedQty * l.purchaseCost, 0)
  }));
}
