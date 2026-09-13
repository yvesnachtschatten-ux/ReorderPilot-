# ReorderPilot — Wix App Setup

## Confirmed Wix path

ReorderPilot should become a Wix app with a dashboard page extension. The Wix CLI is the supported tool for creating, developing, and deploying Wix apps. Wix also provides free development sites for testing an app before App Market submission.

## Current repository state

The repository already contains the validated demo MVP and deterministic replenishment logic. Do not rewrite the domain formulas when moving into the Wix CLI scaffold. Treat `src/domain.ts` as the source of truth for replenishment calculations.

## Target architecture

1. Wix app project created in the Wix App Dashboard / Wix CLI.
2. Dashboard page extension named ReorderPilot.
3. Wix Stores data adapter loads products/variants, inventory, and order history.
4. ReorderPilot maps Wix data into the platform-neutral `SkuInput` model.
5. Existing `calculateReorder()` and `buildPoDrafts()` functions remain deterministic and independent from Wix SDK code.
6. Supplier settings are persisted separately from the Wix catalog.
7. Billing and plan gating are added only after the core installed-app flow works on a development site.

## MVP permissions/data needs

ReorderPilot only needs operational store data required for replenishment decisions. Customer profiling is not required for the MVP.

Required functional inputs:
- products / variants / SKUs
- current inventory quantity
- recent paid/order line quantities for sales velocity
- optional inbound quantity entered by merchant
- merchant-defined supplier, lead time, safety stock, MOQ, pack size, and purchase cost

## Build order

1. Create/connect Wix app project.
2. Add dashboard page extension.
3. Render the existing demo dashboard inside the extension.
4. Add read-only Wix Stores adapter.
5. Verify calculations against demo fixtures and a test store.
6. Add persistence for replenishment settings.
7. Add install/error/empty/loading states.
8. Run mobile/desktop and calculation QA.
9. Only then add Wix billing, pricing gate, listing assets, privacy/terms, and App Market submission.

## Constraints

- No paid infrastructure without explicit approval.
- No production claims until live Wix connectivity is verified.
- No automatic supplier ordering in MVP.
- No customer PII should be stored when order-line aggregates are sufficient.
