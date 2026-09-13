export type Urgency = 'REORDER NOW' | 'AT RISK' | 'HEALTHY' | 'NO SALES';

export interface SkuInput {
  id: string;
  product: string;
  sku: string;
  supplier: string;
  currentStock: number;
  unitsSold30: number;
  purchaseCost: number;
  leadTimeDays: number;
  safetyStockUnits: number;
  inboundQty: number;
  moq: number;
  packSize: number;
}

export interface ReorderResult extends SkuInput {
  avgDailySales: number;
  reorderPoint: number;
  targetStock: number;
  rawRecommendedQty: number;
  recommendedQty: number;
  daysOfStock: number | null;
  urgency: Urgency;
}

export function roundOrderQty(qty: number, moq: number, packSize: number): number {
  if (qty <= 0) return 0;
  const min = Math.max(0, moq || 0);
  const pack = Math.max(1, packSize || 1);
  const afterMoq = Math.max(qty, min);
  return Math.ceil(afterMoq / pack) * pack;
}

export function calculateReorder(input: SkuInput, reviewPeriodDays = 30): ReorderResult {
  const avgDailySales = input.unitsSold30 / 30;
  const reorderPoint = Math.ceil(avgDailySales * input.leadTimeDays + input.safetyStockUnits);
  const targetStock = Math.ceil(avgDailySales * (input.leadTimeDays + reviewPeriodDays) + input.safetyStockUnits);
  const rawRecommendedQty = Math.max(0, targetStock - input.currentStock - input.inboundQty);
  const recommendedQty = roundOrderQty(rawRecommendedQty, input.moq, input.packSize);
  const daysOfStock = avgDailySales > 0 ? input.currentStock / avgDailySales : null;
  let urgency: Urgency = 'HEALTHY';
  if (avgDailySales === 0) urgency = 'NO SALES';
  else if (input.currentStock + input.inboundQty <= reorderPoint) urgency = 'REORDER NOW';
  else if (daysOfStock !== null && daysOfStock <= input.leadTimeDays + 7) urgency = 'AT RISK';
  return { ...input, avgDailySales, reorderPoint, targetStock, rawRecommendedQty, recommendedQty, daysOfStock, urgency };
}

export function buildPoDrafts(items: ReorderResult[]) {
  const selected = items.filter(i => i.recommendedQty > 0);
  const grouped = new Map<string, ReorderResult[]>();
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
