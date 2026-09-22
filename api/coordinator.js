import {fetchCvmMarketsDataset,MARKETS} from '../lib/cvm-data.js';
import {buildCoordinatorSnapshots,findCoordinator} from '../lib/coordinator-data.js';

async function snapshot(req,market){
 if(String(req.query?.live||'')==='1')return null;
 try{
  const host=req.headers['x-forwarded-host']||req.headers.host,proto=req.headers['x-forwarded-proto']||'https';if(!host)return null;
  const r=await fetch(`${proto}://${host}/data/coordinators-${market}.json`,{headers:{Accept:'application/json'}});if(!r.ok)return null;return await r.json()
 }catch{return null}
}
export default async function handler(req,res){
 try{
  const market=String(req.query?.market||'FIDC').toUpperCase(),cnpj=String(req.query?.cnpj||''),name=String(req.query?.name||'').trim();
  if(!MARKETS.includes(market))return res.status(400).json({error:'Mercado inválido.'});
  if(!cnpj&&!name)return res.status(400).json({error:'Informe CNPJ ou nome do coordenador.'});
  const cached=await snapshot(req,market),hit=cached?findCoordinator(cached,{cnpj,name}):null;
  if(hit){res.setHeader('Cache-Control','s-maxage=1800, stale-while-revalidate=21600');res.setHeader('X-Radar-Source','snapshot');return res.status(200).json({market,...hit,source:cached.source})}
  if(cached)return res.status(404).json({error:'Coordenador não encontrado nesta vertical.'});
  const dataset=await fetchCvmMarketsDataset(),snapshots=buildCoordinatorSnapshots(dataset),live=findCoordinator(snapshots[market],{cnpj,name});
  if(!live)return res.status(404).json({error:'Coordenador não encontrado nesta vertical.'});
  res.setHeader('Cache-Control','s-maxage=21600, stale-while-revalidate=86400');res.setHeader('X-Radar-Source','live');res.status(200).json({market,...live,source:snapshots[market].source})
 }catch(error){res.status(502).json({error:error.message,source:'CVM Dados Abertos'})}
}
