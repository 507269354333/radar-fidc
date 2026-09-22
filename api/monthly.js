import {fetchCvmMarketsDataset,MARKETS} from '../lib/cvm-data.js';
import {fetchBcbDataset} from '../lib/bcb-data.js';
import {fetchAnbimaIndicators} from '../lib/anbima-data.js';
import {fetchCvmNews} from './news.js';
import {buildMonthlyLetter,previousFullMonth} from '../lib/monthly.js';
import {buildMarketIntelligence} from '../lib/intelligence.js';

async function snapshot(req,month,market){
  if(String(req.query?.live||'')==='1')return null;
  try{
    const host=req.headers['x-forwarded-host']||req.headers.host;
    const proto=req.headers['x-forwarded-proto']||'https';
    if(!host)return null;
    const r=await fetch(`${proto}://${host}/data/monthly-${month}-${market}.json`,{headers:{Accept:'application/json'}});
    if(!r.ok)return null;
    const d=await r.json();
    return d?.month===month&&d?.market===market?d:null;
  }catch{return null}
}
export default async function handler(req,res){
  try{
    const month=String(req.query?.month||previousFullMonth(new Date())),market=String(req.query?.market||'ALL').toUpperCase();
    if(market!=='ALL'&&!MARKETS.includes(market))return res.status(400).json({error:'Mercado inválido.'});
    if(!/^\d{4}-\d{2}$/.test(month))return res.status(400).json({error:'Mês inválido. Use AAAA-MM.'});
    const cached=await snapshot(req,month,market);
    if(cached){
      res.setHeader('Cache-Control','s-maxage=3600, stale-while-revalidate=86400');
      res.setHeader('X-Radar-Source','snapshot');
      return res.status(200).json(cached);
    }
    const[cvm,bcbR,anbR,newsR]=await Promise.all([fetchCvmMarketsDataset(),fetchBcbDataset().catch(()=>null),fetchAnbimaIndicators().catch(()=>null),fetchCvmNews().catch(()=>[])]);
    const data=buildMonthlyLetter(cvm,bcbR,anbR,newsR,{month,market});
    const intel=buildMarketIntelligence(cvm,bcbR,anbR,newsR,{month});
    res.setHeader('Cache-Control','s-maxage=21600, stale-while-revalidate=86400');
    res.setHeader('X-Radar-Source','live');
    res.status(200).json({...data,intelligence:{brief:intel.brief,theses:intel.theses,directions:intel.directions,scenarios:intel.scenarios}})
  }catch(e){res.status(502).json({error:e.message,source:'Radar'})}
}
