import { calculateReorder, roundOrderQty } from '../src/domain.js';

function assert(name, cond){ if(!cond) throw new Error('FAIL: '+name); console.log('PASS:',name); }
const base = {id:'x',product:'X',sku:'X',supplier:'S',currentStock:5,unitsSold30:30,purchaseCost:1,leadTimeDays:10,safetyStockUnits:5,inboundQty:0,moq:1,packSize:1};
const low = calculateReorder(base);
assert('low stock recommends order', low.recommendedQty > 0 && low.urgency === 'REORDER NOW');
const zero = calculateReorder({...base, unitsSold30:0, currentStock:20});
assert('zero sales status', zero.urgency === 'NO SALES' && zero.daysOfStock === null);
const inbound = calculateReorder({...base, inboundQty:100});
assert('inbound can remove recommendation', inbound.recommendedQty === 0);
assert('MOQ enforced', roundOrderQty(7,20,5)===20);
assert('pack size enforced', roundOrderQty(21,0,6)===24);
