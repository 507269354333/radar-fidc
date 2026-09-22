import assert from 'node:assert/strict';
import {fetchCvmDataset} from '../lib/cvm-data.js';
import {fetchBcbDataset} from '../lib/bcb-data.js';

const cvm=await fetchCvmDataset();
assert(cvm.count>0,'A CVM não retornou ofertas FIDC');
assert(/^\d{4}-\d{2}$/.test(cvm.analytics.latestMonth),'Competência CVM inválida');
assert.equal(new Set(cvm.items.map(item=>item.id)).size,cvm.items.length,'IDs de oferta duplicados');
assert(cvm.items.every(item=>!/[�]/.test(JSON.stringify(item))),'Encoding inválido na base CVM');
assert(cvm.items.every(item=>item.volume===null||(Number.isFinite(item.volume)&&item.volume>=0)),'Volume CVM inválido');
assert(cvm.items.every(item=>!item.date||/^\d{4}-\d{2}-\d{2}$/.test(item.date)),'Data CVM inválida');

const bcb=await fetchBcbDataset(fetch,15000);
assert(bcb.available>=3,`Somente ${bcb.available} séries BCB disponíveis`);
for(const series of Object.values(bcb.series)) if(series.latest){assert(/^\d{4}-\d{2}-\d{2}$/.test(series.latest.date));assert(Number.isFinite(series.latest.value));}

console.log(JSON.stringify({cvm:{offers:cvm.count,rawRows:cvm.rawFidcRows,latestMonth:cvm.analytics.latestMonth,offersInMonth:cvm.analytics.offersInMonth,volumeInMonth:cvm.analytics.volumeInMonth,leadersInMonth:cvm.analytics.leadersInMonth},bcb:{available:bcb.available,partial:bcb.partial,latest:Object.fromEntries(Object.entries(bcb.series).map(([key,value])=>[key,value.latest||value.error]))}},null,2));
