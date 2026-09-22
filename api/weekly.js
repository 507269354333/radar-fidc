import {fetchCvmMarketsDataset,MARKETS} from '../lib/cvm-data.js';
import {fetchBcbDataset} from '../lib/bcb-data.js';
import {fetchAnbimaIndicators} from '../lib/anbima-data.js';
import {fetchCvmNews} from './news.js';
import {buildWeeklyReport} from '../lib/weekly.js';

export default async function handler(req,res){
  try{
    const requested=String(req.query?.market||'FIDC').toUpperCase(),market=requested==='ALL'?'ALL':requested;
    if(market!=='ALL'&&!MARKETS.includes(market))return res.status(400).json({error:'Mercado inválido. Use FIDC, FIAGRO, FII ou ALL.'});
    const [cvmResult,bcbResult,anbimaResult,newsResult]=await Promise.allSettled([fetchCvmMarketsDataset(),fetchBcbDataset(),fetchAnbimaIndicators(),fetchCvmNews()]);
    if(cvmResult.status!=='fulfilled')throw cvmResult.reason;
    const cvm=cvmResult.value,items=market==='ALL'?cvm.allItems:cvm.markets[market].items,report=buildWeeklyReport(items,new Date(),{market}),bcb=bcbResult.status==='fulfilled'?bcbResult.value:null,anbima=anbimaResult.status==='fulfilled'?anbimaResult.value:null,news=newsResult.status==='fulfilled'?newsResult.value:[];
    const marketComparison=MARKETS.map(key=>({market:key,count:cvm.markets[key].count,latestMonth:cvm.markets[key].analytics.latestMonth,offersInMonth:cvm.markets[key].analytics.offersInMonth,volumeInMonth:cvm.markets[key].analytics.volumeInMonth}));
    res.setHeader('Cache-Control','s-maxage=21600, stale-while-revalidate=86400');
    res.status(200).json({...report,sources:{cvm:{name:cvm.source,url:cvm.sourceUrl,updatedAt:cvm.sourceUpdatedAt},bcb:bcb?{name:bcb.source,url:bcb.sourceUrl,updatedAt:bcb.updatedAt}:null,anbima:anbima?{name:anbima.source,url:anbima.sourceUrl,updatedAt:anbima.sourceUpdatedAt}:null},macro:bcb?bcb.series:null,anbima:anbima?.indicators||null,regulatoryHighlights:news.slice(0,8),marketComparison});
  }catch(error){res.status(502).json({error:error.message,source:'Radar FIDC'})}
}
