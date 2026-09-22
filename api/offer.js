import {fetchCvmMarketsDataset,MARKETS} from '../lib/cvm-data.js';
const digits=v=>String(v||'').replace(/\D/g,'');
export default async function handler(req,res){
 try{
  const id=String(req.query?.id||''),market=String(req.query?.market||'FIDC').toUpperCase();
  if(!id)return res.status(400).json({error:'Informe o id da oferta.'});
  if(!MARKETS.includes(market))return res.status(400).json({error:'Mercado inválido.'});
  const dataset=await fetchCvmMarketsDataset(),data=dataset.markets[market],offer=data.items.find(item=>item.id===id);
  if(!offer)return res.status(404).json({error:'Oferta não encontrada na base oficial atual.'});
  const leaderKey=digits(offer.leaderCnpj),issuerKey=digits(offer.cnpj);
  const relatedByLeader=data.items.filter(item=>item.id!==offer.id&&leaderKey&&digits(item.leaderCnpj)===leaderKey).slice(0,8);
  const relatedByIssuer=data.items.filter(item=>item.id!==offer.id&&issuerKey&&digits(item.cnpj)===issuerKey).slice(0,8);
  const leader12m=data.analytics.trailing12.topLeaders.find(item=>leaderKey&&digits(item.cnpj)===leaderKey)||null;
  res.setHeader('Cache-Control','s-maxage=21600, stale-while-revalidate=86400');
  res.status(200).json({offer,leader12m,relatedByLeader,relatedByIssuer,source:{name:dataset.source,url:dataset.sourceUrl,updatedAt:dataset.sourceUpdatedAt},methodology:data.methodology});
 }catch(error){res.status(502).json({error:error.message,source:'CVM Dados Abertos'})}
}
