const SERIES={
 selic:{id:1178,label:'Selic',unit:'%'},
 inadPJ:{id:21083,label:'Inadimplência PJ',unit:'%'},
 estoquePJ:{id:20540,label:'Saldo de crédito PJ',unit:'R$ milhões'},
 spreadPJ:{id:27632,label:'Spread PJ não rotativo',unit:'p.p.'}
};
async function getSeries(id,n=25){
 const u=`https://api.bcb.gov.br/dados/serie/bcdata.sgs.${id}/dados/ultimos/${n}?formato=json`;
 const c=new AbortController(); const t=setTimeout(()=>c.abort(),9000);
 try{
  const r=await fetch(u,{headers:{'User-Agent':'RadarFIDC/1.1','Accept':'application/json'},signal:c.signal});
  if(!r.ok) throw new Error(`BCB ${id}: HTTP ${r.status}`);
  const a=await r.json();
  return a.map(x=>({date:x.data,value:Number(String(x.valor).replace(',','.'))})).filter(x=>Number.isFinite(x.value));
 } finally { clearTimeout(t); }
}
function pack(meta,a){const latest=a.at(-1)||null,previous=a.at(-2)||null;return {...meta,latest,previous,change:latest&&previous?latest.value-previous.value:null,history:a};}
export default async function handler(req,res){
 try{
  const out=await Promise.allSettled(Object.values(SERIES).map(s=>getSeries(s.id)));
  const keys=Object.keys(SERIES), series={}; let ok=0;
  out.forEach((r,i)=>{if(r.status==='fulfilled'){series[keys[i]]=pack(SERIES[keys[i]],r.value);ok++}else series[keys[i]]={...SERIES[keys[i]],error:r.reason?.message||'indisponível',history:[]}});
  res.setHeader('Cache-Control','s-maxage=21600, stale-while-revalidate=86400');
  res.status(ok?200:502).json({source:'Banco Central do Brasil / SGS',series,partial:ok<keys.length,updatedAt:new Date().toISOString()});
 }catch(e){res.status(502).json({error:e.message,source:'Banco Central do Brasil / SGS'});}
}