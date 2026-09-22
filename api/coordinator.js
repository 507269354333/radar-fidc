import {fetchCvmMarketsDataset,MARKETS} from '../lib/cvm-data.js';
const digits=v=>String(v||'').replace(/\D/g,'');
const normalize=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();
const monthRows=items=>{const map=new Map();for(const item of items){if(!/^\d{4}-\d{2}-\d{2}$/.test(item.date||''))continue;const month=item.date.slice(0,7),row=map.get(month)||{month,count:0,volume:0};row.count++;if(Number.isFinite(item.volume)&&item.volume>0)row.volume+=item.volume;map.set(month,row)}return[...map.values()].sort((a,b)=>a.month.localeCompare(b.month)).slice(-18)};
export default async function handler(req,res){
 try{
  const market=String(req.query?.market||'FIDC').toUpperCase(),cnpj=digits(req.query?.cnpj),name=String(req.query?.name||'').trim();
  if(!MARKETS.includes(market))return res.status(400).json({error:'Mercado inválido.'});
  if(!cnpj&&!name)return res.status(400).json({error:'Informe CNPJ ou nome do coordenador.'});
  const dataset=await fetchCvmMarketsDataset(),data=dataset.markets[market],rows=data.items.filter(item=>cnpj?digits(item.leaderCnpj)===cnpj:normalize(item.leader)===normalize(name));
  if(!rows.length)return res.status(404).json({error:'Coordenador não encontrado nesta vertical.'});
  const label=rows.map(x=>x.leader).filter(Boolean).sort((a,b)=>b.length-a.length)[0]||rows[0].leaderCnpj;
  const latestMonth=data.analytics.latestMonth,start=latestMonth?new Date(`${latestMonth}-01T00:00:00Z`):null;if(start)start.setUTCMonth(start.getUTCMonth()-11);const cutoff=start?start.toISOString().slice(0,7):'';
  const trail=rows.filter(x=>x.date&&x.date.slice(0,7)>=cutoff),vol=trail.filter(x=>Number.isFinite(x.volume)&&x.volume>0),byMarket=MARKETS.map(key=>{const other=dataset.markets[key].items.filter(item=>cnpj?digits(item.leaderCnpj)===cnpj:normalize(item.leader)===normalize(name));return{market:key,count:other.length,volume:other.filter(x=>Number.isFinite(x.volume)&&x.volume>0).reduce((s,x)=>s+x.volume,0)}});
  res.setHeader('Cache-Control','s-maxage=21600, stale-while-revalidate=86400');
  res.status(200).json({market,name:label,cnpj:rows.find(x=>x.leaderCnpj)?.leaderCnpj||'',stats12m:{offers:trail.length,volume:vol.reduce((s,x)=>s+x.volume,0),offersWithVolume:vol.length,averageTicket:vol.length?vol.reduce((s,x)=>s+x.volume,0)/vol.length:null},byMonth:monthRows(rows),recentOffers:rows.slice(0,30),byMarket,source:{name:dataset.source,url:dataset.sourceUrl,updatedAt:dataset.sourceUpdatedAt}});
 }catch(error){res.status(502).json({error:error.message,source:'CVM Dados Abertos'})}
}
