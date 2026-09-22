import assert from 'node:assert/strict';
import {fetchCvmMarketsDataset,MARKETS} from '../lib/cvm-data.js';
import {fetchBcbDataset} from '../lib/bcb-data.js';
import {fetchAnbimaIndicators} from '../lib/anbima-data.js';

const cvm=await fetchCvmMarketsDataset();
for(const market of MARKETS){
  const data=cvm.markets[market];
  assert(data.count>0,`A CVM não retornou ofertas ${market}`);
  assert(/^\d{4}-\d{2}$/.test(data.analytics.latestMonth),`Competência ${market} inválida`);
  assert.equal(new Set(data.items.map(item=>item.id)).size,data.items.length,`IDs ${market} duplicados`);
  assert(data.items.every(item=>item.market===market),`Classificação cruzada em ${market}`);
  assert(data.items.every(item=>!/[�]/.test(JSON.stringify(item))),`Encoding inválido em ${market}`);
  assert(data.items.every(item=>item.volume===null||(Number.isFinite(item.volume)&&item.volume>=0)),`Volume inválido em ${market}`);
  assert(data.items.every(item=>!item.date||/^\d{4}-\d{2}-\d{2}$/.test(item.date)),`Data inválida em ${market}`);
}
assert.equal(new Set(cvm.allItems.map(item=>item.id)).size,cvm.allItems.length,'IDs duplicados entre verticais');

const [bcbResult,anbimaResult]=await Promise.allSettled([fetchBcbDataset(fetch,15000),fetchAnbimaIndicators(fetch,15000)]);
assert.equal(bcbResult.status,'fulfilled',`BCB falhou: ${bcbResult.reason?.message||''}`);
const bcb=bcbResult.value;
assert(bcb.available>=3,`Somente ${bcb.available} séries BCB disponíveis`);
for(const series of Object.values(bcb.series)) if(series.latest){assert(/^\d{4}-\d{2}-\d{2}$/.test(series.latest.date));assert(Number.isFinite(series.latest.value));}
assert.equal(anbimaResult.status,'fulfilled',`ANBIMA falhou: ${anbimaResult.reason?.message||''}`);
assert(anbimaResult.value.available>=3,'Poucos indicadores ANBIMA disponíveis');

console.log(JSON.stringify({
  cvm:Object.fromEntries(MARKETS.map(m=>[m,{offers:cvm.markets[m].count,latestMonth:cvm.markets[m].analytics.latestMonth,offersInMonth:cvm.markets[m].analytics.offersInMonth,volumeInMonth:cvm.markets[m].analytics.volumeInMonth,leaders12m:cvm.markets[m].analytics.trailing12.leaders}])),
  overall:cvm.overall,
  bcb:{available:bcb.available,partial:bcb.partial},
  anbima:{available:anbimaResult.value.available,sourceUpdatedAt:anbimaResult.value.sourceUpdatedAt}
},null,2));
