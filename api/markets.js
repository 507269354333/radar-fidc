import {fetchCvmMarketsDataset,MARKETS} from '../lib/cvm-data.js';
const marketName=value=>String(value||'').toUpperCase();
export default async function handler(req,res){
  try{
    const dataset=await fetchCvmMarketsDataset(),requested=marketName(req.query?.market),view=String(req.query?.view||'summary').toLowerCase();
    res.setHeader('Cache-Control','s-maxage=21600, stale-while-revalidate=86400');
    if(requested){
      if(!MARKETS.includes(requested))return res.status(400).json({error:'Mercado inválido. Use FIDC, FIAGRO ou FII.'});
      const data=dataset.markets[requested];
      if(view==='summary')return res.status(200).json({source:dataset.source,sourceUrl:dataset.sourceUrl,sourceUpdatedAt:dataset.sourceUpdatedAt,market:requested,count:data.count,analytics:data.analytics,methodology:data.methodology});
      return res.status(200).json({...data,updatedAt:new Date().toISOString()});
    }
    const markets={};for(const market of MARKETS){const d=dataset.markets[market];markets[market]={market,count:d.count,analytics:d.analytics,methodology:d.methodology}}
    res.status(200).json({source:dataset.source,sourceUrl:dataset.sourceUrl,sourceUpdatedAt:dataset.sourceUpdatedAt,overall:dataset.overall,markets,updatedAt:new Date().toISOString()});
  }catch(error){res.status(502).json({error:error.message,source:'CVM Dados Abertos'})}
}
