const SERIES = {
  selic:{id:1178,label:'Selic',unit:'%'},
  inadPJ:{id:21083,label:'Inadimplência PJ',unit:'%'},
  estoquePJ:{id:20540,label:'Estoque de crédito PJ',unit:'R$ milhões'},
  spreadPJ:{id:27632,label:'Spread PJ não rotativo',unit:'p.p.'}
};
async function getSeries(id,n=25){
  const url=`https://api.bcb.gov.br/dados/serie/bcdata.sgs.${id}/dados/ultimos/${n}?formato=json`;
  const r=await fetch(url,{headers:{'User-Agent':'RadarFIDC/1.0'}}); if(!r.ok) throw new Error(`BCB ${id}: ${r.status}`);
  const a=await r.json(); return a.map(x=>({date:x.data,value:Number(String(x.valor).replace(',','.'))})).filter(x=>Number.isFinite(x.value));
}
function pack(meta,arr){const latest=arr.at(-1)||null,prev=arr.at(-2)||null;return {...meta,latest,previous:prev,change:latest&&prev?latest.value-prev.value:null,history:arr};}
export default async function handler(req,res){
 try{
  const [selic,inadPJ,estoquePJ,spreadPJ]=await Promise.all([getSeries(1178,25),getSeries(21083,25),getSeries(20540,25),getSeries(27632,25)]);
  res.setHeader('Cache-Control','s-maxage=21600, stale-while-revalidate=86400');
  res.status(200).json({source:'Banco Central do Brasil / SGS',updatedAt:new Date().toISOString(),series:{selic:pack(SERIES.selic,selic),inadPJ:pack(SERIES.inadPJ,inadPJ),estoquePJ:pack(SERIES.estoquePJ,estoquePJ),spreadPJ:pack(SERIES.spreadPJ,spreadPJ)}});
 }catch(e){res.status(502).json({error:e.message});}
}
