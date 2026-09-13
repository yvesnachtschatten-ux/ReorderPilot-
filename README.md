# ReorderPilot MVP

Zero-budget validation build for a future Wix Stores app.

## What works
- Demo store dataset with SKU-level replenishment logic
- KPI dashboard
- Search and urgency filtering
- Deterministic reorder math
- MOQ and pack-size rounding
- Editable supplier/replenishment settings
- Calculation detail modal
- Purchase-order drafts grouped by supplier
- Responsive mobile/desktop UI
- Explicit demo-mode and no-live-Wix claims

## Core formulas
- avgDailySales = unitsSold30 / 30
- reorderPoint = ceil(avgDailySales * leadTimeDays + safetyStockUnits)
- targetStock = ceil(avgDailySales * (leadTimeDays + reviewPeriodDays) + safetyStockUnits)
- rawRecommendedQty = max(0, targetStock - currentStock - inboundQty)
- recommendedQty is then rounded to satisfy MOQ and pack size
- daysOfStock = currentStock / avgDailySales when sales > 0

Default review period: 30 days.

## Run locally
Compile TypeScript with `npm run build`, then serve this folder with any static web server and open `index.html`.

## Wix integration roadmap
Current build uses demo data only. The production Wix adapter should later read products/variants, inventory and order history via confirmed Wix APIs, and persist supplier settings. Do not hardcode secrets.

Public Wix App Market compatibility, permissions, billing, privacy/legal copy and live installation flow must be verified before launch.

## Status
Live Wix connectivity: NOT IMPLEMENTED.  
Wix App Market submission: NOT IMPLEMENTED.  
Billing: NOT IMPLEMENTED.
