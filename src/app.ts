import { calculateReorder, buildPoDrafts, type ReorderResult, type SkuInput } from './domain.js';
import { demoSkus } from './demo.js';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
let skus: SkuInput[] = structuredClone(demoSkus);
let query = '';
let statusFilter = 'ALL';
let selected = new Set<string>();

function results(): ReorderResult[] { return skus.map(s => calculateReorder(s)); }
function esc(s: string) { return s.replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c] || c)); }

function render() {
  const all = results();
  const visible = all.filter(r => {
    const hit = `${r.product} ${r.sku} ${r.supplier}`.toLowerCase().includes(query.toLowerCase());
    return hit && (statusFilter === 'ALL' || r.urgency === statusFilter);
  });
  const reorderNow = all.filter(r => r.urgency === 'REORDER NOW').length;
  const atRisk = all.filter(r => r.urgency === 'AT RISK').length;
  const inventoryValue = all.reduce((s, r) => s + r.currentStock * r.purchaseCost, 0);
  const exposure = all.filter(r => r.urgency === 'REORDER NOW').reduce((s,r)=>s+r.avgDailySales*r.purchaseCost*30,0);

  document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
    <header class="topbar">
      <div><div class="brand">ReorderPilot</div><div class="sub">Inventory replenishment for Wix Stores</div></div>
      <div class="actions"><span class="badge demo">DEMO MODE</span><button class="ghost" id="aboutBtn">About</button></div>
    </header>
    <main>
      <section class="hero">
        <div><p class="eyebrow">REPLENISHMENT CONTROL</p><h1>Know what to reorder before you stock out.</h1><p>Deterministic reorder decisions using stock, recent velocity, lead time, safety stock and inbound units.</p></div>
        <div class="plan"><span>Free demo</span><strong>8 / 20 SKUs</strong><small>Pro concept: unlimited SKUs + advanced history · $7.99/mo</small></div>
      </section>
      <section class="kpis">
        ${kpi('Reorder now', String(reorderNow), 'Immediate action')}
        ${kpi('At risk soon', String(atRisk), 'Watch closely')}
        ${kpi('Inventory value', money.format(inventoryValue), 'At purchase cost')}
        ${kpi('Stockout exposure', money.format(exposure), '30-day cost proxy')}
      </section>
      <section class="panel controls">
        <input id="search" placeholder="Search product, SKU or supplier" value="${esc(query)}" />
        <select id="status"><option>ALL</option><option>REORDER NOW</option><option>AT RISK</option><option>HEALTHY</option><option>NO SALES</option></select>
        <button id="poBtn" class="primary">Create PO drafts (${selected.size})</button>
      </section>
      <section class="panel tablewrap">
        <table>
          <thead><tr><th></th><th>Product / SKU</th><th>Status</th><th>Stock</th><th>30d sold</th><th>Days left</th><th>Lead</th><th>Inbound</th><th>ROP</th><th>Reorder</th><th>Supplier</th></tr></thead>
          <tbody>${visible.length ? visible.map(row).join('') : `<tr><td colspan="11" class="empty">No SKUs match this view.</td></tr>`}</tbody>
        </table>
      </section>
      <p class="assumptions">Assumptions: 30-day sales window · 30-day review period · avg. daily sales = units sold / 30 · no seasonality in MVP.</p>
    </main>
    <dialog id="modal"></dialog>
  `;
  const status = document.querySelector<HTMLSelectElement>('#status')!; status.value = statusFilter;
  document.querySelector<HTMLInputElement>('#search')!.oninput = e => { query = (e.target as HTMLInputElement).value; render(); };
  status.onchange = e => { statusFilter = (e.target as HTMLSelectElement).value; render(); };
  document.querySelectorAll<HTMLInputElement>('[data-select]').forEach(cb => cb.onchange = () => { cb.checked ? selected.add(cb.dataset.select!) : selected.delete(cb.dataset.select!); render(); });
  document.querySelectorAll<HTMLButtonElement>('[data-detail]').forEach(b => b.onclick = () => openDetail(b.dataset.detail!));
  document.querySelector<HTMLButtonElement>('#poBtn')!.onclick = openPoDrafts;
  document.querySelector<HTMLButtonElement>('#aboutBtn')!.onclick = openAbout;
}

function kpi(label:string,value:string,note:string){return `<div class="kpi"><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`}
function row(r: ReorderResult) {
  const disabled = r.recommendedQty === 0;
  return `<tr>
    <td><input type="checkbox" data-select="${r.id}" ${selected.has(r.id)?'checked':''} ${disabled?'disabled':''}></td>
    <td><button class="link" data-detail="${r.id}">${esc(r.product)}</button><small>${esc(r.sku)}</small></td>
    <td><span class="badge ${r.urgency.toLowerCase().replace(/ /g,'-')}">${r.urgency}</span></td>
    <td>${r.currentStock}</td><td>${r.unitsSold30}</td><td>${r.daysOfStock===null?'—':r.daysOfStock.toFixed(1)}</td><td>${r.leadTimeDays}d</td><td>${r.inboundQty}</td><td>${r.reorderPoint}</td><td><strong>${r.recommendedQty||'—'}</strong></td><td>${esc(r.supplier)}</td>
  </tr>`;
}
function showModal(html:string){const m=document.querySelector<HTMLDialogElement>('#modal')!;m.innerHTML=html;m.showModal();m.querySelector<HTMLButtonElement>('[data-close]')!.onclick=()=>m.close();}
function openDetail(id:string){const r=results().find(x=>x.id===id)!;showModal(`<div class="modalhead"><div><p class="eyebrow">SKU DETAIL</p><h2>${esc(r.product)}</h2><p>${esc(r.sku)}</p></div><button data-close class="ghost">Close</button></div><div class="calcgrid">${kpi('Avg daily sales',r.avgDailySales.toFixed(2),'30-day velocity')}${kpi('Reorder point',String(r.reorderPoint),'lead demand + safety')}${kpi('Target stock',String(r.targetStock),'lead + 30-day review')}${kpi('Recommended',String(r.recommendedQty),'after inbound/MOQ/pack')}</div><div class="formula"><strong>Calculation</strong><p>ROP = ceil(${r.avgDailySales.toFixed(2)} × ${r.leadTimeDays} + ${r.safetyStockUnits}) = ${r.reorderPoint}</p><p>Target = ceil(${r.avgDailySales.toFixed(2)} × (${r.leadTimeDays} + 30) + ${r.safetyStockUnits}) = ${r.targetStock}</p><p>Raw order = max(0, ${r.targetStock} − ${r.currentStock} − ${r.inboundQty}) = ${r.rawRecommendedQty}</p><p>Rounded order = ${r.recommendedQty} (MOQ ${r.moq}, pack ${r.packSize})</p></div><button class="primary" id="editBtn">Edit replenishment settings</button>`);document.querySelector<HTMLButtonElement>('#editBtn')!.onclick=()=>openEdit(id);}
function openEdit(id:string){const s=skus.find(x=>x.id===id)!;showModal(`<div class="modalhead"><h2>Edit settings</h2><button data-close class="ghost">Close</button></div><form id="editForm" class="formgrid"><label>Supplier<input name="supplier" value="${esc(s.supplier)}"></label><label>Purchase cost<input name="purchaseCost" type="number" step="0.01" value="${s.purchaseCost}"></label><label>Lead time days<input name="leadTimeDays" type="number" value="${s.leadTimeDays}"></label><label>Safety stock<input name="safetyStockUnits" type="number" value="${s.safetyStockUnits}"></label><label>MOQ<input name="moq" type="number" value="${s.moq}"></label><label>Pack size<input name="packSize" type="number" value="${s.packSize}"></label><label>Inbound qty<input name="inboundQty" type="number" value="${s.inboundQty}"></label><button class="primary" type="submit">Save settings</button></form>`);document.querySelector<HTMLFormElement>('#editForm')!.onsubmit=e=>{e.preventDefault();const fd=new FormData(e.currentTarget as HTMLFormElement);s.supplier=String(fd.get('supplier'));for(const k of ['purchaseCost','leadTimeDays','safetyStockUnits','moq','packSize','inboundQty'] as const)s[k]=Number(fd.get(k));document.querySelector<HTMLDialogElement>('#modal')!.close();render();};}
function openPoDrafts(){const chosen=results().filter(r=>selected.has(r.id));const drafts=buildPoDrafts(chosen);showModal(`<div class="modalhead"><div><p class="eyebrow">PURCHASE ORDER DRAFTS</p><h2>${drafts.length ? `${drafts.length} supplier draft${drafts.length>1?'s':''}` : 'No items selected'}</h2></div><button data-close class="ghost">Close</button></div>${drafts.map(d=>`<section class="po"><div class="pohead"><strong>${esc(d.supplier)}</strong><span>${money.format(d.estimatedCost)}</span></div>${d.lines.map(l=>`<div class="poline"><span>${esc(l.sku)}</span><strong>${l.recommendedQty} units</strong><span>${money.format(l.recommendedQty*l.purchaseCost)}</span></div>`).join('')}</section>`).join('')||'<p>Select at least one SKU with a reorder recommendation.</p>'}<p class="note">Draft only. ReorderPilot does not place supplier orders automatically in this MVP.</p>`);}
function openAbout(){showModal(`<div class="modalhead"><div><p class="eyebrow">ABOUT</p><h2>ReorderPilot</h2></div><button data-close class="ghost">Close</button></div><p>ReorderPilot is a replenishment decision assistant for Wix Stores merchants. It uses operational store data only for replenishment calculations; customer profiling is not required for the MVP.</p><p>This build runs on demo data and does not claim live Wix connectivity, billing, or App Market publication yet.</p><p class="note">Goal: fewer stockouts and less cash trapped in excess inventory. No savings are guaranteed.</p>`);}

render();
