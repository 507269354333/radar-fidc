import {fetchCvmMarketsDataset} from '../lib/cvm-data.js';
import {fetchBcbDataset} from '../lib/bcb-data.js';
import {fetchAnbimaIndicators} from '../lib/anbima-data.js';
import {fetchCvmNews} from './news.js';
import {buildMarketIntelligence} from '../lib/intelligence.js';
import {previousFullMonth} from '../lib/monthly.js';

export default async function handler(req,res){
  try{
    const month=String(req.query?.month||previousFullMonth(new Date()));
    if(!/^\d{4}-\d{2}$/.test(month))return res.status(400).json({error:'Mês inválido. Use AAAA-MM.'});
    const[cvm,bcb,anbima,news]=await Promise.all([
      fetchCvmMarketsDataset(),
      fetchBcbDataset().catch(()=>null),
      fetchAnbimaIndicators().catch(()=>null),
      fetchCvmNews().catch(()=>[])
    ]);
    const data=buildMarketIntelligence(cvm,bcb,anbima,news,{month});
    res.setHeader('Cache-Control','s-maxage=21600, stale-while-revalidate=86400');
    res.status(200).json(data);
  }catch(error){res.status(502).json({error:error.message,source:'Radar Intelligence'})}
}
