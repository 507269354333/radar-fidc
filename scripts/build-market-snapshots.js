import {mkdir,writeFile} from 'node:fs/promises';
import {fetchCvmMarketsDataset,MARKETS} from '../lib/cvm-data.js';
import {fetchBcbDataset} from '../lib/bcb-data.js';
import {fetchAnbimaIndicators} from '../lib/anbima-data.js';
import {fetchCvmNews} from '../api/news.js';
import {buildWeeklyReport} from '../lib/weekly.js';

const [cvm,bcbResult,anbimaResult,newsResult]=await Promise.all([
  fetchCvmMarketsDataset(),
  fetchBcbDataset().catch(()=>null),
  fetchAnbimaIndicators().catch(()=>null),
  fetchCvmNews().catch(()=>[])
]);
await mkdir('data',{recursive:true});
const pretty=data=>JSON.stringify(data,null,2)+'\n';
const marketComparison=MARKETS.map(key=>({market:key,count:cvm.markets[key].count,latestMonth:cvm.markets[key].analytics.latestMonth,offersInMonth:cvm.markets[key].analytics.offersInMonth,volumeInMonth:cvm.markets[key].analytics.volumeInMonth}));
const sourceSummary={source:cvm.source,sourceUrl:cvm.sourceUrl,sourceUpdatedAt:cvm.sourceUpdatedAt,overall:cvm.overall,markets:Object.fromEntries(MARKETS.map(key=>{const d=cvm.markets[key];return[key,{market:key,count:d.count,analytics:d.analytics,methodology:d.methodology}]})),updatedAt:new Date().toISOString()};
await writeFile('data/markets-summary.json',pretty(sourceSummary));
for(const market of MARKETS){
  const d=cvm.markets[market];
  await writeFile(`data/market-${market}.json`,pretty({source:cvm.source,sourceUrl:cvm.sourceUrl,sourceUpdatedAt:cvm.sourceUpdatedAt,market,count:d.count,analytics:d.analytics,methodology:d.methodology,updatedAt:new Date().toISOString()}));
}
for(const market of [...MARKETS,'ALL']){
  const items=market==='ALL'?cvm.allItems:cvm.markets[market].items;
  const report=buildWeeklyReport(items,new Date(),{market});
  const payload={...report,sources:{cvm:{name:cvm.source,url:cvm.sourceUrl,updatedAt:cvm.sourceUpdatedAt},bcb:bcbResult?{name:bcbResult.source,url:bcbResult.sourceUrl,updatedAt:bcbResult.updatedAt}:null,anbima:anbimaResult?{name:anbimaResult.source,url:anbimaResult.sourceUrl,updatedAt:anbimaResult.sourceUpdatedAt}:null},macro:bcbResult?.series||null,anbima:anbimaResult?.indicators||null,regulatoryHighlights:(newsResult||[]).slice(0,8),marketComparison};
  await writeFile(`data/weekly-${market}.json`,pretty(payload));
}
console.log('Snapshots oficiais atualizados:',new Date().toISOString());
